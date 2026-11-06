import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAccess } from "@/lib/auth";
import { Price, EtaBadge } from "@/components/ui";
import { redirect, notFound } from "next/navigation";
import OrderDetailClient from "@/components/order-detail";
import Link from "next/link";

const TIMELINE = [
  { key: "PLACED", label: "Order Placed", icon: "📝" },
  { key: "CONFIRMED", label: "Confirmed by Store", icon: "✅" },
  { key: "PREPARING", label: "Packing Fresh Items", icon: "📦" },
  { key: "PACKED", label: "Packed & Ready", icon: "🛍️" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🛵" },
  { key: "DELIVERED", label: "Delivered at Doorstep", icon: "🎉" },
];

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const token = cookies().get("gcp_access")?.value;
  let userId: string | null = null;
  if (token) {
    try {
      const s = verifyAccess(token);
      if (s.kind === "CUSTOMER") userId = s.userId ?? null;
    } catch {
      /* ignore */
    }
  }
  if (!userId) redirect("/login?next=/orders");

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, history: { orderBy: { createdAt: "asc" } }, delivery: true },
  });
  if (!order || order.userId !== userId) notFound();

  const currentIdx = TIMELINE.findIndex((t) => t.key === order.status);
  const isDelivered = order.status === "DELIVERED";
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Status Banner */}
      <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Order #{order.orderNumber}</span>
            <h1 className="mt-0.5 text-2xl font-black text-ink">
              {isDelivered
                ? "Order Delivered!"
                : isCancelled
                ? "Order Cancelled"
                : "Arriving in 10 minutes ⚡"}
            </h1>
            <p className="mt-1 text-xs text-muted font-medium">
              Placed on {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <EtaBadge minutes={10} className="px-3 py-1 text-xs" />
        </div>

        {/* Live Tracking Stepper */}
        {!isCancelled ? (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-black text-ink uppercase tracking-wider mb-4">Live Order Progress</h3>
            <div className="space-y-3">
              {TIMELINE.map((step, i) => {
                const isPassed = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black transition ${
                        isCurrent
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm"
                          : isPassed
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {step.icon}
                    </span>
                    <div className="flex-1">
                      <p className={`text-xs ${isPassed ? "font-black text-ink" : "font-medium text-slate-400"}`}>
                        {step.label}
                      </p>
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        In Progress
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700">
            This order has been cancelled and any reserved items have been restored to inventory.
          </div>
        )}
      </div>

      {/* Items & Bill Receipt */}
      <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-black text-ink uppercase tracking-wider">Items in this Delivery</h2>
        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
              <div>
                <p className="font-extrabold text-ink">{item.productName}</p>
                <p className="text-[11px] text-muted">{item.variantName} × {item.qty}</p>
              </div>
              <Price paise={item.totalPaise} className="font-black text-ink" />
            </div>
          ))}
        </div>

        {/* Bill Breakdown */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Items Subtotal</span>
            <Price paise={order.subtotalPaise} className="font-bold text-ink" />
          </div>
          {order.discountPaise > 0 ? (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Coupon Discount</span>
              <span>−<Price paise={order.discountPaise} /></span>
            </div>
          ) : null}
          {order.loyaltyDiscountPaise > 0 ? (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Loyalty Points</span>
              <span>−<Price paise={order.loyaltyDiscountPaise} /></span>
            </div>
          ) : null}
          {order.storeCreditUsedPaise > 0 ? (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Store Credit</span>
              <span>−<Price paise={order.storeCreditUsedPaise} /></span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            {order.deliveryChargePaise === 0 ? (
              <span className="font-bold text-emerald-600">FREE</span>
            ) : (
              <Price paise={order.deliveryChargePaise} className="font-bold text-ink" />
            )}
          </div>
          <div className="flex justify-between text-[11px] text-muted">
            <span>Taxes (Included GST)</span>
            <Price paise={order.taxPaise} />
          </div>
          <div className="flex justify-between pt-3 border-t border-slate-100 text-base font-black text-ink">
            <span>Grand Total</span>
            <Price paise={order.grandTotalPaise} />
          </div>
          {order.savingsPaise > 0 ? (
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center">
              🎉 You saved <Price paise={order.savingsPaise} /> on this order!
            </div>
          ) : null}
        </div>
      </div>

      {/* Action Buttons (Cancel / Reorder) */}
      <OrderDetailClient orderId={order.id} status={order.status} />

      <div className="text-center">
        <Link href="/" className="text-xs font-bold text-emerald-700 hover:underline">
          ← Back to Shopping
        </Link>
      </div>
    </div>
  );
}
