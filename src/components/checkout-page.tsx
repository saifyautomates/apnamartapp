"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/shop";
import { Price, EtaBadge } from "@/components/ui";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function CheckoutPageClient() {
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
      const data = await api("/api/checkout", {
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
      const orderId = data.orderId as string | undefined;
      if (!orderId) throw new Error("Checkout did not return an order");
      window.dispatchEvent(new Event("cart-updated"));
      if (paymentMethod === "COD") {
        router.push(`/orders/${orderId}`);
      } else {
        router.push(`/checkout/mock-pay?orderId=${orderId}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setPlacing(false);
    }
  }

  if (needLogin) {
    return (
      <div className="max-w-md mx-auto py-12 text-center bg-white rounded-3xl border border-slate-100 p-8 shadow-xs">
        <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-3xl mx-auto mb-4">
          📱
        </div>
        <h1 className="text-xl font-black text-ink">Sign in to Checkout</h1>
        <p className="mt-2 text-xs text-muted leading-relaxed">
          Please enter your mobile number to view saved addresses and track your 10-minute grocery delivery.
        </p>
        <Link
          href="/login?next=/checkout"
          className="mt-6 inline-block w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-3 text-sm font-black text-white shadow-md transition active:scale-[0.99]"
        >
          Sign in with Mobile OTP →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">Checkout</h1>
          <p className="text-xs text-muted mt-0.5 font-medium">Verify your delivery details & payment method</p>
        </div>
        <EtaBadge minutes={10} className="px-3 py-1 text-xs" />
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-bold text-red-600">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Options & Address */}
        <section className="space-y-4">
          {/* Mode Switch */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
            <h2 className="text-xs font-black text-ink uppercase tracking-wider mb-3">Fulfilment Mode</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("DELIVERY")}
                className={`rounded-xl border p-3 text-left font-bold transition flex items-center gap-2.5 ${
                  mode === "DELIVERY"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-lg">⚡</span>
                <div>
                  <p className="text-xs font-black">10 Min Delivery</p>
                  <p className="text-[10px] text-muted font-normal">Direct to doorstep</p>
                </div>
              </button>

              {storeInfo?.pickup?.enabled !== false ? (
                <button
                  onClick={() => setMode("PICKUP")}
                  className={`rounded-xl border p-3 text-left font-bold transition flex items-center gap-2.5 ${
                    mode === "PICKUP"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span className="text-lg">🏪</span>
                  <div>
                    <p className="text-xs font-black">Store Pickup</p>
                    <p className="text-[10px] text-muted font-normal">Collect in store</p>
                  </div>
                </button>
              ) : null}
            </div>
          </div>

          {/* Delivery Address */}
          {mode === "DELIVERY" ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-ink uppercase tracking-wider">Delivery Address</h2>
                <Link href="/account" className="text-xs font-bold text-emerald-700 hover:underline">
                  + Add / Edit Address
                </Link>
              </div>

              {addresses.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-xs text-muted">
                  No saved address found. <Link href="/account" className="text-emerald-700 font-bold underline">Add an address</Link> to proceed.
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((a) => {
                    const isSelected = addressId === a.id;
                    return (
                      <label
                        key={a.id}
                        className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={isSelected}
                          onChange={() => {
                            setAddressId(a.id);
                            setPincode(a.pincode);
                          }}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="text-xs">
                          <p className="font-extrabold text-ink">{a.label}</p>
                          <p className="text-slate-600 mt-0.5">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city} - {a.pincode}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {matchedZone ? (
                <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-3 text-xs text-emerald-900">
                  <span className="font-bold">Zone: {matchedZone.name}</span> · Delivery fee <Price paise={matchedZone.deliveryChargePaise} className="font-extrabold" />
                  {matchedZone.freeThresholdPaise ? (
                    <span> (Free above <Price paise={matchedZone.freeThresholdPaise} className="font-extrabold" />)</span>
                  ) : null}
                </div>
              ) : addressId ? (
                <p className="text-xs font-bold text-red-600">Delivery is not yet available for this address PIN code.</p>
              ) : null}

              {selectedZone && selectedZone.slots.length > 0 ? (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-ink">
                    Delivery Slot
                    <select
                      value={slotId}
                      onChange={(e) => setSlotId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-ink font-medium focus:border-emerald-600"
                    >
                      <option value="">Instant (8-10 Mins) / Select Slot…</option>
                      {selectedZone.slots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Payment Method */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-black text-ink uppercase tracking-wider">Payment Options</h2>
            <div className="space-y-2">
              {payments.cod ? (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-500 transition">
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-ink">Cash on Delivery (COD)</p>
                    <p className="text-[11px] text-muted">Pay with cash or UPI at the doorstep</p>
                  </div>
                </label>
              ) : null}

              {payments.upi ? (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-500 transition">
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === "UPI"}
                    onChange={() => setPaymentMethod("UPI")}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-ink">UPI / QR Code</p>
                    <p className="text-[11px] text-muted">GPay, PhonePe, Paytm</p>
                  </div>
                </label>
              ) : null}

              {payments.online ? (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-500 transition">
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === "ONLINE"}
                    onChange={() => setPaymentMethod("ONLINE")}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-ink">Credit / Debit Card & NetBanking</p>
                    <p className="text-[11px] text-muted">All major banks supported</p>
                  </div>
                </label>
              ) : null}
            </div>
          </div>

          {/* Coupons & Loyalty */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-black text-ink uppercase tracking-wider">Coupons & Savings</h2>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon (e.g. WELCOME10)"
                className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-ink placeholder-slate-400 focus:border-emerald-600 uppercase"
              />
              <button
                type="button"
                className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-ink transition"
              >
                Apply
              </button>
            </div>
          </div>
        </section>

        {/* Right: Sticky Order Summary */}
        <section>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs lg:sticky lg:top-24 space-y-4">
            <h2 className="text-xs font-black text-ink uppercase tracking-wider">Order Summary</h2>

            {cartSummary ? (
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Total Items</span>
                  <span className="font-bold text-ink">{cartSummary.lines.reduce((s, i) => s + i.qty, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <Price paise={cartSummary.subtotalPaise} className="font-bold text-ink text-sm" />
                </div>
                <p className="text-[11px] text-muted pt-2 border-t border-slate-100">
                  ⚡ 10-Minute superfast delivery directly from store dark hub.
                </p>
              </div>
            ) : null}

            <button
              onClick={placeOrder}
              disabled={placing || (mode === "DELIVERY" && (!addressId || !matchedZone))}
              className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 text-center text-sm font-black shadow-md transition active:scale-[0.99] disabled:opacity-50"
            >
              {placing ? "Placing Order…" : "Place Order ⚡"}
            </button>
            <p className="text-[10px] text-muted text-center">
              Double-tapping Place Order creates only one order (Idempotent checkout).
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
