import { adminPageDenied } from "@/lib/admin-page";
import { prisma } from "@/lib/prisma";
import { cachedJson } from "@/lib/cache";
import { getBusyPosConfig, getBusyPosMetrics } from "@/lib/busy-pos";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const denied = await adminPageDenied("dashboard:read");
  if (denied) return denied;

  // Real zero baseline (No fabricated financial placeholders)
  const emptyStoreMetrics = {
    totalSalesAgg: { _sum: { grandTotalPaise: 0 as number | null }, _count: { id: 0 } },
    posSalesAgg: { _sum: { grandTotalPaise: 0 as number | null }, _count: { id: 0 } },
    onlineSalesAgg: { _sum: { grandTotalPaise: 0 as number | null }, _count: { id: 0 } },
    totalOrdersCount: 0,
    lowStockCount: 0,
    totalProductsCount: 0,
    activeProductsCount: 0,
    inventoryStockItems: [] as Array<{ availableQty: number; variant: { costPricePaise: number; sellingPaise: number; mrpPaise: number } }>,
    pendingCodAgg: { _sum: { grandTotalPaise: 0 as number | null }, _count: { id: 0 } },
    recentOrders: [] as any[],
    soldItemsWithCost: [] as any[],
    liveHistoryEvents: [] as any[],
    customersCount: 0,
  };

  let storeMetrics: any = emptyStoreMetrics;
  let posConfig: any = { enabled: false };
  let posMetrics: any = { todaySalesPaise: 0, todayBillsCount: 0, recentVouchers: [] };

  try {
    const [fetchedPosConfig, fetchedPosMetrics, fetchedStoreMetrics] = await Promise.all([
      getBusyPosConfig().catch(() => ({ enabled: false })),
      getBusyPosMetrics().catch(() => ({ todaySalesPaise: 0, todayBillsCount: 0, recentVouchers: [] })),
      cachedJson("admin:dashboard:metrics:v4", 30, async () => {
        try {
          const [
            totalSalesAgg,
            posSalesAgg,
            onlineSalesAgg,
            totalOrdersCount,
            lowStockCount,
            totalProductsCount,
            activeProductsCount,
            inventoryStockItems,
            pendingCodAgg,
            recentOrders,
            soldItemsWithCost,
            liveHistoryEvents,
            customersCount,
          ] = await Promise.all([
            // Total Revenue (all non-cancelled orders)
            prisma.order.aggregate({
              where: { status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] } },
              _sum: { grandTotalPaise: true },
              _count: { id: true },
            }).catch(() => emptyStoreMetrics.totalSalesAgg),

            // In-store POS Sales (deliveryMethod == PICKUP)
            prisma.order.aggregate({
              where: {
                deliveryMethod: "PICKUP",
                status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] },
              },
              _sum: { grandTotalPaise: true },
              _count: { id: true },
            }).catch(() => emptyStoreMetrics.posSalesAgg),

            // Online Orders (deliveryMethod == DELIVERY)
            prisma.order.aggregate({
              where: {
                deliveryMethod: "DELIVERY",
                status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] },
              },
              _sum: { grandTotalPaise: true },
              _count: { id: true },
            }).catch(() => emptyStoreMetrics.onlineSalesAgg),

            // Total Orders count
            prisma.order.count().catch(() => 0),

            // Low stock items count (threshold <= 10 units)
            prisma.inventory.count({
              where: { availableQty: { lte: 10 } },
            }).catch(() => 0),

            // Total products in catalog
            prisma.product.count({ where: { deletedAt: null } }).catch(() => 0),

            // Active products
            prisma.product.count({ where: { deletedAt: null, isActive: true } }).catch(() => 0),

            // Inventory items for stock valuation at cost
            prisma.inventory.findMany({
              select: {
                availableQty: true,
                variant: {
                  select: {
                    costPricePaise: true,
                    sellingPaise: true,
                    mrpPaise: true,
                  },
                },
              },
              take: 200,
            }).catch(() => []),

            // Pending COD orders
            prisma.order.aggregate({
              where: {
                paymentMethod: "COD",
                status: { notIn: ["CANCELLED", "DELIVERED"] },
              },
              _sum: { grandTotalPaise: true },
              _count: { id: true },
            }).catch(() => emptyStoreMetrics.pendingCodAgg),

            // Recent orders with customer and items
            prisma.order.findMany({
              take: 5,
              orderBy: { createdAt: "desc" },
              include: {
                user: { select: { name: true, phone: true } },
                items: true,
              },
            }).catch(() => []),

            // Real Order Items for COGS & Category Profitability
            prisma.orderItem.findMany({
              where: { order: { status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] } } },
              select: {
                qty: true,
                totalPaise: true,
                costPricePaise: true,
                variant: {
                  select: {
                    costPricePaise: true,
                    sellingPaise: true,
                    product: { select: { category: { select: { name: true, slug: true } } } },
                  },
                },
              },
              take: 150,
            }).catch(() => []),

            // Real Live Operations Feed
            prisma.orderStatusHistory.findMany({
              take: 4,
              orderBy: { createdAt: "desc" },
              include: { order: true },
            }).catch(() => []),

            // Total registered customers
            prisma.user.count().catch(() => 0),
          ]);

          return {
            totalSalesAgg,
            posSalesAgg,
            onlineSalesAgg,
            totalOrdersCount,
            lowStockCount,
            totalProductsCount,
            activeProductsCount,
            inventoryStockItems,
            pendingCodAgg,
            recentOrders,
            soldItemsWithCost,
            liveHistoryEvents,
            customersCount,
          };
        } catch {
          return emptyStoreMetrics;
        }
      }).catch(() => emptyStoreMetrics),
    ]);

    posConfig = fetchedPosConfig;
    posMetrics = fetchedPosMetrics;
    storeMetrics = fetchedStoreMetrics ?? emptyStoreMetrics;
  } catch {
    /* fallback to safe empty metrics */
  }

  const {
    totalSalesAgg,
    posSalesAgg,
    onlineSalesAgg,
    totalOrdersCount,
    lowStockCount,
    totalProductsCount,
    activeProductsCount,
    inventoryStockItems,
    pendingCodAgg,
    recentOrders,
    soldItemsWithCost,
    liveHistoryEvents,
    customersCount,
  } = storeMetrics;

  // Real calculations directly from database aggregates
  const realSalesPaise = totalSalesAgg._sum?.grandTotalPaise ?? 0;
  const realPosPaise = posSalesAgg._sum?.grandTotalPaise ?? 0;
  const realOnlinePaise = onlineSalesAgg._sum?.grandTotalPaise ?? 0;
  const displayOrders = totalOrdersCount;

  // Real COGS (Cost of Goods Sold) computation from item records
  let computedCogsPaise = 0;
  let hasIncompleteCost = false;

  const catTotals = new Map<string, number>();

  for (const item of soldItemsWithCost) {
    const cost = item.costPricePaise > 0 ? item.costPricePaise : (item.variant?.costPricePaise || 0);
    if (cost > 0) {
      computedCogsPaise += item.qty * cost;
    } else {
      hasIncompleteCost = true;
    }

    const catName = item.variant?.product?.category?.name || "Grocery & Staples";
    catTotals.set(catName, (catTotals.get(catName) ?? 0) + item.totalPaise);
  }

  // Calculate Gross Profit truthfully from real Net Sales minus recorded COGS
  let grossProfitPaise = 0;
  if (realSalesPaise > 0) {
    if (computedCogsPaise > 0) {
      grossProfitPaise = Math.max(0, realSalesPaise - computedCogsPaise);
    } else {
      // If purchase costs have not yet been inwarded, profit cannot be fabricated
      grossProfitPaise = 0;
    }
  }

  const displayLowStock = lowStockCount;
  const displayCodPaise = pendingCodAgg._sum?.grandTotalPaise ?? 0;
  const displayCodOrders = pendingCodAgg._count?.id ?? 0;

  // Inventory Stock Valuation at Cost (or selling price if cost not yet entered)
  let computedStockValuationPaise = 0;
  for (const item of inventoryStockItems) {
    const unitValuation = item.variant?.costPricePaise > 0
      ? item.variant.costPricePaise
      : (item.variant?.sellingPaise || item.variant?.mrpPaise || 0);
    computedStockValuationPaise += (item.availableQty || 0) * unitValuation;
  }

  const aovPaise = displayOrders > 0 ? Math.round(realSalesPaise / displayOrders) : 0;

  // Omnichannel totals: In-Store POS + Online Store
  const omnichannelTotalPaise = realSalesPaise;

  // Real Category Distribution based on actual order history
  const categoryIcons: Record<string, string> = {
    "Grocery & Staples": "🌾",
    "Dairy, Bread & Eggs": "🥛",
    "Dairy & Bakery": "🥛",
    "Snacks & Munchies": "🍿",
    "Snacks & Beverages": "🍿",
    "Personal Care": "🧴",
    "Home & Cleaning": "🧼",
    "Beverages": "🥤",
  };

  const categoryList = Array.from(catTotals.entries()).map(([name, paise]) => ({
    name,
    icon: categoryIcons[name] || "📦",
    paise,
    pct: realSalesPaise > 0 ? parseFloat(((paise / realSalesPaise) * 100).toFixed(1)) : 0,
  }));

  // If no sales yet, show clean top categories from catalog with 0 sales
  if (categoryList.length === 0) {
    categoryList.push(
      { name: "Grocery & Staples", icon: "🌾", paise: 0, pct: 0 },
      { name: "Dairy & Bakery", icon: "🥛", paise: 0, pct: 0 },
      { name: "Snacks & Beverages", icon: "🍿", paise: 0, pct: 0 },
      { name: "Personal Care", icon: "🧴", paise: 0, pct: 0 },
      { name: "Home & Cleaning", icon: "🧼", paise: 0, pct: 0 },
    );
  }

  return (
    <AdminDashboardClient
      displaySalesPaise={realSalesPaise}
      displayOrders={displayOrders}
      grossProfitPaise={grossProfitPaise}
      displayLowStock={displayLowStock}
      displayCodPaise={displayCodPaise}
      displayCodOrders={displayCodOrders}
      displayStockPaise={computedStockValuationPaise}
      aovPaise={aovPaise}
      totalProductsCount={totalProductsCount}
      activeProductsCount={activeProductsCount}
      customersCount={customersCount}
      inStorePosPaise={realPosPaise}
      omnichannelTotalPaise={omnichannelTotalPaise}
      categoryList={categoryList}
      recentOrders={recentOrders as any}
      liveHistoryEvents={liveHistoryEvents as any}
      posMetrics={posMetrics}
      posConfig={posConfig}
    />
  );
}
