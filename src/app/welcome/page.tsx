import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to Central Mart | Groceries & FMCG at Your Doorstep",
  description: "Shop 100% authentic groceries, snacks, personal care, and staples delivered in 12-15 minutes across Kota.",
};

/**
 * Screen 1: Splash / Onboarding Screen
 * Matches Mockup Screen 1:
 * - Emerald Green Gradient
 * - Lime Speed-Cart Emblem
 * - Central Mart Wordmark & Tagline
 * - Grocery Packshot Basket
 * - Get Started → Button
 */
export default function WelcomePage() {
  return (
    <div className="relative min-h-[92vh] sm:min-h-screen flex flex-col justify-between overflow-hidden rounded-3xl sm:rounded-none bg-gradient-to-b from-[#032812] via-[#063b1e] to-[#02180b] text-white px-6 py-8 sm:py-12 select-none shadow-2xl">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#a3e635]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-[#16a34a]/20 blur-3xl pointer-events-none" />

      {/* Top Header / Status Row */}
      <div className="relative z-10 flex items-center justify-between text-xs text-emerald-200/80 font-bold">
        <span>Kota, Rajasthan</span>
        <span className="flex items-center gap-1 text-[#a3e635]">
          <span className="h-2 w-2 rounded-full bg-[#a3e635] animate-ping" />
          <span>12-15 Min Delivery</span>
        </span>
      </div>

      {/* Center Branding & FMCG Showcase */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto space-y-6">
        {/* Speed Cart Emblem */}
        <div className="flex items-center justify-center gap-1.5">
          <div className="flex flex-col gap-1 items-end">
            <span className="h-1 w-6 bg-[#a3e635] rounded-full" />
            <span className="h-1 w-4 bg-[#a3e635] rounded-full" />
            <span className="h-1 w-5 bg-[#a3e635] rounded-full" />
          </div>
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-[#a3e635] text-[#032812] shadow-lg shadow-lime-400/20">
            <ShoppingCart className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.4]" />
          </div>
        </div>

        {/* Wordmark */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Central Mart
          </h1>
          <p className="mt-2 text-sm sm:text-base font-semibold text-emerald-200/90 max-w-xs">
            Groceries &amp; FMCG <br />
            at Your Doorstep
          </p>
        </div>

        {/* FMCG Product Showcase Basket */}
        <div className="relative w-72 h-64 sm:w-88 sm:h-72 mt-2 flex items-center justify-center">
          {/* Basket Backdrop Card */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Left Product: Lay's */}
            <div className="absolute left-2 bottom-6 h-28 w-24 sm:h-36 sm:w-28 rounded-2xl bg-white/10 backdrop-blur-md p-1 shadow-2xl -rotate-12 border border-white/15">
              <Image
                src="/images/products/lays-classic-salted-potato-chips.jpg"
                alt="Lay's FMCG"
                fill
                className="object-contain p-1.5"
                unoptimized
              />
            </div>

            {/* Center Product: Coca-Cola */}
            <div className="relative z-10 h-36 w-28 sm:h-44 sm:w-32 rounded-2xl bg-white/15 backdrop-blur-md p-1.5 shadow-2xl border border-white/20">
              <Image
                src="/images/products/coca-cola-original-soft-drink.jpg"
                alt="Coca-Cola FMCG"
                fill
                className="object-contain p-2"
                unoptimized
              />
            </div>

            {/* Right Product: Dove & Tide */}
            <div className="absolute right-2 bottom-6 h-28 w-24 sm:h-36 sm:w-28 rounded-2xl bg-white/10 backdrop-blur-md p-1 shadow-2xl rotate-12 border border-white/15">
              <Image
                src="/images/products/dove-cream-beauty-bathing-bar.jpg"
                alt="Dove FMCG"
                fill
                className="object-contain p-1.5"
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action CTA: Get Started → */}
      <div className="relative z-10 pt-4 max-w-md mx-auto w-full">
        <Link
          href="/"
          className="group w-full flex items-center justify-center gap-2 rounded-full bg-white text-[#042812] hover:bg-neutral-100 py-3.5 px-6 text-sm sm:text-base font-black shadow-xl transition active:scale-98 cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
        </Link>
        <p className="mt-3 text-center text-[11px] text-emerald-300/70 font-medium">
          Smart Shopping. Better Living. · Kota, Rajasthan
        </p>
      </div>
    </div>
  );
}

