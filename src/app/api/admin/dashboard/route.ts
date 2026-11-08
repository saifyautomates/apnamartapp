import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sellableQty } from "@/lib/inventory";
import { cachedJson } from "@/lib/cache";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "dashboard:read");

  const data = await cachedJson("admin:api:dashboard:v2", 15, async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [todayOrders, todaySales, pending, preparing, outForDelivery, recentOrders, inventoryRows, topProducts, paymentBreakdown] =
      await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: start }, status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] } } }),
        prisma.order.aggregate({
          where: { createdAt: { gte: start }, status: { notIn: ["CANCELLED", "PAYMENT_FAILED", "REFUNDED"] } },
          _sum: { grandTotalPaise: true },
        }),
        prisma.order.count({ where: { status: "PLACED" } }),
        prisma.order.count({ where: { status: "PREPARING" } }),
        prisma.order.count({ where: { status: "OUT_FOR_DELIVERY" } }),
        prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { items: true } }),
        prisma.inventory.findMany({
          select: {
            id: true,
            availableQty: true,
            reservedQty: true,
            minStock: true,
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                product: { select: { id: true, name: true, slug: true } },
              },
            },
          },
          take: 200,
        }),
        prisma.orderItem.groupBy({ by: ["variantId"], _sum: { qty: true }, orderBy: { _sum: { qty: "desc" } }, take: 10 }),
        prisma.payment.groupBy({ by: ["method"], _sum: { amountPaise: true }, where: { status: "CAPTURED" } }),
      ]);

    const lowStock = inventoryRows.filter((r) => sellableQty(r as any) <= r.minStock).slice(0, 10);
    const outOfStock = inventoryRows.filter((r) => sellableQty(r as any) <= 0).slice(0, 10);
    const topVariantIds = topProducts.map((t) => t.variantId);
    const topVariants = await prisma.productVariant.findMany({
      where: { id: { in: topVariantIds } },
      select: { id: true, name: true, product: { select: { name: true } } },
    });
    const top = topProducts.map((t) => ({
      variant: topVariants.find((v) => v.id === t.variantId),
      qty: t._sum.qty ?? 0,
    }));
    const aov = todayOrders > 0 ? Math.round((todaySales._sum.grandTotalPaise ?? 0) / todayOrders) : 0;

    return {
      todayOrders,
      todaySalesPaise: todaySales._sum.grandTotalPaise ?? 0,
      averageOrderValuePaise: aov,
      pending,
      preparing,
      outForDelivery,
      lowStock,
      outOfStock,
      topProducts: top,
      recentOrders,
      paymentBreakdown,
    };
  });

  return ok(data);
});
