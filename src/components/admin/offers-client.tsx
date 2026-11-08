"use client";

import { useEffect, useState, useMemo } from "react";
import { StoreOffer } from "@/lib/offers";
import { ensureCsrf } from "@/lib/api/client";

function CountdownDisplay({ endsAt, isActive }: { endsAt: string; isActive: boolean }) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      const totalSec = Math.floor(diff / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (!isActive) {
    return <span className="inline-flex items-center gap-1 text-neutral-400 font-medium">⚪ Paused</span>;
  }

  if (timeLeft.expired) {
    return <span className="inline-flex items-center gap-1 text-red-500 font-bold">🔴 Expired</span>;
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200/80 text-xs font-mono font-black text-red-600 shadow-2xs">
      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
      <span>
        {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}

export function AdminOffersClient({ initialOffers }: { initialOffers: StoreOffer[] }) {
  const [offers, setOffers] = useState<StoreOffer[]>(initialOffers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [title, setTitle] = useState("Flat ₹100 OFF on orders over ₹1,000");
  const [subtitle, setSubtitle] = useState("Apply code SAVE100 to get instant ₹100 discount on your grocery order");
  const [badgeText, setBadgeText] = useState("⚡ FLASH OFFER");
  const [code, setCode] = useState("SAVE100");
  const [type, setType] = useState<"FLAT" | "PERCENT" | "FREE_DELIVERY">("FLAT");
  const [discountValue, setDiscountValue] = useState<number>(100);
  const [minOrderValue, setMinOrderValue] = useState<number>(1000);
  const [maxDiscountValue, setMaxDiscountValue] = useState<number>(150);
  const [timerHours, setTimerHours] = useState<number>(6);
  const [customEndsAt, setCustomEndsAt] = useState<string>("");
  const [autoApply, setAutoApply] = useState(false);
  const [themeGradient, setThemeGradient] = useState("from-[#b91c1c] via-[#c2410c] to-[#d97706]");

  const refreshOffers = async () => {
    try {
      const res = await fetch("/api/admin/offers");
      if (res.ok) {
        const json = await res.json();
        setOffers(json.data ?? []);
      }
    } catch {
      /* ignore */
    }
  };

  const computedEndsAt = useMemo(() => {
    if (customEndsAt) return new Date(customEndsAt).toISOString();
    return new Date(Date.now() + timerHours * 3600 * 1000).toISOString();
  }, [timerHours, customEndsAt]);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const csrf = await ensureCsrf();
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({
          title,
          subtitle,
          badgeText,
          code: code.trim().toUpperCase(),
          type,
          discountValue: Number(discountValue),
          minOrderValue: Number(minOrderValue),
          maxDiscountValue: type === "PERCENT" && maxDiscountValue ? Number(maxDiscountValue) : undefined,
          startsAt: new Date().toISOString(),
          endsAt: computedEndsAt,
          isActive: true,
          autoApply,
          bgGradient: themeGradient,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create offer");

      setSuccess(`Offer "${title}" successfully launched with live timer!`);
      if (json.data?.offers) {
        setOffers(json.data.offers);
      } else {
        await refreshOffers();
      }

      // Reset to defaults
      setCode("");
      setTitle("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating offer");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const csrf = await ensureCsrf();
      const res = await fetch("/api/admin/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      if (res.ok) {
        setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, isActive: !currentActive } : o)));
      }
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      const csrf = await ensureCsrf();
      const res = await fetch(`/api/admin/offers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrf },
      });
      if (res.ok) {
        setOffers((prev) => prev.filter((o) => o.id !== id));
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-adminline pb-5">
        <div>
          <h1 className="text-2xl font-black text-ink tracking-tight flex items-center gap-2.5">
            <span>⚡ Flash Sale & Offers Control</span>
            <span className="text-xs bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-bold">
              Live Timers Engine
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Launch countdown offers (e.g. ₹100 OFF over ₹1,000, 15% OFF, Free Delivery). Ticking countdown timer is displayed across the storefront, cart, and checkout in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200">
            Total Offers: <strong className="text-ink">{offers.length}</strong>
          </span>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600 border border-red-200">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800 border border-emerald-200">
          ✅ {success}
        </div>
      )}

      {/* Grid: Create Form on Left (or Top) and Active Offers Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Create Offer Card (5 Columns) */}
        <div className="lg:col-span-5 rounded-3xl border border-adminline bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-adminline pb-3">
            <h2 className="text-base font-black text-ink flex items-center gap-2">
              <span>➕ Create Flash Sale Offer</span>
            </h2>
            <span className="text-xs text-muted font-mono">100% Admin Automated</span>
          </div>

          <form onSubmit={handleCreateOffer} className="space-y-4">
            {/* Offer Title */}
            <div>
              <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1">
                Offer Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Flat ₹100 OFF on orders over ₹1,000"
                required
                className="w-full rounded-xl border border-adminline px-3.5 py-2 text-sm focus:border-brand-600 focus:outline-hidden"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1">
                Subtitle / Description
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Flat discount on groceries & staples"
                className="w-full rounded-xl border border-adminline px-3.5 py-2 text-sm focus:border-brand-600 focus:outline-hidden"
              />
            </div>

            {/* Offer Type & Code */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1">
                  Offer Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "FLAT" | "PERCENT" | "FREE_DELIVERY")}
                  className="w-full rounded-xl border border-adminline px-3 py-2 text-sm focus:border-brand-600 focus:outline-hidden bg-white"
                >
                  <option value="FLAT">Flat Discount (₹)</option>
                  <option value="PERCENT">Percentage Discount (%)</option>
                  <option value="FREE_DELIVERY">Free Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE100"
                  required
                  className="w-full rounded-xl border border-adminline px-3.5 py-2 text-sm font-mono font-bold tracking-wider uppercase focus:border-brand-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Discount & Min Order Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1">
                  {type === "PERCENT" ? "Discount (%)" : "Discount (₹)"} *
                </label>
                <input
                  type="number"
                  min="1"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-adminline px-3.5 py-2 text-sm focus:border-brand-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1">
                  Min Order (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-adminline px-3.5 py-2 text-sm focus:border-brand-600 focus:outline-hidden"
                />
              </div>
            </div>

            {type === "PERCENT" && (
              <div>
                <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1">
                  Max Discount Cap (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxDiscountValue}
                  onChange={(e) => setMaxDiscountValue(Number(e.target.value))}
                  placeholder="e.g. 150"
                  className="w-full rounded-xl border border-adminline px-3.5 py-2 text-sm focus:border-brand-600 focus:outline-hidden"
                />
              </div>
            )}

            {/* Countdown Timer Duration Presets */}
            <div>
              <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>⏱️ Live Countdown Timer Duration</span>
                <span className="text-[11px] text-red-600 font-bold">Expires in {timerHours}h</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "2 Hours", val: 2 },
                  { label: "6 Hours", val: 6 },
                  { label: "12 Hours", val: 12 },
                  { label: "24 Hours", val: 24 },
                  { label: "48 Hours", val: 48 },
                  { label: "72 Hours", val: 72 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => {
                      setTimerHours(preset.val);
                      setCustomEndsAt("");
                    }}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      timerHours === preset.val && !customEndsAt
                        ? "bg-red-600 text-white border-red-600 shadow-xs"
                        : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Or Custom Target Date & Time */}
              <div className="mt-2.5">
                <input
                  type="datetime-local"
                  value={customEndsAt}
                  onChange={(e) => setCustomEndsAt(e.target.value)}
                  className="w-full rounded-xl border border-adminline px-3 py-1.5 text-xs text-neutral-600 focus:border-brand-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Badge Text & Color Theme */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1">
                  Badge Label
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="⚡ FLASH DEAL"
                  className="w-full rounded-xl border border-adminline px-3 py-2 text-xs focus:border-brand-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1">
                  Color Theme
                </label>
                <select
                  value={themeGradient}
                  onChange={(e) => setThemeGradient(e.target.value)}
                  className="w-full rounded-xl border border-adminline px-2.5 py-2 text-xs focus:border-brand-600 focus:outline-hidden bg-white"
                >
                  <option value="from-[#b91c1c] via-[#c2410c] to-[#d97706]">Fiery Red / Orange</option>
                  <option value="from-[#0a6833] via-[#0c831f] to-[#15803d]">Central Mart Green</option>
                  <option value="from-[#7c3aed] via-[#6d28d9] to-[#4c1d95]">Royal Purple</option>
                  <option value="from-[#0284c7] via-[#0369a1] to-[#075985]">Ocean Blue</option>
                </select>
              </div>
            </div>

            {/* Auto-Apply Checkbox */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer">
              <input
                type="checkbox"
                checked={autoApply}
                onChange={(e) => setAutoApply(e.target.checked)}
                className="h-4 w-4 rounded-sm border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <div className="text-xs">
                <span className="font-black text-ink">Auto-Apply at Checkout</span>
                <p className="text-muted">Automatically deduct discount when cart total exceeds min order amount.</p>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white font-black py-3 text-sm shadow-md transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Launching Offer..." : "🚀 Launch Flash Sale Offer Now"}
            </button>
          </form>
        </div>

        {/* Live Offers Management Table (7 Columns) */}
        <div className="lg:col-span-7 rounded-3xl border border-adminline bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-adminline pb-3">
            <h2 className="text-base font-black text-ink flex items-center gap-2">
              <span>📋 Active Store Offers & Flash Deals</span>
            </h2>
            <button
              onClick={refreshOffers}
              className="text-xs font-bold text-brand-700 hover:underline cursor-pointer"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase font-black text-muted border-b border-adminline pb-2">
                  <th className="py-2.5">Offer / Title</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Countdown Timer</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {offers.map((o) => (
                  <tr key={o.id} className="hover:bg-neutral-50/60 transition">
                    <td className="py-3 pr-2">
                      <div className="font-black text-[#1c1c1c] text-xs sm:text-sm">{o.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] font-bold text-[#0c831f] bg-[#e8f5e9] px-2 py-0.5 rounded-md">
                          {o.code}
                        </span>
                        {o.autoApply && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            Auto-apply
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="font-bold text-xs">
                      {o.type === "PERCENT"
                        ? `${o.discountValue}% OFF`
                        : o.type === "FREE_DELIVERY"
                          ? "FREE DEL"
                          : `₹${o.discountValue} OFF`}
                    </td>

                    <td className="font-medium text-xs text-neutral-600">
                      ₹{o.minOrderValue}
                    </td>

                    <td className="py-2.5">
                      <CountdownDisplay endsAt={o.endsAt} isActive={o.isActive} />
                    </td>

                    <td>
                      <button
                        onClick={() => handleToggleActive(o.id, o.isActive)}
                        className={`text-[11px] font-black px-2.5 py-1 rounded-full border transition cursor-pointer ${
                          o.isActive
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                            : "bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200"
                        }`}
                      >
                        {o.isActive ? "🟢 Active" : "⚪ Paused"}
                      </button>
                    </td>

                    <td className="text-right">
                      <button
                        onClick={() => handleDelete(o.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-bold p-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Delete offer"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {offers.length === 0 && (
              <div className="text-center py-8 text-neutral-400 text-xs">
                No active offers. Use the form on the left to launch your first promotional offer!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOffersClient;
