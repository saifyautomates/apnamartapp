"use client";

import { useState } from "react";
import Link from "next/link";
import { effectivePrice, discountPercent } from "@/lib/pricing";
import { formatPaise } from "@/lib/money";
import { ProductImage } from "./product-image";
import { AddButton } from "./add-button";
import { useDelivery } from "@/lib/delivery-context";
import { useWishlist } from "@/hooks/use-wishlist";
import { Sparkles, Heart } from "lucide-react";

export interface VariantCardProps {
  id: string;
  name?: string;
  packSize?: string | null;
  mrpPaise: number;
  sellingPaise: number;
  product: {
    id: string;
    name: string;
    slug: string;
    brand?: { name: string } | null;
    images?: Array<{ url: string }>;
  };
  inventory?: { availableQty: number; reservedQty: number } | null;
}

export function BlinkitProductCard({ v }: { v: VariantCardProps }) {
  const { isWishlisted, toggleWishlist } = useWishlist(v.id);
  const { deliveryBadgeText } = useDelivery();
  const product = v.product;
  const price = effectivePrice(v as never);
  const pct = discountPercent(v.mrpPaise, price);
  const image = product.images?.[0]?.url ?? `/images/products/${product.slug}.jpg`;
  const sellable = v.inventory ? v.inventory.availableQty - v.inventory.reservedQty : 0;
  const inStock = sellable > 0;
  const packSize = v.packSize || "1 pack";

  return (
    <article className="group relative flex flex-col justify-between rounded-3xl border border-neutral-100/90 hover:border-emerald-300/80 bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_32px_-8px_rgba(12,131,31,0.14)] hover:-translate-y-1 transition-all duration-300 h-full">
      {/* Top Media & Actions Row */}
      <div className="relative">
        <div className="flex items-center justify-between gap-1 w-full z-10">
          {/* Bestseller Badge with Refined Vector Sparkle */}
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 text-white px-2 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-tight shadow-xs">
            <Sparkles className="w-2.5 h-2.5 fill-white/80" />
            <span>Bestseller</span>
          </span>

          {/* Wishlist Heart Icon */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggleWishlist();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-50 hover:bg-rose-50 text-neutral-400 hover:text-rose-500 transition cursor-pointer active:scale-90"
            aria-label="Add to wishlist"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isWishlisted ? "fill-rose-500 text-rose-500 scale-110" : "text-neutral-400 group-hover:text-neutral-600"
              }`}
            />
          </button>
        </div>

        {/* Product Image with Smooth Studio Pedestal Framing */}
        <Link
          href={`/product/${product.slug}`}
          prefetch={true}
          className="block h-28 sm:h-36 w-full overflow-hidden bg-gradient-to-b from-neutral-50/80 via-emerald-50/15 to-white rounded-2xl p-2 my-1 flex items-center justify-center cursor-pointer active:scale-95 transition-all group-hover:bg-emerald-50/30"
          aria-label={product.name}
        >
          <ProductImage
            src={image}
            alt={product.name}
            className="h-full w-full object-contain group-hover:scale-108 transition-transform duration-300"
          />
        </Link>
      </div>

      {/* Product Details */}
      <div className="mt-1 flex-1 flex flex-col justify-between">
        <div>
          <Link
            href={`/product/${product.slug}`}
            prefetch={true}
            className="line-clamp-2 text-xs sm:text-sm font-bold text-[#1c1c1c] group-hover:text-[#0c831f] transition-colors leading-snug min-h-[2.2rem] cursor-pointer"
          >
            {product.name}
          </Link>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100/70 px-1.5 py-0.5 rounded-md">
              {packSize}
            </span>
            {pct > 0 ? (
              <span className="text-[10px] font-black text-rose-600">
                {pct}% OFF
              </span>
            ) : null}
          </div>
        </div>

        {/* Pricing & Add Button Row */}
        <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-neutral-100">
          <div className="flex flex-col leading-tight">
            <span className="text-sm sm:text-base font-bold tabular-nums text-[#1c1c1c]">
              {formatPaise(price)}
            </span>
            {v.mrpPaise > price ? (
              <span className="text-[10px] text-neutral-400 line-through tabular-nums font-normal">
                {formatPaise(v.mrpPaise)}
              </span>
            ) : null}
          </div>

          <div className="w-[72px] sm:w-[78px] shrink-0">
            {inStock ? (
              <AddButton variantId={v.id} />
            ) : (
              <button
                disabled
                className="w-full rounded-xl bg-neutral-100 py-1.5 text-center text-[10px] font-bold text-neutral-400 cursor-not-allowed uppercase"
              >
                Sold Out
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default BlinkitProductCard;
