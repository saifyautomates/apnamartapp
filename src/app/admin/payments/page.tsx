import { adminPageDenied } from "@/lib/admin-page";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";

export default async function AdminPaymentsPage() {
  const denied = await adminPageDenied("payments:read");
  if (denied) return denied;
  const payments = await prisma.payment.findMany({ include: { order: { select: { orderNumber: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <h1 className="text-2xl font-bold">Payments</h1>
      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="px-3 py-2">Order</th>
              <th>Method</th>
              <th>Provider</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-3 py-2">{p.order.orderNumber}</td>
                <td>{p.method}</td>
                <td>{p.provider}</td>
                <td>{p.status}</td>
                <td>{formatPaise(p.amountPaise)}</td>
                <td>{new Date(p.createdAt).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 ? <p className="p-4 text-muted">No payments yet.</p> : null}
      </div>
    </div>
  );
}
