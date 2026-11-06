import { adminPageDenied } from "@/lib/admin-page";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { AdminCard, AdminPageHeader } from "@/components/admin-display";
import Link from "next/link";

export default async function AdminCustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const denied = await adminPageDenied("customers:read");
  if (denied) return denied;
  const q = searchParams.q ?? "";
  const where: Record<string, unknown> = { deletedAt: null };
  if (q) {
    where.OR = [{ phone: { contains: q } }, { name: { contains: q, mode: "insensitive" } }];
  }
  const users = await prisma.user.findMany({
    where: where as never,
    include: { _count: { select: { orders: true } }, orders: { orderBy: { createdAt: "desc" }, take: 1 }, loyalty: true, credit: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const ltv = await Promise.all(users.map((u) => prisma.order.aggregate({ where: { userId: u.id, status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] } }, _sum: { grandTotalPaise: true } })));
  return (
    <div>
      <AdminPageHeader title="Customers" subtitle="Lifetime value excludes cancelled and failed orders." />
      <form method="get" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search phone or name…"
          className="w-full max-w-md flex-1 rounded-full border border-adminline bg-white px-4 py-2 text-sm outline-none placeholder:text-muted focus:border-admin"
        />
        <button className="rounded-full bg-admin px-5 py-2 text-sm font-semibold text-white">Search</button>
      </form>
      <AdminCard className="mt-4" title={`${users.length} customers`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-2">Customer</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Lifetime value</th>
                <th>Last order</th>
                <th>Loyalty</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="border-t border-adminline">
                  <td className="py-2.5">
                    <Link href={`/admin/customers/${u.id}`} className="font-semibold">
                      {u.name ?? "—"}
                    </Link>
                  </td>
                  <td>{u.phone}</td>
                  <td>{u._count.orders}</td>
                  <td>{formatPaise(ltv[i]._sum.grandTotalPaise ?? 0)}</td>
                  <td>{u.orders[0] ? new Date(u.orders[0].createdAt).toLocaleDateString("en-IN") : "—"}</td>
                  <td>{u.loyalty?.points ?? 0} pts</td>
                  <td>{formatPaise(u.credit?.balancePaise ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 ? <p className="py-4 text-muted">No customers found.</p> : null}
        </div>
      </AdminCard>
    </div>
  );
}
