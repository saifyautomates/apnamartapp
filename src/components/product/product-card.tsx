"use client";

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
  const { deliveryBadgeText } = useDelivery();
  const product = v.product;
  const price = effectivePrice(v as never);
  const pct = discountPercent(v.mrpPaise, price);
  const image = product.images?.[0]?.url ?? `/images/products/${product.slug}.jpg`;
  const sellable = v.inventory ? v.inventory.availableQty - v.inventory.reservedQty : 0;
  const inStock = sellable > 0;

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200/70 bg-white p-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full">
      {/* Top Media Container */}
      <div className="relative">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-1 w-full z-10">
          {/* Delivery Promise Badge */}
          <span className="inline-flex items-center gap-1 rounded bg-[#f4f6fb] px-1.5 py-0.5 text-[10px] font-extrabold text-[#333333]">
            <span className="text-[11px] text-[#0c831f]">⚡</span> {deliveryBadgeText ? deliveryBadgeText.replace(/^⚡\s*/, "") : "SAME DAY"}
          </span>

          {/* Discount Badge: e.g. 6% OFF in Blue */}
          {pct > 0 ? (
            <span className="inline-flex items-center rounded-sm bg-[#256fe8] px-1.5 py-0.5 text-[10px] font-black text-white shadow-xs uppercase tracking-tight">
              {pct}% OFF
            </span>
          ) : (
            <span />
          )}
        </div>

        {/* Product Image - Opens Product Sheet In-App on Same Page */}
        <a
          href={`/product/${product.slug}`}
          onClick={(e) => {
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
          }}
          className="block h-28 sm:h-32 w-full overflow-hidden bg-white p-1 my-1 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
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
            onClick={(e) => {
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
            }}
            className="line-clamp-2 text-xs sm:text-sm font-bold text-[#1c1c1c] leading-snug hover:text-[#0c831f] transition min-h-[2.4rem] cursor-pointer"
          >
            {product.name}
          </a>
          <p className="mt-1 text-xs text-neutral-500 font-medium">
            {v.packSize ?? v.name ?? "Standard"}
          </p>
        </div>

        {/* Pricing & Add Button Row */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-1 border-t border-neutral-100/60">
          <div className="flex flex-col leading-tight">
            <span className="text-xs sm:text-sm font-black text-[#1c1c1c]">
              {formatPaise(price)}
            </span>
            {v.mrpPaise > price ? (
              <span className="text-[11px] text-neutral-400 line-through font-normal">
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
                className="w-full rounded-lg bg-neutral-100 py-1.5 text-center text-[10px] font-bold text-neutral-400 cursor-not-allowed uppercase"
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

