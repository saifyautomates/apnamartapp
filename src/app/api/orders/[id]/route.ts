import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/errors";
import { getOrderTimeline } from "@/lib/orders";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  const { userId } = await requireCustomer(req);
  const order = await prisma.order.findFirst({
    where: { id: ctx.params.id, userId },
    include: {
      items: true,
      history: { orderBy: { createdAt: "asc" } },
      delivery: true,
      payments: true,
      refunds: true,
    },
  });
  if (!order) throw notFound("Order not found");
  return ok({ order, timeline: getOrderTimeline(order.status) });
});
