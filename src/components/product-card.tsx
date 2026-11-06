import Link from "next/link";
import { effectivePrice, discountPercent } from "@/lib/pricing";
import { Price, Mrp, DiscountBadge, EtaBadge } from "@/components/ui";
import { AddButton, ProductImage } from "@/components/shop";

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

export default function BlinkitProductCard({ v }: { v: VariantCardProps }) {
  const product = v.product;
  const price = effectivePrice(v as never);
  const pct = discountPercent(v.mrpPaise, price);
  const image = product.images?.[0]?.url ?? `/images/products/${product.slug}.jpg`;
  const sellable = v.inventory ? v.inventory.availableQty - v.inventory.reservedQty : 0;
  const inStock = sellable > 0;

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-2.5 sm:p-3.5 shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-200">
      {/* Top Media Container */}
      <div className="relative">
        {/* Badges Row */}
        <div className="absolute left-0 top-0 z-10 flex flex-col gap-1 items-start">
          <EtaBadge minutes={10} className="shadow-xs" />
          {pct > 0 ? <DiscountBadge percent={pct} className="shadow-xs" /> : null}
        </div>

        {/* Product Image */}
        <Link
          href={`/product/${product.slug}`}
          className="block h-32 sm:h-36 w-full overflow-hidden rounded-xl bg-white p-2 flex items-center justify-center"
          aria-label={product.name}
        >
          <ProductImage
            src={image}
            alt={product.name}
            className="h-full w-full object-contain"
          />
        </Link>
      </div>

      {/* Product Details */}
      <div className="mt-2.5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[11px] font-bold text-muted uppercase tracking-wider truncate">
            {product.brand?.name ?? "Grocery"}
          </p>
          <Link
            href={`/product/${product.slug}`}
            className="mt-0.5 line-clamp-2 text-xs sm:text-sm font-bold text-ink leading-snug hover:text-emerald-700 transition"
          >
            {product.name}
          </Link>
        </div>

        <div className="mt-2">
          {/* Pack size pill */}
          <span className="inline-block rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-100">
            {v.packSize ?? v.name ?? "Standard"}
          </span>

          {/* Pricing & Add Button Row */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex flex-col leading-tight">
              <Price paise={price} className="text-sm sm:text-base font-black text-ink" />
              {v.mrpPaise > price ? (
                <Mrp paise={v.mrpPaise} className="text-[11px]" />
              ) : null}
            </div>

            <div className="w-20 sm:w-22 shrink-0">
              {inStock ? (
                <AddButton variantId={v.id} />
              ) : (
                <button
                  disabled
                  className="w-full rounded-lg bg-slate-100 py-1.5 text-center text-[11px] font-bold text-slate-400 cursor-not-allowed uppercase"
                >
                  Sold Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

