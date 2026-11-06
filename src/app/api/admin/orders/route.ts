import { NextRequest } from "next/server";
import { handler, ok, getPagination } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "orders:read");
  const url = new URL(req.url);
  const { page, pageSize } = getPagination(req);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q") ?? "";
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { user: { phone: { contains: q } } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where: where as never,
      include: { user: { select: { id: true, name: true, phone: true } }, items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where: where as never }),
  ]);
  return ok({ items, total, page, pageSize });
});
