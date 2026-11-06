"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ProductImage } from "@/components/shop";
import { Price, Mrp, EmptyState } from "@/components/ui";
import { CartSkeleton } from "@/components/skeletons";
import { formatPaise } from "@/lib/money";
import Link from "next/link";

type CartLine = {
  variantId: string;
  name: string;
  variantName: string;
  imageUrl: string | null;
  slug: string;
  qty: number;
  unitPricePaise: number;
  mrpPaise: number;
  lineTotalPaise: number;
  sellable: number;
  overRequested: boolean;
};

type Cart = {
  lines: CartLine[];
  subtotalPaise: number;
  mrpTotalPaise: number;
  savingsPaise: number;
  count: number;
};

export default function CartPageClient() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tip, setTip] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetch("/api/cart").then((r) => r.json());
      setCart(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setQty(variantId: string, qty: number) {
    setBusy(true);
    setError("");
    try {
      await api("/api/cart", { method: "POST", body: JSON.stringify({ variantId, qty }) });
      await load();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <CartSkeleton />;

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <EmptyState
          title="Your cart is empty"
          body="Looks like you haven't added anything to your cart yet. Explore fresh groceries delivering in 10 minutes."
          action={
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-6 py-2.5 text-sm font-extrabold text-white shadow-sm transition active:scale-95"
            >
              Start Shopping →
            </Link>
          }
        />
      </div>
    );
  }

  const FREE_THRESHOLD = 19900;
  const subtotal = cart.subtotalPaise;
  const remainingForFree = Math.max(0, FREE_THRESHOLD - subtotal);
  const deliveryCharge = subtotal >= FREE_THRESHOLD ? 0 : 1500;
  const handlingCharge = 200;
  const tipPaise = tip ? tip * 100 : 0;
  const grandTotal = subtotal + deliveryCharge + handlingCharge + tipPaise;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 10 Mins ETA Alert */}
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white text-lg">
            ⚡
          </span>
          <div>
            <h2 className="text-sm font-black text-ink">Delivery in 10 minutes</h2>
            <p className="text-xs text-emerald-800 font-medium">Shipment of {cart.lines.reduce((s, l) => s + l.qty, 0)} items from your local dark store</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-xs">
          Instant Dispatch
        </span>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-bold text-red-600">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cart Items List */}
        <div className="md:col-span-2 space-y-3">
          {/* Free delivery banner */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
            {remainingForFree > 0 ? (
              <div>
                <p className="text-xs text-slate-600 font-medium">
                  Shop for <span className="font-bold text-emerald-700">{formatPaise(remainingForFree)}</span> more to get <span className="font-bold text-ink">FREE Delivery</span>
                </p>
                <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / FREE_THRESHOLD) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <span>🎉</span> You unlocked FREE Delivery!
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs divide-y divide-slate-100">
            {cart.lines.map((line) => (
              <article key={line.variantId} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-4">
                <div className="h-20 w-20 shrink-0 rounded-xl border border-slate-100 bg-white p-1.5 overflow-hidden flex items-center justify-center">
                  <ProductImage
                    src={line.imageUrl ?? "/placeholder.svg"}
                    alt={line.name}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${line.slug}`}
                    className="text-sm font-bold text-ink hover:text-emerald-700 leading-snug line-clamp-1"
                  >
                    {line.name}
                  </Link>
                  <p className="text-xs text-muted mt-0.5">{line.variantName}</p>

                  <div className="mt-1 flex items-baseline gap-2">
                    <Price paise={line.unitPricePaise} className="text-sm font-black text-ink" />
                    {line.mrpPaise > line.unitPricePaise ? (
                      <Mrp paise={line.mrpPaise} />
                    ) : null}
                  </div>

                  {line.overRequested ? (
                    <p className="mt-1 text-[11px] font-bold text-amber-600">
                      Only {line.sellable} available — adjusted at checkout.
                    </p>
                  ) : null}
                </div>

                {/* Stepper */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center rounded-xl bg-emerald-700 text-white shadow-xs">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => setQty(line.variantId, line.qty - 1)}
                      disabled={busy}
                      className="px-2.5 py-1 text-sm font-black hover:bg-emerald-800 rounded-l-xl transition disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="px-2 text-xs font-black min-w-6 text-center">{line.qty}</span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => setQty(line.variantId, line.qty + 1)}
                      disabled={busy}
                      className="px-2.5 py-1 text-sm font-black hover:bg-emerald-800 rounded-r-xl transition disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs font-black text-ink mt-1">
                    <Price paise={line.lineTotalPaise} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Bill Summary Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-ink uppercase tracking-wider">Bill Summary</h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Item total</span>
                <span className="font-bold text-ink">{formatPaise(cart.subtotalPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery charge</span>
                {deliveryCharge === 0 ? (
                  <span className="font-bold text-emerald-600">FREE</span>
                ) : (
                  <span className="font-bold text-ink">{formatPaise(deliveryCharge)}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span>Handling fee</span>
                <span className="font-bold text-ink">{formatPaise(handlingCharge)}</span>
              </div>
              {tipPaise > 0 ? (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Delivery partner tip</span>
                  <span>₹{tip}</span>
                </div>
              ) : null}
              {cart.savingsPaise > 0 ? (
                <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                  <span>Total Savings</span>
                  <span>-{formatPaise(cart.savingsPaise)}</span>
                </div>
              ) : null}
              <div className="flex justify-between pt-3 border-t border-slate-100 text-base font-black text-ink">
                <span>To Pay</span>
                <span>{formatPaise(grandTotal)}</span>
              </div>
            </div>

            {/* Tip Delivery Partner */}
            <div className="pt-2">
              <p className="text-xs font-bold text-ink flex items-center gap-1">
                <span>🚴</span> Tip your delivery partner
              </p>
              <div className="flex gap-1.5 mt-2">
                {[10, 20, 30, 50].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTip(tip === amt ? null : amt)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                      tip === amt
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-700 border-slate-200 hover:border-emerald-500"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-4 block w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white py-3 text-center text-sm font-black shadow-md transition active:scale-[0.99]"
            >
              Proceed to Checkout →
            </Link>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-[11px] text-muted space-y-1">
            <p className="font-bold text-slate-700">Cancellation Policy</p>
            <p>Orders cannot be cancelled once packed for delivery. In case of unexpected delay, a refund will be processed.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
