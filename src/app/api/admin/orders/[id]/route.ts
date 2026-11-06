import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/errors";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  const session = await requireAdmin(req);
  requirePermission(session, "orders:read");
  const order = await prisma.order.findUnique({
    where: { id: ctx.params.id },
    include: {
      user: true,
      items: true,
      history: { orderBy: { createdAt: "asc" } },
      delivery: true,
      payments: { include: { attempts: true, refunds: true } },
      refunds: true,
      coupon: true,
    },
  });
  if (!order) throw notFound("Order not found");
  return ok(order);
});
