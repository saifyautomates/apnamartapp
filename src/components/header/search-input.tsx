"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearch } from "@/hooks/use-search";
import { openSearchModal } from "@/components/search/search-modal";
import { openProductSheet } from "@/components/product/product-detail-modal";

export interface SearchInputProps {
  initial?: string;
  className?: string;
}

export function SearchInput({
  initial = "",
  className = "",
}: SearchInputProps) {
  const { query, setQuery, suggestions, isOpen, setIsOpen, clear } = useSearch();

  useEffect(() => {
    if (initial) setQuery(initial);
  }, [initial, setQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openSearchModal(query);
  };

  return (
    <div className={`relative w-full ${className}`}>
      <form onSubmit={handleSearchSubmit}>
        <div className="relative flex items-center">
          {/* Search Glass Icon */}
          <span className="absolute left-3.5 text-neutral-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>

          {/* Main Input */}
          <input
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={() => openSearchModal(query)}
            onFocus={() => {
              if (window.innerWidth < 640) {
                openSearchModal(query);
              } else if (suggestions.length > 0) {
                setIsOpen(true);
              }
            }}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder="Search for groceries, snacks, personal care..."
            aria-label="Search for groceries, snacks, personal care"
            className="w-full rounded-2xl border border-neutral-200/90 bg-white pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#1c1c1c] font-medium placeholder-neutral-400 focus:bg-white focus:border-[#0c831f] focus:outline-hidden transition cursor-pointer shadow-xs"
          />

          {/* Barcode Scanner Icon (Matching Screen 1 Mockup) */}
          <button
            type="button"
            onClick={() => openSearchModal(query)}
            className="absolute right-3 text-neutral-400 hover:text-[#0c831f] transition cursor-pointer"
            title="Scan barcode or browse"
            aria-label="Scan barcode"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2m-10 0H5a2 2 0 01-2-2v-2M8 12h8" />
            </svg>
          </button>
        </div>
      </form>

      {/* Live Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 ? (
        <ul className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl border border-neutral-100 bg-white py-1.5 shadow-xl z-50 divide-y divide-neutral-50">
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
                <span className="text-xs font-bold text-[#0c831f] bg-[#e8f5e9] px-2 py-0.5 rounded-md">
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
