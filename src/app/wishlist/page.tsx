"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/hooks/use-wishlist";
import { BlinkitProductCard } from "@/components/product/product-card";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";

export default function WishlistPage() {
  const router = useRouter();
  const { wishlistIds, count } = useWishlist();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlistProducts() {
      try {
        setLoading(true);
        // Fetch all catalogue variants
        const res = await fetch("/api/search?q=");
        if (res.ok) {
          const json = await res.json();
          const allVariants = json.data?.variants || json.data?.results || [];
          // Filter to wishlisted variants
          const saved = allVariants.filter((v: any) => wishlistIds.includes(v.id));
          setProducts(saved);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }

    loadWishlistProducts();
  }, [wishlistIds]);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-16 px-4">
      {/* Top Header */}
      <div className="flex items-center justify-between py-3 border-b border-neutral-100">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-base font-black text-[#1c1c1c] hover:text-[#0c831f] transition cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
          <span>My Wishlist</span>
        </button>
        <span className="text-xs font-bold text-neutral-500">
          {count} {count === 1 ? "item" : "items"} saved
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : count === 0 || products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto">
          <div className="h-20 w-20 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
            <Heart className="w-10 h-10 stroke-[1.8]" />
          </div>
          <h2 className="text-lg font-black text-[#1c1c1c]">Your Wishlist is Empty</h2>
          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
            Explore fresh groceries and FMCG essentials. Tap the heart icon on any product to save it here for later!
          </p>
          <Link
            href="/"
            className="mt-5 rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] px-6 py-2.5 text-xs font-black text-white shadow-md transition active:scale-95 cursor-pointer"
          >
            Explore Groceries →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {products.map((variant) => (
            <BlinkitProductCard key={variant.id} v={variant} />
          ))}
        </div>
      )}
    </div>
  );
}

