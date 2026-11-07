"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchInput } from "./search-input";
import { LocationModal } from "./location-modal";
import { CartHeaderButton } from "./cart-button";
import { CentralMartLogo } from "@/components/ui/logo";
import { useDelivery } from "@/lib/delivery-context";
import { openLoginModal } from "@/components/auth/login-modal";
import { openCategoriesModal } from "@/components/category/category-drawer";
import { openSearchModal } from "@/components/search/search-modal";

export interface HeaderProps {
  storeName?: string;
  initialCount?: number;
  initialTotal?: number;
  customerName?: string | null;
  isLoggedIn?: boolean;
}

export function BlinkitHeader({
  initialCount = 0,
  initialTotal = 0,
  customerName = null,
  isLoggedIn = false,
}: HeaderProps) {
  const [count, setCount] = useState(initialCount);
  const [total, setTotal] = useState(initialTotal);
  const [locationOpen, setLocationOpen] = useState(false);

  const { deliveryPromiseText, activeLocation, setActiveLocation, zones } = useDelivery();

  const refreshCart = async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setCount(json.data.count ?? 0);
          setTotal(json.data.subtotalPaise ?? 0);
        }
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    window.addEventListener("cart-updated", refreshCart);
    return () => window.removeEventListener("cart-updated", refreshCart);
  }, []);

  const openCart = () => {
    window.dispatchEvent(new Event("open-cart"));
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-xs">
        {/* Mobile Header Top Row (< sm) - Matches Screen 1 Mockup */}
        <div className="flex sm:hidden items-center justify-between px-3.5 pt-2.5 pb-1">
          {/* Hamburger Menu on Left */}
          <button
            onClick={openCategoriesModal}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#f8faf8] border border-neutral-200/80 text-neutral-800 hover:bg-[#e8f5e9] transition cursor-pointer active:scale-90"
            aria-label="Open categories menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Central Mart Logo */}
          <CentralMartLogo size="sm" />

          {/* Right Action: Notifications & Account */}
          <div className="flex items-center gap-1.5">
            {isLoggedIn ? (
              <Link
                href="/account"
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#e8f5e9] text-[#0c831f] font-black text-xs border border-[#0c831f]/20 active:scale-95 transition"
              >
                {customerName ? customerName[0].toUpperCase() : "U"}
              </Link>
            ) : (
              <button
                onClick={openLoginModal}
                className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-[#f8faf8] border border-neutral-200/80 text-neutral-700 hover:text-[#0c831f] transition cursor-pointer active:scale-90"
                aria-label="Account Login & Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
            )}

            <button
              onClick={openCart}
              className="relative flex h-9 px-2.5 items-center gap-1.5 rounded-2xl bg-[#0c831f] text-white font-black text-xs shadow-xs active:scale-90 transition cursor-pointer"
            >
              <span>🛒</span>
              <span>{count}</span>
            </button>
          </div>
        </div>

        {/* Deliver to Home Location Bar (< sm) - Matches Screen 1 Mockup */}
        <div className="flex sm:hidden items-center justify-between px-3.5 py-1">
          <button
            onClick={() => setLocationOpen(true)}
            className="flex items-center gap-1.5 text-left group transition min-w-0 flex-1 cursor-pointer"
          >
            <span className="text-sm text-[#0c831f] shrink-0">📍</span>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1 text-xs font-black text-[#1c1c1c]">
                <span>Deliver to Home</span>
                <span className="text-[10px] text-neutral-400">▾</span>
              </div>
              <p className="text-[11px] text-neutral-500 font-semibold truncate max-w-[220px]">
                {activeLocation.address || activeLocation.zoneName || "Kota Central, Nayapura - 324001"}
              </p>
            </div>
          </button>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#0c831f] bg-[#e8f5e9] px-2 py-0.5 rounded-full border border-[#0c831f]/20 shrink-0">
            ⚡ {deliveryPromiseText || "12-15 MINS"}
          </span>
        </div>

        {/* Mobile Search Bar (< sm) */}
        <div className="sm:hidden px-3.5 pb-2.5 pt-0.5 space-y-1.5">
          <SearchInput />

          {/* Horizontal Quick-Access Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-touch">
            {[
              { label: "🔥 Deals", query: "deals" },
              { label: "🥛 Dairy", query: "milk dairy" },
              { label: "🍞 Bread", query: "bread pav" },
              { label: "🍪 Snacks", query: "snacks chips" },
              { label: "🥤 Drinks", query: "drinks juice cold drink" },
              { label: "🌾 Atta & Dal", query: "atta dal rice" },
              { label: "🧼 Cleaning", query: "surf detergent cleaning" },
              { label: "🧴 Personal Care", query: "soap shampoo toothpaste" },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => openSearchModal(chip.query)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-[#e8f5e9] hover:text-[#0c831f] text-neutral-700 text-[11px] font-bold border border-neutral-200/60 active:scale-95 transition cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Header Row (>= sm) */}
        <div className="hidden sm:flex mx-auto max-w-7xl items-center justify-between gap-3 px-6 py-3">
          {/* Logo & Location */}
          <div className="flex items-center gap-7">
            <CentralMartLogo showBadge />

            <button
              onClick={() => setLocationOpen(true)}
              className="flex flex-col text-left group transition max-w-[240px] cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-sm font-black text-[#1c1c1c] leading-tight">
                <span>⚡ {deliveryPromiseText}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium truncate mt-0.5 group-hover:text-[#0c831f]">
                <span className="truncate">{activeLocation.address || activeLocation.zoneName || "Select Location"}</span>
                <span className="text-[9px]">▾</span>
              </div>
            </button>
          </div>

          {/* Desktop Search Bar */}
          <div className="flex-1 max-w-2xl mx-4">
            <SearchInput />
          </div>

          {/* Desktop Actions */}
          <div className="flex items-center gap-4 md:gap-5">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-xl border border-neutral-200/90 bg-neutral-50 hover:bg-[#0c831f] hover:text-white hover:border-[#0c831f] px-3 py-2 text-xs font-black text-neutral-800 transition shadow-xs group"
              title="Central Mart Store Admin Panel"
            >
              <span className="text-sm group-hover:rotate-45 transition-transform">⚙️</span>
              <span className="hidden md:inline font-bold">Admin</span>
            </Link>

            {isLoggedIn ? (
              <Link
                href="/account"
                className="flex items-center gap-1.5 text-sm font-bold text-[#2c2c2c] hover:text-[#0c831f] px-2 py-1.5 rounded-lg transition"
              >
                <span className="h-7 w-7 rounded-full bg-[#e8f5e9] text-[#0c831f] flex items-center justify-center font-black text-xs">
                  {customerName ? customerName[0].toUpperCase() : "U"}
                </span>
                <span className="max-w-[90px] truncate">{customerName ?? "Account"}</span>
              </Link>
            ) : (
              <button
                onClick={openLoginModal}
                className="inline-block text-base font-semibold text-[#2c2c2c] hover:text-[#0c831f] px-2 py-1 rounded-lg hover:bg-neutral-50 transition cursor-pointer active:scale-95"
              >
                Login
              </button>
            )}

            <CartHeaderButton count={count} total={total} onClick={openCart} />
          </div>
        </div>
      </header>

      {/* Location Selector Dialog Modal */}
      <LocationModal
        isOpen={locationOpen}
        onClose={() => setLocationOpen(false)}
      />
    </>
  );
}

export default BlinkitHeader;
