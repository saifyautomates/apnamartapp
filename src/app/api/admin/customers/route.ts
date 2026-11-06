import { NextRequest } from "next/server";
import { handler, ok, getPagination } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "customers:read");
  const url = new URL(req.url);
  const { page, pageSize } = getPagination(req);
  const q = url.searchParams.get("q") ?? "";
  const where: Record<string, unknown> = { deletedAt: null };
  if (q) {
    where.OR = [{ phone: { contains: q } }, { name: { contains: q, mode: "insensitive" } }];
  }
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where: where as never,
      include: {
        _count: { select: { orders: true } },
        orders: { select: { grandTotalPaise: true, createdAt: true, status: true }, orderBy: { createdAt: "desc" }, take: 1 },
        loyalty: true,
        credit: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where: where as never }),
  ]);
  const mapped = await Promise.all(items.map(async (u) => {
    const agg = await prisma.order.aggregate({
      where: { userId: u.id, status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] } },
      _sum: { grandTotalPaise: true },
    });
    return {
      id: u.id,
      phone: u.phone,
      name: u.name,
      email: u.email,
      orderCount: u._count.orders,
      lifetimeValuePaise: agg._sum.grandTotalPaise ?? 0,
      lastOrderAt: u.orders[0]?.createdAt ?? null,
      loyaltyPoints: u.loyalty?.points ?? 0,
      creditPaise: u.credit?.balancePaise ?? 0,
      createdAt: (u as { createdAt: Date }).createdAt,
    };
  }));
  return ok({ items: mapped, total, page, pageSize });
});
