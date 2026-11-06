"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatPaise } from "@/lib/money";
import { ProductImage } from "@/components/shop";

const SEARCH_PLACEHOLDERS = [
  "Search 'milk, bread & butter'",
  "Search 'atta, rice & dal'",
  "Search 'chips, biscuits & namkeen'",
  "Search 'cold drinks & juices'",
  "Search 'Maggi, noodles & pasta'",
  "Search 'detergent & cleaning'",
  "Search 'toothpaste & shampoo'",
];

export interface HeaderProps {
  storeName: string;
  initialCount?: number;
  initialTotal?: number;
  customerName?: string | null;
  isLoggedIn?: boolean;
}

export default function BlinkitHeader({
  storeName,
  initialCount = 0,
  initialTotal = 0,
  customerName = null,
  isLoggedIn = false,
}: HeaderProps) {
  const [count, setCount] = useState(initialCount);
  const [total, setTotal] = useState(initialTotal);
  const [q, setQ] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; slug: string; brand?: { name: string } | null; imageUrl?: string }>>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Home - B-Block, Sector 62, Noida");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rotate search placeholder every 2.5 seconds
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
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3.5 py-2.5 sm:px-6 sm:py-3">
          {/* Left: Brand + Location */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-1.5 shrink-0 group" aria-label="Home">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-ink group-hover:opacity-90">
                blink<span className="text-emerald-700">it</span>
              </span>
              <span className="hidden md:inline-block rounded-full bg-amber-400 text-ink px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                10 mins
              </span>
            </Link>

            {/* Location Selector Pill */}
            <div className="relative">
              <button
                onClick={() => setLocationOpen(true)}
                className="flex flex-col text-left group transition max-w-[160px] sm:max-w-[220px]"
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-ink">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <span className="leading-none">Delivery in 10 minutes</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate mt-0.5 group-hover:text-emerald-700">
                  <span className="truncate">{selectedLocation}</span>
                  <span className="text-[10px]">▼</span>
                </div>
              </button>
            </div>
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
                <span className="absolute left-3.5 text-slate-400 text-base">
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-9 py-2.5 text-sm text-ink font-medium placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:shadow-sm transition"
                />
                {q ? (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            </form>

            {/* Autocomplete Dropdown */}
            {searchOpen && suggestions.length > 0 ? (
              <ul className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl z-50 divide-y divide-slate-50">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/product/${s.slug}`}
                      className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-sm transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-slate-300">🔍</span>
                        <span className="font-semibold text-ink">{s.name}</span>
                        {s.brand?.name ? (
                          <span className="text-xs text-muted">in {s.brand.name}</span>
                        ) : null}
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        View →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Right: Auth & Cart */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isLoggedIn ? (
              <Link
                href="/account"
                className="hidden sm:flex items-center gap-1.5 text-xs font-extrabold text-ink hover:text-emerald-700 px-2 py-1.5 rounded-lg transition"
              >
                <span className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  {customerName ? customerName[0].toUpperCase() : "U"}
                </span>
                <span className="max-w-[80px] truncate">{customerName ?? "Account"}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-block text-sm font-extrabold text-ink hover:text-emerald-700 px-3 py-1.5 rounded-lg transition"
              >
                Login
              </Link>
            )}

            {/* Blinkit Cart Button (Desktop & Mobile) */}
            <button
              onClick={openCart}
              className="flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2.5 text-xs sm:text-sm font-extrabold shadow-sm transition active:scale-95"
              aria-label="Open Cart"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {count > 0 ? (
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[10px] font-bold opacity-90">{count} {count === 1 ? "item" : "items"}</span>
                  <span className="text-xs sm:text-sm font-black">{formatPaise(total)}</span>
                </div>
              ) : (
                <span>My Cart</span>
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
              <span className="absolute left-3 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                name="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-ink placeholder-slate-400 focus:bg-white focus:border-emerald-600 transition"
              />
            </div>
          </form>
        </div>
      </header>

      {/* Location Picker Modal */}
      {locationOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-ink text-sm">Select Delivery Location</h3>
              <button onClick={() => setLocationOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {[
                { title: "Home", addr: "B-Block, Sector 62, Noida - 201301", pin: "201301" },
                { title: "Work / Office", addr: "Tower A, Tech Park, Sector 125, Noida - 201303", pin: "201303" },
                { title: "Other (Store Pickup)", addr: "Apna Grocery Store, Main Market Road", pin: "Store" },
              ].map((loc) => (
                <button
                  key={loc.title}
                  onClick={() => {
                    setSelectedLocation(`${loc.title} - ${loc.addr.split(",")[0]}`);
                    setLocationOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-600 hover:bg-emerald-50/50 transition flex items-start gap-3"
                >
                  <span className="text-lg">📍</span>
                  <div>
                    <p className="text-xs font-bold text-ink">{loc.title}</p>
                    <p className="text-[11px] text-muted mt-0.5">{loc.addr}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      ⚡ 10 Mins Delivery
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

