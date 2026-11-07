import { adminPageDenied } from "@/lib/admin-page";
import { prisma, withDbTimeout } from "@/lib/prisma";
import { getBusyStatus } from "@/lib/busy";
import { getShiprocketStatus } from "@/lib/shiprocket";
import { SyncJobButton } from "@/components/admin-ui";
import Link from "next/link";

export default async function AdminIntegrationsPage() {
  const denied = await adminPageDenied("integrations:read");
  if (denied) return denied;
  const busy = getBusyStatus();
  const shiprocket = getShiprocketStatus();

  let jobs: any[] = [];
  let busyCfg: Record<string, any> = {};

  try {
    const res = await withDbTimeout(
      Promise.all([
        prisma.integrationSyncJob.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { logs: { orderBy: { createdAt: "desc" }, take: 3 } } }),
        prisma.setting.findUnique({ where: { key: "busy" } }),
      ]),
      250
    );
    jobs = res[0];
    busyCfg = (res[1]?.value as { postingTrigger?: string } | undefined) ?? {};
  } catch {
    /* fallback */
  }
  const cards = [
    { name: "BUSY Enterprise", status: busy, note: "Sync products, inventory, customers, invoices and accounting. Posting trigger: " + (busyCfg.postingTrigger ?? "OUT_FOR_DELIVERY") },
    { name: "Shiprocket", status: shiprocket, note: "Shipping and courier fulfilment (future). Store-handled delivery is used in v1." },
    { name: "Payment Gateway", status: { connected: false, provider: "Gateway", reason: "Mock gateway in v1; wire a real provider via env." }, note: "COD works today. Online/UPI use the dev mock gateway." },
    { name: "SMS Provider", status: { connected: false, provider: "SMS", reason: "Console provider in v1." }, note: "Notifications are logged, not sent, until a provider is configured." },
    { name: "WhatsApp", status: { connected: false, provider: "WhatsApp", reason: "Console provider in v1." }, note: "Notifications are logged, not sent, until a provider is configured." },
  ];
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Integrations</h1>
        <Link
          href="/admin/pos"
          className="rounded-2xl bg-[#052b14] hover:bg-[#063319] text-[#86efac] border border-emerald-800/80 px-4 py-2 text-xs font-black shadow-xs transition active:scale-95 flex items-center gap-2"
        >
          <span>🖥️</span>
          <span>BUSY POS Terminal Hub →</span>
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <article key={c.name} className="rounded-lg border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-bold">{c.name}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${c.status.connected ? "bg-brand-600 text-white" : "bg-bg text-muted"}`}>
                {c.status.connected ? "Connected" : "Not Connected"}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">{c.note}</p>
            {!c.status.connected && "reason" in c.status && c.status.reason ? <p className="mt-1 text-sm text-muted">{c.status.reason}</p> : null}
            <p className="mt-3 text-sm text-muted">Configuration is via environment variables — see README and docs/busy-integration.md.</p>
          </article>
        ))}
      </div>
      <h2 className="mt-6 text-lg font-bold">Sync jobs</h2>
      <div className="mt-2">
        <SyncJobButton />
      </div>
      <div className="mt-4 space-y-2">
        {jobs.map((j) => (
          <article key={j.id} className="rounded-lg border border-line bg-white p-3 text-sm">
            <p className="font-semibold">{j.provider} · {j.jobType} · {j.direction} · {j.status}</p>
            <p className="text-muted">Entity {j.entityType}/{j.entityId} · Attempts {j.attemptCount}{j.error ? ` · Error: ${j.error}` : ""}</p>
          </article>
        ))}
        {jobs.length === 0 ? <p className="text-muted">No sync jobs yet.</p> : null}
      </div>
    </div>
  );
}
