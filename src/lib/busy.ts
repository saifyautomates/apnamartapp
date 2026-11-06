import { prisma } from "./prisma";
import type { SyncDirection, SyncJobStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// BUSY Enterprise integration layer — FUTURE READY, NOT CONNECTED in v1.
// The commerce core NEVER calls BUSY directly. All BUSY access goes through
// this adapter interface, so a real adapter can replace the mock without
// touching order, inventory, or pricing logic. The app keeps working when
// BUSY is down or unconfigured: checkout never waits on BUSY.
// ---------------------------------------------------------------------------

export type BusyResult<T> = { ok: true; data: T } | { ok: false; error: string };

export interface BusyAdapter {
  getProducts(): Promise<BusyResult<unknown[]>>;
  getInventory(): Promise<BusyResult<unknown[]>>;
  getCustomers(): Promise<BusyResult<unknown[]>>;
  getPrices(): Promise<BusyResult<unknown[]>>;
  createCustomer(input: unknown): Promise<BusyResult<{ externalId: string }>>;
  createOrder(input: unknown): Promise<BusyResult<{ externalId: string }>>;
  createInvoice(input: unknown): Promise<BusyResult<{ externalId: string }>>;
  updateInventory(input: unknown): Promise<BusyResult<void>>;
  syncProduct(internalId: string): Promise<BusyResult<void>>;
  syncCustomer(internalId: string): Promise<BusyResult<void>>;
  syncOrder(internalId: string): Promise<BusyResult<void>>;
}

/**
 * Mock adapter for v1. It NEVER pretends a connection works: every call
 * returns NOT_CONNECTED. Sync jobs that target BUSY therefore fail gracefully,
 * retry with backoff, and eventually dead-letter — without blocking checkout.
 */
export class MockBusyAdapter implements BusyAdapter {
  private notConnected<T>(): BusyResult<T> {
    return { ok: false, error: "BUSY_NOT_CONNECTED" };
  }
  async getProducts() { return this.notConnected<unknown[]>(); }
  async getInventory() { return this.notConnected<unknown[]>(); }
  async getCustomers() { return this.notConnected<unknown[]>(); }
  async getPrices() { return this.notConnected<unknown[]>(); }
  async createCustomer() { return this.notConnected<{ externalId: string }>(); }
  async createOrder() { return this.notConnected<{ externalId: string }>(); }
  async createInvoice() { return this.notConnected<{ externalId: string }>(); }
  async updateInventory() { return this.notConnected<void>(); }
  async syncProduct() { return this.notConnected<void>(); }
  async syncCustomer() { return this.notConnected<void>(); }
  async syncOrder() { return this.notConnected<void>(); }
}

export function getBusyAdapter(): BusyAdapter {
  // A real adapter is wired here ONLY when BUSY credentials are configured AND
  // an explicit enable flag is set. v1 always returns the mock.
  return new MockBusyAdapter();
}

export function getBusyStatus(): { connected: boolean; provider: string; reason: string } {
  return { connected: false, provider: "BUSY", reason: "Not configured in v1 (mock adapter only)" };
}

// Source-of-truth rules (documented contract for the future real adapter).
export const SOURCE_OF_TRUTH = {
  inventory: "BUSY",
  accounting: "BUSY",
  offlineInvoices: "BUSY",
  onlineOrderWorkflow: "COMMERCE",
  productContentImages: "COMMERCE",
  pricingSource: "CONFIGURABLE", // admin selects source price vs custom online price per variant
} as const;

// Conflict strategy: never silently overwrite. BUSY is authoritative for stock
// and accounting; commerce is authoritative for the online order workflow and
// product content. A mismatch creates a reconciliation record (sync log with
// status FAILED + error) for an admin to resolve — it never auto-overwrites.
export const CONFLICT_STRATEGY =
  "On mismatch, keep both values, log a FAILED sync entry with both values, and surface it in admin Integrations for manual reconciliation. No silent overwrite.";

// ---------------- Sync job engine ----------------

const MAX_ATTEMPTS = 5;

export function backoffSeconds(attempt: number): number {
  return Math.min(3600 * Math.pow(2, Math.max(0, attempt - 1)), 86400);
}

export async function enqueueSyncJob(input: {
  provider: string;
  entityType: string;
  entityId: string;
  direction: SyncDirection;
  jobType: string;
  payloadRef?: string;
}) {
  return prisma.integrationSyncJob.create({ data: { ...input, status: "PENDING" } });
}

function adapterMethodFor(jobType: string, adapter: BusyAdapter): (() => Promise<BusyResult<unknown>>) | null {
  switch (jobType) {
    case "INBOUND_PRODUCT_SYNC": return () => adapter.getProducts();
    case "INBOUND_STOCK_SYNC": return () => adapter.getInventory();
    case "INBOUND_PRICE_SYNC": return () => adapter.getPrices();
    case "INBOUND_CUSTOMER_SYNC": return () => adapter.getCustomers();
    case "OUTBOUND_CUSTOMER_SYNC": return () => adapter.createCustomer({});
    case "OUTBOUND_ORDER_SYNC": return () => adapter.createOrder({});
    case "OUTBOUND_INVOICE_SYNC": return () => adapter.createInvoice({});
    default: return null;
  }
}

/** Process due jobs. Safe to run on a schedule; BUSY jobs fail gracefully in v1. */
export async function processDueSyncJobs(limit = 20): Promise<{ processed: number; succeeded: number; failed: number }> {
  const jobs = await prisma.integrationSyncJob.findMany({
    where: { status: { in: ["PENDING", "RETRYING"] }, nextAttemptAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  // Also pick up PENDING jobs that never had nextAttemptAt set.
  const fresh = await prisma.integrationSyncJob.findMany({
    where: { status: "PENDING", nextAttemptAt: null },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  const all = [...jobs, ...fresh.filter((f) => !jobs.some((j) => j.id === f.id))].slice(0, limit);
  let succeeded = 0;
  let failed = 0;
  const adapter = getBusyAdapter();
  for (const job of all) {
    await prisma.integrationSyncJob.update({ where: { id: job.id }, data: { status: "PROCESSING", lastAttemptAt: new Date() } });
    const method = adapterMethodFor(job.jobType, adapter);
    const result = method ? await method() : { ok: false, error: "UNKNOWN_JOB_TYPE" };
    const attemptCount = job.attemptCount + 1;
    if (result.ok) {
      await prisma.integrationSyncJob.update({ where: { id: job.id }, data: { status: "SUCCESS", attemptCount } });
      await prisma.integrationSyncLog.create({ data: { jobId: job.id, provider: job.provider, entityType: job.entityType, entityId: job.entityId, direction: job.direction, status: "SUCCESS", message: "OK" } });
      succeeded += 1;
    } else {
      const err = (result as { error?: string }).error ?? "Unknown error";
      const dead = attemptCount >= MAX_ATTEMPTS;
      const status: SyncJobStatus = dead ? "DEAD" : "RETRYING";
      await prisma.integrationSyncJob.update({
        where: { id: job.id },
        data: { status, attemptCount, error: err, nextAttemptAt: dead ? null : new Date(Date.now() + backoffSeconds(attemptCount) * 1000) },
      });
      await prisma.integrationSyncLog.create({ data: { jobId: job.id, provider: job.provider, entityType: job.entityType, entityId: job.entityId, direction: job.direction, status, message: err } });
      failed += 1;
    }
  }
  return { processed: all.length, succeeded, failed };
}
