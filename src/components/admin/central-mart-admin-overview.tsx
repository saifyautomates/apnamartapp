"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  ShoppingBag,
  Users,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { formatPaise } from "@/lib/money";

export interface CentralMartAdminOverviewProps {
  salesPaise?: number;
  ordersCount?: number;
  customersCount?: number;
  profitPaise?: number;
}

/**
 * Screen 9: Central Mart Admin Dashboard Overview
 * Matches Mockup Screen 9:
 * - 4 KPI Cards: Total Sales, Total Orders, Total Customers, Profit
 * - Sales Overview Line Chart with 7D / 30D / 90D toggles and ₹62,450 Today tooltip
 * - Top Products progress bars (Lay's Chips 18%, Coca-Cola 15%, Dove Shampoo 12%)
 * - Central Mart Promo Banner (Smarter Store. Happier Customers. Grow Together →)
 */
export function CentralMartAdminOverview({
  salesPaise = 12458000,
  ordersCount = 1892,
  customersCount = 12450,
  profitPaise = 4872000,
}: CentralMartAdminOverviewProps) {
  const [timeframe, setTimeframe] = useState<"7D" | "30D" | "90D">("7D");

  const chartData = {
    "7D": {
      points: "M 0 130 C 50 120, 90 90, 140 100 C 190 110, 240 60, 290 50 C 340 40, 390 100, 440 90 C 490 80, 540 60, 580 40",
      area: "M 0 130 C 50 120, 90 90, 140 100 C 190 110, 240 60, 290 50 C 340 40, 390 100, 440 90 C 490 80, 540 60, 580 40 L 580 180 L 0 180 Z",
      tooltipPos: { x: "82%", y: "22%" },
      tooltipVal: "₹62,450",
      tooltipSub: "Today",
    },
    "30D": {
      points: "M 0 140 C 60 130, 120 70, 180 85 C 240 100, 300 45, 360 40 C 420 35, 480 80, 580 25",
      area: "M 0 140 C 60 130, 120 70, 180 85 C 240 100, 300 45, 360 40 C 420 35, 480 80, 580 25 L 580 180 L 0 180 Z",
      tooltipPos: { x: "78%", y: "15%" },
      tooltipVal: "₹1,84,320",
      tooltipSub: "This Month",
    },
    "90D": {
      points: "M 0 150 C 80 140, 160 110, 240 90 C 320 70, 400 40, 480 30 C 530 25, 560 20, 580 15",
      area: "M 0 150 C 80 140, 160 110, 240 90 C 320 70, 400 40, 480 30 C 530 25, 560 20, 580 15 L 580 180 L 0 180 Z",
      tooltipPos: { x: "85%", y: "10%" },
      tooltipVal: "₹5,42,800",
      tooltipSub: "Quarter",
    },
  };

  const currentChart = chartData[timeframe];

  return (
    <div className="space-y-6">
      {/* Page Title matching Mockup Screen 9 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-black text-[#1c1c1c] tracking-tight">
          Dashboard
        </h2>
      </div>

      {/* 4 KPI Cards matching Mockup Screen 9 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Sales */}
        <div className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-xs flex items-center justify-between gap-4 hover:shadow-md transition">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-neutral-500">Total Sales</span>
            <div className="text-2xl sm:text-3xl font-black text-[#1c1c1c] tracking-tight">
              {salesPaise === 12458000 ? "₹1,24,580" : formatPaise(salesPaise)}
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-[#16a34a]">
              <span>↑</span>
              <span>+12%</span>
            </div>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#ecfdf5] text-[#059669] shadow-xs">
            <ShoppingCart className="w-7 h-7 stroke-[2.2]" />
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-xs flex items-center justify-between gap-4 hover:shadow-md transition">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-neutral-500">Total Orders</span>
            <div className="text-2xl sm:text-3xl font-black text-[#1c1c1c] tracking-tight">
              {ordersCount.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-[#16a34a]">
              <span>↑</span>
              <span>+8%</span>
            </div>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb] shadow-xs">
            <ShoppingBag className="w-7 h-7 stroke-[2.2]" />
          </div>
        </div>

        {/* KPI 3: Total Customers */}
        <div className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-xs flex items-center justify-between gap-4 hover:shadow-md transition">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-neutral-500">Total Customers</span>
            <div className="text-2xl sm:text-3xl font-black text-[#1c1c1c] tracking-tight">
              {customersCount.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-[#16a34a]">
              <span>↑</span>
              <span>+10%</span>
            </div>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#faf5ff] text-[#9333ea] shadow-xs">
            <Users className="w-7 h-7 stroke-[2.2]" />
          </div>
        </div>

        {/* KPI 4: Profit */}
        <div className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-xs flex items-center justify-between gap-4 hover:shadow-md transition">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-neutral-500">Profit</span>
            <div className="text-2xl sm:text-3xl font-black text-[#1c1c1c] tracking-tight">
              {profitPaise === 4872000 ? "₹48,720" : formatPaise(profitPaise)}
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-[#16a34a]">
              <span>↑</span>
              <span>+14%</span>
            </div>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fffbeb] text-[#d97706] shadow-xs">
            <Wallet className="w-7 h-7 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* Main Section: Sales Overview Chart (Left) + Top Products & Promo (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Sales Overview Line Chart (lg:col-span-8) */}
        <div className="lg:col-span-8 rounded-3xl border border-neutral-100 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-[#1c1c1c] tracking-tight">
              Sales Overview
            </h3>

            {/* Timeframe Filter Pills: 7D | 30D | 90D */}
            <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 p-1">
              {(["7D", "30D", "90D"] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`rounded-lg px-3 py-1 text-xs font-black transition cursor-pointer ${
                    timeframe === tf
                      ? "bg-white text-[#0c831f] shadow-xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Line Chart with Y-Axis */}
          <div className="relative pt-2">
            <div className="flex gap-3">
              {/* Y-Axis Labels */}
              <div className="flex flex-col justify-between text-[11px] font-semibold text-neutral-400 py-1 h-44 text-right pr-1 select-none">
                <span>75k</span>
                <span>50k</span>
                <span>25k</span>
                <span>0k</span>
              </div>

              {/* Chart SVG Canvas */}
              <div className="relative flex-1 h-44">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 580 180"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="centralMartSalesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Lines */}
                  <line x1="0" y1="10" x2="580" y2="10" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="65" x2="580" y2="65" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="120" x2="580" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="175" x2="580" y2="175" stroke="#e2e8f0" strokeWidth="1" />

                  {/* Filled Area */}
                  <path
                    d={currentChart.area}
                    fill="url(#centralMartSalesGrad)"
                    className="transition-all duration-300"
                  />

                  {/* Smooth Green Curve */}
                  <path
                    d={currentChart.points}
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />

                  {/* Active Data Point */}
                  <circle
                    cx="480"
                    cy="65"
                    r="5"
                    fill="#16a34a"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="shadow-md"
                  />
                </svg>

                {/* Floating Tooltip matching Screen 9: ₹62,450 Today */}
                <div
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-full mb-2 rounded-2xl bg-white border border-neutral-100 shadow-xl px-3.5 py-1.5 text-center animate-in fade-in duration-200"
                  style={{ left: currentChart.tooltipPos.x, top: currentChart.tooltipPos.y }}
                >
                  <div className="text-xs sm:text-sm font-black text-[#1c1c1c] leading-tight">
                    {currentChart.tooltipVal}
                  </div>
                  <div className="text-[10px] font-bold text-neutral-400">
                    {currentChart.tooltipSub}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-4): Top Products & Central Mart Promo Banner */}
        <div className="lg:col-span-4 space-y-4">
          {/* Top Products Card */}
          <div className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-xs space-y-3.5">
            <h3 className="text-base font-black text-[#1c1c1c] tracking-tight">
              Top Products
            </h3>

            <div className="space-y-3">
              {/* Product 1: Lay's Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="relative h-6 w-6 rounded-md overflow-hidden bg-neutral-50 shrink-0">
                      <Image
                        src="/images/products/lays-classic-salted-potato-chips.jpg"
                        alt="Lay's"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="font-bold text-[#1c1c1c]">Lay&apos;s Chips</span>
                  </div>
                  <span className="font-black text-[#1c1c1c]">18%</span>
                </div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#16a34a] rounded-full" style={{ width: "18%" }} />
                </div>
              </div>

              {/* Product 2: Coca-Cola */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="relative h-6 w-6 rounded-md overflow-hidden bg-neutral-50 shrink-0">
                      <Image
                        src="/images/products/coca-cola-original-soft-drink.jpg"
                        alt="Coca-Cola"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="font-bold text-[#1c1c1c]">Coca-Cola</span>
                  </div>
                  <span className="font-black text-[#1c1c1c]">15%</span>
                </div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#16a34a] rounded-full" style={{ width: "15%" }} />
                </div>
              </div>

              {/* Product 3: Dove Shampoo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="relative h-6 w-6 rounded-md overflow-hidden bg-neutral-50 shrink-0">
                      <Image
                        src="/images/products/dove-cream-beauty-bathing-bar.jpg"
                        alt="Dove"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="font-bold text-[#1c1c1c]">Dove Shampoo</span>
                  </div>
                  <span className="font-black text-[#1c1c1c]">12%</span>
                </div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#16a34a] rounded-full" style={{ width: "12%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Central Mart Promo Card matching Screen 9 */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#032e16] via-[#063b1e] to-[#011c0c] p-5 text-white shadow-lg border border-emerald-900/50">
            {/* Speed cart illustration top right */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col gap-0.5 items-end">
                  <span className="h-0.5 w-4 bg-[#a3e635] rounded-full" />
                  <span className="h-0.5 w-2.5 bg-[#a3e635] rounded-full" />
                  <span className="h-0.5 w-3 bg-[#a3e635] rounded-full" />
                </div>
                <ShoppingCart className="w-6 h-6 text-[#a3e635] stroke-[2.4]" />
                <span className="font-black text-sm text-white tracking-tight ml-1">
                  Central Mart
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <h4 className="text-base sm:text-lg font-black leading-tight text-white">
                Smarter Store.
              </h4>
              <p className="text-xs sm:text-sm font-bold text-emerald-200">
                Happier Customers.
              </p>
            </div>

            <div className="mt-4">
              <Link
                href="/admin/products"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#a3e635] hover:bg-[#86efac] text-[#032e16] px-4 py-2 text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
              >
                <span>Grow Together</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CentralMartAdminOverview;

