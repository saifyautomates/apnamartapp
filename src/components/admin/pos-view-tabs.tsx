"use client";

import { useState } from "react";
import { PosScannerBilling } from "./pos-scanner-billing";
import { BusyPosTerminal } from "./busy-pos-terminal";
import type { BusyPosConfig, BusyPosMetrics } from "@/lib/busy-pos";

export function PosViewTabs({
  initialConfig,
  initialMetrics,
}: {
  initialConfig: BusyPosConfig;
  initialMetrics: BusyPosMetrics;
}) {
  const [activeTab, setActiveTab] = useState<"BILLING" | "TERMINALS">("BILLING");

  return (
    <div className="space-y-6">
      {/* Tab Switcher Pills (Desktop only to keep mobile POS 100% focused) */}
      <div className="hidden lg:flex items-center gap-3 border-b border-neutral-200 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("BILLING")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition active:scale-95 cursor-pointer shadow-xs ${
            activeTab === "BILLING"
              ? "bg-[#052b14] text-[#86efac] border border-emerald-800 shadow-md scale-[1.02]"
              : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          <span className="text-base">🛒</span>
          <span>Offline &amp; Barcode Scanner Billing</span>
          <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-ping" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TERMINALS")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition active:scale-95 cursor-pointer shadow-xs ${
            activeTab === "TERMINALS"
              ? "bg-[#052b14] text-[#86efac] border border-emerald-800 shadow-md scale-[1.02]"
              : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          <span className="text-base">🖥️</span>
          <span>BUSY POS Terminal Hub &amp; Bridge Settings</span>
          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px]">
            Sync Active
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "BILLING" ? (
        <PosScannerBilling />
      ) : (
        <BusyPosTerminal initialConfig={initialConfig} initialMetrics={initialMetrics} />
      )}
    </div>
  );
}

