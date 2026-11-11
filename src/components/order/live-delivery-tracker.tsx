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
  const prevStatusRef = useRef(initialOrder.status);

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

      {/* 0. Live Status Simulator Bar (Virtual Code Style Demo Controls) */}
      <div className="bg-neutral-900 text-white rounded-2xl p-3 shadow-md border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#f8cb46] animate-ping" />
          <span className="text-xs font-black text-neutral-300 uppercase tracking-wider">
            Live Order Simulator:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
          {STEPS.map((step) => (
            <button
              key={step.key}
              onClick={() => handleSimulateStatus(step.key)}
              disabled={isSimulating}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition cursor-pointer border ${
                order.status === step.key
                  ? "bg-[#0c831f] text-white border-emerald-400 shadow-xs ring-2 ring-emerald-500/30"
                  : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700"
              }`}
            >
              {step.icon} {step.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Main Live Delivery ETA & Status Card */}
      <div className="overflow-hidden rounded-3xl bg-white border border-neutral-200/90 shadow-md">
        {/* Top Header with Glowing Delivery Dial */}
        <div className="bg-gradient-to-r from-[#0c831f] via-[#107d22] to-[#15803d] p-5 sm:p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                <span className="h-2 w-2 rounded-full bg-[#f8cb46] animate-ping" />
                Live Dispatch &amp; Delivery Tracking
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isDelivered
                  ? "Order Delivered! 🎉"
                  : isCancelled
                  ? "Order Cancelled"
                  : isOutForDelivery
                  ? "Rider on the way 🛵"
                  : "Same-Day Delivery in Progress ⚡"}
              </h1>
              <p className="mt-1 text-xs text-emerald-100 font-medium" suppressHydrationWarning>
                Order #{order.orderNumber} · Placed{" "}
                {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Circular Timer Pill */}
            {!isDelivered && !isCancelled ? (
              <div className="flex flex-col items-center justify-center h-20 w-20 rounded-2xl bg-white text-[#1c1c1c] shadow-lg shrink-0 p-2 border-2 border-white/40" suppressHydrationWarning>
                <span className="text-[10px] font-black uppercase text-[#0c831f] tracking-wider">
                  ETA
                </span>
                <span className="text-xl font-black font-mono tracking-tight text-[#1c1c1c]">
                  {formatCountdown(countdown)}
                </span>
                <span className="text-[9px] font-bold text-neutral-400">mins left</span>
              </div>
            ) : isDelivered ? (
              <div className="flex flex-col items-center justify-center h-20 w-20 rounded-2xl bg-white text-[#0c831f] shadow-lg shrink-0 p-2">
                <span className="text-2xl">✅</span>
                <span className="text-[10px] font-black uppercase tracking-wider mt-1">Delivered</span>
              </div>
            ) : null}
          </div>

          {/* Linear Progress Bar */}
          {!isCancelled ? (
            <div className="mt-5">
              <div className="flex justify-between text-[11px] font-bold text-emerald-100 mb-1.5">
                <span>{STEPS[currentStepIndex].label}</span>
                <span>{progressPct}% Completed</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/25">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#f8cb46] to-emerald-300 transition-all duration-700 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* 2. Interactive GPS Delivery Route Map (Leaflet Map with View Toggle) */}
        {!isCancelled && (
          <div className="relative bg-[#f4f7f6] p-4 sm:p-5 border-b border-neutral-200/80">
            {/* Map Mode Switcher Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#1c1c1c]">
                <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
                <span>Live Route Tracking Radar</span>
              </div>
              <div className="flex gap-1 bg-neutral-200/80 p-0.5 rounded-xl text-[10px] font-black">
                <button
                  type="button"
                  onClick={() => setMapMode("gps")}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    mapMode === "gps"
                      ? "bg-white text-emerald-800 shadow-xs"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  🗺️ Live GPS Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode("schematic")}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    mapMode === "schematic"
                      ? "bg-white text-emerald-800 shadow-xs"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  ⚡ Schematic Radar
                </button>
              </div>
            </div>

            {mapMode === "gps" ? (
              <LiveMapTracker
                orderStatus={order.status}
                deliveryAddress={order.deliveryAddress}
                progressPct={progressPct}
                countdown={countdown}
              />
            ) : (
              <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden bg-[#eef3f1] border border-neutral-300/70 shadow-inner">
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

                  <rect x="20" y="20" width="70" height="45" rx="6" fill="#dfe7e2" opacity="0.7" />
                  <rect x="110" y="15" width="85" height="50" rx="6" fill="#dfe7e2" opacity="0.7" />
                  <rect x="220" y="25" width="110" height="40" rx="6" fill="#dfe7e2" opacity="0.7" />
                  <rect x="350" y="15" width="100" height="50" rx="6" fill="#dfe7e2" opacity="0.7" />

                  <rect x="30" y="145" width="80" height="40" rx="6" fill="#dfe7e2" opacity="0.7" />
                  <rect x="130" y="140" width="90" height="45" rx="6" fill="#dfe7e2" opacity="0.7" />
                  <rect x="240" y="145" width="95" height="40" rx="6" fill="#dfe7e2" opacity="0.7" />
                  <rect x="360" y="135" width="85" height="50" rx="6" fill="#dfe7e2" opacity="0.7" />

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
                    <circle r="18" fill="#0c831f" opacity="0.2" className="animate-ping" />
                    <circle r="14" fill="#0c831f" stroke="#ffffff" strokeWidth="3" />
                    <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
                      🏪
                    </text>
                  </g>

                  <g transform="translate(420, 140)">
                    <circle r="18" fill="#ef4444" opacity="0.2" className="animate-ping" />
                    <circle r="14" fill="#ef4444" stroke="#ffffff" strokeWidth="3" />
                    <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
                      📍
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

                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-200/90 shadow-sm flex items-center gap-1.5 text-xs font-black text-[#1c1c1c]">
                  <span className="text-emerald-600">●</span>
                  <span>Central Mart Dark Store (80 Feet Rd)</span>
                </div>

                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-200/90 shadow-sm flex items-center gap-1.5 text-xs font-black text-[#1c1c1c]">
                  <span>🏠</span>
                  <span className="max-w-[140px] truncate">
                    {order.deliveryAddress?.line1 ?? "Delivery Address"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Delivery Partner Profile Card with AI Chat & Call */}
        {!isCancelled && !isDelivered && (
          <div className="p-5 border-b border-neutral-100 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="h-13 w-13 rounded-2xl bg-gradient-to-tr from-[#0c831f] to-[#16a34a] flex items-center justify-center text-white text-xl font-black shadow-md ring-2 ring-emerald-500/20">
                    👨‍🦱
                  </div>
                  <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">
                    ✓
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-[#1c1c1c]">
                      {order.delivery?.assignedTo || "Ramesh Kumar"}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-black text-amber-700 border border-amber-200/60">
                      ⭐ 4.9
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-semibold mt-0.5">
                    Central Mart Express Rider · Ather 450X (RJ-20-CM-8821)
                  </p>
                  <p className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                    <span>🛡️</span> 100% Vaccinated · Temperature 98.2°F · Thermal Cooler Bag
                  </p>
                </div>
              </div>

              {/* Action Buttons: Chat with Rider & Call Rider */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0c831f] to-[#16a34a] hover:from-[#0a701a] hover:to-[#15803d] text-white px-3.5 py-2.5 text-xs font-black shadow-md transition active:scale-95 cursor-pointer shrink-0"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat with Rider</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f8cb46] animate-ping" />
                </button>

                <a
                  href="tel:+919876543210"
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3.5 py-2.5 text-xs font-black transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              </div>
            </div>

            {/* Quick Delivery Instructions Chips */}
            <div className="mt-4 pt-3 border-t border-neutral-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-2">
                Quick Rider Instructions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "🔔 Ring the bell",
                  "🚪 Leave at door",
                  "📞 Call upon arrival",
                  "🛡️ Leave with security",
                  "💬 Ask via AI Chat",
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      if (chip === "💬 Ask via AI Chat") {
                        setIsChatOpen(true);
                      } else {
                        setActiveDeliveryNote(chip);
                        setNoteSent(true);
                        setTimeout(() => setNoteSent(false), 3000);
                      }
                    }}
                    className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer border ${
                      activeDeliveryNote === chip
                        ? "bg-[#0c831f] text-white border-[#0c831f]"
                        : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200"
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              {noteSent ? (
                <p className="mt-1.5 text-[11px] font-bold text-[#0c831f] animate-fade-in">
                  ✓ Instruction shared with rider!
                </p>
              ) : null}
            </div>
          </div>
        )}

        {/* 4. Live Vertical Stepper */}
        {!isCancelled ? (
          <div className="p-5 sm:p-6 bg-white">
            <h3 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider mb-4">
              Order Milestones
            </h3>
            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const isPassed = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step.key} className="flex items-start gap-3.5">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black transition-all ${
                          isCurrent
                            ? "bg-[#0c831f] text-white ring-4 ring-[#e8f5e9] shadow-md scale-110"
                            : isPassed
                            ? "bg-[#0c831f] text-white shadow-xs"
                            : "bg-neutral-100 text-neutral-400"
                        }`}
                      >
                        {step.icon}
                      </div>
                      {i < STEPS.length - 1 ? (
                        <div
                          className={`w-0.5 h-6 my-1 transition-colors ${
                            i < currentStepIndex ? "bg-[#0c831f]" : "bg-neutral-200"
                          }`}
                        />
                      ) : null}
                    </div>

                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs ${
                            isPassed ? "font-black text-[#1c1c1c]" : "font-semibold text-neutral-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent ? (
                          <span className="text-[10px] font-black text-[#0c831f] bg-[#e8f5e9] px-2 py-0.5 rounded-full border border-[#0c831f]/20 animate-pulse">
                            In Progress
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-neutral-400 font-medium">{step.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-red-50 text-red-700 text-xs font-bold text-center">
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
