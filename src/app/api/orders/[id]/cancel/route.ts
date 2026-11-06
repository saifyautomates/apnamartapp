import { NextRequest } from "next/server";
import { handler, ok, readJson, getClientIp } from "@/lib/http";
import { requireCustomer, assertCsrf } from "@/lib/auth";
import { cancelOrder } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/errors";
import { notifyOrderEvent } from "@/lib/notify";
import { z } from "zod";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  assertCsrf(req);
  const { userId } = await requireCustomer(req);
  const body = z.object({ reason: z.string().min(1).max(300).optional() }).parse(await readJson(req));
  const order = await prisma.order.findFirst({ where: { id: ctx.params.id, userId } });
  if (!order) throw notFound("Order not found");
  const updated = await cancelOrder(order.id, userId, body.reason ?? "Cancelled by customer", "CUSTOMER", { ip: getClientIp(req) });
  await notifyOrderEvent(order.id, "CANCELLED").catch(() => undefined);
  return ok(updated);
});
