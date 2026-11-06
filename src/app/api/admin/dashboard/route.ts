import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sellableQty } from "@/lib/inventory";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "dashboard:read");
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [todayOrders, todaySales, pending, preparing, outForDelivery, recentOrders, lowStockRows, outRows, topProducts, paymentBreakdown] =
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
      prisma.inventory.findMany({ include: { variant: { include: { product: true } } }, take: 200 }),
      prisma.inventory.findMany({ include: { variant: { include: { product: true } } }, take: 500 }),
      prisma.orderItem.groupBy({ by: ["variantId"], _sum: { qty: true }, orderBy: { _sum: { qty: "desc" } }, take: 10 }),
      prisma.payment.groupBy({ by: ["method"], _sum: { amountPaise: true }, where: { status: "CAPTURED" } }),
    ]);
  const lowStock = lowStockRows.filter((r) => sellableQty(r) <= r.minStock).slice(0, 10);
  const outOfStock = outRows.filter((r) => sellableQty(r) <= 0).slice(0, 10);
  const topVariantIds = topProducts.map((t) => t.variantId);
  const topVariants = await prisma.productVariant.findMany({
    where: { id: { in: topVariantIds } },
    include: { product: true },
  });
  const top = topProducts.map((t) => ({
    variant: topVariants.find((v) => v.id === t.variantId),
    qty: t._sum.qty ?? 0,
  }));
  const aov = todayOrders > 0 ? Math.round((todaySales._sum.grandTotalPaise ?? 0) / todayOrders) : 0;
  return ok({
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
  });
});
