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
      <header className="sticky top-0 z-40 bg-[#0a6833] sm:bg-white/95 sm:backdrop-blur-md sm:border-b sm:border-neutral-200/80 shadow-md sm:shadow-xs transition-colors">
        {/* Mobile Header Top Row (< sm) - Matches Phone 1 Mockup */}
        <div className="flex sm:hidden items-center justify-between px-3.5 pt-3 pb-2 text-white">
          {/* Hamburger Menu on Left */}
          <button
            onClick={openCategoriesModal}
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-white hover:bg-white/15 transition cursor-pointer active:scale-90"
            aria-label="Open categories menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Central Mart Logo */}
          <CentralMartLogo theme="greenHeader" />

          {/* Right Action: Notifications Bell & Cart */}
          <div className="flex items-center gap-2">
            <button
              onClick={openLoginModal}
              className="relative flex h-9 w-9 items-center justify-center rounded-2xl text-white hover:bg-white/15 transition cursor-pointer active:scale-90"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0a6833]" />
            </button>

            <button
              onClick={openCart}
              className="relative flex h-9 w-9 items-center justify-center rounded-2xl text-white hover:bg-white/15 transition cursor-pointer active:scale-90"
              aria-label="Open Cart"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black ring-2 ring-[#0a6833]">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Deliver to Home Location Bar Card (< sm) - Matches Phone 1 Mockup */}
        <div className="flex sm:hidden px-3.5 py-1">
          <button
            onClick={() => setLocationOpen(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white shadow-sm border border-neutral-100 text-left group transition cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-base text-[#0c831f] shrink-0">📍</span>
              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-1 text-xs font-black text-[#1c1c1c]">
                  <span>Deliver to Home</span>
                  <span className="text-[10px] text-neutral-400">▾</span>
                </div>
                <p className="text-[11px] text-neutral-500 font-semibold truncate max-w-[200px]">
                  {activeLocation.address || activeLocation.zoneName || "Kota Central, Nayapura - 324001"}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black text-amber-900 bg-[#fef08a] px-2.5 py-1 rounded-xl shadow-xs shrink-0 flex items-center gap-1">
              <span>⚡</span>
              <span>Get in {deliveryPromiseText || "12-15 min"}</span>
            </span>
          </button>
        </div>

        {/* Mobile Search Bar (< sm) - Matches Phone 1 Mockup */}
        <div className="sm:hidden px-3.5 pb-3 pt-1">
          <SearchInput />
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
