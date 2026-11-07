"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchInput } from "./search-input";
import { LocationModal } from "./location-modal";
import { CartHeaderButton } from "./cart-button";
import { CentralMartLogo } from "@/components/ui/logo";
import { useDelivery } from "@/lib/delivery-context";

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
        {/* Mobile Header Top Row (< sm) */}
        <div className="flex sm:hidden items-center justify-between gap-2 px-3 pt-2 pb-1.5">
          {/* Left: Location & Fast ETA (Blinkit Signature) */}
          <button
            onClick={() => setLocationOpen(true)}
            className="flex items-center gap-2 text-left group transition min-w-0 flex-1 cursor-pointer"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e8f5e9] text-[#0c831f] border border-[#0c831f]/20">
              <span className="text-sm font-black">⚡</span>
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#1c1c1c]">
                <span>{deliveryPromiseText || "12-15 MINS"}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#0c831f] animate-ping" />
              </div>
              <div className="flex items-center gap-0.5 text-[11px] text-neutral-500 font-semibold truncate mt-0.5">
                <span className="truncate max-w-[170px]">
                  {activeLocation.address || activeLocation.zoneName || "Kota Central · 324001"}
                </span>
                <span className="text-[10px] text-neutral-400">▾</span>
              </div>
            </div>
          </button>

          {/* Right: Quick Actions (Admin, Account & Cart) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/admin"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 hover:text-[#0c831f] transition"
              title="Admin Panel"
            >
              <span className="text-xs">⚙️</span>
            </Link>

            {isLoggedIn ? (
              <Link
                href="/account"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f5e9] text-[#0c831f] font-black text-xs border border-[#0c831f]/20"
              >
                {customerName ? customerName[0].toUpperCase() : "U"}
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex h-8 px-2.5 items-center justify-center rounded-xl border border-neutral-200 bg-white text-xs font-black text-[#1c1c1c] hover:border-[#0c831f]"
              >
                Login
              </Link>
            )}

            <button
              onClick={openCart}
              className="relative flex h-8 px-2.5 items-center gap-1.5 rounded-xl bg-[#0c831f] text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            >
              <span>🛒</span>
              <span>{count}</span>
            </button>
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
              <Link
                href="/login"
                className="inline-block text-base font-semibold text-[#2c2c2c] hover:text-[#0c831f] px-1 py-1 transition cursor-pointer"
              >
                Login
              </Link>
            )}

            <CartHeaderButton count={count} total={total} onClick={openCart} />
          </div>
        </div>

        {/* Mobile Search Bar & Quick Categories Carousel (< sm) */}
        <div className="sm:hidden px-3 pb-2 pt-0.5 space-y-1.5">
          <SearchInput />

          {/* Horizontal Quick-Access Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-touch">
            {[
              { label: "🔥 Deals", href: "/category" },
              { label: "🥛 Dairy", href: "/category/dairy-eggs" },
              { label: "🍞 Bread", href: "/category/dairy-eggs" },
              { label: "🍪 Snacks", href: "/category/snacks" },
              { label: "🥤 Drinks", href: "/category/cold-drinks" },
              { label: "🌾 Atta & Dal", href: "/category/staples" },
              { label: "🧼 Cleaning", href: "/category/cleaning-essentials" },
              { label: "🧴 Personal Care", href: "/category/personal-care" },
            ].map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                className="shrink-0 px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-[#e8f5e9] hover:text-[#0c831f] text-neutral-700 text-[11px] font-bold border border-neutral-200/60 active:scale-95 transition"
              >
                {chip.label}
              </Link>
            ))}
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

