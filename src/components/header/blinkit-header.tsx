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
import { MapPin, Zap, Settings, ChevronDown, Smartphone } from "lucide-react";

export interface HeaderProps {
  storeName?: string;
  logoUrl?: string;
  initialCount?: number;
  initialTotal?: number;
  customerName?: string | null;
  isLoggedIn?: boolean;
}

export function BlinkitHeader({
  storeName,
  logoUrl,
  initialCount = 0,
  initialTotal = 0,
  customerName = null,
  isLoggedIn = false,
}: HeaderProps) {
  const [count, setCount] = useState(initialCount);
  const [total, setTotal] = useState(initialTotal);
  const [locationOpen, setLocationOpen] = useState(false);

  const { deliveryPromiseText, activeLocation, setActiveLocation, zones } = useDelivery();

  const refreshCart = async (e?: Event) => {
    const detail = (e as CustomEvent)?.detail;
    if (detail && typeof detail.count === "number") {
      setCount(detail.count);
      if (typeof detail.subtotalPaise === "number") setTotal(detail.subtotalPaise);
      return;
    }
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
    refreshCart();
    window.addEventListener("cart-updated", refreshCart);
    return () => window.removeEventListener("cart-updated", refreshCart);
  }, []);

  const openCart = () => {
    window.dispatchEvent(new Event("open-cart"));
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-gradient-to-b from-[#032e16] via-[#063b1e] to-[#074724] sm:bg-white/95 sm:backdrop-blur-md sm:border-b sm:border-neutral-200/80 shadow-md sm:shadow-xs transition-colors">
        {/* Mobile Header (< sm) - Matches Phone Screen 2 Mockup */}
        <div className="flex sm:hidden flex-col px-3.5 pt-2.5 pb-2.5 text-white gap-2">
          {/* Top Row: Location on Left, Notification Bell on Right */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setLocationOpen(true)}
              className="flex items-center gap-1.5 text-left text-white/90 hover:text-white transition cursor-pointer active:scale-95 group"
            >
              <MapPin className="w-3.5 h-3.5 text-[#a3e635] shrink-0" />
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-white/95 tracking-tight">
                  Deliver to {activeLocation.zoneName || "Kota, Rajasthan"}
                </span>
                <ChevronDown className="w-3 h-3 text-white/70 group-hover:text-white transition-transform" />
              </div>
            </button>

            {/* Notification Bell with Red Badge "2" */}
            <div className="flex items-center gap-2">
              <button
                onClick={openLoginModal}
                className="relative flex h-8 w-8 items-center justify-center rounded-xl text-white hover:bg-white/15 transition cursor-pointer active:scale-90"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 flex h-3.5 min-w-3.5 px-0.5 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black ring-2 ring-[#063b1e]">
                  2
                </span>
              </button>
            </div>
          </div>

          {/* Centered Brand Wordmark & Speed Cart Emblem */}
          <div className="flex justify-center items-center py-0.5">
            <CentralMartLogo theme="greenHeader" logoUrl={logoUrl} storeName={storeName} />
          </div>

          {/* Search Bar with Mic Icon */}
          <div className="pt-0.5">
            <SearchInput />
          </div>
        </div>

        {/* Desktop Header Row (>= sm) */}
        <div className="hidden sm:flex mx-auto max-w-7xl items-center justify-between gap-3 px-6 py-3">
          {/* Logo & Location */}
          <div className="flex items-center gap-7">
            <CentralMartLogo showBadge logoUrl={logoUrl} storeName={storeName} />

            <button
              onClick={() => setLocationOpen(true)}
              className="flex flex-col text-left group transition max-w-[240px] cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-sm font-black text-[#1c1c1c] leading-tight">
                <Zap className="w-4 h-4 fill-[#0c831f] text-[#0c831f]" />
                <span>{deliveryPromiseText}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium truncate mt-0.5 group-hover:text-[#0c831f]">
                <span className="truncate">{activeLocation.address || activeLocation.zoneName || "Select Location"}</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </div>
            </button>
          </div>

          {/* Desktop Search Bar */}
          <div className="flex-1 max-w-2xl mx-4">
            <SearchInput />
          </div>

          {/* Desktop Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            <Link
              href="/app"
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-[#0c831f] hover:text-white hover:border-[#0c831f] px-3 py-2 text-xs font-black text-[#0c831f] transition shadow-xs group"
              title="Experience Central Mart Mobile App Simulator (iPhone 13)"
            >
              <Smartphone className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline font-bold">App View</span>
            </Link>

            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-xl border border-neutral-200/90 bg-neutral-50 hover:bg-[#0c831f] hover:text-white hover:border-[#0c831f] px-3 py-2 text-xs font-black text-neutral-800 transition shadow-xs group"
              title="Central Mart Store Admin Panel"
            >
              <Settings className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
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
