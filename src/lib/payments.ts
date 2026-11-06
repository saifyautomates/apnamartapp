import crypto from "crypto";
import { prisma } from "./prisma";
import { badRequest } from "./errors";

// ---------------------------------------------------------------------------
// Payment abstraction. Checkout never embeds provider logic. v1 ships:
// - COD: pay on delivery.
// - MockGateway: stands in for UPI/Online gateway until a real provider is
//   wired (createPayment/verifyPayment/capturePayment/refundPayment/webhook).
// A real gateway replaces MockGatewayProvider without touching checkout.
// Webhooks are idempotent (event id via IdempotencyKey) and signature-checked
// whenever PAYMENT_WEBHOOK_SECRET is set. Never trust client-side success.
// ---------------------------------------------------------------------------

export interface PaymentProvider {
  createPayment(input: { orderId: string; amountPaise: number; method: string }): Promise<{ providerRef: string; checkoutPayload: unknown }>;
  verifyPayment(providerRef: string): Promise<{ status: "CAPTURED" | "PENDING" | "FAILED"; providerRef: string }>;
  capturePayment(providerRef: string): Promise<{ ok: boolean }>;
  refundPayment(providerRef: string, amountPaise: number): Promise<{ ok: boolean; refundRef?: string }>;
}

export class CodProvider implements PaymentProvider {
  async createPayment(input: { orderId: string }) {
    return { providerRef: `COD-${input.orderId}`, checkoutPayload: { method: "COD" } };
  }
  async verifyPayment(providerRef: string) {
    return { status: "PENDING" as const, providerRef };
  }
  async capturePayment() {
    return { ok: true };
  }
  async refundPayment() {
    // COD refunds are manual (cash handed back); the ledger records it.
    return { ok: true, refundRef: "COD-MANUAL" };
  }
}

export class MockGatewayProvider implements PaymentProvider {
  async createPayment(input: { orderId: string; amountPaise: number; method: string }) {
    const providerRef = `MOCK-${Date.now()}-${input.orderId.slice(0, 8)}`;
    return {
      providerRef,
      checkoutPayload: {
        mock: true,
        method: input.method,
        amountPaise: input.amountPaise,
        // In production this would be the gateway checkout URL.
        payUrl: `/checkout/mock-pay?ref=${providerRef}`,
      },
    };
  }
  async verifyPayment(providerRef: string) {
    // Server-side check against our own attempt records (never the client).
    const attempt = await prisma.paymentAttempt.findFirst({
      where: { providerRef },
      orderBy: { createdAt: "desc" },
    });
    if (!attempt) return { status: "PENDING" as const, providerRef };
    if (attempt.status === "CAPTURED") return { status: "CAPTURED" as const, providerRef };
    if (attempt.status === "FAILED") return { status: "FAILED" as const, providerRef };
    return { status: "PENDING" as const, providerRef };
  }
  async capturePayment() {
    return { ok: true };
  }
  async refundPayment(providerRef: string) {
    return { ok: true, refundRef: `MOCK-REF-${providerRef}` };
  }
}

export async function getPaymentProvider(method: string): Promise<PaymentProvider> {
  if (method === "COD") return new CodProvider();
  const settings = await prisma.setting.findUnique({ where: { key: "payments" } });
  const cfg = (settings?.value as { cod?: boolean; upi?: boolean; online?: boolean } | undefined) ?? { cod: true, upi: true, online: true };
  if (method === "UPI" && cfg.upi === false) throw badRequest("UPI payments are disabled");
  if (method === "ONLINE" && cfg.online === false) throw badRequest("Online payments are disabled");
  if (method === "COD" && cfg.cod === false) throw badRequest("Cash on delivery is disabled");
  return new MockGatewayProvider();
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    // Dev only: no secret configured. Never accept unsigned webhooks in production.
    if (process.env.NODE_ENV === "production") return false;
    console.warn("[payments] webhook accepted without signature (dev only, no secret configured)");
    return true;
  }
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** Idempotent webhook application. Returns { applied: false } on duplicate events. */
export async function applyPaymentWebhook(event: {
  eventId: string;
  paymentId: string;
  providerRef: string;
  status: "CAPTURED" | "FAILED";
  amountPaise: number;
}): Promise<{ applied: boolean }> {
  const key = `wh:${event.eventId}`;
  const existing = await prisma.idempotencyKey.findUnique({ where: { key } });
  if (existing) return { applied: false };
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: event.paymentId }, include: { order: true } });
    if (!payment) throw badRequest("Payment not found");
    await tx.paymentAttempt.create({
      data: { paymentId: payment.id, provider: "MOCK", amountPaise: event.amountPaise, status: event.status, providerRef: event.providerRef },
    });
    if (event.status === "CAPTURED") {
      await tx.payment.update({ where: { id: payment.id }, data: { status: "CAPTURED", providerPaymentId: event.providerRef } });
      if (payment.order.status === "PENDING_PAYMENT") {
        await tx.order.update({ where: { id: payment.orderId }, data: { status: "PLACED", paymentStatus: "CAPTURED" } });
        await tx.orderStatusHistory.create({ data: { orderId: payment.orderId, fromStatus: "PENDING_PAYMENT", toStatus: "PLACED", note: "Payment captured via webhook" } });
      }
    } else {
      await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      if (payment.order.status === "PENDING_PAYMENT") {
        await tx.order.update({ where: { id: payment.orderId }, data: { status: "PAYMENT_FAILED", paymentStatus: "FAILED" } });
        await tx.orderStatusHistory.create({ data: { orderId: payment.orderId, fromStatus: "PENDING_PAYMENT", toStatus: "PAYMENT_FAILED", note: "Payment failed via webhook" } });
        const reservations = await tx.stockReservation.findMany({ where: { orderId: payment.orderId, status: "ACTIVE" } });
        for (const r of reservations) {
          await tx.inventory.update({ where: { variantId: r.variantId }, data: { reservedQty: { decrement: r.qty } } });
          await tx.stockReservation.update({ where: { id: r.id }, data: { status: "RELEASED" } });
          await tx.inventoryMovement.create({ data: { variantId: r.variantId, type: "RELEASE", qtyDelta: 0, reason: "Payment failed, reservation released", referenceType: "ORDER", referenceId: payment.orderId } });
        }
      }
    }
    await tx.idempotencyKey.create({
      data: { key, endpoint: "payment-webhook", responseBody: { applied: true }, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
    });
  });
  return { applied: true };
}
