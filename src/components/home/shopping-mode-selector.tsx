"use client";

import React from "react";
import Link from "next/link";
import { useDelivery, type ShoppingMode } from "@/lib/delivery-context";
import { Bike, ShoppingBag, Store, Sparkles, QrCode, Clock, MapPin, CheckCircle2, ChevronRight } from "lucide-react";

export function ShoppingModeSelector() {
  const { shoppingMode, setShoppingMode, activeLocation } = useDelivery();

  const modes: Array<{
    id: ShoppingMode;
    label: string;
    sublabel: string;
    badge?: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "DELIVERY",
      label: "Home Delivery",
      sublabel: "15–30 Mins",
      badge: "Express",
      icon: <Bike className="w-4 h-4 stroke-[2.4]" />,
    },
    {
      id: "PICKUP",
      label: "Store Pickup",
      sublabel: "Ready in 15m",
      badge: "Zero Fee",
      icon: <ShoppingBag className="w-4 h-4 stroke-[2.4]" />,
    },
    {
      id: "IN_STORE",
      label: "In-Store Mode",
      sublabel: "Scan & Go",
      badge: "Self-Check",
      icon: <Store className="w-4 h-4 stroke-[2.4]" />,
    },
  ];

  return (
    <div className="space-y-2.5">
      {/* 3-Pill Interactive Mode Selector */}
      <div
        role="tablist"
        aria-label="Shopping Mode Selection"
        className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1 bg-neutral-100/90 rounded-2xl border border-neutral-200/70"
      >
        {modes.map((m) => {
          const isActive = shoppingMode === m.id;
          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setShoppingMode(m.id)}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 rounded-xl transition-all duration-200 cursor-pointer text-center select-none ${
                isActive
                  ? "bg-white text-[#064221] shadow-sm font-black ring-1 ring-black/5"
                  : "text-neutral-600 hover:text-neutral-900 font-bold hover:bg-white/60"
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  isActive ? "bg-emerald-100/80 text-[#0c831f]" : "text-neutral-500"
                }`}
              >
                {m.icon}
              </div>
              <div className="text-left leading-tight">
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm font-black truncate">{m.label}</span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-neutral-500 font-semibold block">
                  {m.sublabel}
                </span>
              </div>
              {m.badge && (
                <span
                  className={`hidden sm:inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ml-auto ${
                    isActive
                      ? "bg-emerald-700 text-white"
                      : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {m.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Context Card based on active Shopping Mode */}
      {shoppingMode === "DELIVERY" && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-neutral-700">
          <div className="flex items-center gap-2 truncate">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0c831f] text-white text-[10px] shrink-0">
              ⚡
            </span>
            <span className="font-bold text-[#1c1c1c] truncate">
              Express 15–30 Min Delivery to{" "}
              <span className="text-[#0c831f] underline font-extrabold">
                {activeLocation.address || activeLocation.zoneName || "Kota Central"}
              </span>
            </span>
          </div>
          <span className="text-[11px] font-black text-[#0c831f] shrink-0 ml-2 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
            FREE on ₹499+
          </span>
        </div>
      )}

      {shoppingMode === "PICKUP" && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-xs text-neutral-800">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="truncate">
              <span className="font-black text-neutral-900">Central Mart Hub (80 Feet Road, Kota)</span>
              <span className="text-[11px] text-neutral-600 block">
                Open 7:00 AM – 11:00 PM · Ready for pickup in 15 mins
              </span>
            </div>
          </div>
          <span className="text-[11px] font-black text-amber-900 bg-amber-200/80 px-2 py-1 rounded-lg shrink-0 ml-2">
            ₹0 Fee
          </span>
        </div>
      )}

      {shoppingMode === "IN_STORE" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-emerald-900 via-[#064221] to-[#042c16] text-white shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg shrink-0">
              🏬
            </div>
            <div>
              <p className="text-xs font-black text-white flex items-center gap-1.5">
                <span>In-Store Shopping Mode Active</span>
                <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
              </p>
              <p className="text-[11px] text-emerald-200 font-medium">
                At 80 Feet Road Supermarket. Scan shelf barcodes for instant cart &amp; queue-free checkout!
              </p>
            </div>
          </div>
          <Link
            href="/scan"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-neutral-950 px-4 py-2 text-xs font-black shadow-md active:scale-95 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <QrCode className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Open Barcode Scanner</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default ShoppingModeSelector;

