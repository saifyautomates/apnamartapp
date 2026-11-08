"use client";

import { useEffect, useState, useRef } from "react";
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

export function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const TRENDING_SEARCHES = [
    "Amul Milk",
    "Aashirvaad Atta",
    "Fortune Oil",
    "Maggi Noodles",
    "Coca Cola",
    "Lays Chips",
    "Tata Salt",
    "Bread",
    "Eggs",
    "Dettol Soap",
  ];

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ query?: string }>;
      const q = customEvent.detail?.query;
      setIsOpen(true);
      if (typeof q === "string" && q) {
        setQuery(q);
      }
      setTimeout(() => inputRef.current?.focus(), 150);
    };
    const handleClose = () => setIsOpen(false);

    window.addEventListener("open-search-modal", handleOpen);
    window.addEventListener("close-search-modal", handleClose);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("open-search-modal", handleOpen);
      window.removeEventListener("close-search-modal", handleClose);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&pageSize=15`);
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
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

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

        {/* Input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search for "milk", "atta", "chips", "coke"...'
            className="w-full rounded-2xl border border-neutral-200 bg-[#f8f8f8] pl-4 pr-10 py-2.5 text-sm sm:text-base font-semibold text-[#1c1c1c] placeholder-neutral-400 focus:bg-white focus:border-[#0c831f] focus:outline-none transition shadow-inner"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold hover:bg-neutral-300 transition cursor-pointer"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {/* Main Search Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-4xl mx-auto w-full scroll-touch-y">
        {/* If query is empty: show trending search chips */}
        {!query.trim() ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span>🔥</span> Trending Searches in Kota
              </p>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="rounded-full bg-neutral-100 hover:bg-[#e8f5e9] hover:text-[#0c831f] border border-neutral-200/80 px-3.5 py-1.5 text-xs font-bold text-neutral-700 transition active:scale-95 cursor-pointer"
                  >
                    🔍 {term}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100">
              <p className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-2.5">
                Popular Categories
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: "Dairy & Bread", query: "milk" },
                  { name: "Snacks & Munchies", query: "chips" },
                  { name: "Cold Drinks", query: "cold drink" },
                  { name: "Atta, Rice & Dal", query: "atta" },
                ].map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setQuery(c.query)}
                    className="p-3 rounded-2xl bg-[#fafafa] hover:bg-[#f0f8f1] border border-neutral-100 text-left transition active:scale-95 cursor-pointer"
                  >
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
            <p className="text-xs font-bold text-neutral-500">
              Found {results.length} results for &ldquo;{query}&rdquo;
            </p>
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
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default SearchModal;
