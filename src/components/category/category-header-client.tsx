"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Search } from "lucide-react";
import { openSearchModal } from "@/components/search/search-modal";

export interface CategoryHeaderClientProps {
  categoryName: string;
}

export function CategoryHeaderClient({ categoryName }: CategoryHeaderClientProps) {
  const router = useRouter();
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
    router.push("/cart");
  };

  const handleOpenSearch = () => {
    openSearchModal(categoryName);
  };

  return (
    <div className="sm:hidden -mx-3 -mt-2.5 bg-gradient-to-r from-[#032e16] via-[#063b1e] to-[#074724] text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-md rounded-b-2xl">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white active:scale-90 transition cursor-pointer shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
        </button>
        <h1 className="text-base font-black text-white leading-tight truncate">{categoryName}</h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleOpenSearch}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white active:scale-90 transition cursor-pointer"
          aria-label="Search this category"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={handleOpenCart}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white active:scale-90 transition relative cursor-pointer"
          aria-label="Open cart"
        >
          <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black ring-2 ring-[#063b1e]">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default CategoryHeaderClient;

