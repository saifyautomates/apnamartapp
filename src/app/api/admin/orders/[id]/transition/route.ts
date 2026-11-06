import { NextRequest } from "next/server";
import { handler, ok, readJson, getClientIp } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { orderTransitionSchema } from "@/lib/validation";
import { transitionOrder, cancelOrder } from "@/lib/orders";
import { notifyOrderEvent } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/errors";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "orders:write");
  const body = orderTransitionSchema.parse(await readJson(req));
  const order = await prisma.order.findUnique({ where: { id: ctx.params.id } });
  if (!order) throw notFound("Order not found");
  let updated;
  if (body.to === "CANCELLED") {
    updated = await cancelOrder(order.id, session.adminId, body.note ?? "Cancelled by admin", "ADMIN", { ip: getClientIp(req) });
    await notifyOrderEvent(order.id, "CANCELLED").catch(() => undefined);
  } else {
    updated = await transitionOrder(order.id, body.to, session.adminId, body.note);
    const eventMap: Record<string, string> = {
      CONFIRMED: "ORDER_CONFIRMED",
      PACKED: "PACKED",
      OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
      DELIVERED: "DELIVERED",
    };
    if (eventMap[body.to]) await notifyOrderEvent(order.id, eventMap[body.to]).catch(() => undefined);
  }
  return ok(updated);
});
