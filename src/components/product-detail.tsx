"use client";

import { useState } from "react";
import { AddButton, ProductImage } from "@/components/shop";
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

export default function ProductDetailClient({
  variants,
  images,
  productName,
}: {
  variants: VariantDetail[];
  images: string[];
  productName?: string;
}) {
  const [selected, setSelected] = useState<VariantDetail>(variants[0]);
  const [activeImg, setActiveImg] = useState(images[0] ?? "/placeholder.svg");

  if (!selected) return null;
  const price = selected.priceSource === "CUSTOM" && selected.onlinePricePaise != null ? selected.onlinePricePaise : selected.sellingPaise;
  const discount = discountPercent(selected.mrpPaise, price);
  const savings = Math.max(0, selected.mrpPaise - price);

  return (
    <div className="grid gap-6 md:grid-cols-2 bg-white rounded-3xl border border-slate-100 p-5 sm:p-8 shadow-xs">
      {/* Media / Image Gallery */}
      <div className="flex flex-col items-center">
        <div className="relative w-full h-72 sm:h-96 rounded-2xl bg-white border border-slate-100 p-6 flex items-center justify-center">
          <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5 items-start">
            <EtaBadge minutes={10} className="px-2.5 py-1 text-xs" />
            {discount > 0 ? <DiscountBadge percent={discount} className="px-2 py-0.5 text-xs" /> : null}
          </div>
          <ProductImage
            src={activeImg}
            alt={productName ?? "Product Image"}
            className="h-full w-full object-contain"
          />
        </div>

        {images.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto py-1">
            {images.map((u) => (
              <button
                key={u}
                onClick={() => setActiveImg(u)}
                className={`h-16 w-16 rounded-xl border p-1 bg-white overflow-hidden transition ${
                  activeImg === u ? "border-emerald-600 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300"
                }`}
                aria-label="View product image"
              >
                <ProductImage src={u} alt="" className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Details & Purchase */}
      <div className="flex flex-col justify-between space-y-6">
        <div>
          {/* Variant Selector Pills */}
          <div>
            <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-2">Select Unit / Pack</h3>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => {
                const vPrice = v.priceSource === "CUSTOM" && v.onlinePricePaise != null ? v.onlinePricePaise : v.sellingPaise;
                const isSelected = selected.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelected(v)}
                    className={`rounded-xl border px-3.5 py-2 text-left transition flex flex-col ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-1 ring-emerald-600"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-black">{v.packSize ?? v.name}</span>
                    <span className="text-[11px] font-bold text-ink mt-0.5">{formatPaise(vPrice)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price & Discount block */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-baseline gap-3">
              <Price paise={price} className="text-3xl font-black text-ink" />
              {selected.mrpPaise > price ? (
                <>
                  <Mrp paise={selected.mrpPaise} className="text-base" />
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800">
                    Save {formatPaise(savings)}
                  </span>
                </>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] text-muted font-medium">(Inclusive of all taxes)</p>
          </div>

          {/* Stock Status */}
          <div className="mt-3 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${selected.sellable > 0 ? "bg-emerald-500" : "bg-red-400"}`} />
            <span className="text-xs font-bold text-slate-700">
              {selected.sellable > 0 ? `In Stock (Delivering in 10 minutes)` : "Currently Out of Stock"}
            </span>
          </div>

          {/* Add to Cart CTA */}
          <div className="mt-6 max-w-xs">
            {selected.sellable > 0 ? (
              <AddButton variantId={selected.id} className="h-11 flex items-center" />
            ) : (
              <button disabled className="w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-400 cursor-not-allowed">
                Out of Stock
              </button>
            )}
          </div>
        </div>

        {/* Why shop from Blinkit guarantees */}
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
          <h4 className="text-xs font-black text-ink uppercase tracking-wider">Why order from us?</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 text-base">⚡</span>
              <div>
                <p className="font-bold text-ink">Superfast 10 Mins</p>
                <p className="text-[11px] text-muted">Direct from dark store</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 text-base">🛡️</span>
              <div>
                <p className="font-bold text-ink">Best Prices</p>
                <p className="text-[11px] text-muted">Daily offers & MRP off</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-base">🔄</span>
              <div>
                <p className="font-bold text-ink">Easy Return</p>
                <p className="text-[11px] text-muted">Doorstep replacement</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-500 text-base">💯</span>
              <div>
                <p className="font-bold text-ink">Authentic Quality</p>
                <p className="text-[11px] text-muted">100% genuine brand</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
