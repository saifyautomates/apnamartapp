"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatPaise } from "@/lib/money";

const SEARCH_PLACEHOLDERS = [
  'Search "sugar"',
  'Search "milk"',
  'Search "bread"',
  'Search "atta"',
  'Search "chips"',
  'Search "curd"',
  'Search "ice cream"',
  'Search "butter"',
  'Search "chocolate"',
];

export interface HeaderProps {
  storeName?: string;
  initialCount?: number;
  initialTotal?: number;
  customerName?: string | null;
  isLoggedIn?: boolean;
}

export default function BlinkitHeader({
  initialCount = 0,
  initialTotal = 0,
  customerName = null,
  isLoggedIn = false,
}: HeaderProps) {
  const [count, setCount] = useState(initialCount);
  const [total, setTotal] = useState(initialTotal);
  const [q, setQ] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; slug: string; brand?: { name: string } | null }>>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("R K Nagar, Police Line, Kota, Raj...");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rotate search placeholder every 2.8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Listen to cart update events
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

  // Autocomplete fetch
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setSuggestions(json.data?.suggestions ?? []);
        setSearchOpen(true);
      } catch {
        /* ignore */
      }
    }, 200);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [q]);

  const openCart = () => {
    window.dispatchEvent(new Event("open-cart"));
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/70 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3.5 py-2.5 sm:px-6 sm:py-3">
          {/* Left: Brand + Location */}
          <div className="flex items-center gap-4 sm:gap-8">
            {/* Blinkit Exact Logo */}
            <Link href="/" className="flex items-baseline shrink-0 group select-none" aria-label="Blinkit Home">
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
          <div className="hidden sm:block flex-1 max-w-2xl mx-4 relative">
            <form
              action="/search"
              method="get"
              onSubmit={(e) => {
                if (!q.trim()) e.preventDefault();
              }}
            >
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-neutral-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  name="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                  placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                  className="w-full rounded-xl border border-neutral-200/80 bg-[#f8f8f8] pl-10 pr-9 py-2.5 text-sm text-[#1c1c1c] font-medium placeholder-neutral-400 focus:bg-white focus:border-[#0c831f] focus:outline-hidden transition"
                />
                {q ? (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="absolute right-3 text-neutral-400 hover:text-neutral-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            </form>

            {/* Autocomplete Dropdown */}
            {searchOpen && suggestions.length > 0 ? (
              <ul className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-neutral-100 bg-white py-1.5 shadow-xl z-50 divide-y divide-neutral-50">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/product/${s.slug}`}
                      className="flex items-center justify-between px-4 py-2 hover:bg-neutral-50 text-sm transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-neutral-400">🔍</span>
                        <span className="font-semibold text-[#1c1c1c]">{s.name}</span>
                        {s.brand?.name ? (
                          <span className="text-xs text-neutral-400">in {s.brand.name}</span>
                        ) : null}
                      </div>
                      <span className="text-xs font-bold text-[#0c831f] bg-[#e8f5e9] px-2 py-0.5 rounded">
                        View →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Right: Auth & Cart */}
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

            {/* Blinkit Cart Button (Desktop & Mobile) */}
            <button
              onClick={openCart}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-extrabold transition active:scale-95 cursor-pointer ${
                count > 0
                  ? "bg-[#0c831f] hover:bg-[#0b721b] text-white shadow-sm"
                  : "bg-[#f2f4f7] hover:bg-[#e5e7eb] text-[#6b7280]"
              }`}
              aria-label="Open Cart"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {count > 0 ? (
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[10px] font-bold opacity-90">{count} {count === 1 ? "item" : "items"}</span>
                  <span className="text-xs sm:text-sm font-black">{formatPaise(total)}</span>
                </div>
              ) : (
                <span className="font-bold">My Cart</span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Below Header on Phone) */}
        <div className="sm:hidden px-3.5 pb-2.5">
          <form
            action="/search"
            method="get"
            onSubmit={(e) => {
              if (!q.trim()) e.preventDefault();
            }}
          >
            <div className="relative flex items-center">
              <span className="absolute left-3 text-neutral-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                name="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                className="w-full rounded-xl border border-neutral-200/80 bg-[#f8f8f8] pl-9 pr-3 py-2 text-xs text-[#1c1c1c] placeholder-neutral-400 focus:bg-white focus:border-[#0c831f] focus:outline-hidden transition"
              />
            </div>
          </form>
        </div>
      </header>

      {/* Location Picker Modal */}
      {locationOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-[#1c1c1c] text-sm">Select Delivery Location</h3>
              <button onClick={() => setLocationOpen(false)} className="text-neutral-400 hover:text-neutral-600 text-sm font-bold">
                ✕
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {[
                { title: "Kota Address", addr: "R K Nagar, Police Line, Kota, Rajasthan - 324001" },
                { title: "Home", addr: "B-Block, Sector 62, Noida - 201301" },
                { title: "Work / Office", addr: "Tower A, Tech Park, Sector 125, Noida - 201303" },
              ].map((loc) => (
                <button
                  key={loc.title}
                  onClick={() => {
                    setSelectedLocation(loc.addr);
                    setLocationOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-neutral-100 hover:border-[#0c831f] hover:bg-[#e8f5e9]/40 transition flex items-start gap-3"
                >
                  <span className="text-lg">📍</span>
                  <div>
                    <p className="text-xs font-bold text-[#1c1c1c]">{loc.title}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{loc.addr}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold text-[#0c831f] bg-[#e8f5e9] px-1.5 py-0.5 rounded">
                      ⚡ 8 Mins Delivery
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
