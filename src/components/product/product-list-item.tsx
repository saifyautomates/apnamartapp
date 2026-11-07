"use client";

import { useState } from "react";
import { effectivePrice, discountPercent } from "@/lib/pricing";
import { formatPaise } from "@/lib/money";
import { ProductImage } from "./product-image";
import { AddButton } from "./add-button";
import { openProductSheet } from "./product-detail-modal";
import { VariantCardProps } from "./product-card";

export function ProductListItem({ v }: { v: VariantCardProps }) {
  const [wishlisted, setWishlisted] = useState(false);
  const product = v.product;
  const price = effectivePrice(v as never);
  const mrp = v.mrpPaise > price ? v.mrpPaise : Math.round(price * 1.2);
  const pct = discountPercent(mrp, price);
  const image = product.images?.[0]?.url ?? `/images/products/${product.slug}.jpg`;
  const sellable = v.inventory ? v.inventory.availableQty - v.inventory.reservedQty : 10;
  const inStock = sellable > 0;

  // Mock rating for FMCG grocery staples matching Phone 2 mockup
  const ratingsMap: Record<string, { rating: string; count: string }> = {
    "aashirvaad-shudh-chakki-atta": { rating: "4.7", count: "12.6K+" },
    "tata-salt-iodised": { rating: "4.8", count: "28.4K+" },
    "fortune-sunflower-oil": { rating: "4.7", count: "9.1K+" },
    "surf-excel-easy-wash-detergent-powder": { rating: "4.8", count: "42.7K+" },
  };

  const ratingInfo = ratingsMap[product.slug] || { rating: "4.8", count: "8.4K+" };

  const handleCardClick = (e: React.MouseEvent) => {
    if (!e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      openProductSheet({
        slug: product.slug,
        initialName: product.name,
        initialPrice: price,
        initialMrp: mrp,
        initialImage: image,
      });
    }
  };

  return (
    <article className="group relative flex items-center justify-between gap-3 rounded-2xl border border-neutral-100 bg-white p-3 shadow-xs hover:shadow-md transition-all duration-200">
      {/* Left: Product Image */}
      <a
        href={`/product/${product.slug}`}
        onClick={handleCardClick}
        className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-xl bg-[#fafafa] p-1.5 flex items-center justify-center overflow-hidden border border-neutral-100 active:scale-95 transition-transform"
      >
        <ProductImage
          src={image}
          alt={product.name}
          className="h-full w-full object-contain"
        />
      </a>

      {/* Center & Right Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-24 sm:h-28">
        {/* Top Row: Title & Heart */}
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <a
              href={`/product/${product.slug}`}
              onClick={handleCardClick}
              className="text-xs sm:text-sm font-black text-[#1c1c1c] truncate block hover:text-[#0c831f] transition cursor-pointer"
            >
              {product.name}
            </a>
            <p className="text-[11px] text-neutral-400 font-medium truncate mt-0.5">
              {v.packSize ?? v.name ?? "1 kg"}
            </p>
          </div>

          {/* Heart Wishlist */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setWishlisted(!wishlisted);
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:text-red-500 transition cursor-pointer active:scale-90"
            aria-label="Wishlist"
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

        {/* Middle Row: Rating Pill & Discount Tag */}
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#e8f5e9] px-1.5 py-0.5 text-[10px] font-black text-[#0c831f]">
            <span>★</span>
            <span>{ratingInfo.rating}</span>
            <span className="text-neutral-500 font-normal">({ratingInfo.count})</span>
          </span>

          {pct > 0 && (
            <span className="inline-flex items-center rounded-md bg-[#e8f5e9] px-1.5 py-0.5 text-[10px] font-black text-[#0c831f]">
              {pct}% OFF
            </span>
          )}
        </div>

        {/* Bottom Row: Price & Add Button */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-black text-[#1c1c1c]">
              {formatPaise(price)}
            </span>
            {mrp > price && (
              <span className="text-[11px] text-neutral-400 line-through">
                {formatPaise(mrp)}
              </span>
            )}
          </div>

          <div className="w-20 sm:w-24 shrink-0">
            {inStock ? (
              <AddButton variantId={v.id} />
            ) : (
              <button
                disabled
                className="w-full rounded-xl bg-neutral-100 py-1.5 text-center text-[10px] font-bold text-neutral-400 cursor-not-allowed"
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

export default ProductListItem;

