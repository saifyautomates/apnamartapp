"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearch } from "@/hooks/use-search";
import { openSearchModal } from "@/components/search/search-modal";
import { openProductSheet } from "@/components/product/product-detail-modal";

const DEFAULT_PLACEHOLDERS = [
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

export interface SearchInputProps {
  initial?: string;
  className?: string;
  placeholders?: string[];
}

export function SearchInput({
  initial = "",
  className = "",
  placeholders = DEFAULT_PLACEHOLDERS,
}: SearchInputProps) {
  const { query, setQuery, suggestions, isOpen, setIsOpen, clear } = useSearch();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (initial) setQuery(initial);
  }, [initial, setQuery]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [placeholders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openSearchModal(query);
  };

  return (
    <div className={`relative w-full ${className}`}>
      <form onSubmit={handleSearchSubmit}>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-neutral-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={() => {
              // On mobile and desktop, trigger modal search overlay
              openSearchModal(query);
            }}
            onFocus={() => {
              if (window.innerWidth < 640) {
                openSearchModal(query);
              } else if (suggestions.length > 0) {
                setIsOpen(true);
              }
            }}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder={placeholders[placeholderIndex]}
            aria-label="Search products"
            className="w-full rounded-xl border border-neutral-200/80 bg-[#f8f8f8] pl-10 pr-9 py-2.5 text-sm text-[#1c1c1c] font-medium placeholder-neutral-400 focus:bg-white focus:border-[#0c831f] focus:outline-hidden transition cursor-pointer"
          />
          {query ? (
            <button
              type="button"
              onClick={clear}
              className="absolute right-3 text-neutral-400 hover:text-neutral-600 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          ) : null}
        </div>
      </form>

      {/* Live Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 ? (
        <ul className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-neutral-100 bg-white py-1.5 shadow-xl z-50 divide-y divide-neutral-50">
          {suggestions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/product/${s.slug}`}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  setIsOpen(false);
                  openProductSheet({
                    slug: s.slug,
                    initialName: s.name,
                  });
                }}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50 text-sm transition"
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
  );
}

export default SearchInput;
