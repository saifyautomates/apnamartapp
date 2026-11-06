import { NextRequest } from "next/server";
import { handler, ok, getPagination } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sellableQty } from "@/lib/inventory";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "inventory:read");
  const url = new URL(req.url);
  const { page, pageSize } = getPagination(req);
  const q = url.searchParams.get("q") ?? "";
  const lowOnly = url.searchParams.get("low") === "true";
  const where: Record<string, unknown> = {};
  if (q) {
    where.variant = {
      OR: [
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
        { product: { name: { contains: q, mode: "insensitive" } } },
      ],
    };
  }
  const [rows, total] = await Promise.all([
    prisma.inventory.findMany({
      where: where as never,
      include: { variant: { include: { product: { include: { brand: true, category: true } } } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inventory.count({ where: where as never }),
  ]);
  const items = rows.map((r) => ({
    ...r,
    sellableQty: sellableQty(r),
    lowStock: sellableQty(r) <= r.minStock,
  })).filter((r) => (lowOnly ? r.lowStock : true));
  return ok({ items, total, page, pageSize });
});
