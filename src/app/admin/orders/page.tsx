import { adminPageDenied } from "@/lib/admin-page";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { AdminCard, AdminPageHeader, StatusBadge } from "@/components/admin-display";
import Link from "next/link";

const STATUSES = ["PLACED", "CONFIRMED", "PREPARING", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "PENDING_PAYMENT", "PAYMENT_FAILED", "REFUND_PENDING", "REFUNDED"];

export default async function AdminOrdersPage({ searchParams }: { searchParams: { status?: string } }) {
  const denied = await adminPageDenied("orders:read");
  if (denied) return denied;
  const where: Record<string, unknown> = {};
  if (searchParams.status) where.status = searchParams.status;
  const orders = await prisma.order.findMany({
    where: where as never,
    include: { user: { select: { phone: true, name: true } }, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <AdminPageHeader title="Orders" subtitle="Newest first. Filter by status to triage the pipeline." />
      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/orders"
          className={`rounded-full border px-3.5 py-1.5 font-medium ${
            !searchParams.status ? "border-admin bg-admin text-white" : "border-adminline bg-white"
          }`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full border px-3.5 py-1.5 font-medium ${
              searchParams.status === s ? "border-admin bg-admin text-white" : "border-adminline bg-white"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>
      <AdminCard className="mt-4" title={`${orders.length} orders`} subtitle={searchParams.status ? `Status: ${searchParams.status}` : "All statuses"}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-2">Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Status</th>
                <th>Total</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-adminline">
                  <td className="py-2.5">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td>{o.user.name ?? o.user.phone}</td>
                  <td>{o.items.length}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td>{formatPaise(o.grandTotalPaise)}</td>
                  <td>{new Date(o.createdAt).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 ? <p className="py-4 text-muted">No orders in this view.</p> : null}
        </div>
      </AdminCard>
    </div>
  );
}
