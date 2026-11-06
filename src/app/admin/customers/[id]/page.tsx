import { adminPageDenied } from "@/lib/admin-page";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { notFound } from "next/navigation";

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const denied = await adminPageDenied("customers:read");
  if (denied) return denied;
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      profile: true,
      addresses: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, take: 20, include: { items: true } },
      loyalty: { include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } } },
      credit: { include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } } },
    },
  });
  if (!user) notFound();
  return (
    <div>
      <h1 className="text-2xl font-bold">{user.name ?? user.phone}</h1>
      <p className="text-muted">{user.phone}{user.email ? ` · ${user.email}` : ""}</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="font-bold">Addresses</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {user.addresses.map((a) => (
              <li key={a.id}>{a.label} — {a.line1}, {a.city} {a.pincode}</li>
            ))}
            {user.addresses.length === 0 ? <li className="text-muted">No addresses.</li> : null}
          </ul>
          <h2 className="mt-4 font-bold">Recent orders</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {user.orders.map((o) => (
              <li key={o.id} className="flex justify-between">
                <span>{o.orderNumber} · {o.status}</span>
                <span>{formatPaise(o.grandTotalPaise)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="font-bold">Loyalty ({user.loyalty?.points ?? 0} pts)</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {user.loyalty?.transactions.map((t) => (
              <li key={t.id}>{t.type} {t.pointsDelta > 0 ? "+" : ""}{t.pointsDelta} — {t.reason}</li>
            ))}
          </ul>
          <h2 className="mt-4 font-bold">Store credit ({formatPaise(user.credit?.balancePaise ?? 0)})</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {user.credit?.transactions.map((t) => (
              <li key={t.id}>{t.type} {formatPaise(t.amountPaise)} — {t.reason}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
