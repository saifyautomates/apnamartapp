"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { openSearchModal } from "@/components/search/search-modal";

export interface CategoryHeaderClientProps {
  categoryName: string;
}

export function CategoryHeaderClient({ categoryName }: CategoryHeaderClientProps) {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const json = await res.json();
          setCartCount(json.data?.count ?? 0);
        }
      } catch {
        /* ignore */
      }
    };

    fetchCartCount();

    const onCartUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ count?: number }>;
      if (custom.detail?.count !== undefined) {
        setCartCount(custom.detail.count);
      } else {
        fetchCartCount();
      }
    };

    window.addEventListener("cart-updated", onCartUpdated);
    return () => window.removeEventListener("cart-updated", onCartUpdated);
  }, []);

  const handleOpenCart = () => {
    window.dispatchEvent(new Event("open-cart"));
  };

  const handleOpenSearch = () => {
    openSearchModal(categoryName);
  };

  return (
    <div className="sm:hidden -mx-4 -mt-4 bg-[#0a6833] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white active:scale-90 transition cursor-pointer shrink-0"
          aria-label="Back to home"
        >
          ←
        </Link>
        <h1 className="text-base font-black text-white leading-tight truncate">{categoryName}</h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleOpenSearch}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white active:scale-90 transition cursor-pointer"
          aria-label="Search this category"
        >
          🔍
        </button>
        <button
          onClick={handleOpenCart}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white active:scale-90 transition relative cursor-pointer"
          aria-label="Open cart"
        >
          🛒
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black ring-2 ring-[#0a6833]">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default CategoryHeaderClient;

