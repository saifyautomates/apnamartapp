"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Price } from "@/components/ui";
import Link from "next/link";
import OrderDetailClient from "./order-detail";
import { useSupabaseRealtime } from "@/hooks";
import { LiveMapTracker } from "./live-map-tracker";
import { RiderAiChatModal } from "./rider-ai-chat-modal";
import { MessageSquare, Phone, Sparkles, Navigation, Activity, ArrowLeft } from "lucide-react";

export interface LiveOrder {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  deliveryMethod: string;
  deliveryAddress?: {
    name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    pincode?: string;
  } | null;
  items: Array<{
    id: string;
    productName: string;
    variantName?: string | null;
    qty: number;
    totalPaise: number;
  }>;
  subtotalPaise: number;
  discountPaise: number;
  loyaltyDiscountPaise: number;
  storeCreditUsedPaise: number;
  deliveryChargePaise: number;
  taxPaise: number;
  grandTotalPaise: number;
  savingsPaise: number;
  delivery?: {
    assignedTo?: string | null;
    status?: string;
  } | null;
}

const STEPS = [
  { key: "PLACED", label: "Order Placed", sub: "Received by Central Mart", icon: "📝" },
  { key: "CONFIRMED", label: "Order Confirmed", sub: "Assigned to nearest dark store", icon: "⚡" },
  { key: "PREPARING", label: "Packing Essentials", sub: "100% genuine packaged goods checked", icon: "📦" },
  { key: "PACKED", label: "Packed & Sealed", sub: "Handed over to delivery rider", icon: "🛍️" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", sub: "Rider speeding to your doorstep", icon: "🛵" },
  { key: "DELIVERED", label: "Delivered at Doorstep", sub: "Enjoy your fresh groceries!", icon: "🎉" },
];

function playChime() {
  try {
    const AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    /* ignore audio error if user hasn't interacted */
  }
}

export function LiveDeliveryTracker({ initialOrder }: { initialOrder: LiveOrder }) {
  const router = useRouter();
  const [order, setOrder] = useState<LiveOrder>(initialOrder);
  const [activeDeliveryNote, setActiveDeliveryNote] = useState<string | null>(null);
  const [noteSent, setNoteSent] = useState(false);
  const [mapMode, setMapMode] = useState<"gps" | "schematic">("gps");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevStatusRef = useRef(initialOrder.status);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Remaining Seconds Calculator for delivery countdown
  const elapsedSeconds = useMemo(() => {
    const createdTime = new Date(order.createdAt).getTime();
    return Math.max(0, Math.floor((Date.now() - createdTime) / 1000));
  }, [order.createdAt]);

  const [countdown, setCountdown] = useState(() => Math.max(0, 480 - elapsedSeconds));

  const isDelivered = order.status === "DELIVERED";
  const isCancelled = order.status === "CANCELLED";
  const isOutForDelivery = order.status === "OUT_FOR_DELIVERY";

  // Step Index
  const currentStepIndex = useMemo(() => {
    const idx = STEPS.findIndex((s) => s.key === order.status);
    return idx === -1 ? 0 : idx;
  }, [order.status]);

  // Live Timer Interval
  useEffect(() => {
    if (isDelivered || isCancelled) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isDelivered, isCancelled]);

  // Supabase Realtime CDC: Sub-second live WebSocket order status updates
  useSupabaseRealtime({
    table: "Order",
    filter: `id=eq.${order.id}`,
    enabled: !isDelivered && !isCancelled,
    onPayload: (payload) => {
      const next = payload.new as any;
      if (next?.status && next.status !== prevStatusRef.current) {
        prevStatusRef.current = next.status;
        playChime();
        setOrder((prev) => ({
          ...prev,
          status: next.status,
          delivery: prev.delivery ? { ...prev.delivery, status: next.status } : null,
        }));
      }
    },
  });

  // Real-time Poller (Fallback if WebSocket disconnects)
  useEffect(() => {
    if (isDelivered || isCancelled) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.order) {
            const nextOrder = json.data.order as LiveOrder;
            if (nextOrder.status !== prevStatusRef.current) {
              prevStatusRef.current = nextOrder.status;
              playChime();
            }
            setOrder(nextOrder);
          }
        }
      } catch {
        /* ignore network hiccups */
      }
    }, 3500);

    return () => clearInterval(pollInterval);
  }, [order.id, isDelivered, isCancelled]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Progress Percentage for Map & Meter
  const progressPct = isDelivered
    ? 100
    : isCancelled
    ? 0
    : currentStepIndex === 0
    ? 10
    : currentStepIndex === 1
    ? 25
    : currentStepIndex === 2
    ? 45
    : currentStepIndex === 3
    ? 65
    : currentStepIndex === 4
    ? Math.min(95, 70 + Math.floor((1 - countdown / 480) * 25))
    : 100;

  // Rider position along SVG map curve
  const riderX = 60 + (progressPct / 100) * 360;
  const riderY = 140 - Math.sin((progressPct / 100) * Math.PI) * 55;

  // Demo simulator status change
  const handleSimulateStatus = async (targetStatus: string) => {
    setIsSimulating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/simulate-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.order) {
          prevStatusRef.current = targetStatus;
          playChime();
          setOrder((prev) => ({
            ...prev,
            status: targetStatus,
            delivery: prev.delivery ? { ...prev.delivery, status: targetStatus } : null,
          }));
        }
      }
    } catch {
      /* ignore */
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* Top Header matching Mockup Screen 7: "← Track Order" */}
      <div className="flex items-center justify-between py-2 border-b border-neutral-100">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-base font-black text-[#1c1c1c] hover:text-[#0c831f] transition cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
          <span>Track Order</span>
        </button>
        <span className="text-xs font-bold text-neutral-400">#{order.orderNumber}</span>
      </div>

      {/* Main Delivery Tracking Card matching Screen 7 Mockup */}
      <div className="overflow-hidden rounded-3xl bg-white border border-neutral-200/90 shadow-md">
        {/* 1. Map Canvas at Top */}
        {!isCancelled && (
          <div className="relative bg-[#f4f7f6] border-b border-neutral-200/80">
            {mapMode === "gps" ? (
              <LiveMapTracker
                orderStatus={order.status}
                deliveryAddress={order.deliveryAddress}
                progressPct={progressPct}
                countdown={countdown}
              />
            ) : (
              <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-[#eef3f1]">
                {/* Schematic SVG Canvas */}
                <svg className="w-full h-full" viewBox="0 0 480 200" preserveAspectRatio="none">
                  <defs>
                    <pattern id="roadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e0e8e4" strokeWidth="1" />
                    </pattern>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0c831f" />
                      <stop offset="50%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>

                  <rect width="100%" height="100%" fill="#edf3f0" />
                  <rect width="100%" height="100%" fill="url(#roadGrid)" />

                  <path
                    d="M 60 140 Q 240 25 420 140"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 60 140 Q 240 25 420 140"
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="8 6"
                    className="animate-pulse"
                  />

                  <g transform="translate(60, 140)">
                    <circle r="16" fill="#0c831f" stroke="#ffffff" strokeWidth="3" />
                    <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10">
                      🏪
                    </text>
                  </g>
                  <g transform="translate(420, 140)">
                    <circle r="16" fill="#ef4444" stroke="#ffffff" strokeWidth="3" />
                    <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10">
                      🏠
                    </text>
                  </g>
                  <g
                    transform={`translate(${riderX}, ${riderY})`}
                    className="transition-transform duration-700 ease-linear"
                  >
                    <circle r="16" fill="#f8cb46" stroke="#1c1c1c" strokeWidth="2.5" className="drop-shadow-md" />
                    <text x="0" y="4.5" textAnchor="middle" fontSize="12">
                      🛵
                    </text>
                  </g>
                </svg>
              </div>
            )}
          </div>
        )}

        {/* 2. Order Status Callout matching Screen 7 */}
        <div className="p-4 sm:p-5 bg-white text-center border-b border-neutral-100">
          <h2 className="text-base sm:text-lg font-black text-[#1c1c1c]">
            {isDelivered
              ? "Your order has been delivered! 🎉"
              : isCancelled
              ? "Order Cancelled"
              : isOutForDelivery
              ? "Your order is on the way!"
              : "Your order is being prepared!"}
          </h2>
          <p className="text-xs text-neutral-500 font-semibold mt-0.5">
            {isDelivered
              ? "Delivered at your doorstep in Kota"
              : isCancelled
              ? "Cancellation confirmed & items restored"
              : `Arriving in ${mounted ? formatCountdown(countdown) : "12"} min`}
          </p>
        </div>

        {/* 3. Rider Card matching Screen 7 */}
        {!isCancelled && !isDelivered && (
          <div className="px-5 py-3.5 bg-white flex items-center justify-between gap-3 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-[#0c831f] to-[#16a34a] flex items-center justify-center text-white text-lg font-black shadow-xs">
                👨‍🦱
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1c1c1c]">
                  {order.delivery?.assignedTo || "Rohit Kumar"}
                </h3>
                <p className="text-[11px] text-neutral-500 font-semibold">
                  +91 98765 43210
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsChatOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-[#0c831f] bg-[#e8f5e9] px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
              <a
                href="tel:+919876543210"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0c831f] hover:bg-[#0a701a] text-white shadow-xs transition active:scale-90 cursor-pointer"
                aria-label="Call Rider"
              >
                <Phone className="w-4 h-4 stroke-[2.4]" />
              </a>
            </div>
          </div>
        )}

        {/* 4. Horizontal Milestone Tracker matching Screen 7 Mockup */}
        {!isCancelled ? (
          <div className="p-4 sm:p-5 bg-white">
            <div className="relative flex items-center justify-between">
              {/* Connecting Track */}
              <div className="absolute top-3 left-4 right-4 h-0.5 bg-neutral-200 z-0">
                <div
                  className="h-full bg-[#0c831f] transition-all duration-500"
                  style={{
                    width:
                      order.status === "DELIVERED"
                        ? "100%"
                        : order.status === "OUT_FOR_DELIVERY"
                        ? "66%"
                        : order.status === "PREPARING" || order.status === "CONFIRMED" || order.status === "PACKED"
                        ? "33%"
                        : "0%",
                  }}
                />
              </div>

              {[
                { key: "PLACED", label: "Placed", step: 0 },
                { key: "PREPARING", label: "Preparing", step: 1 },
                { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", step: 2 },
                { key: "DELIVERED", label: "Delivered", step: 3 },
              ].map((st, i) => {
                let currentStepNum = 0;
                if (["CONFIRMED", "PREPARING", "PACKED"].includes(order.status)) currentStepNum = 1;
                if (order.status === "OUT_FOR_DELIVERY") currentStepNum = 2;
                if (order.status === "DELIVERED") currentStepNum = 3;

                const isPassed = i <= currentStepNum;
                const isCurrent = i === currentStepNum;

                return (
                  <div key={st.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                        isPassed
                          ? "bg-[#0c831f] text-white ring-4 ring-[#e8f5e9]"
                          : "bg-white border-2 border-neutral-300 text-transparent"
                      }`}
                    >
                      {isPassed ? <span className="text-[10px] font-black">✓</span> : <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />}
                    </div>
                    <span
                      className={`mt-1.5 text-[10px] text-center leading-tight max-w-[65px] ${
                        isCurrent
                          ? "font-black text-[#0c831f]"
                          : isPassed
                          ? "font-bold text-[#1c1c1c]"
                          : "font-medium text-neutral-400"
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-red-50 text-red-700 text-xs font-bold text-center">
            Order #{order.orderNumber} has been cancelled.
          </div>
        )}
      </div>

      {/* 5. Items in this Delivery & Receipt */}
      <div className="rounded-3xl bg-white border border-neutral-200/90 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">
            Items in this Delivery ({order.items.length})
          </h2>
          <span className="text-xs font-bold text-neutral-500">
            {order.deliveryMethod === "DELIVERY" ? "🚀 Same-Day FMCG Delivery" : "🏬 Store Pickup"}
          </span>
        </div>

        <div className="divide-y divide-neutral-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
              <div>
                <p className="font-extrabold text-[#1c1c1c]">{item.productName}</p>
                <p className="text-[11px] text-neutral-400">
                  {item.variantName ?? "Pack"} × {item.qty}
                </p>
              </div>
              <Price paise={item.totalPaise} className="font-black text-[#1c1c1c]" />
            </div>
          ))}
        </div>

        {/* Bill Breakdown */}
        <div className="pt-3 border-t border-neutral-100 space-y-2 text-xs text-neutral-600">
          <div className="flex justify-between">
            <span>Items Subtotal</span>
            <Price paise={order.subtotalPaise} className="font-bold text-[#1c1c1c]" />
          </div>
          {order.discountPaise > 0 ? (
            <div className="flex justify-between text-[#0c831f] font-bold">
              <span>Coupon Discount</span>
              <span>−<Price paise={order.discountPaise} /></span>
            </div>
          ) : null}
          {order.loyaltyDiscountPaise > 0 ? (
            <div className="flex justify-between text-[#0c831f] font-bold">
              <span>Loyalty Points</span>
              <span>−<Price paise={order.loyaltyDiscountPaise} /></span>
            </div>
          ) : null}
          {order.storeCreditUsedPaise > 0 ? (
            <div className="flex justify-between text-[#0c831f] font-bold">
              <span>Store Credit</span>
              <span>−<Price paise={order.storeCreditUsedPaise} /></span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            {order.deliveryChargePaise === 0 ? (
              <span className="font-bold text-[#0c831f]">FREE</span>
            ) : (
              <Price paise={order.deliveryChargePaise} className="font-bold text-[#1c1c1c]" />
            )}
          </div>
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>Taxes (Included GST)</span>
            <Price paise={order.taxPaise} />
          </div>
          <div className="flex justify-between pt-3 border-t border-neutral-100 text-base font-black text-[#1c1c1c]">
            <span>Grand Total</span>
            <Price paise={order.grandTotalPaise} />
          </div>
          {order.savingsPaise > 0 ? (
            <div className="p-2.5 rounded-xl bg-[#e8f5e9] text-[#0c831f] text-xs font-bold text-center">
              🎉 You saved <Price paise={order.savingsPaise} /> on this FMCG order!
            </div>
          ) : null}
        </div>
      </div>

      {/* 6. Customer Delivery Address Snapshot */}
      {order.deliveryAddress ? (
        <div className="rounded-3xl bg-white border border-neutral-200/90 p-5 shadow-sm text-xs space-y-1.5">
          <h3 className="font-black text-[#1c1c1c] uppercase tracking-wider text-[11px]">
            Delivery Location
          </h3>
          <p className="font-bold text-[#1c1c1c]">{order.deliveryAddress.name}</p>
          <p className="text-neutral-500 font-medium">
            {order.deliveryAddress.line1}
            {order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ""}
            {order.deliveryAddress.city ? `, ${order.deliveryAddress.city}` : ""}
            {order.deliveryAddress.pincode ? ` - ${order.deliveryAddress.pincode}` : ""}
          </p>
          {order.deliveryAddress.phone ? (
            <p className="text-neutral-400 font-semibold">Contact: +91 {order.deliveryAddress.phone}</p>
          ) : null}
        </div>
      ) : null}

      {/* 7. Action Buttons (Cancel / Reorder) */}
      <OrderDetailClient orderId={order.id} status={order.status} />

      <div className="text-center pt-2">
        <Link href="/" className="text-xs font-bold text-[#0c831f] hover:underline cursor-pointer">
          ← Back to Shopping
        </Link>
      </div>

      {/* 8. AI Chat Modal / Floating Drawer */}
      <RiderAiChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        orderId={order.id}
        orderNumber={order.orderNumber}
        riderName={order.delivery?.assignedTo || "Ramesh Kumar"}
      />
    </div>
  );
}

export default LiveDeliveryTracker;
