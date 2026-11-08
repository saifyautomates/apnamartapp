"use client";

import { useState } from "react";
import Link from "next/link";
import { effectivePrice, discountPercent } from "@/lib/pricing";
import { formatPaise } from "@/lib/money";
import { ProductImage } from "./product-image";
import { AddButton } from "./add-button";
import { useDelivery } from "@/lib/delivery-context";
import { openProductSheet } from "./product-detail-modal";

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
  const [wishlisted, setWishlisted] = useState(false);
  const { deliveryBadgeText } = useDelivery();
  const product = v.product;
  const price = effectivePrice(v as never);
  const pct = discountPercent(v.mrpPaise, price);
  const image = product.images?.[0]?.url ?? `/images/products/${product.slug}.jpg`;
  const sellable = v.inventory ? v.inventory.availableQty - v.inventory.reservedQty : 0;
  const inStock = sellable > 0;
  const packSize = v.packSize || "1 pack";

  const handleCardClick = (e: React.MouseEvent) => {
    if (!e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      openProductSheet({
        slug: product.slug,
        initialName: product.name,
        initialPrice: price,
        initialMrp: v.mrpPaise,
        initialImage: image,
      });
    }
  };

  return (
    <article className="group relative flex flex-col justify-between rounded-3xl border border-neutral-100/90 hover:border-emerald-300/80 bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_32px_-8px_rgba(12,131,31,0.14)] hover:-translate-y-1 transition-all duration-300 h-full">
      {/* Top Media & Actions Row */}
      <div className="relative">
        <div className="flex items-center justify-between gap-1 w-full z-10">
          {/* Bestseller Badge with Flame Icon */}
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-2 py-0.5 text-[9px] sm:text-[10px] font-black tracking-tight shadow-xs">
            <span>⚡</span>
            <span>Bestseller</span>
          </span>

          {/* Wishlist Heart Icon */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setWishlisted(!wishlisted);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-50 hover:bg-rose-50 text-neutral-400 hover:text-rose-500 transition cursor-pointer active:scale-90"
            aria-label="Add to wishlist"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                wishlisted ? "fill-rose-500 text-rose-500 scale-110" : "text-neutral-400 group-hover:text-neutral-600"
              }`}
              fill={wishlisted ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        {/* Product Image with Smooth Studio Pedestal Framing */}
        <a
          href={`/product/${product.slug}`}
          onClick={handleCardClick}
          className="block h-28 sm:h-36 w-full overflow-hidden bg-gradient-to-b from-neutral-50/80 via-emerald-50/15 to-white rounded-2xl p-2 my-1 flex items-center justify-center cursor-pointer active:scale-95 transition-all group-hover:bg-emerald-50/30"
          aria-label={product.name}
        >
          <ProductImage
            src={image}
            alt={product.name}
            className="h-full w-full object-contain group-hover:scale-108 transition-transform duration-300"
          />
        </a>
      </div>

      {/* Product Details */}
      <div className="mt-1 flex-1 flex flex-col justify-between">
        <div>
          <a
            href={`/product/${product.slug}`}
            onClick={handleCardClick}
            className="line-clamp-2 text-xs sm:text-sm font-bold text-[#1c1c1c] group-hover:text-[#0c831f] transition-colors leading-snug min-h-[2.2rem] cursor-pointer"
          >
            {product.name}
          </a>
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
            <span className="text-sm sm:text-base font-black text-[#1c1c1c]">
              {formatPaise(price)}
            </span>
            {v.mrpPaise > price ? (
              <span className="text-[10px] text-neutral-400 line-through font-normal">
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
