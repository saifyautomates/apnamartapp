import { NextRequest } from "next/server";
import { handler, ok, getPagination } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "payments:read");
  const { page, pageSize } = getPagination(req);
  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      include: { order: { select: { orderNumber: true, user: { select: { phone: true, name: true } } } }, attempts: true, refunds: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payment.count(),
  ]);
  return ok({ items, total, page, pageSize });
});
