import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { verifyWebhookSignature, applyPaymentWebhook } from "@/lib/payments";
import { badRequest } from "@/lib/errors";

export const runtime = "nodejs";

/** Payment gateway webhook. Idempotent + signature-checked (when secret is set). */
export const POST = handler(async (req: NextRequest) => {
  const raw = await req.text();
  const signature = req.headers.get("x-signature");
  if (!verifyWebhookSignature(raw, signature)) throw badRequest("Invalid webhook signature");
  let event: { eventId: string; paymentId: string; providerRef: string; status: string; amountPaise: number };
  try {
    event = JSON.parse(raw);
  } catch {
    throw badRequest("Invalid webhook JSON");
  }
  if (!event.eventId || !event.paymentId || (event.status !== "CAPTURED" && event.status !== "FAILED")) {
    throw badRequest("Invalid webhook payload");
  }
  const result = await applyPaymentWebhook({
    eventId: event.eventId,
    paymentId: event.paymentId,
    providerRef: event.providerRef ?? "",
    status: event.status as "CAPTURED" | "FAILED",
    amountPaise: event.amountPaise ?? 0,
  });
  return ok(result);
});
