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
    <article className="group relative flex flex-col justify-between rounded-3xl border border-neutral-100 bg-white p-3 shadow-xs hover:shadow-md transition-all duration-200 h-full">
      {/* Top Media & Actions Row */}
      <div className="relative">
        <div className="flex items-center justify-between gap-1 w-full z-10">
          {/* Bestseller Badge (Matches Mockup Screen 1) */}
          <span className="inline-flex items-center rounded-full bg-[#0c831f] text-white px-2 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-tight shadow-xs">
            Bestseller
          </span>

          {/* Wishlist Heart Icon (Matches Mockup Screen 1) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setWishlisted(!wishlisted);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-50 hover:bg-red-50 text-neutral-400 hover:text-red-500 transition cursor-pointer active:scale-90"
            aria-label="Add to wishlist"
          >
            <svg
              className={`w-4 h-4 ${wishlisted ? "fill-red-500 text-red-500" : "text-neutral-400"}`}
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

        {/* Product Image */}
        <a
          href={`/product/${product.slug}`}
          onClick={handleCardClick}
          className="block h-28 sm:h-36 w-full overflow-hidden bg-white p-1 my-1 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          aria-label={product.name}
        >
          <ProductImage
            src={image}
            alt={product.name}
            className="h-full w-full object-contain"
          />
        </a>
      </div>

      {/* Product Details */}
      <div className="mt-1 flex-1 flex flex-col justify-between">
        <div>
          <a
            href={`/product/${product.slug}`}
            onClick={handleCardClick}
            className="line-clamp-2 text-xs sm:text-sm font-bold text-[#1c1c1c] leading-snug hover:text-[#0c831f] transition min-h-[2.2rem] cursor-pointer"
          >
            {product.name}
          </a>
          <p className="mt-0.5 text-[11px] text-neutral-400 font-medium">
            {v.packSize ?? v.name ?? "~ 1 kg"}
          </p>
        </div>

        {/* Pricing & Add Button Row (Matches Mockup Screen 1) */}
        <div className="mt-2.5 flex items-center justify-between gap-2 pt-1 border-t border-neutral-100">
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
