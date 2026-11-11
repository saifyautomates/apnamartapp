"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Price } from "@/components/ui";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDelivery } from "@/lib/delivery-context";
import { GoogleMapPicker } from "@/components/location/google-map-picker";

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
  name?: string;
  phone?: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

const KOTA_SLOTS = [
  { id: "slot-express", label: "⚡ 10-15 Min Express Delivery (Darkstore Fast-Track)", eta: "10-15 Mins", badge: "Fastest" },
  { id: "slot-eve", label: "🌆 Today Evening (5:00 PM - 7:30 PM)", eta: "Evening", badge: "Scheduled" },
  { id: "slot-morn", label: "🌅 Tomorrow Morning (7:00 AM - 9:30 AM)", eta: "Morning", badge: "Fresh Batch" },
];

export function CheckoutPageView() {
  const { deliveryPromiseText, activeLocation, shoppingMode } = useDelivery();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [storeInfo, setStoreInfo] = useState<{ payments: Record<string, boolean>; pickup: { enabled?: boolean } } | null>(null);
  const [cartSummary, setCartSummary] = useState<{ subtotalPaise: number; lines: Array<{ qty: number }> } | null>(null);
  const [mode, setMode] = useState<"DELIVERY" | "PICKUP">(() => (shoppingMode === "PICKUP" ? "PICKUP" : "DELIVERY"));
  const [addressId, setAddressId] = useState("");
  const [pincode, setPincode] = useState("324005");
  const [slotId, setSlotId] = useState("slot-express");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI" | "ONLINE">("COD");
  const [selectedUpiApp, setSelectedUpiApp] = useState<"gpay" | "phonepe" | "paytm" | "bhim">("gpay");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountPaise, setDiscountPaise] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [creditPaise, setCreditPaise] = useState(0);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  // Map Picker State
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Inline OTP Login State
  const [phoneInput, setPhoneInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [devOtpHint, setDevOtpHint] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [availableOffers, setAvailableOffers] = useState<any[]>([]);

  const loadCheckoutData = async () => {
    try {
      const [addrRes, zoneRes, infoRes, cartRes, offerRes] = await Promise.all([
        fetch("/api/account/addresses"),
        fetch("/api/delivery/zones"),
        fetch("/api/store-info"),
        fetch("/api/cart"),
        fetch("/api/offers").then((r) => r.json()).catch(() => ({ data: [] })),
      ]);
      const addrJson = await addrRes.json();
      if (addrRes.status === 401) {
        setNeedLogin(true);
      } else {
        setNeedLogin(false);
        const list: Address[] = addrJson.data ?? [];
        setAddresses(list);
        if (list.length > 0) {
          const def = list.find((a) => a.isDefault) || list[0];
          setAddressId(def.id);
          setPincode(def.pincode);
        } else if (activeLocation?.pincode) {
          setPincode(activeLocation.pincode);
        }
      }

      const zoneJson = await zoneRes.json();
      setZones(zoneJson.data ?? []);
      const infoJson = await infoRes.json();
      setStoreInfo(infoJson.data);
      const cartJson = await cartRes.json();
      setCartSummary(cartJson.data);
      if (offerRes?.data && Array.isArray(offerRes.data)) {
        setAvailableOffers(offerRes.data);
      }
    } catch {
      setError("Failed to load checkout data");
    }
  };

  useEffect(() => {
    loadCheckoutData();
  }, []);

  // Handle inline OTP request
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const clean = phoneInput.replace(/\D/g, "");
    if (clean.length < 10) {
      setAuthError("Please enter a valid 10-digit mobile number");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean.slice(-10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to send OTP");
      setOtpSent(true);
      if (data.data?.devOtp) {
        setDevOtpHint(data.data.devOtp);
        setOtpCode(data.data.devOtp); // Auto-fill demo OTP for effortless testing
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Error sending OTP");
    } finally {
      setAuthLoading(false);
    }
  }

  // Handle inline OTP verification
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const cleanPhone = phoneInput.replace(/\D/g, "").slice(-10);
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Invalid OTP code");
      setNeedLogin(false);
      await loadCheckoutData();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setAuthLoading(false);
    }
  }

  // Handle Google Map Address Pin
  async function handleMapAddressSelect(selected: {
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    locality: string;
  }) {
    setPincode(selected.pincode);

    // Try saving address via API
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: selected.label,
          name: "Resident",
          phone: phoneInput.slice(-10) || "9876543210",
          line1: selected.line1,
          line2: selected.line2 || `${selected.locality}, Kota`,
          city: "Kota",
          state: "Rajasthan",
          pincode: selected.pincode,
          isDefault: true,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.id) {
          setAddressId(json.data.id);
          setAddresses((prev) => [json.data, ...prev.map((a) => ({ ...a, isDefault: false }))]);
        }
      } else {
        // Fallback for guest
        const tempId = `addr-temp-${Date.now()}`;
        const tempAddr: Address = {
          id: tempId,
          label: selected.label,
          line1: selected.line1,
          line2: selected.line2 || `${selected.locality}, Kota`,
          city: "Kota",
          state: "Rajasthan",
          pincode: selected.pincode,
          isDefault: true,
        };
        setAddresses([tempAddr, ...addresses]);
        setAddressId(tempId);
      }
    } catch {
      // Local fallback
      const tempId = `addr-temp-${Date.now()}`;
      setAddressId(tempId);
    }
  }

  // Apply Promo Coupon / Dynamic Offer
  function applyCoupon(codeToApply?: string) {
    const raw = (typeof codeToApply === "string" ? codeToApply : couponCode).trim().toUpperCase();
    if (!raw) return;

    const sub = cartSummary?.subtotalPaise || 0;
    const matched = availableOffers.find(
      (o) => o.code?.toUpperCase() === raw || o.id === raw
    );

    if (matched) {
      const minPaise = Math.round(Number(matched.minOrderValue) * 100);
      if (sub < minPaise) {
        setError(`Add ₹${Math.round((minPaise - sub) / 100)} more to use ${matched.code} (Min order: ₹${matched.minOrderValue})`);
        return;
      }
      let disc = 0;
      if (matched.type === "PERCENT") {
        disc = Math.round((sub * Number(matched.discountValue)) / 100);
        if (matched.maxDiscountValue) {
          disc = Math.min(disc, Math.round(Number(matched.maxDiscountValue) * 100));
        }
      } else {
        disc = Math.round(Number(matched.discountValue) * 100);
      }
      setCouponApplied(true);
      setCouponCode(matched.code);
      setDiscountPaise(Math.min(disc, sub));
      setError("");
      return;
    }

    if (raw === "SAVE100" || raw === "CENTRAL100") {
      if (sub < 100000) {
        setError("Min order for SAVE100 is ₹1,000");
        return;
      }
      setCouponApplied(true);
      setCouponCode(raw);
      setDiscountPaise(10000);
      setError("");
    } else if (raw === "KOTA50" || raw === "FIRST50" || raw === "BLINKIT") {
      if (sub < 49900) {
        setError("Min order for KOTA50 is ₹499");
        return;
      }
      setCouponApplied(true);
      setCouponCode(raw);
      setDiscountPaise(5000);
      setError("");
    } else {
      setError("Invalid coupon code. Try SAVE100 or KOTA50");
    }
  }

  function removeCoupon() {
    setCouponApplied(false);
    setCouponCode("");
    setDiscountPaise(0);
    setError("");
  }

  const matchedZone = zones.find((z) => z.pincodes.includes(pincode)) || {
    id: "zone-kota",
    name: "Kota Express Darkstore Zone",
    pincodes: ["324001", "324002", "324004", "324005", "324006", "324007", "324008", "324009", "324010"],
    minOrderPaise: 9900,
    deliveryChargePaise: 0,
    freeThresholdPaise: 19900,
    slots: [],
  };

  const subtotal = cartSummary?.subtotalPaise || 0;
  const deliveryFee = subtotal >= 19900 ? 0 : 2500;
  const handlingFee = 200; // ₹2
  const finalTotal = Math.max(0, subtotal + (deliveryFee === 0 ? 0 : deliveryFee) + handlingFee - discountPaise);

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
          deliverySlotId: mode === "DELIVERY" && slotId && slotId !== "slot-express" ? slotId : undefined,
          paymentMethod,
          couponCode: couponApplied ? couponCode : undefined,
          loyaltyPoints: loyaltyPoints || undefined,
          storeCreditPaise: creditPaise || undefined,
        }),
      });
      const orderId = data.orderId;
      if (!orderId) throw new Error("Checkout did not return an order");
      window.dispatchEvent(new Event("cart-updated"));
      const targetUrl = paymentMethod === "COD"
        ? `/orders/${orderId}`
        : `/checkout/mock-pay?orderId=${orderId}&method=${paymentMethod}`;
      router.push(targetUrl);
      setTimeout(() => {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/orders/")) {
          window.location.href = targetUrl;
        }
      }, 500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Checkout Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-neutral-100 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition"
          >
            ←
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1c1c1c] tracking-tight">
              Order Checkout
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              FMCG Express Darkstore &bull; Kota Hub (324001 - 324010)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            ⚡ 10-15 Min Delivery
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      ) : null}

      {/* Inline Fast Login Modal / Card if needed */}
      {needLogin ? (
        <div className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-50/50 to-white p-6 sm:p-8 shadow-lg space-y-5 animate-in fade-in duration-300">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#0c831f] text-white flex items-center justify-center text-2xl font-black shadow-md shrink-0">
              ⚡
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#1c1c1c]">
                Quick 10-Second Phone Login
              </h2>
              <p className="text-xs text-neutral-600 mt-0.5">
                Login with your mobile number to get live GPS delivery tracking and Kota cashback rewards!
              </p>
            </div>
          </div>

          {authError ? (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600">
              {authError}
            </div>
          ) : null}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Mobile Number</label>
                <div className="flex rounded-2xl border border-neutral-300 bg-white overflow-hidden shadow-xs focus-within:border-[#0c831f] focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <span className="px-3.5 py-3 text-xs font-bold text-neutral-500 bg-neutral-50 border-r border-neutral-200">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="flex-1 px-3 py-3 text-sm font-black text-[#1c1c1c] placeholder-neutral-400 focus:outline-hidden"
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] py-3.5 text-xs sm:text-sm font-black text-white shadow-md transition active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? "Sending Code..." : "Send Instant OTP →"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-700">Enter Verification Code</label>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-[11px] font-bold text-[#0c831f] hover:underline"
                  >
                    Change Number
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 4 or 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full tracking-widest text-center rounded-2xl border border-neutral-300 bg-white py-3 text-lg font-black text-[#1c1c1c] focus:border-[#0c831f] focus:outline-hidden shadow-xs"
                  autoFocus
                />
                {devOtpHint ? (
                  <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                    ✨ Demo Test Code: <span className="font-mono">{devOtpHint}</span> (auto-filled)
                  </p>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] py-3.5 text-xs sm:text-sm font-black text-white shadow-md transition active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? "Verifying..." : "Verify & Continue Checkout →"}
              </button>
            </form>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Delivery Mode, Address & Payment */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Delivery Option Tabs */}
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">
              1. Delivery Mode
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("DELIVERY")}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  mode === "DELIVERY"
                    ? "border-[#0c831f] bg-[#e8f5e9]/50 ring-2 ring-[#0c831f]/20"
                    : "border-neutral-200 hover:border-neutral-300 bg-neutral-50/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <div>
                    <span className="text-xs font-black text-[#1c1c1c] block">
                      Doorstep Delivery
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                      10-15 Mins
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 mt-2">Delivered to your house in Kota</p>
              </button>

              <button
                type="button"
                onClick={() => setMode("PICKUP")}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  mode === "PICKUP"
                    ? "border-[#0c831f] bg-[#e8f5e9]/50 ring-2 ring-[#0c831f]/20"
                    : "border-neutral-200 hover:border-neutral-300 bg-neutral-50/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏪</span>
                  <div>
                    <span className="text-xs font-black text-[#1c1c1c] block">
                      Store Pickup
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-1.5 py-0.2 rounded">
                      Zero Fees
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 mt-2">Collect from Central Mart Kota Hub</p>
              </button>
            </div>
          </div>

          {/* 2. Delivery Address with Google Map Picker */}
          {mode === "DELIVERY" ? (
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">
                    2. Delivery Address
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Live GPS pin for exact doorstep arrival
                  </p>
                </div>
                {/* Trigger Google Map Modal */}
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0c831f] font-black text-xs transition cursor-pointer shadow-xs border border-emerald-200/60"
                >
                  <span>📍</span>
                  <span>Pin on Google Map &rsaquo;</span>
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-6 text-center space-y-3">
                  <span className="text-3xl block">📍</span>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-neutral-800">No delivery address selected yet</p>
                    <p className="text-[11px] text-neutral-500">
                      Use the interactive Google Map to pin your flat or house in Kota!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0c831f] hover:bg-[#0a701a] px-5 py-2.5 text-xs font-black text-white shadow-md transition cursor-pointer active:scale-95"
                  >
                    <span>📍 Pin Location on Google Map</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                        addressId === a.id
                          ? "border-[#0c831f] bg-[#e8f5e9]/40 ring-2 ring-[#0c831f]/20"
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
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
                          <span className="text-xs font-black text-[#1c1c1c]">{a.label || "Home"}</span>
                          {a.isDefault ? (
                            <span className="text-[10px] font-bold text-[#0c831f] bg-emerald-100/70 px-1.5 py-0.5 rounded">
                              Selected
                            </span>
                          ) : null}
                          <span className="text-[10px] font-mono text-neutral-400">PIN: {a.pincode}</span>
                        </div>
                        <p className="text-xs text-neutral-600 mt-1 leading-snug">
                          {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Express Delivery Slots */}
              <div className="pt-3 border-t border-neutral-100 space-y-2">
                <label className="text-[11px] font-black uppercase text-neutral-500 tracking-wider">
                  Select Delivery Slot
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {KOTA_SLOTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSlotId(s.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer text-xs ${
                        slotId === s.id
                          ? "border-[#0c831f] bg-emerald-50/80 font-bold text-[#0c831f] ring-1 ring-[#0c831f]"
                          : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[11px]">{s.badge}</span>
                        {slotId === s.id ? <span>✓</span> : null}
                      </div>
                      <p className="text-[11px] leading-tight mt-1 text-neutral-600 line-clamp-2">
                        {s.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* 3. Payment Method with Instant UPI preview */}
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">
              3. Payment Method
            </h3>
            <div className="space-y-2.5">
              {/* Cash on Delivery */}
              <label
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === "COD"
                    ? "border-[#0c831f] bg-[#e8f5e9]/40 ring-2 ring-[#0c831f]/20"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="accent-[#0c831f]"
                />
                <span className="text-xl">💵</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-[#1c1c1c]">Cash on Delivery (COD)</p>
                    <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded">
                      Pay at Doorstep
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">Pay cash or scan rider's QR on delivery</p>
                </div>
              </label>

              {/* UPI Instant */}
              <label
                className={`flex flex-col gap-2 p-3.5 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === "UPI"
                    ? "border-[#0c831f] bg-[#e8f5e9]/40 ring-2 ring-[#0c831f]/20"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "UPI"}
                    onChange={() => setPaymentMethod("UPI")}
                    className="accent-[#0c831f]"
                  />
                  <span className="text-xl">📱</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-[#1c1c1c]">Instant UPI</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        Fastest &bull; 0% Fee
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">PhonePe, Google Pay, Paytm, CRED &amp; BHIM</p>
                  </div>
                </div>

                {paymentMethod === "UPI" ? (
                  <div className="pt-2 pl-7 flex items-center gap-2">
                    {(["gpay", "phonepe", "paytm", "bhim"] as const).map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setSelectedUpiApp(app)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border transition ${
                          selectedUpiApp === app
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        {app === "gpay" ? "Google Pay" : app === "phonepe" ? "PhonePe" : app === "paytm" ? "Paytm" : "BHIM"}
                      </button>
                    ))}
                  </div>
                ) : null}
              </label>

              {/* Cards / Netbanking */}
              <label
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === "ONLINE"
                    ? "border-[#0c831f] bg-[#e8f5e9]/40 ring-2 ring-[#0c831f]/20"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                  className="accent-[#0c831f]"
                />
                <span className="text-xl">💳</span>
                <div className="flex-1">
                  <p className="text-xs font-black text-[#1c1c1c]">Debit / Credit Cards &amp; NetBanking</p>
                  <p className="text-[11px] text-neutral-500">Visa, Mastercard, RuPay &amp; Netbanking</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order Button */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-4 sticky top-20">
            <h3 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">
              Bill Breakdown
            </h3>

            {/* Free Delivery Bar Pill */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🎉</span>
                <span>FREE Express Delivery Unlocked!</span>
              </div>
              <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px] font-mono">
                Kota Special
              </span>
            </div>

            {cartSummary ? (
              <div className="space-y-2 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Item Total ({(cartSummary.lines ?? []).reduce((s, l) => s + l.qty, 0)} items)</span>
                  <Price paise={subtotal} />
                </div>
                <div className="flex justify-between">
                  <span>Delivery Partner Fee</span>
                  <span className="font-bold text-[#0c831f]">FREE (₹25 saved)</span>
                </div>
                <div className="flex justify-between">
                  <span>Handling &amp; Packaging</span>
                  <Price paise={handlingFee} />
                </div>
                {couponApplied ? (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon ({couponCode})</span>
                    <span>- <Price paise={discountPaise} /></span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-3 border-t border-neutral-200 text-base font-black text-[#1c1c1c]">
                  <span>To Pay</span>
                  <Price paise={finalTotal} />
                </div>
              </div>
            ) : null}

            {/* Promo Code & Available Offers */}
            <div className="pt-2 border-t border-neutral-100 space-y-2">
              {couponApplied ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <span className="text-base text-emerald-700">🏷️</span>
                    <div>
                      <p className="text-xs font-mono font-black text-emerald-900">{couponCode} APPLIED</p>
                      <p className="text-[11px] text-emerald-700 font-bold">Saved <Price paise={discountPaise} /></p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="PROMO CODE (e.g. SAVE100)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold uppercase placeholder-neutral-400 focus:border-[#0c831f] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => applyCoupon()}
                    className="rounded-xl bg-[#e8f5e9] text-[#0c831f] font-black text-xs px-4 py-2 hover:bg-[#d4edd8] transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              )}

              {/* Available Promo Chips */}
              {!couponApplied && availableOffers && availableOffers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {availableOffers.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => applyCoupon(o.code)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-800 text-[11px] font-mono font-bold text-neutral-700 transition cursor-pointer border border-neutral-200"
                    >
                      <span>🏷️</span>
                      <span>{o.code}</span>
                      <span className="text-[10px] text-emerald-700 font-sans font-bold">
                        ({o.type === "PERCENT" ? `${o.discountValue}%` : `₹${o.discountValue}`} OFF)
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              id="place-order-btn"
              onClick={placeOrder}
              disabled={placing || (mode === "DELIVERY" && !addressId && addresses.length === 0)}
              className="w-full rounded-2xl bg-gradient-to-r from-[#0c831f] to-emerald-700 hover:from-[#0a701a] hover:to-emerald-800 py-4 text-center text-sm font-black text-white shadow-lg transition active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {placing ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Confirming Order...</span>
                </>
              ) : mode === "DELIVERY" && !addressId && addresses.length === 0 ? (
                <span>📍 Please Pin Address on Map First</span>
              ) : (
                <>
                  <span>Place Order</span>
                  <span>&bull;</span>
                  <Price paise={finalTotal} />
                  <span>→</span>
                </>
              )}
            </button>

            {/* Cancellation & Trust Guarantee */}
            <div className="pt-2 text-[10px] text-neutral-400 text-center space-y-1">
              <p>🛡️ 100% Original Products &bull; Instant Refund Policy</p>
              <p>Delivered by Central Mart Darkstore Fleet, Kota</p>
            </div>
          </div>
        </div>
      </div>

      {/* Google Map Address Selector Modal */}
      <GoogleMapPicker
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectAddress={handleMapAddressSelect}
      />
    </div>
  );
}

export default CheckoutPageView;
