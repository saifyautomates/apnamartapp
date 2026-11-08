"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ProductImage } from "@/components/product/product-image";
import { AddButton } from "@/components/product/add-button";
import { openProductSheet } from "@/components/product/product-detail-modal";
import { formatPaise } from "@/lib/money";

interface SearchResultItem {
  id: string;
  name?: string;
  slug?: string;
  packSize?: string | null;
  mrpPaise?: number;
  sellingPaise?: number;
  images?: Array<{ url: string }>;
  brand?: { name: string } | null;
  variants?: Array<{
    id: string;
    name: string;
    packSize?: string | null;
    mrpPaise: number;
    sellingPaise: number;
  }>;
  product?: {
    id: string;
    name: string;
    slug: string;
    brand?: { name: string } | null;
    images?: Array<{ url: string }>;
  };
}

export function openSearchModal(initialQuery?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-search-modal", { detail: { query: initialQuery } }));
  }
}

const RECENT_KEY = "centralmart_recent_searches";

export function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const TRENDING_SEARCHES = [
    "Amul Milk",
    "Aashirvaad Atta",
    "Fortune Oil",
    "Maggi Noodles",
    "Coca Cola",
    "Tata Salt",
    "Red Label Tea",
    "Surf Excel",
    "Britannia Biscuits",
    "Amul Butter",
  ];

  // Refresh cart summary inside modal
  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setCartCount(json.data.count ?? 0);
          setCartTotal(json.data.subtotalPaise ?? 0);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 6));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    try {
      const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore */
    }
  };

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&pageSize=20`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.data?.items ?? []);
        setSuggestions(json.data?.suggestions ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ query?: string }>;
      const q = customEvent.detail?.query ?? "";
      setIsOpen(true);
      refreshCart();
      if (q) {
        setQuery(q);
        performSearch(q);
      }
      setTimeout(() => inputRef.current?.focus(), 120);
    };
    const handleClose = () => setIsOpen(false);

    window.addEventListener("open-search-modal", handleOpen);
    window.addEventListener("close-search-modal", handleClose);
    window.addEventListener("cart-updated", refreshCart);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("open-search-modal", handleOpen);
      window.removeEventListener("close-search-modal", handleClose);
      window.removeEventListener("cart-updated", refreshCart);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [performSearch, refreshCart]);

  // Debounced live typing
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim()) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 180);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, performSearch]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    inputRef.current?.blur();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      performSearch(query.trim());
    }
  };

  const handleSelectTerm = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
    performSearch(term);
  };

  const openCartAndClose = () => {
    setIsOpen(false);
    window.dispatchEvent(new Event("open-cart"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-200">
      {/* Top Search App Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-200/80 px-3 py-2.5 sm:px-6 sm:py-3.5 shadow-xs flex items-center gap-2.5">
        <button
          onClick={() => setIsOpen(false)}
          className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition active:scale-95 cursor-pointer"
          aria-label="Back to store"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Input wrapped in form for mobile keyboard Go/Search action */}
        <form onSubmit={handleFormSubmit} className="relative flex-1">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search for "milk", "atta", "chips", "coke"...'
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-2xl border border-neutral-200 bg-[#f8f8f8] pl-4 pr-10 py-2.5 text-sm sm:text-base font-semibold text-[#1c1c1c] placeholder-neutral-400 focus:bg-white focus:border-[#0c831f] focus:outline-none transition shadow-inner"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold hover:bg-neutral-300 transition cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : null}
        </form>
      </div>

      {/* Autocomplete Suggestion Strip (Blinkit / Zepto Style) */}
      {suggestions.length > 0 && query.trim() ? (
        <div className="bg-[#fcfcfc] border-b border-neutral-200/60 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-touch-x">
          <span className="text-[11px] font-bold text-neutral-400 shrink-0 uppercase tracking-wide">Suggested:</span>
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectTerm(s.name)}
              className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-800 hover:border-[#0c831f] hover:text-[#0c831f] shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <span>🔍</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* Main Search Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-4xl mx-auto w-full scroll-touch-y pb-24">
        {/* If query is empty: show Recent Searches & Trending Searches */}
        {!query.trim() ? (
          <div className="space-y-5">
            {/* Recent Searches */}
            {recentSearches.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🕒</span> Recent Searches
                  </p>
                  <button
                    onClick={clearRecentSearches}
                    className="text-[11px] font-bold text-[#0c831f] hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSelectTerm(term)}
                      className="rounded-full bg-neutral-100 hover:bg-[#e8f5e9] hover:text-[#0c831f] border border-neutral-200/80 px-3.5 py-1.5 text-xs font-semibold text-neutral-700 transition active:scale-95 cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Trending Searches */}
            <div>
              <p className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span>🔥</span> Trending Searches in Kota
              </p>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSelectTerm(term)}
                    className="rounded-full bg-neutral-100 hover:bg-[#e8f5e9] hover:text-[#0c831f] border border-neutral-200/80 px-3.5 py-1.5 text-xs font-bold text-neutral-700 transition active:scale-95 cursor-pointer"
                  >
                    🔍 {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Categories */}
            <div className="pt-4 border-t border-neutral-100">
              <p className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-2.5">
                Popular Categories
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { name: "Dairy & Bread", query: "milk", icon: "🥛" },
                  { name: "Snacks & Munchies", query: "chips", icon: "🍿" },
                  { name: "Cold Drinks", query: "cold drink", icon: "🥤" },
                  { name: "Atta, Rice & Dal", query: "atta", icon: "🌾" },
                ].map((c) => (
                  <button
                    key={c.name}
                    onClick={() => handleSelectTerm(c.query)}
                    className="p-3 rounded-2xl bg-[#fafafa] hover:bg-[#f0f8f1] border border-neutral-100 text-left transition active:scale-95 cursor-pointer"
                  >
                    <span className="text-xl mb-1 block">{c.icon}</span>
                    <p className="text-xs font-bold text-[#1c1c1c]">{c.name}</p>
                    <p className="text-[10px] text-[#0c831f] font-semibold mt-0.5">Explore items →</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-7 w-7 rounded-full border-3 border-[#0c831f] border-t-transparent animate-spin" />
          </div>
        ) : null}

        {/* Results List */}
        {!loading && query.trim() && results.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-neutral-500">
                Found {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
              </p>
              <span className="text-[11px] font-bold text-[#0c831f] bg-[#e8f5e9] px-2 py-0.5 rounded-full">
                ⚡ Same Day Delivery
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.map((item) => {
                const prodName = item.product?.name ?? item.name ?? "Grocery Item";
                const prodSlug = item.product?.slug ?? item.slug ?? "";
                const img =
                  item.product?.images?.[0]?.url ??
                  item.images?.[0]?.url ??
                  (prodSlug ? `/images/products/${prodSlug}.jpg` : "/images/placeholder-product.svg");
                const firstVar = item.variants?.[0];
                const variantId = firstVar?.id ?? item.id;
                const sellingPrice = firstVar?.sellingPaise ?? item.sellingPaise ?? 0;
                const mrpPrice = firstVar?.mrpPaise ?? item.mrpPaise ?? sellingPrice;
                const packText = firstVar?.packSize ?? item.packSize ?? prodName;

                return (
                  <div
                    key={variantId || item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-neutral-100 bg-white hover:border-[#0c831f] shadow-xs transition"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        openProductSheet({
                          slug: prodSlug,
                          initialName: prodName,
                          initialPrice: sellingPrice,
                          initialMrp: mrpPrice,
                          initialImage: img,
                        });
                      }}
                      className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="h-16 w-16 shrink-0 rounded-xl bg-[#fafafa] p-1 border border-neutral-100 overflow-hidden flex items-center justify-center">
                        <ProductImage src={img} alt={prodName} className="h-full w-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-[#1c1c1c] truncate">{prodName}</h4>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{packText}</p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-xs sm:text-sm font-black text-[#1c1c1c]">{formatPaise(sellingPrice)}</span>
                          {mrpPrice > sellingPrice ? (
                            <span className="text-[10px] text-neutral-400 line-through">{formatPaise(mrpPrice)}</span>
                          ) : null}
                        </div>
                      </div>
                    </button>

                    <div className="w-20 shrink-0">
                      <AddButton variantId={variantId} className="w-full text-xs" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* No Results Empty State */}
        {!loading && query.trim() && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-neutral-100 flex items-center justify-center text-3xl mb-3">
              🔍
            </div>
            <h3 className="text-base font-black text-[#1c1c1c]">No items found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs">
              We couldn&apos;t find anything matching &ldquo;{query}&rdquo;. Try checking the spelling or browse our popular categories.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-sm">
              {TRENDING_SEARCHES.slice(0, 4).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSelectTerm(t)}
                  className="rounded-full bg-neutral-100 hover:bg-[#e8f5e9] hover:text-[#0c831f] px-3 py-1 text-xs font-semibold text-neutral-700 transition cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Floating In-Modal Cart Strip (Blinkit & Zepto Style) */}
      {cartCount > 0 ? (
        <div className="fixed bottom-3 left-3 right-3 sm:max-w-md sm:mx-auto z-50 animate-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={openCartAndClose}
            className="w-full flex items-center justify-between bg-gradient-to-r from-[#0c831f] via-[#0d8e23] to-[#0a701a] text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-400/30 transition active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-sm">
                🛒
              </span>
              <div className="text-left leading-tight">
                <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-wide">
                  {cartCount} {cartCount === 1 ? "item" : "items"} in cart
                </p>
                <p className="text-sm font-black">{formatPaise(cartTotal)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-black uppercase tracking-wider bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition">
              <span>View Cart</span>
              <span className="text-sm">→</span>
            </div>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default SearchModal;
