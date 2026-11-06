import { NextRequest } from "next/server";
import { handler, ok, getPagination } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "inventory:read");
  const url = new URL(req.url);
  const { page, pageSize } = getPagination(req);
  const variantId = url.searchParams.get("variantId");
  const where: Record<string, unknown> = {};
  if (variantId) where.variantId = variantId;
  const [items, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where: where as never,
      include: { variant: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inventoryMovement.count({ where: where as never }),
  ]);
  return ok({ items, total, page, pageSize });
});
