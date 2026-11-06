"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPaise } from "@/lib/money";
import { ProductImage } from "@/components/shop";

export interface CartLine {
  variantId: string;
  productId: string;
  name: string;
  variantName: string;
  brand: string | null;
  imageUrl: string | null;
  slug: string;
  qty: number;
  unitPricePaise: number;
  mrpPaise: number;
  lineTotalPaise: number;
  sellable: number;
  inStock: boolean;
}

export interface CartDetail {
  cartId: string;
  lines: CartLine[];
  subtotalPaise: number;
  mrpTotalPaise: number;
  savingsPaise: number;
  taxPaise: number;
  count: number;
}

let csrfToken: string | null = null;
async function ensureCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  try {
    const res = await fetch("/api/auth/csrf");
    const json = await res.json();
    csrfToken = json.data?.csrfToken as string;
    return csrfToken;
  } catch {
    return "";
  }
}

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState<number | null>(null);

  async function loadCart() {
    try {
      setLoading(true);
      const res = await fetch("/api/cart");
      if (!res.ok) return;
      const json = await res.json();
      setCart(json.data ?? null);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();

    const handleOpen = () => {
      setOpen(true);
      loadCart();
    };
    const handleClose = () => setOpen(false);
    const handleCartUpdated = () => {
      loadCart();
    };

    window.addEventListener("open-cart", handleOpen);
    window.addEventListener("close-cart", handleClose);
    window.addEventListener("cart-updated", handleCartUpdated);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("open-cart", handleOpen);
      window.removeEventListener("close-cart", handleClose);
      window.removeEventListener("cart-updated", handleCartUpdated);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function updateQty(variantId: string, nextQty: number) {
    try {
      const token = await ensureCsrf();
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ variantId, qty: nextQty }),
      });
      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch {
      /* ignore */
    }
  }

  if (!open) return null;

  const FREE_DELIVERY_THRESHOLD = 19900; // ₹199 in paise
  const subtotal = cart?.subtotalPaise ?? 0;
  const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : 1500;
  const handlingCharge = subtotal > 0 ? 200 : 0; // ₹2
  const tipPaise = tip ? tip * 100 : 0;
  const grandTotal = subtotal + deliveryCharge + handlingCharge + tipPaise;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setOpen(false)}
      />

      {/* Drawer Container */}
      <aside
        className="absolute inset-y-0 right-0 flex max-w-full pl-10 sm:w-[420px] w-full"
        aria-label="Shopping Cart"
      >
        <div className="flex w-full flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-ink">My Cart</h2>
              {cart && cart.count > 0 ? (
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 font-bold">
                  {cart.count} {cart.count === 1 ? "item" : "items"}
                </span>
              ) : null}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Close cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Delivery ETA Pill */}
          <div className="bg-emerald-50 border-b border-emerald-100/60 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>⚡ Delivery in 10 minutes</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-white/80 px-2 py-0.5 rounded-full border border-emerald-200">
              Shipment of {cart?.count ?? 0} items
            </span>
          </div>

          {/* Free Delivery Meter */}
          {cart && cart.count > 0 ? (
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 text-xs">
              {remainingForFree > 0 ? (
                <div>
                  <p className="text-slate-600 font-medium">
                    Add items worth <span className="font-bold text-emerald-700">{formatPaise(remainingForFree)}</span> for <span className="font-bold text-ink">FREE delivery</span>
                  </p>
                  <div className="mt-1.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span>🎉</span>
                  <span>Yay! You unlocked FREE Delivery!</span>
                </div>
              )}
            </div>
          ) : null}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-slate-100">
            {(!cart || cart.lines.length === 0) && !loading ? (
              <div className="flex flex-col items-center justify-center h-80 text-center px-4">
                <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-4xl mb-4">
                  🛒
                </div>
                <h3 className="font-extrabold text-ink text-lg">Your cart is empty</h3>
                <p className="text-xs text-muted mt-1 max-w-xs">
                  Your favourite groceries are just 10 minutes away. Add some items to begin!
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-5 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  Start Shopping
                </button>
              </div>
            ) : null}

            {/* Cart Items List */}
            {cart?.lines.map((line) => (
              <div key={line.variantId} className="py-3 flex items-start gap-3">
                <div className="h-16 w-16 shrink-0 rounded-lg border border-slate-100 bg-white p-1 overflow-hidden flex items-center justify-center">
                  <ProductImage
                    src={line.imageUrl ?? "/placeholder.svg"}
                    alt={line.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-ink leading-tight truncate">{line.name}</h4>
                  <p className="text-[11px] text-muted mt-0.5">{line.variantName}</p>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-xs font-extrabold text-ink">{formatPaise(line.unitPricePaise)}</span>
                    {line.mrpPaise > line.unitPricePaise ? (
                      <span className="text-[10px] text-muted line-through">{formatPaise(line.mrpPaise)}</span>
                    ) : null}
                  </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center rounded-lg border border-emerald-600 bg-emerald-50/50 shadow-xs">
                  <button
                    onClick={() => updateQty(line.variantId, line.qty - 1)}
                    className="px-2 py-1 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100 rounded-l-md transition"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="px-2 text-xs font-bold text-emerald-900 min-w-6 text-center">{line.qty}</span>
                  <button
                    onClick={() => updateQty(line.variantId, line.qty + 1)}
                    className="px-2 py-1 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100 rounded-r-md transition"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}

            {/* Bill Details */}
            {cart && cart.lines.length > 0 ? (
              <div className="pt-4 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Bill Details</h4>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Items total</span>
                    <span className="font-semibold text-ink">{formatPaise(cart.subtotalPaise)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery fee</span>
                    {deliveryCharge === 0 ? (
                      <span className="font-bold text-emerald-600">FREE</span>
                    ) : (
                      <span className="font-semibold text-ink">{formatPaise(deliveryCharge)}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span>Handling charge</span>
                    <span className="font-semibold text-ink">{formatPaise(handlingCharge)}</span>
                  </div>
                  {tipPaise > 0 ? (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Delivery partner tip</span>
                      <span>₹{tip}</span>
                    </div>
                  ) : null}
                  {cart.savingsPaise > 0 ? (
                    <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
                      <span>Total Savings</span>
                      <span>-{formatPaise(cart.savingsPaise)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-ink">
                    <span>Grand Total</span>
                    <span>{formatPaise(grandTotal)}</span>
                  </div>
                </div>

                {/* Delivery Tip Selector */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 mt-3">
                  <p className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <span>🚴</span> Tip your delivery partner
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">100% of the tip goes directly to your partner.</p>
                  <div className="flex gap-2 mt-2">
                    {[10, 20, 30, 50].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setTip(tip === amount ? null : amount)}
                        className={`flex-1 py-1 text-xs font-bold rounded-lg border transition ${
                          tip === amount
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-700 border-slate-200 hover:border-emerald-500"
                        }`}
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cancellation Policy */}
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3 text-[11px] text-muted space-y-1">
                  <p className="font-bold text-slate-700">Cancellation Policy</p>
                  <p>Orders cannot be cancelled once packed for delivery. In case of unexpected delay, a refund will be processed.</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Sticky Checkout Footer */}
          {cart && cart.lines.length > 0 ? (
            <div className="border-t border-slate-200 bg-white p-4 sticky bottom-0 z-10 shadow-lg">
              <div className="flex items-center justify-between mb-2 text-xs">
                <div>
                  <p className="font-medium text-muted">Delivery Address</p>
                  <p className="font-bold text-ink truncate max-w-[200px]">Home - Sector 62, Noida</p>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">⚡ 10 mins</span>
              </div>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-between rounded-xl bg-emerald-600 px-4 py-3 text-white font-extrabold shadow-md hover:bg-emerald-700 active:scale-[0.99] transition"
              >
                <div className="text-left">
                  <div className="text-xs opacity-90">{cart.count} {cart.count === 1 ? "item" : "items"}</div>
                  <div className="text-base leading-none font-black">{formatPaise(grandTotal)}</div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wide">
                  <span>Proceed to Pay</span>
                  <span className="text-lg">→</span>
                </div>
              </Link>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

