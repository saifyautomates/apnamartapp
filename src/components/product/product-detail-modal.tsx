"use client";

import { useEffect, useState } from "react";
import { ProductImage } from "./product-image";
import { AddButton } from "./add-button";
import { formatPaise } from "@/lib/money";
import { discountPercent } from "@/lib/pricing";
import { useDelivery } from "@/lib/delivery-context";

export interface OpenProductEventDetail {
  slug: string;
  initialName?: string;
  initialPrice?: number;
  initialMrp?: number;
  initialImage?: string;
}

interface ProductVariantApi {
  id: string;
  name: string;
  packSize: string | null;
  mrpPaise: number;
  sellingPaise: number;
  onlinePricePaise?: number | null;
  priceSource?: string;
  inventory?: { availableQty: number; reservedQty: number } | null;
}

interface ProductDetailApi {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  brand?: { name: string } | null;
  category?: { name: string; slug: string } | null;
  images?: Array<{ url: string }>;
  variants: ProductVariantApi[];
}

export function openProductSheet(detail: OpenProductEventDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-product-sheet", { detail }));
  }
}

export function ProductDetailModal() {
  const { deliveryPromiseText } = useDelivery();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductDetailApi | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantApi | null>(null);
  const [activeImage, setActiveImage] = useState<string>("/placeholder.svg");

  useEffect(() => {
    const handleOpen = async (e: Event) => {
      const customEvent = e as CustomEvent<OpenProductEventDetail>;
      const detail = customEvent.detail;
      if (!detail?.slug) return;

      // Optimistic preview if initial data provided
      if (detail.initialName) {
        setProduct({
          id: `opt-${detail.slug}`,
          name: detail.initialName,
          slug: detail.slug,
          images: detail.initialImage ? [{ url: detail.initialImage }] : [],
          variants: [
            {
              id: `opt-var-${detail.slug}`,
              name: "Standard",
              packSize: "Standard",
              mrpPaise: detail.initialMrp ?? detail.initialPrice ?? 0,
              sellingPaise: detail.initialPrice ?? 0,
            },
          ],
        });
        setActiveImage(detail.initialImage ?? `/images/products/${detail.slug}.jpg`);
      }

      setIsOpen(true);
      setLoading(true);

      try {
        const res = await fetch(`/api/products/${detail.slug}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data?.product) {
            const p = json.data.product as ProductDetailApi;
            setProduct(p);
            if (p.variants && p.variants.length > 0) {
              setSelectedVariant(p.variants[0]);
            }
            const img = p.images?.[0]?.url ?? `/images/products/${p.slug}.jpg`;
            setActiveImage(img);
          }
        }
      } catch {
        /* fallback to existing optimistic */
      } finally {
        setLoading(false);
      }
    };

    const handleClose = () => setIsOpen(false);

    window.addEventListener("open-product-sheet", handleOpen);
    window.addEventListener("close-product-sheet", handleClose);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("open-product-sheet", handleOpen);
      window.removeEventListener("close-product-sheet", handleClose);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (!isOpen || !product) return null;

  const variant = selectedVariant ?? product.variants[0];
  const price = variant ? (variant.onlinePricePaise ?? variant.sellingPaise) : 0;
  const mrp = variant?.mrpPaise ?? price;
  const discount = discountPercent(mrp, price);
  const savings = Math.max(0, mrp - price);
  const sellable = variant?.inventory ? variant.inventory.availableQty - variant.inventory.reservedQty : 100;
  const inStock = sellable > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Darkened Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Responsive Sheet: Bottom Sheet on Mobile, Centered Modal on Desktop */}
      <aside
        className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[580px] w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl z-50 animate-in slide-in-from-bottom sm:zoom-in-95 duration-250 overflow-hidden"
        aria-label={product.name}
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white cursor-grab">
          <div className="h-1.5 w-12 rounded-full bg-neutral-300" />
        </div>

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] text-[#0c831f] border border-[#0c831f]/20 px-2.5 py-0.5 text-[11px] font-black uppercase">
              <span>⚡</span> {deliveryPromiseText || "12 MINS"} in Kota
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
            aria-label="Close product details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Product Details Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 divide-y divide-neutral-100 scroll-touch">
          {/* Top Hero Image Section */}
          <div className="flex flex-col items-center">
            <div className="relative h-56 sm:h-64 w-full rounded-2xl bg-[#fafafa] border border-neutral-100 p-4 flex items-center justify-center">
              {discount > 0 ? (
                <div className="absolute top-3 left-3 bg-[#256fe8] text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs uppercase tracking-tight">
                  {discount}% OFF
                </div>
              ) : null}
              <div className="absolute top-3 right-3 bg-black/60 text-white text-[9px] font-black px-2 py-0.5 rounded-full backdrop-blur-md">
                100% GENUINE
              </div>
              <ProductImage
                src={activeImage}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Thumbnail Carousel if multiple images */}
            {product.images && product.images.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto py-1">
                {product.images.map((img) => (
                  <button
                    key={img.url}
                    onClick={() => setActiveImage(img.url)}
                    className={`h-12 w-12 rounded-xl border p-1 bg-white overflow-hidden transition cursor-pointer ${
                      activeImage === img.url
                        ? "border-[#0c831f] ring-2 ring-[#e8f5e9]"
                        : "border-neutral-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <ProductImage src={img.url} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Product Title & Brand Info */}
          <div className="pt-3 space-y-1">
            {product.brand?.name ? (
              <p className="text-[11px] font-black text-[#0c831f] uppercase tracking-wider">
                {product.brand.name}
              </p>
            ) : null}
            <h2 className="text-base sm:text-xl font-black text-[#1c1c1c] leading-snug">
              {product.name}
            </h2>
            <p className="text-xs text-neutral-500 font-medium">
              Pack of {variant?.packSize ?? variant?.name ?? "Standard"}
            </p>
          </div>

          {/* Unit / Pack Size Variant Selector */}
          {product.variants.length > 1 ? (
            <div className="pt-3">
              <p className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider mb-2">
                Select Pack Size
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = (selectedVariant?.id ?? product.variants[0].id) === v.id;
                  const vPrice = v.onlinePricePaise ?? v.sellingPaise;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`rounded-xl border px-3 py-2 text-left transition flex flex-col cursor-pointer ${
                        isSelected
                          ? "border-[#0c831f] bg-[#e8f5e9]/60 text-[#0c831f] ring-1 ring-[#0c831f]"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      <span className="text-xs font-black">{v.packSize ?? v.name}</span>
                      <span className="text-[11px] font-bold text-[#1c1c1c]">
                        {formatPaise(vPrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Product Highlights & Trust Badges */}
          <div className="pt-3 space-y-2.5">
            <h3 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">
              Why shop from Central Mart Kota?
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-[#f8faf8] p-2.5 border border-neutral-100">
                <span className="text-base">⚡</span>
                <div className="leading-tight">
                  <p className="font-bold text-[#1c1c1c]">Doorstep Delivery</p>
                  <p className="text-[10px] text-neutral-400">Fast delivery across Kota</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-[#f8faf8] p-2.5 border border-neutral-100">
                <span className="text-base">🏷️</span>
                <div className="leading-tight">
                  <p className="font-bold text-[#1c1c1c]">100% Genuine</p>
                  <p className="text-[10px] text-neutral-400">Direct from FMCG brands</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="border-t border-neutral-200 bg-white p-3.5 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sticky bottom-0 z-10 shadow-lg flex items-center justify-between gap-4">
          <div className="leading-tight">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-2xl font-black text-[#1c1c1c]">
                {formatPaise(price)}
              </span>
              {mrp > price ? (
                <span className="text-xs text-neutral-400 line-through">
                  {formatPaise(mrp)}
                </span>
              ) : null}
            </div>
            {savings > 0 ? (
              <p className="text-[11px] font-bold text-[#0c831f] mt-0.5">
                Save {formatPaise(savings)} ({discount}% OFF)
              </p>
            ) : (
              <p className="text-[10px] text-neutral-400">Inclusive of all taxes</p>
            )}
          </div>

          <div className="w-32 sm:w-36 shrink-0">
            {inStock && variant ? (
              <AddButton variantId={variant.id} className="w-full text-sm" />
            ) : (
              <button
                disabled
                className="w-full rounded-xl bg-neutral-100 py-2.5 text-center text-xs font-bold text-neutral-400 cursor-not-allowed uppercase"
              >
                Out of Stock
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default ProductDetailModal;
