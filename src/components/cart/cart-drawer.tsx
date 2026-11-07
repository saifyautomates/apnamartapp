"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPaise } from "@/lib/money";
import { ProductImage } from "@/components/product/product-image";
import { api, ensureCsrf } from "@/lib/api/client";
import { useDelivery } from "@/lib/delivery-context";
import { openLoginModal } from "@/components/auth/login-modal";

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

interface UserSession {
  id: string;
  phone: string;
  name: string | null;
}

export function CartDrawer() {
  const { deliveryPromiseText, deliveryBadgeText, activeLocation } = useDelivery();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");
  const [cart, setCart] = useState<CartDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState<number | null>(null);

  // In-drawer checkout state
  const [sessionUser, setSessionUser] = useState<UserSession | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [streetLandmark, setStreetLandmark] = useState("");
  const [selectedPincode, setSelectedPincode] = useState("324001");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  async function loadSession() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.data?.session?.kind === "CUSTOMER" && json.data.session.user) {
          setSessionUser(json.data.session.user);
          setCustomerPhone(json.data.session.user.phone || "");
          if (json.data.session.user.name) setCustomerName(json.data.session.user.name);
        }
      }
    } catch {
      /* ignore */
    }
  }

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
    loadSession();

    const handleOpen = () => {
      setOpen(true);
      setStep("cart");
      setCheckoutError("");
      loadCart();
      loadSession();
    };
    const handleClose = () => setOpen(false);
    const handleCartUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<CartDetail>;
      if (customEvent.detail && typeof customEvent.detail === "object" && "lines" in customEvent.detail) {
        setCart(customEvent.detail);
      } else {
        loadCart();
      }
    };

    window.addEventListener("open-cart", handleOpen);
    window.addEventListener("close-cart", handleClose);
    window.addEventListener("cart-updated", handleCartUpdated);
    window.addEventListener("auth-updated", loadSession);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("open-cart", handleOpen);
      window.removeEventListener("close-cart", handleClose);
      window.removeEventListener("cart-updated", handleCartUpdated);
      window.removeEventListener("auth-updated", loadSession);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function updateQty(variantId: string, nextQty: number) {
    try {
      const data = await api<CartDetail>("/api/cart", {
        method: "POST",
        body: JSON.stringify({ variantId, qty: nextQty }),
      });
      setCart(data);
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: data }));
    } catch {
      /* ignore */
    }
  }

  // Kota quick free delivery threshold (₹499)
  const FREE_DELIVERY_THRESHOLD = 49900;
  const subtotal = cart?.subtotalPaise ?? 0;
  const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : 2500; // ₹25 delivery
  const handlingCharge = subtotal > 0 ? 200 : 0; // ₹2
  const tipPaise = tip ? tip * 100 : 0;
  const grandTotal = subtotal + deliveryCharge + handlingCharge + tipPaise;

  async function handlePlaceOrder() {
    setCheckoutError("");

    // If not logged in, request login first
    if (!sessionUser) {
      openLoginModal();
      return;
    }

    if (!houseNo.trim()) {
      setCheckoutError("Please enter your House / Flat / Plot Number");
      return;
    }

    setPlacingOrder(true);
    try {
      const csrfToken = await ensureCsrf();
      const idempotencyKey = crypto.randomUUID();

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          deliveryMethod: "DELIVERY",
          paymentMethod,
          address: {
            line1: `${houseNo.trim()}, ${streetLandmark.trim() || activeLocation.address || "Kota"}`,
            city: "Kota",
            state: "Rajasthan",
            pincode: selectedPincode || activeLocation.pincode || "324001",
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message ?? "Unable to complete order. Please retry.");
      }

      const orderId = json.data?.orderId ?? `CM-${Date.now().toString().slice(-6)}`;
      setConfirmedOrderId(orderId);
      setStep("success");
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setOpen(false)}
      />

      {/* Drawer Container: Responsive Bottom Sheet on Mobile, Slide-over on Desktop */}
      <aside
        className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[440px] w-full max-h-[92vh] sm:max-h-full flex flex-col rounded-t-3xl sm:rounded-none bg-white shadow-2xl z-50 animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 overflow-hidden"
        aria-label="Shopping Cart and Instant Checkout"
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white cursor-grab">
          <div className="h-1.5 w-12 rounded-full bg-neutral-300" />
        </div>

        <div className="flex w-full flex-1 flex-col overflow-hidden bg-white">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3.5 bg-white sticky top-0 z-10">
            {step === "checkout" ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep("cart")}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition cursor-pointer"
                  title="Back to items"
                >
                  ←
                </button>
                <div>
                  <h2 className="text-base font-black text-[#1c1c1c] leading-tight">Delivery & Payment</h2>
                  <p className="text-[11px] text-neutral-400 font-semibold">12-15 Mins · Kota Superfast</p>
                </div>
              </div>
            ) : step === "success" ? (
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f5e9] text-[#0c831f] text-base">
                  🎉
                </span>
                <h2 className="text-base font-black text-[#1c1c1c]">Order Confirmed</h2>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#1c1c1c]">My Cart</h2>
                {cart && cart.count > 0 ? (
                  <span className="rounded-full bg-[#e8f5e9] text-[#0c831f] text-xs px-2.5 py-0.5 font-bold">
                    {cart.count} {cart.count === 1 ? "item" : "items"}
                  </span>
                ) : null}
              </div>
            )}

            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
              aria-label="Close cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* STEP 1: CART ITEMS & BILL */}
          {step === "cart" && (
            <>
              {/* Delivery ETA Pill */}
              <div className="bg-[#f2f7fc] border-b border-neutral-100 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1c1c1c]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0c831f] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0c831f]"></span>
                  </span>
                  <span>⚡ {deliveryPromiseText || "12-15 MINS Superfast"}</span>
                </div>
                <span className="text-[11px] font-bold text-[#0c831f] bg-white px-2 py-0.5 rounded-full border border-[#0c831f]/20">
                  Kota Express Store
                </span>
              </div>

              {/* Free Delivery Meter */}
              {cart && cart.count > 0 ? (
                <div className="bg-[#f8f8f8] border-b border-neutral-100 px-4 py-2.5 text-xs">
                  {remainingForFree > 0 ? (
                    <div>
                      <p className="text-neutral-600 font-medium">
                        Add items worth <span className="font-bold text-[#0c831f]">{formatPaise(remainingForFree)}</span> for <span className="font-bold text-[#1c1c1c]">FREE Kota Delivery</span>
                      </p>
                      <div className="mt-1.5 h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0c831f] rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[#0c831f] font-bold">
                      <span>🎉</span>
                      <span>Yay! You unlocked FREE Delivery across Kota!</span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-neutral-100 scroll-touch">
                {(!cart || cart.lines.length === 0) && !loading ? (
                  <div className="flex flex-col items-center justify-center h-80 text-center px-4">
                    <div className="h-20 w-20 rounded-2xl bg-[#e8f5e9] text-[#0c831f] flex items-center justify-center text-4xl mb-4">
                      🛒
                    </div>
                    <h3 className="font-black text-[#1c1c1c] text-lg">Your cart is empty</h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">
                      100% Genuine FMCG groceries delivered across Kota in 12-15 minutes. Tap below to start!
                    </p>
                    <button
                      onClick={() => setOpen(false)}
                      className="mt-5 rounded-xl bg-[#0c831f] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0a701a] transition cursor-pointer active:scale-95"
                    >
                      Explore Groceries
                    </button>
                  </div>
                ) : null}

                {/* Cart Items List */}
                {cart?.lines.map((line) => (
                  <div key={line.variantId} className="py-3 flex items-start gap-3">
                    <div className="h-16 w-16 shrink-0 rounded-xl border border-neutral-100 bg-[#fafafa] p-1 overflow-hidden flex items-center justify-center">
                      <ProductImage
                        src={line.imageUrl ?? "/images/placeholder-product.svg"}
                        alt={line.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#1c1c1c] leading-tight truncate">{line.name}</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{line.variantName}</p>
                      <div className="flex items-baseline gap-1.5 mt-1.5">
                        <span className="text-xs font-black text-[#1c1c1c]">{formatPaise(line.unitPricePaise)}</span>
                        {line.mrpPaise > line.unitPricePaise ? (
                          <span className="text-[10px] text-neutral-400 line-through">{formatPaise(line.mrpPaise)}</span>
                        ) : null}
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center rounded-xl bg-[#0c831f] text-white shadow-xs">
                      <button
                        onClick={() => updateQty(line.variantId, line.qty - 1)}
                        className="h-8 w-8 flex items-center justify-center text-sm font-black hover:bg-[#0a701a] rounded-l-xl transition active:scale-90 cursor-pointer select-none"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="px-1 text-xs font-black min-w-6 text-center select-none">{line.qty}</span>
                      <button
                        onClick={() => updateQty(line.variantId, line.qty + 1)}
                        className="h-8 w-8 flex items-center justify-center text-sm font-black hover:bg-[#0a701a] rounded-r-xl transition active:scale-90 cursor-pointer select-none"
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
                    <h4 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">Bill Details</h4>
                    <div className="space-y-1.5 text-xs text-neutral-600">
                      <div className="flex justify-between">
                        <span>Items total</span>
                        <span className="font-semibold text-[#1c1c1c]">{formatPaise(cart.subtotalPaise)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery fee</span>
                        {deliveryCharge === 0 ? (
                          <span className="font-bold text-[#0c831f]">FREE</span>
                        ) : (
                          <span className="font-semibold text-[#1c1c1c]">{formatPaise(deliveryCharge)}</span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span>Handling charge</span>
                        <span className="font-semibold text-[#1c1c1c]">{formatPaise(handlingCharge)}</span>
                      </div>
                      {tipPaise > 0 ? (
                        <div className="flex justify-between text-[#0c831f] font-medium">
                          <span>Delivery partner tip</span>
                          <span>₹{tip}</span>
                        </div>
                      ) : null}
                      {cart.savingsPaise > 0 ? (
                        <div className="flex justify-between text-[#0c831f] font-bold bg-[#e8f5e9] px-2 py-1 rounded-lg">
                          <span>Total Savings</span>
                          <span>-{formatPaise(cart.savingsPaise)}</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-black text-[#1c1c1c]">
                        <span>Grand Total</span>
                        <span>{formatPaise(grandTotal)}</span>
                      </div>
                    </div>

                    {/* Delivery Partner Tip Selector */}
                    <div className="rounded-2xl border border-neutral-100 bg-[#f8f8f8] p-3 mt-3">
                      <p className="text-xs font-bold text-[#1c1c1c] flex items-center gap-1.5">
                        <span>🚴</span> Tip your Kota delivery partner
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">100% of the tip goes directly to your partner.</p>
                      <div className="flex gap-2 mt-2">
                        {[10, 20, 30, 50].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setTip(tip === amount ? null : amount)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition active:scale-95 cursor-pointer ${
                              tip === amount
                                ? "bg-[#0c831f] text-white border-[#0c831f]"
                                : "bg-white text-neutral-700 border-neutral-200 hover:border-[#0c831f]"
                            }`}
                          >
                            ₹{amount}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cancellation Policy */}
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-3 text-[11px] text-neutral-400 space-y-1">
                      <p className="font-bold text-neutral-700">Central Mart Guarantee</p>
                      <p>Superfast 12-15 minute delivery across Kota. In case of damaged or missing items, instant doorstep refund or replacement provided.</p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Sticky Action Footer */}
              {cart && cart.lines.length > 0 ? (
                <div className="border-t border-neutral-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sticky bottom-0 z-10 shadow-lg">
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <div>
                      <p className="font-medium text-neutral-400">Delivering to</p>
                      <p className="font-bold text-[#1c1c1c] truncate max-w-[200px]">
                        {activeLocation.address || activeLocation.zoneName || "Kota Central · 324001"}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-[#0c831f] bg-[#e8f5e9] px-2.5 py-0.5 rounded-full border border-[#0c831f]/20">
                      ⚡ 12-15 MINS
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (!sessionUser) {
                        openLoginModal();
                      } else {
                        setStep("checkout");
                      }
                    }}
                    className="w-full flex items-center justify-between rounded-2xl bg-[#0c831f] px-4 py-3.5 text-white font-black shadow-lg hover:bg-[#0a701a] active:scale-[0.98] transition cursor-pointer"
                  >
                    <div className="text-left">
                      <div className="text-[11px] opacity-90">{cart.count} {cart.count === 1 ? "item" : "items"}</div>
                      <div className="text-base leading-none font-black">{formatPaise(grandTotal)}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-black uppercase tracking-wide">
                      <span>{sessionUser ? "Select Address & Pay" : "Login to Checkout"}</span>
                      <span className="text-lg">→</span>
                    </div>
                  </button>
                </div>
              ) : null}
            </>
          )}

          {/* STEP 2: IN-DRAWER INSTANT CHECKOUT */}
          {step === "checkout" && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-touch">
                {/* Customer Info Card */}
                <div className="p-3.5 rounded-2xl bg-[#f8faf8] border border-neutral-200/80">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Contact</p>
                    <span className="text-xs font-black text-[#0c831f] bg-[#e8f5e9] px-2 py-0.5 rounded-md">
                      Verified Phone
                    </span>
                  </div>
                  <p className="text-sm font-black text-[#1c1c1c] mt-1">
                    +91 {sessionUser?.phone || customerPhone || "9876543210"}
                  </p>
                </div>

                {/* Delivery Address Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">Kota Delivery Address</h3>
                    <span className="text-[11px] text-[#0c831f] font-bold">📍 12-15 Mins Hub</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                      House / Flat / Shop Number *
                    </label>
                    <input
                      type="text"
                      value={houseNo}
                      onChange={(e) => setHouseNo(e.target.value)}
                      placeholder="e.g. Flat 304, Near Allen Sankalp"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-[#fafafa] focus:bg-white focus:border-[#0c831f] text-sm text-[#1c1c1c] font-medium outline-hidden transition"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                      Street / Area / Landmark
                    </label>
                    <input
                      type="text"
                      value={streetLandmark}
                      onChange={(e) => setStreetLandmark(e.target.value)}
                      placeholder="e.g. Talwandi / Vigyan Nagar / Kunhari"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-[#fafafa] focus:bg-white focus:border-[#0c831f] text-sm text-[#1c1c1c] font-medium outline-hidden transition"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                      Kota Pincode
                    </label>
                    <select
                      value={selectedPincode}
                      onChange={(e) => setSelectedPincode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-[#fafafa] focus:bg-white focus:border-[#0c831f] text-sm text-[#1c1c1c] font-bold outline-hidden transition cursor-pointer"
                    >
                      <option value="324001">324001 - Nayapura & Station</option>
                      <option value="324002">324002 - Central City & Rampura</option>
                      <option value="324003">324003 - Gumanpura & Shopping Centre</option>
                      <option value="324004">324004 - Vigyan Nagar & City Mall</option>
                      <option value="324005">324005 - Talwandi & Allen Hub</option>
                      <option value="324006">324006 - Dadabari & Mahaveer Nagar</option>
                      <option value="324007">324007 - Kunhari & Landmark City</option>
                      <option value="324008">324008 - Sakatpura & Thermal</option>
                      <option value="324009">324009 - Borkhera & Baran Road</option>
                      <option value="324010">324010 - Railway Colony</option>
                    </select>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <h3 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">Payment Method</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("COD")}
                      className={`p-3 rounded-2xl border text-left transition active:scale-95 cursor-pointer ${
                        paymentMethod === "COD"
                          ? "border-[#0c831f] bg-[#e8f5e9]/50 text-[#0c831f]"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">💵</span>
                        {paymentMethod === "COD" && <span className="text-xs font-black">✓</span>}
                      </div>
                      <p className="text-xs font-black text-[#1c1c1c] mt-1.5">Cash on Delivery</p>
                      <p className="text-[10px] text-neutral-400">Pay cash/UPI at door</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("UPI")}
                      className={`p-3 rounded-2xl border text-left transition active:scale-95 cursor-pointer ${
                        paymentMethod === "UPI"
                          ? "border-[#0c831f] bg-[#e8f5e9]/50 text-[#0c831f]"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">⚡</span>
                        {paymentMethod === "UPI" && <span className="text-xs font-black">✓</span>}
                      </div>
                      <p className="text-xs font-black text-[#1c1c1c] mt-1.5">Instant UPI / QR</p>
                      <p className="text-[10px] text-neutral-400">GPay, PhonePe, Paytm</p>
                    </button>
                  </div>
                </div>

                {checkoutError ? (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-bold">
                    ⚠️ {checkoutError}
                  </div>
                ) : null}
              </div>

              {/* Sticky Order Button */}
              <div className="border-t border-neutral-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sticky bottom-0 z-10 shadow-lg">
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full flex items-center justify-between rounded-2xl bg-[#0c831f] px-4 py-3.5 text-white font-black shadow-lg hover:bg-[#0a701a] active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="text-[11px] opacity-90">{paymentMethod === "COD" ? "Cash on Delivery" : "UPI Payment"}</div>
                    <div className="text-base leading-none font-black">{formatPaise(grandTotal)}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-black uppercase tracking-wide">
                    <span>{placingOrder ? "Placing Order..." : "Place Order 🔒"}</span>
                    {!placingOrder && <span className="text-lg">→</span>}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ORDER SUCCESS CELEBRATION */}
          {step === "success" && (
            <div className="flex-1 flex flex-col justify-between p-6 text-center overflow-y-auto">
              <div className="my-auto space-y-4">
                <div className="h-20 w-20 mx-auto rounded-full bg-[#e8f5e9] text-[#0c831f] flex items-center justify-center text-4xl shadow-inner animate-bounce">
                  ✓
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1c1c1c]">Order Placed Successfully!</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Order ID: <span className="font-bold text-[#0c831f]">{confirmedOrderId}</span>
                  </p>
                </div>

                {/* 4-Stage Live Delivery Tracker */}
                <div className="p-4 rounded-2xl bg-[#f8faf8] border border-neutral-200/80 text-left space-y-3 mt-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <span className="text-xs font-black text-[#1c1c1c]">⚡ Estimated Delivery</span>
                    <span className="text-xs font-black text-[#0c831f]">12-15 MINS</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2.5 text-[#0c831f] font-bold">
                      <span className="h-5 w-5 rounded-full bg-[#0c831f] text-white flex items-center justify-center text-[10px]">✓</span>
                      <span>Order Received & Confirmed</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-neutral-700 font-semibold">
                      <span className="h-5 w-5 rounded-full bg-[#e8f5e9] text-[#0c831f] flex items-center justify-center text-[10px] animate-pulse">●</span>
                      <span>Store Partner Packing Fresh FMCG Items</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-neutral-400">
                      <span className="h-5 w-5 rounded-full bg-neutral-100 flex items-center justify-center text-[10px]">○</span>
                      <span>Delivery Partner Heading to {selectedPincode}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-neutral-400">
                      <span className="h-5 w-5 rounded-full bg-neutral-100 flex items-center justify-center text-[10px]">○</span>
                      <span>Delivered at Doorstep</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Link
                  href="/orders"
                  onClick={() => setOpen(false)}
                  className="block w-full py-3 rounded-2xl bg-[#0c831f] text-white font-black text-sm shadow-md hover:bg-[#0a701a] transition active:scale-95 text-center"
                >
                  View My Orders
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="block w-full py-2.5 rounded-2xl bg-neutral-100 text-neutral-700 font-bold text-xs hover:bg-neutral-200 transition active:scale-95 cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default CartDrawer;
