"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { ProductImage } from "@/components/product/product-image";
import { Price, Mrp, EmptyState } from "@/components/ui";
import { CartSkeleton } from "@/components/ui/skeletons";
import { formatPaise } from "@/lib/money";
import Link from "next/link";
import { useDelivery } from "@/lib/delivery-context";
import { ArrowLeft, Trash2, ArrowRight } from "lucide-react";

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
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tip, setTip] = useState<number | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountPaise, setDiscountPaise] = useState(0);
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [removedItemUndo, setRemovedItemUndo] = useState<{
    variantId: string;
    name: string;
    qty: number;
  } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { deliveryPromiseText, estimatedArrivalNotice, deliveryConfig } = useDelivery();

  const load = useCallback(async () => {
    try {
      const [cartRes, offerRes] = await Promise.all([
        fetch("/api/cart").then((r) => r.json()),
        fetch("/api/offers").then((r) => r.json()).catch(() => ({ data: [] })),
      ]);
      setCart(cartRes.data);
      setOffers(offerRes.data ?? []);
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

    // Capture removed item for 5-second undo toast
    if (qty <= 0 && cart?.lines) {
      const target = cart.lines.find((l) => l.variantId === variantId);
      if (target) {
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        setRemovedItemUndo({
          variantId,
          name: target.name,
          qty: target.qty,
        });
        undoTimeoutRef.current = setTimeout(() => {
          setRemovedItemUndo(null);
        }, 5000);
      }
    }

    // Instant 0ms Optimistic UI calculation
    setCart((prev) => {
      if (!prev) return null;
      let newLines = prev.lines.map((l) =>
        l.variantId === variantId
          ? { ...l, qty, lineTotalPaise: l.unitPricePaise * qty }
          : l
      );
      if (qty <= 0) {
        newLines = newLines.filter((l) => l.variantId !== variantId);
      }
      const newSubtotal = newLines.reduce((sum, l) => sum + (l.lineTotalPaise || l.unitPricePaise * l.qty), 0);
      const newCount = newLines.reduce((sum, l) => sum + l.qty, 0);
      return {
        ...prev,
        lines: newLines,
        subtotalPaise: newSubtotal,
        totalPaise: newSubtotal + (prev.deliveryPaise || 0) + (prev.handlingPaise || 0),
        count: newCount,
      };
    });

    try {
      await api("/api/cart", { method: "POST", body: JSON.stringify({ variantId, qty }) });
      await load();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      await load(); // rollback on failure
    } finally {
      setBusy(false);
    }
  }

  async function handleUndoRemove() {
    if (!removedItemUndo) return;
    const item = removedItemUndo;
    setRemovedItemUndo(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    await setQty(item.variantId, item.qty);
  }

  async function handleConfirmClearCart() {
    setBusy(true);
    setShowClearConfirm(false);
    try {
      await api("/api/cart?clearAll=true", { method: "DELETE" });
      await load();
      window.dispatchEvent(new Event("cart-updated"));
    } catch {
      // Robust fallback: delete items
      if (cart?.lines) {
        for (const line of cart.lines) {
          await api("/api/cart", { method: "POST", body: JSON.stringify({ variantId: line.variantId, qty: 0 }) });
        }
        await load();
        window.dispatchEvent(new Event("cart-updated"));
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <CartSkeleton />;

  if (!cart || !cart.lines || cart.lines.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <EmptyState
          title="Your cart is empty"
          body="Looks like you haven't added anything to your cart yet. Explore fresh groceries delivered with Same-Day Delivery."
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
  const grandTotal = Math.max(0, subtotal + deliveryCharge + handlingCharge + tipPaise - discountPaise);

  function applyCouponCode(codeToApply?: string) {
    const raw = (codeToApply || couponCode).trim().toUpperCase();
    if (!raw) {
      setCouponMsg({ text: "Please enter a valid offer or coupon code", isError: true });
      return;
    }

    const matchedOffer = offers.find(
      (o) => o.code?.toUpperCase() === raw || o.id === raw
    );

    if (matchedOffer) {
      const minPaise = Math.round(Number(matchedOffer.minOrderValue) * 100);
      if (subtotal < minPaise) {
        setCouponMsg({
          text: `Add ${formatPaise(minPaise - subtotal)} more to use ${matchedOffer.code} (Min order: ₹${matchedOffer.minOrderValue})`,
          isError: true,
        });
        return;
      }

      let discount = 0;
      if (matchedOffer.type === "PERCENT") {
        discount = Math.round((subtotal * Number(matchedOffer.discountValue)) / 100);
        if (matchedOffer.maxDiscountValue) {
          discount = Math.min(discount, Math.round(Number(matchedOffer.maxDiscountValue) * 100));
        }
      } else {
        discount = Math.round(Number(matchedOffer.discountValue) * 100);
      }
      discount = Math.min(discount, subtotal);

      setDiscountPaise(discount);
      setCouponApplied(true);
      setCouponCode(matchedOffer.code);
      setCouponMsg({ text: `🎉 Offer ${matchedOffer.code} applied! Saved ${formatPaise(discount)}`, isError: false });
      return;
    }

    if (raw === "SAVE100" || raw === "CENTRAL100") {
      if (subtotal < 100000) {
        setCouponMsg({ text: `Add ${formatPaise(100000 - subtotal)} more to unlock ₹100 OFF (Min order: ₹1,000)`, isError: true });
        return;
      }
      setDiscountPaise(10000);
      setCouponApplied(true);
      setCouponCode(raw);
      setCouponMsg({ text: "🎉 Code SAVE100 applied! Saved ₹100.00", isError: false });
    } else if (raw === "KOTA50" || raw === "FIRST50") {
      if (subtotal < 49900) {
        setCouponMsg({ text: `Add ${formatPaise(49900 - subtotal)} more to unlock ₹50 OFF (Min order: ₹499)`, isError: true });
        return;
      }
      setDiscountPaise(5000);
      setCouponApplied(true);
      setCouponCode(raw);
      setCouponMsg({ text: `🎉 Code ${raw} applied! Saved ₹50.00`, isError: false });
    } else {
      setCouponMsg({ text: "Invalid offer code. Try SAVE100 or KOTA50", isError: true });
    }
  }

  function removeCoupon() {
    setCouponApplied(false);
    setCouponCode("");
    setDiscountPaise(0);
    setCouponMsg(null);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Top Header matching Mockup Screen 6: "← My Cart" + Trash can */}
      <div className="flex items-center justify-between py-2 border-b border-neutral-100">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-base font-black text-[#1c1c1c] hover:text-[#0c831f] transition cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
          <span>My Cart</span>
        </button>

        {cart && cart.lines.length > 0 && (
          <button
            id="empty-cart-btn"
            onClick={() => setShowClearConfirm(true)}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer active:scale-90"
            title="Empty Cart"
            aria-label="Empty Cart"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Delivery Promise Alert */}
      <div className="rounded-2xl bg-[#e8f5e9] border border-[#0c831f]/20 p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#0c831f] text-white flex items-center justify-center text-lg font-bold">
            ⚡
          </div>
          <div>
            <h2 className="text-sm font-black text-[#1c1c1c]">{deliveryPromiseText || "Same Day Delivery"}</h2>
            <p className="text-xs text-neutral-600 mt-0.5">{estimatedArrivalNotice} · Shipment of {cart.count} items</p>
          </div>
        </div>
        <span className="text-xs font-black text-[#0c831f] bg-white px-3 py-1 rounded-full border border-[#0c831f]/30">
          {deliveryConfig.badgeText || "Same Day"}
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

                {/* Blinkit Stepper & Trash Delete Action */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl bg-[#0c831f] text-white shadow-xs shrink-0">
                    <button
                      onClick={() => setQty(l.variantId, l.qty - 1)}
                      disabled={busy}
                      className="px-2.5 py-1 text-xs font-extrabold hover:bg-[#0a701a] rounded-l-xl transition cursor-pointer"
                    >
                      −
                    </button>
                    <span className="px-2 text-xs font-black min-w-6 text-center">{l.qty}</span>
                    <button
                      onClick={() => setQty(l.variantId, l.qty + 1)}
                      disabled={busy}
                      className="px-2.5 py-1 text-xs font-extrabold hover:bg-[#0a701a] rounded-r-xl transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => setQty(l.variantId, 0)}
                    disabled={busy}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Bill Details & Checkout */}
        <div className="lg:col-span-5 space-y-4">
          {/* Offers & Coupons Box */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider flex items-center gap-1.5">
                <span>🏷️</span>
                <span>Offers & Coupons</span>
              </span>
              {couponApplied && (
                <button
                  onClick={removeCoupon}
                  className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter offer code"
                className="flex-1 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase focus:border-[#0c831f] focus:outline-hidden"
              />
              <button
                onClick={() => applyCouponCode()}
                className="rounded-xl bg-[#0c831f] text-white px-4 py-1.5 text-xs font-black hover:bg-[#0a701a] transition cursor-pointer"
              >
                Apply
              </button>
            </div>

            {couponMsg && (
              <p className={`text-[11px] font-bold ${couponMsg.isError ? "text-red-600" : "text-[#0c831f]"}`}>
                {couponMsg.text}
              </p>
            )}

            {/* List of Available Offers */}
            {offers && offers.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                {offers.map((o) => {
                  const minPaise = Math.round(Number(o.minOrderValue) * 100);
                  const isEligible = subtotal >= minPaise;
                  const isThisApplied = couponApplied && couponCode === o.code;

                  return (
                    <div
                      key={o.id}
                      className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                        isThisApplied ? "bg-emerald-50 border-emerald-300" : "bg-neutral-50/70 border-neutral-200"
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="font-mono font-black text-ink">{o.code}</span>
                        <p className="text-[11px] text-neutral-500 truncate">{o.title}</p>
                      </div>
                      <button
                        onClick={() => applyCouponCode(o.code)}
                        disabled={!isEligible || isThisApplied}
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                          isThisApplied
                            ? "bg-emerald-600 text-white"
                            : isEligible
                              ? "bg-[#0c831f] text-white hover:bg-[#0a701a]"
                              : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                        }`}
                      >
                        {isThisApplied ? "Applied ✓" : isEligible ? "Apply" : `Min ₹${o.minOrderValue}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-[#1c1c1c] tracking-tight">Price Details</h3>
            <div className="space-y-2.5 text-xs text-neutral-600">
              <div className="flex justify-between font-medium">
                <span>Items Total</span>
                <span className="font-bold text-[#1c1c1c]">{formatPaise(subtotal)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Delivery Fee</span>
                {deliveryCharge === 0 ? (
                  <span className="font-black text-[#0c831f]">FREE</span>
                ) : (
                  <span className="font-bold text-[#1c1c1c]">{formatPaise(deliveryCharge)}</span>
                )}
              </div>
              <div className="flex justify-between font-medium">
                <span>Platform Fee</span>
                <span className="font-bold text-[#1c1c1c]">₹5</span>
              </div>
              {discountPaise > 0 && (
                <div className="flex justify-between text-xs text-[#0c831f] font-bold bg-[#e8f5e9] p-2 rounded-xl">
                  <span>Offer Discount ({couponCode})</span>
                  <span>-{formatPaise(discountPaise)}</span>
                </div>
              )}
              {tipPaise > 0 ? (
                <div className="flex justify-between text-[#0c831f] font-semibold">
                  <span>Delivery Tip</span>
                  <span>₹{tip}</span>
                </div>
              ) : null}
              {cart.savingsPaise > 0 ? (
                <div className="flex justify-between text-[#0c831f] font-bold bg-[#e8f5e9] p-2 rounded-xl">
                  <span>Total Savings</span>
                  <span>-{formatPaise(cart.savingsPaise)}</span>
                </div>
              ) : null}
              <div className="flex justify-between pt-3 border-t border-neutral-200 text-base font-black text-[#1c1c1c]">
                <span>Total Amount</span>
                <span className="text-[#0c831f] font-black">{formatPaise(grandTotal)}</span>
              </div>
            </div>

            {/* Delivery Partner Tip Selector */}
            <div className="rounded-2xl border border-neutral-100 bg-[#f8f8f8] p-3">
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
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] py-3.5 px-5 text-white font-black shadow-md transition active:scale-[0.99] cursor-pointer"
            >
              <span>Proceed to Pay</span>
              <span className="text-base font-bold">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-neutral-100 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 className="w-7 h-7 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1c1c1c]">Clear your cart?</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Are you sure you want to remove all {cart.count} {cart.count === 1 ? "item" : "items"} from your cart? This cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="cancel-clear-cart-btn"
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="w-full py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 active:scale-95 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-clear-cart-btn"
                type="button"
                onClick={handleConfirmClearCart}
                disabled={busy}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs active:scale-95 transition cursor-pointer"
              >
                {busy ? "Clearing..." : "Yes, Clear Cart"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5-Second Undo Removal Toast */}
      {removedItemUndo && (
        <div
          id="undo-toast"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-4 rounded-2xl bg-[#1c1c1c] text-white px-5 py-3.5 shadow-2xl border border-white/10 animate-in slide-in-from-bottom-4 duration-200 max-w-md w-[92%] sm:w-auto"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-sm">🗑️</span>
            <span className="text-xs font-medium truncate">
              Removed <strong>{removedItemUndo.name}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="undo-cart-removal-btn"
              onClick={handleUndoRemove}
              className="text-xs font-black text-[#a3e635] hover:underline uppercase tracking-wide cursor-pointer active:scale-95 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition"
            >
              Undo
            </button>
            <button
              onClick={() => setRemovedItemUndo(null)}
              className="text-neutral-400 hover:text-white p-1 cursor-pointer text-sm font-bold"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPageView;

