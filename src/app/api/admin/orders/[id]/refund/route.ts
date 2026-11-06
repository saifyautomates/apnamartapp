import { NextRequest } from "next/server";
import { handler, ok, readJson, getClientIp } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { refundSchema } from "@/lib/validation";
import { processRefund } from "@/lib/orders";
import { notifyOrderEvent } from "@/lib/notify";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "payments:write");
  const body = refundSchema.parse(await readJson(req));
  const updated = await processRefund(ctx.params.id, body.amountPaise, body.reason, session.adminId, { ip: getClientIp(req) });
  await notifyOrderEvent(ctx.params.id, "REFUND").catch(() => undefined);
  return ok(updated);
});
