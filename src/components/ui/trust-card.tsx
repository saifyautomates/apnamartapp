"use client";

import React from "react";
import { Zap, ShieldCheck, Tag, RotateCcw } from "lucide-react";

export interface TrustCardProps {
  className?: string;
}

/**
 * Exact 4-badge Central Mart Trust Card matching the user's design image:
 * - 12-15 Min Delivery (Hyperlocal in Kota)
 * - 100% Genuine (Direct FMCG Brands)
 * - Best Wholesale Rates (Up to 35% Savings)
 * - Instant Refunds (No Questions Asked)
 */
export function CentralMartTrustCard({ className = "" }: TrustCardProps) {
  return (
    <div
      className={`rounded-3xl border border-neutral-100 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-sm ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
        {/* Left Column (Items 1 & 3) */}
        <div className="space-y-4 pb-4 sm:pb-0 sm:pr-5">
          {/* Item 1: 12-15 Min Delivery */}
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ecfdf5] text-[#059669] shadow-xs">
              <Zap className="w-6 h-6 fill-[#059669] text-[#059669]" />
            </span>
            <div className="leading-snug">
              <h4 className="text-sm sm:text-base font-extrabold text-[#1c1c1c] tracking-tight">
                12-15 Min Delivery
              </h4>
              <p className="text-xs sm:text-sm font-medium text-neutral-400">
                Hyperlocal in Kota
              </p>
            </div>
          </div>

          {/* Item 3: Best Wholesale Rates */}
          <div className="flex items-center gap-3.5 pt-1">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fffbeb] text-[#d97706] shadow-xs">
              <Tag className="w-6 h-6 stroke-[2.4]" />
            </span>
            <div className="leading-snug">
              <h4 className="text-sm sm:text-base font-extrabold text-[#1c1c1c] tracking-tight">
                Best Wholesale Rates
              </h4>
              <p className="text-xs sm:text-sm font-medium text-neutral-400">
                Up to 35% Savings
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (Items 2 & 4) */}
        <div className="space-y-4 pt-4 sm:pt-0 sm:pl-5">
          {/* Item 2: 100% Genuine */}
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb] shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.4]" />
            </span>
            <div className="leading-snug">
              <h4 className="text-sm sm:text-base font-extrabold text-[#1c1c1c] tracking-tight">
                100% Genuine
              </h4>
              <p className="text-xs sm:text-sm font-medium text-neutral-400">
                Direct FMCG Brands
              </p>
            </div>
          </div>

          {/* Item 4: Instant Refunds */}
          <div className="flex items-center gap-3.5 pt-1">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f2] text-[#f43f5e] shadow-xs">
              <RotateCcw className="w-6 h-6 stroke-[2.4]" />
            </span>
            <div className="leading-snug">
              <h4 className="text-sm sm:text-base font-extrabold text-[#1c1c1c] tracking-tight">
                Instant Refunds
              </h4>
              <p className="text-xs sm:text-sm font-medium text-neutral-400">
                No Questions Asked
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CentralMartTrustCard;

