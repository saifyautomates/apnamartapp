"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Price, EtaBadge } from "@/components/ui";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDelivery } from "@/lib/delivery-context";

type Zone = {
  id: string;
  name: string;
  pincodes: string[];
  minOrderPaise: number;
  deliveryChargePaise: number;
  freeThresholdPaise: number | null;
  slots: Array<{ id: string; label: string; isActive: boolean }>;
};

type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export function CheckoutPageView() {
  const { deliveryPromiseText } = useDelivery();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [storeInfo, setStoreInfo] = useState<{ payments: Record<string, boolean>; pickup: { enabled?: boolean } } | null>(null);
  const [cartSummary, setCartSummary] = useState<{ subtotalPaise: number; lines: Array<{ qty: number }> } | null>(null);
  const [mode, setMode] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [addressId, setAddressId] = useState("");
  const [pincode, setPincode] = useState("");
  const [slotId, setSlotId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI" | "ONLINE">("COD");
  const [couponCode, setCouponCode] = useState("");
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [creditPaise, setCreditPaise] = useState(0);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    (async () => {
      const [addrRes, zoneRes, infoRes, cartRes] = await Promise.all([
        fetch("/api/account/addresses"),
        fetch("/api/delivery/zones"),
        fetch("/api/store-info"),
        fetch("/api/cart"),
      ]);
      const addrJson = await addrRes.json();
      if (addrRes.status === 401) setNeedLogin(true);
      else setAddresses(addrJson.data ?? []);
      const zoneJson = await zoneRes.json();
      setZones(zoneJson.data ?? []);
      const infoJson = await infoRes.json();
      setStoreInfo(infoJson.data);
      const cartJson = await cartRes.json();
      setCartSummary(cartJson.data);
      const def = (addrJson.data ?? []).find((a: Address) => a.isDefault);
      if (def) {
        setAddressId(def.id);
        setPincode(def.pincode);
      }
    })().catch(() => setError("Failed to load checkout data"));
  }, []);

  const matchedZone = zones.find((z) => z.pincodes.includes(pincode));
  const selectedZone = matchedZone;
  const payments = storeInfo?.payments ?? { cod: true, upi: false, online: false };

  async function placeOrder() {
    setPlacing(true);
    setError("");
    try {
      const idempotencyKey = crypto.randomUUID();
      const data = await api<{ orderId: string }>("/api/checkout", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          addressId: mode === "DELIVERY" ? addressId || undefined : undefined,
          deliveryMethod: mode,
          deliverySlotId: mode === "DELIVERY" ? slotId || undefined : undefined,
          paymentMethod,
          couponCode: couponCode || undefined,
          loyaltyPoints: loyaltyPoints || undefined,
          storeCreditPaise: creditPaise || undefined,
        }),
      });
      const orderId = data.orderId;
      if (!orderId) throw new Error("Checkout did not return an order");
      window.dispatchEvent(new Event("cart-updated"));
      if (paymentMethod === "COD") {
        router.push(`/orders/${orderId}`);
      } else {
        router.push(`/checkout/mock-pay?orderId=${orderId}&method=${paymentMethod}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setPlacing(false);
    }
  }

  if (needLogin) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-xs">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-[#e8f5e9] text-[#0c831f] flex items-center justify-center text-3xl mb-4">
          🔐
        </div>
        <h2 className="text-xl font-black text-[#1c1c1c]">Login required to checkout</h2>
        <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
          Please log in to your account with your mobile number to complete your Same-Day Delivery order.
        </p>
        <Link
          href="/login?next=/checkout"
          className="mt-6 inline-block w-full rounded-xl bg-[#0c831f] hover:bg-[#0a701a] py-3 text-sm font-black text-white shadow-md transition active:scale-95 cursor-pointer"
        >
          Login with Phone →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black text-[#1c1c1c]">Checkout</h1>
        <EtaBadge minutes={8} />
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Delivery Mode & Address */}
        <div className="lg:col-span-7 space-y-5">
          {/* Mode Selector */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
            <h3 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider mb-3">Delivery Option</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("DELIVERY")}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  mode === "DELIVERY"
                    ? "border-[#0c831f] bg-[#e8f5e9]/40 ring-1 ring-[#0c831f]"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span className="text-xs font-black text-[#1c1c1c]">{deliveryPromiseText || "Same Day Delivery"}</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">Delivered to your doorstep</p>
              </button>

              <button
                type="button"
                onClick={() => setMode("PICKUP")}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  mode === "PICKUP"
                    ? "border-[#0c831f] bg-[#e8f5e9]/40 ring-1 ring-[#0c831f]"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏪</span>
                  <span className="text-xs font-black text-[#1c1c1c]">Store Pickup</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">Collect from nearest hub</p>
              </button>
            </div>
          </div>

          {/* Delivery Address */}
          {mode === "DELIVERY" ? (
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">Delivery Address</h3>
                <Link href="/account" className="text-xs font-bold text-[#0c831f] hover:underline">
                  + Add New Address
                </Link>
              </div>

              {addresses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center">
                  <p className="text-xs text-neutral-500">No saved addresses found.</p>
                  <Link
                    href="/account"
                    className="mt-3 inline-block rounded-lg bg-[#0c831f] px-4 py-2 text-xs font-bold text-white shadow-sm"
                  >
                    Add Address
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        addressId === a.id
                          ? "border-[#0c831f] bg-[#e8f5e9]/30 ring-1 ring-[#0c831f]"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={addressId === a.id}
                        onChange={() => {
                          setAddressId(a.id);
                          setPincode(a.pincode);
                        }}
                        className="mt-1 accent-[#0c831f]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#1c1c1c]">{a.label}</span>
                          {a.isDefault ? (
                            <span className="text-[10px] font-bold text-[#0c831f] bg-[#e8f5e9] px-1.5 py-0.5 rounded">
                              Default
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-neutral-600 mt-1 leading-snug">
                          {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} - {a.pincode}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {mode === "DELIVERY" && pincode && !matchedZone ? (
                <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <span className="text-base shrink-0">📍</span>
                  <div>
                    <p className="font-black text-amber-950">Kota Delivery Only (PIN: 324xxx)</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Central Mart currently delivers exclusively across Kota, Rajasthan. Pincode <strong>{pincode}</strong> is outside our delivery area. Please select a Kota address (PIN: 324001, 324002, 324004, 324005, 324007, etc.).
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Payment Method Selector */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">Select Payment Method</h3>
            <div className="space-y-2.5">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  paymentMethod === "COD"
                    ? "border-[#0c831f] bg-[#e8f5e9]/30 ring-1 ring-[#0c831f]"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="accent-[#0c831f]"
                />
                <span className="text-lg">💵</span>
                <div className="flex-1">
                  <p className="text-xs font-black text-[#1c1c1c]">Cash on Delivery (COD)</p>
                  <p className="text-[11px] text-neutral-500">Pay cash or UPI to delivery partner</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  paymentMethod === "UPI"
                    ? "border-[#0c831f] bg-[#e8f5e9]/30 ring-1 ring-[#0c831f]"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "UPI"}
                  onChange={() => setPaymentMethod("UPI")}
                  className="accent-[#0c831f]"
                />
                <span className="text-lg">📱</span>
                <div className="flex-1">
                  <p className="text-xs font-black text-[#1c1c1c]">UPI (Google Pay, PhonePe, Paytm)</p>
                  <p className="text-[11px] text-neutral-500">Instant instant QR / intent payment</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  paymentMethod === "ONLINE"
                    ? "border-[#0c831f] bg-[#e8f5e9]/30 ring-1 ring-[#0c831f]"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                  className="accent-[#0c831f]"
                />
                <span className="text-lg">💳</span>
                <div className="flex-1">
                  <p className="text-xs font-black text-[#1c1c1c]">Cards &amp; NetBanking</p>
                  <p className="text-[11px] text-neutral-500">Credit / Debit Card or Internet Banking</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">Order Summary</h3>

            {cartSummary ? (
              <div className="space-y-2 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <Price paise={cartSummary.subtotalPaise} />
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-[#0c831f]">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span>Handling Fee</span>
                  <Price paise={200} />
                </div>
                <div className="flex justify-between pt-3 border-t border-neutral-200 text-base font-black text-[#1c1c1c]">
                  <span>Total Amount</span>
                  <Price paise={cartSummary.subtotalPaise + 200} />
                </div>
              </div>
            ) : null}

            {/* Promo Code Input */}
            <div className="pt-2 border-t border-neutral-100 flex gap-2">
              <input
                type="text"
                placeholder="Promo Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold uppercase placeholder-neutral-400 focus:border-[#0c831f] focus:outline-hidden"
              />
              <button
                type="button"
                className="rounded-xl bg-[#e8f5e9] text-[#0c831f] font-black text-xs px-3.5 py-2 hover:bg-[#d4edd8] transition cursor-pointer"
              >
                Apply
              </button>
            </div>

            <button
              onClick={placeOrder}
              disabled={placing || (mode === "DELIVERY" && (!addressId || !matchedZone))}
              className="w-full rounded-xl bg-[#0c831f] hover:bg-[#0a701a] py-3.5 text-center text-sm font-black text-white shadow-md transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {placing
                ? "Placing Order..."
                : mode === "DELIVERY" && !matchedZone && pincode
                ? "Address Outside Kota (Not Serviceable)"
                : "Place Order →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPageView;

