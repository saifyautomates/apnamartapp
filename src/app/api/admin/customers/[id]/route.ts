import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/errors";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  const session = await requireAdmin(req);
  requirePermission(session, "customers:read");
  const user = await prisma.user.findUnique({
    where: { id: ctx.params.id },
    include: {
      profile: true,
      addresses: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, take: 20, include: { items: true } },
      loyalty: { include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } } },
      credit: { include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } } },
      couponUsage: true,
    },
  });
  if (!user) throw notFound("Customer not found");
  return ok(user);
});
