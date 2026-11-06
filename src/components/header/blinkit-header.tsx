"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchInput } from "./search-input";
import { LocationModal } from "./location-modal";
import { CartHeaderButton } from "./cart-button";

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
  const [selectedLocation, setSelectedLocation] = useState("R K Nagar, Police Line, Kota, Raj...");

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
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/70 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3.5 py-2.5 sm:px-6 sm:py-3">
          {/* Left: Exact Blinkit Logo & Location Selector */}
          <div className="flex items-center gap-4 sm:gap-8">
            <Link
              href="/"
              className="flex items-baseline shrink-0 group select-none"
              aria-label="Blinkit Home"
            >
              <span className="text-3xl sm:text-4xl font-black tracking-tight font-sans">
                <span className="text-[#f8cb46]">blink</span>
                <span className="text-[#0c831f]">it</span>
              </span>
            </Link>

            {/* Location Selector Pill */}
            <button
              onClick={() => setLocationOpen(true)}
              className="flex flex-col text-left group transition max-w-[170px] sm:max-w-[240px] cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#1c1c1c] leading-tight">
                Delivery in 8 minutes
              </div>
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-neutral-500 font-medium truncate mt-0.5 group-hover:text-[#0c831f]">
                <span className="truncate">{selectedLocation}</span>
                <span className="text-[9px]">▾</span>
              </div>
            </button>
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden sm:block flex-1 max-w-2xl mx-4">
            <SearchInput />
          </div>

          {/* Right: Auth Link & Cart Header Button */}
          <div className="flex items-center gap-4 sm:gap-6">
            {isLoggedIn ? (
              <Link
                href="/account"
                className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-[#2c2c2c] hover:text-[#0c831f] px-2 py-1.5 rounded-lg transition"
              >
                <span className="h-7 w-7 rounded-full bg-[#e8f5e9] text-[#0c831f] flex items-center justify-center font-black text-xs">
                  {customerName ? customerName[0].toUpperCase() : "U"}
                </span>
                <span className="max-w-[90px] truncate">{customerName ?? "Account"}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-block text-base font-semibold text-[#2c2c2c] hover:text-[#0c831f] px-1 py-1 transition cursor-pointer"
              >
                Login
              </Link>
            )}

            <CartHeaderButton count={count} total={total} onClick={openCart} />
          </div>
        </div>

        {/* Mobile Search Bar (Directly below header on small screens) */}
        <div className="sm:hidden px-3.5 pb-2.5">
          <SearchInput />
        </div>
      </header>

      {/* Location Selector Dialog Modal */}
      <LocationModal
        isOpen={locationOpen}
        onClose={() => setLocationOpen(false)}
        onSelect={(addr) => setSelectedLocation(addr)}
        currentLocation={selectedLocation}
      />
    </>
  );
}

export default BlinkitHeader;
