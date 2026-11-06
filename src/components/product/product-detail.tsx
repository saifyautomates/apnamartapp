"use client";

import { useState } from "react";
import { AddButton } from "./add-button";
import { ProductImage } from "./product-image";
import { Price, Mrp, DiscountBadge, EtaBadge } from "@/components/ui";
import { discountPercent } from "@/lib/pricing";
import { formatPaise } from "@/lib/money";

export type VariantDetail = {
  id: string;
  name: string;
  packSize: string | null;
  mrpPaise: number;
  sellingPaise: number;
  onlinePricePaise: number | null;
  priceSource: string;
  sellable: number;
};

export interface ProductDetailProps {
  variants: VariantDetail[];
  images: string[];
  productName?: string;
  brandName?: string | null;
}

export function ProductDetailView({
  variants,
  images,
  productName,
  brandName,
}: ProductDetailProps) {
  const [selected, setSelected] = useState<VariantDetail>(variants[0]);
  const [activeImg, setActiveImg] = useState(images[0] ?? "/placeholder.svg");

  if (!selected) return null;
  const price =
    selected.priceSource === "CUSTOM" && selected.onlinePricePaise != null
      ? selected.onlinePricePaise
      : selected.sellingPaise;
  const discount = discountPercent(selected.mrpPaise, price);
  const savings = Math.max(0, selected.mrpPaise - price);
  const inStock = selected.sellable > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-12 bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-8 shadow-xs">
      {/* Media / Image Gallery (Left Column) */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="relative w-full h-72 sm:h-96 rounded-2xl bg-white border border-neutral-100 p-6 flex items-center justify-center">
          <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5 items-start">
            <EtaBadge minutes={8} className="px-2.5 py-1 text-xs" />
            {discount > 0 ? (
              <DiscountBadge percent={discount} className="px-2 py-0.5 text-xs" />
            ) : null}
          </div>
          <ProductImage
            src={activeImg}
            alt={productName ?? "Product Image"}
            className="h-full w-full object-contain"
          />
        </div>

        {images.length > 1 ? (
          <div className="mt-4 flex gap-2.5 overflow-x-auto py-1">
            {images.map((u) => (
              <button
                key={u}
                onClick={() => setActiveImg(u)}
                className={`h-16 w-16 rounded-xl border p-1 bg-white overflow-hidden transition cursor-pointer ${
                  activeImg === u
                    ? "border-[#0c831f] ring-2 ring-[#e8f5e9]"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
                aria-label="View product image"
              >
                <ProductImage src={u} alt="" className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Details & Purchase (Right Column) */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
        <div>
          {/* Breadcrumb & Brand */}
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
            <span>{brandName ?? "Grocery"}</span>
            <span>•</span>
            <span className="text-[#0c831f]">In Stock</span>
          </div>

          <h1 className="mt-1.5 text-xl sm:text-3xl font-black text-[#1c1c1c] leading-tight">
            {productName}
          </h1>

          {/* Unit / Pack Variant Selector */}
          <div className="mt-5">
            <h3 className="text-xs font-black text-neutral-500 uppercase tracking-wider mb-2.5">
              Select Unit / Pack Size
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {variants.map((v) => {
                const vPrice =
                  v.priceSource === "CUSTOM" && v.onlinePricePaise != null
                    ? v.onlinePricePaise
                    : v.sellingPaise;
                const isSelected = selected.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelected(v)}
                    className={`rounded-xl border px-4 py-2.5 text-left transition flex flex-col cursor-pointer ${
                      isSelected
                        ? "border-[#0c831f] bg-[#e8f5e9]/50 text-[#0c831f] ring-1 ring-[#0c831f]"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                    }`}
                  >
                    <span className="text-xs font-black">{v.packSize ?? v.name}</span>
                    <span className="text-[11px] font-bold text-[#1c1c1c] mt-0.5">
                      {formatPaise(vPrice)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price & Discount block */}
          <div className="mt-6 pt-5 border-t border-neutral-100 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2.5">
                <Price paise={price} className="text-2xl sm:text-3xl font-black text-[#1c1c1c]" />
                {selected.mrpPaise > price ? (
                  <Mrp paise={selected.mrpPaise} className="text-base" />
                ) : null}
              </div>
              {savings > 0 ? (
                <p className="mt-1 text-xs font-black text-[#0c831f]">
                  You save {formatPaise(savings)} ({discount}% OFF)
                </p>
              ) : null}
              <p className="text-[11px] text-neutral-400 mt-0.5">(Inclusive of all taxes)</p>
            </div>

            <div className="w-32 sm:w-36">
              {inStock ? (
                <AddButton variantId={selected.id} className="w-full text-sm" />
              ) : (
                <button
                  disabled
                  className="w-full rounded-xl bg-neutral-100 py-3 text-center text-xs font-bold text-neutral-400 cursor-not-allowed uppercase"
                >
                  Out of Stock
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Blinkit Trust Badges */}
        <div className="rounded-2xl bg-[#f4f7fc] p-4 space-y-3 border border-neutral-100">
          <h4 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">
            Why shop from Blinkit?
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-xs font-bold text-[#1c1c1c]">Superfast Delivery</p>
                <p className="text-[11px] text-neutral-500">Get your order in 8 mins</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏷️</span>
              <div>
                <p className="text-xs font-bold text-[#1c1c1c]">Best Prices &amp; Offers</p>
                <p className="text-[11px] text-neutral-500">Direct from top brands</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💯</span>
              <div>
                <p className="text-xs font-bold text-[#1c1c1c]">Wide Assortment</p>
                <p className="text-[11px] text-neutral-500">Over 10,000+ essentials</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailView;
