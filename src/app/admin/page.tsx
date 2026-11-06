import { adminPageDenied } from "@/lib/admin-page";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { AdminCard, AdminPageHeader, StatusBadge, RevenueLineChart, CategoryBars, StatusDonut } from "@/components/admin-display";
import Link from "next/link";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dayLabel(isoDate: string): string {
  return `${parseInt(isoDate.slice(8, 10), 10)} ${MONTHS[parseInt(isoDate.slice(5, 7), 10) - 1]}`;
}

export default async function AdminDashboard() {
  const denied = await adminPageDenied("dashboard:read");
  if (denied) return denied;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);
  const [todayAgg, todayCount, pending, preparing, outForDelivery, lowStock, outOfStock, topProducts, recentOrders, payments, productsCount, statusBreakdown, dailyPayments, categoryItems] =
    await Promise.all([
      prisma.order.aggregate({ where: { createdAt: { gte: today }, status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] } }, _sum: { grandTotalPaise: true } }),
      prisma.order.count({ where: { createdAt: { gte: today }, status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] } } }),
      prisma.order.count({ where: { status: "PLACED" } }),
      prisma.order.count({ where: { status: "PREPARING" } }),
      prisma.order.count({ where: { status: "OUT_FOR_DELIVERY" } }),
      prisma.inventory.count({ where: { availableQty: { lte: 5 } } }),
      prisma.inventory.count({ where: { availableQty: 0 } }),
      prisma.orderItem.groupBy({ by: ["variantId"], _sum: { qty: true, totalPaise: true }, orderBy: { _sum: { totalPaise: "desc" } }, take: 5 }),
      prisma.order.findMany({ include: { user: { select: { phone: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 10 }),
      // PAID-only revenue: captured payments grouped by method (same
      // definition as the /api/admin/dashboard endpoint).
      prisma.payment.groupBy({ by: ["method"], where: { status: "CAPTURED" }, _sum: { amountPaise: true } }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.payment.findMany({ where: { status: "CAPTURED", createdAt: { gte: since } }, select: { createdAt: true, amountPaise: true } }),
      prisma.orderItem.findMany({
        where: { order: { status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] } } },
        select: { totalPaise: true, variant: { select: { product: { select: { category: { select: { name: true } } } } } } },
      }),
    ]);
  const sales = todayAgg._sum.grandTotalPaise ?? 0;
  const aov = todayCount > 0 ? Math.round(sales / todayCount) : 0;
  const variantIds = topProducts.map((t) => t.variantId);
  const variants = await prisma.productVariant.findMany({ where: { id: { in: variantIds } }, include: { product: true } });

  // Revenue trend: one bucket per day for the last 14 days (UTC date keys),
  // summed from captured payments only — real data, never invented.
  const dayKeys: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(since);
    d.setDate(since.getDate() + (13 - i));
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const dailyTotals = new Map<string, number>(dayKeys.map((k) => [k, 0]));
  for (const p of dailyPayments) {
    const k = p.createdAt.toISOString().slice(0, 10);
    if (dailyTotals.has(k)) dailyTotals.set(k, (dailyTotals.get(k) ?? 0) + p.amountPaise);
  }
  const trendPoints = dayKeys.map((k) => ({ label: dayLabel(k), value: dailyTotals.get(k) ?? 0 }));

  // Category sales: real order-item totals for non-cancelled orders.
  const categoryTotals = new Map<string, number>();
  for (const item of categoryItems) {
    const name = item.variant.product.category?.name ?? "Uncategorised";
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + item.totalPaise);
  }
  const categoryRows = [...categoryTotals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const statusSlices = statusBreakdown.map((s) => ({ label: s.status, count: s._count._all }));

  return (
    <div>
      <AdminPageHeader title="Dashboard" subtitle="Real totals from the store database, refreshed on every load." />

      {/* Green stat band (preview design) */}
      <div className="grid grid-cols-2 gap-4 rounded-2xl bg-admin p-5 text-white shadow-sm lg:grid-cols-4">
        <div>
          <p className="text-sm text-white/80">Today&apos;s sales</p>
          <p className="mt-1 text-2xl font-extrabold">{formatPaise(sales)}</p>
          <p className="mt-0.5 text-xs text-white/80">{todayCount} orders today</p>
        </div>
        <div>
          <p className="text-sm text-white/80">Products</p>
          <p className="mt-1 text-2xl font-extrabold">{productsCount}</p>
          <p className="mt-0.5 text-xs text-white/80">live catalogue</p>
        </div>
        <div>
          <p className="text-sm text-white/80">Pending orders</p>
          <p className="mt-1 text-2xl font-extrabold">{pending}</p>
          <p className="mt-0.5 text-xs text-white/80">
            {preparing} preparing · {outForDelivery} out for delivery
          </p>
        </div>
        <div>
          <p className="text-sm text-white/80">Stock alerts</p>
          <p className="mt-1 text-2xl font-extrabold">{lowStock} low</p>
          <p className="mt-0.5 text-xs text-white/80">{outOfStock} out of stock</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminCard title="Revenue received" subtitle="Captured payments only, last 14 days">
          <RevenueLineChart points={trendPoints} />
        </AdminCard>
        <AdminCard title="Orders by status" subtitle="All orders in the store">
          <StatusDonut slices={statusSlices} />
        </AdminCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminCard title="Sales by category" subtitle="Non-cancelled orders, by product category">
          <CategoryBars rows={categoryRows} />
        </AdminCard>
        <AdminCard title="Top products" subtitle="By revenue, all time">
          <ul className="space-y-2.5 text-sm">
            {topProducts.map((t) => {
              const v = variants.find((x) => x.id === t.variantId);
              return (
                <li key={t.variantId} className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{v ? `${v.product.name} (${v.packSize ?? v.name})` : t.variantId}</span>
                  <span className="shrink-0 text-muted">
                    {t._sum.qty} sold · {formatPaise(t._sum.totalPaise ?? 0)}
                  </span>
                </li>
              );
            })}
            {topProducts.length === 0 ? <li className="text-muted">No sales yet.</li> : null}
          </ul>
        </AdminCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminCard title="Payments received" subtitle="Captured payments by method">
          <ul className="space-y-2.5 text-sm">
            {payments.map((p) => (
              <li key={p.method} className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{p.method}</span>
                <span className="text-muted">{formatPaise(p._sum.amountPaise ?? 0)}</span>
              </li>
            ))}
            {payments.length === 0 ? <li className="text-muted">No captured payments yet.</li> : null}
          </ul>
        </AdminCard>
        <AdminCard title="Order overview" subtitle="Today's orders at a glance">
          <p className="text-2xl font-extrabold">{formatPaise(aov)}</p>
          <p className="mt-0.5 text-sm text-muted">Average order value today</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-adminbg p-3">
              <p className="text-lg font-bold">{pending}</p>
              <p className="text-xs text-muted">Pending</p>
            </div>
            <div className="rounded-lg bg-adminbg p-3">
              <p className="text-lg font-bold">{preparing}</p>
              <p className="text-xs text-muted">Preparing</p>
            </div>
            <div className="rounded-lg bg-adminbg p-3">
              <p className="text-lg font-bold">{outForDelivery}</p>
              <p className="text-xs text-muted">Out for delivery</p>
            </div>
          </div>
        </AdminCard>
      </div>

      <AdminCard title="Recent orders" subtitle="Latest 10 orders" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-2">Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-t border-adminline">
                  <td className="py-2.5">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td>{o.user.name ?? o.user.phone}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td>{formatPaise(o.grandTotalPaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentOrders.length === 0 ? <p className="py-4 text-muted">No orders yet.</p> : null}
        </div>
      </AdminCard>
    </div>
  );
}
