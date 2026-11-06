import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { assertCsrf } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyPaymentWebhook } from "@/lib/payments";
import { badRequest, forbidden } from "@/lib/errors";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * Mock-gateway confirmation endpoint (DEV ONLY — disabled in production).
 * Called by the /checkout/mock-pay page with the order id + outcome.
 * In production this endpoint does not exist; only signed provider webhooks
 * apply payments.
 */
export const POST = handler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === "production") throw forbidden("Mock payments are disabled in production");
  assertCsrf(req);
  const body = z.object({
    orderId: z.string().min(1),
    success: z.boolean(),
  }).parse(await readJson(req));
  const payment = await prisma.payment.findFirst({ where: { orderId: body.orderId }, orderBy: { createdAt: "desc" } });
  if (!payment) throw badRequest("Payment not found for this order");
  const outcome = body.success ? "CAPTURED" : "FAILED";
  const result = await applyPaymentWebhook({
    eventId: `mock-${payment.id}-${outcome}`,
    paymentId: payment.id,
    providerRef: payment.providerPaymentId ?? payment.id,
    status: outcome,
    amountPaise: payment.amountPaise,
  });
  return ok(result);
});
