import { NextRequest } from "next/server";
import { handler, ok, getPagination } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "audit:read");
  const url = new URL(req.url);
  const { page, pageSize } = getPagination(req);
  const action = url.searchParams.get("action");
  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: where as never,
      include: { actor: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where: where as never }),
  ]);
  return ok({ items, total, page, pageSize });
});
