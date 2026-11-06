import { adminPageDenied } from "@/lib/admin-page";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { notFound } from "next/navigation";
import { OrderActions, RefundForm } from "@/components/admin-ui";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const denied = await adminPageDenied("orders:read");
  if (denied) return denied;
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { user: true, items: true, history: { orderBy: { createdAt: "asc" } }, delivery: true, payments: { include: { attempts: true, refunds: true } }, refunds: true, coupon: true },
  });
  if (!order) notFound();
  return (
    <div>
      <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
      <p className="text-muted">
        {order.user.name ?? order.user.phone} · {order.user.phone} · {new Date(order.createdAt).toLocaleString("en-IN")}
      </p>
      <p className="mt-1 text-sm">
        Status: <strong>{order.status}</strong> · Payment: {order.paymentMethod} · BUSY sync: {order.busySyncStatus}
        {order.busyVoucherId ? ` · Voucher: ${order.busyVoucherId}` : ""}
        {order.busyInvoiceId ? ` · Invoice: ${order.busyInvoiceId}` : ""}
      </p>
      <div className="mt-4">
        <OrderActions orderId={order.id} status={order.status} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="font-bold">Items</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span>{i.productName} ({i.variantName}) × {i.qty}</span>
                <span>{formatPaise(i.totalPaise)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPaise(order.subtotalPaise)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>−{formatPaise(order.discountPaise)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{formatPaise(order.deliveryChargePaise)}</span></div>
            <div className="flex justify-between"><span>GST (included)</span><span>{formatPaise(order.taxPaise)}</span></div>
            <div className="flex justify-between font-bold"><span>Grand total</span><span>{formatPaise(order.grandTotalPaise)}</span></div>
          </div>
          <h3 className="mt-4 font-bold">Status history</h3>
          <ul className="mt-1 space-y-1 text-sm text-muted">
            {order.history.map((h) => (
              <li key={h.id}>
                {h.toStatus} — {new Date(h.createdAt).toLocaleString("en-IN")}
                {h.note ? ` (${h.note})` : ""}
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-4">
          <div className="rounded-lg border border-line bg-white p-4">
            <h2 className="font-bold">Delivery</h2>
            <p className="mt-1 text-sm">
              Mode: {order.deliveryMethod}
              {order.delivery ? ` · ${order.delivery.status}` : ""}
              {order.addressSnapshot && typeof order.addressSnapshot === "object"
                ? ` · ${(order.addressSnapshot as Record<string, unknown>).line1 ?? ""}, ${(order.addressSnapshot as Record<string, unknown>).city ?? ""} ${(order.addressSnapshot as Record<string, unknown>).pincode ?? ""}`
                : ""}
            </p>
          </div>
          <div className="rounded-lg border border-line bg-white p-4">
            <h2 className="font-bold">Payments &amp; refunds</h2>
            <ul className="mt-1 space-y-1 text-sm">
              {order.payments.map((p) => (
                <li key={p.id}>
                  {p.method} · {p.status} · {formatPaise(p.amountPaise)}
                </li>
              ))}
              {order.refunds.map((r) => (
                <li key={r.id}>
                  Refund {r.status} · {formatPaise(r.amountPaise)} · {r.reason}
                </li>
              ))}
              {order.payments.length === 0 ? <li className="text-muted">No payment records (COD order).</li> : null}
            </ul>
          </div>
          <RefundForm orderId={order.id} />
        </section>
      </div>
    </div>
  );
}
