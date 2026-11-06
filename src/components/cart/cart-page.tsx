"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api/client";
import { ProductImage } from "@/components/product/product-image";
import { Price, Mrp, EmptyState } from "@/components/ui";
import { CartSkeleton } from "@/components/ui/skeletons";
import { formatPaise } from "@/lib/money";
import Link from "next/link";

export type CartLine = {
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

export type Cart = {
  lines: CartLine[];
  subtotalPaise: number;
  mrpTotalPaise: number;
  savingsPaise: number;
  count: number;
};

export function CartPageView() {
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
          body="Looks like you haven't added anything to your cart yet. Explore fresh groceries delivering in 8 minutes."
          action={
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0c831f] hover:bg-[#0a701a] px-6 py-2.5 text-sm font-black text-white shadow-sm transition active:scale-95 cursor-pointer"
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
      {/* 8 Mins ETA Alert */}
      <div className="rounded-2xl bg-[#e8f5e9] border border-[#0c831f]/20 p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#0c831f] text-white flex items-center justify-center text-lg font-bold">
            ⚡
          </div>
          <div>
            <h2 className="text-sm font-black text-[#1c1c1c]">Delivery in 8 minutes</h2>
            <p className="text-xs text-neutral-600 mt-0.5">Shipment of {cart.count} items</p>
          </div>
        </div>
        <span className="text-xs font-black text-[#0c831f] bg-white px-3 py-1 rounded-full border border-[#0c831f]/30">
          Superfast
        </span>
      </div>

      {/* Free Delivery Meter */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
        {remainingForFree > 0 ? (
          <div>
            <p className="text-xs text-neutral-600 font-medium">
              Add items worth <span className="font-bold text-[#0c831f]">{formatPaise(remainingForFree)}</span> more to unlock <span className="font-bold text-[#1c1c1c]">FREE Delivery</span>
            </p>
            <div className="mt-2 h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0c831f] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (subtotal / FREE_THRESHOLD) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-[#0c831f]">
            <span>🎉</span>
            <span>You have unlocked FREE Delivery on this order!</span>
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 border border-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Cart Items */}
        <div className="lg:col-span-7 space-y-3">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs divide-y divide-neutral-100">
            {cart.lines.map((l) => (
              <div key={l.variantId} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-16 w-16 shrink-0 rounded-xl border border-neutral-100 bg-white p-1 overflow-hidden flex items-center justify-center">
                    <ProductImage
                      src={l.imageUrl ?? "/placeholder.svg"}
                      alt={l.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/product/${l.slug}`} className="text-xs sm:text-sm font-bold text-[#1c1c1c] hover:text-[#0c831f] line-clamp-1">
                      {l.name}
                    </Link>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{l.variantName}</p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <Price paise={l.unitPricePaise} className="text-xs sm:text-sm font-black" />
                      {l.mrpPaise > l.unitPricePaise ? <Mrp paise={l.mrpPaise} className="text-[10px]" /> : null}
                    </div>
                  </div>
                </div>

                {/* Blinkit Stepper */}
                <div className="flex items-center rounded-lg bg-[#0c831f] text-white shadow-xs shrink-0">
                  <button
                    onClick={() => setQty(l.variantId, l.qty - 1)}
                    disabled={busy}
                    className="px-2.5 py-1 text-xs font-extrabold hover:bg-[#0a701a] rounded-l-md transition cursor-pointer"
                  >
                    −
                  </button>
                  <span className="px-2 text-xs font-black min-w-6 text-center">{l.qty}</span>
                  <button
                    onClick={() => setQty(l.variantId, l.qty + 1)}
                    disabled={busy}
                    className="px-2.5 py-1 text-xs font-extrabold hover:bg-[#0a701a] rounded-r-md transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Bill Details & Checkout */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">Bill Summary</h3>
            <div className="space-y-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Item Total</span>
                <span className="font-semibold text-[#1c1c1c]">{formatPaise(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                {deliveryCharge === 0 ? (
                  <span className="font-bold text-[#0c831f]">FREE</span>
                ) : (
                  <span className="font-semibold text-[#1c1c1c]">{formatPaise(deliveryCharge)}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span>Handling Fee</span>
                <span className="font-semibold text-[#1c1c1c]">{formatPaise(handlingCharge)}</span>
              </div>
              {tipPaise > 0 ? (
                <div className="flex justify-between text-[#0c831f] font-semibold">
                  <span>Delivery Tip</span>
                  <span>₹{tip}</span>
                </div>
              ) : null}
              {cart.savingsPaise > 0 ? (
                <div className="flex justify-between text-[#0c831f] font-bold bg-[#e8f5e9] p-2 rounded-lg">
                  <span>Total Savings</span>
                  <span>-{formatPaise(cart.savingsPaise)}</span>
                </div>
              ) : null}
              <div className="flex justify-between pt-3 border-t border-neutral-200 text-base font-black text-[#1c1c1c]">
                <span>To Pay</span>
                <span>{formatPaise(grandTotal)}</span>
              </div>
            </div>

            {/* Delivery Partner Tip Selector */}
            <div className="rounded-xl border border-neutral-100 bg-[#f8f8f8] p-3">
              <p className="text-xs font-bold text-[#1c1c1c] flex items-center gap-1.5">
                <span>🚴</span> Tip your delivery partner
              </p>
              <div className="flex gap-2 mt-2">
                {[10, 20, 30, 50].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTip(tip === amt ? null : amt)}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      tip === amt
                        ? "bg-[#0c831f] text-white border-[#0c831f]"
                        : "bg-white text-neutral-700 border-neutral-200 hover:border-[#0c831f]"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full flex items-center justify-between rounded-xl bg-[#0c831f] hover:bg-[#0a701a] px-5 py-3 text-white font-black shadow-md transition active:scale-[0.99] cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <span className="text-lg">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPageView;
