import { NextRequest } from "next/server";
import { handler, ok, getPagination } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "loyalty:write");
  const { page, pageSize } = getPagination(req);
  const [items, total] = await Promise.all([
    prisma.loyaltyAccount.findMany({
      include: { user: { select: { phone: true, name: true } }, transactions: { orderBy: { createdAt: "desc" }, take: 5 } },
      orderBy: { points: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.loyaltyAccount.count(),
  ]);
  return ok({ items, total, page, pageSize });
});
