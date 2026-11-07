"use client";

import { useEffect, useState } from "react";
import { ProductImage } from "./product-image";
import { AddButton } from "./add-button";
import { formatPaise } from "@/lib/money";
import { discountPercent } from "@/lib/pricing";
import { useDelivery } from "@/lib/delivery-context";
import { api } from "@/lib/api/client";

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
  const [wishlisted, setWishlisted] = useState(false);
  const [product, setProduct] = useState<ProductDetailApi | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantApi | null>(null);
  const [activeImage, setActiveImage] = useState<string>("/images/placeholder-product.svg");
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const handleOpen = async (e: Event) => {
      const customEvent = e as CustomEvent<OpenProductEventDetail>;
      const detail = customEvent.detail;
      if (!detail?.slug) return;

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
              packSize: "1 kg",
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
        /* fallback */
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

  async function handleDirectAddToCart() {
    if (!variant) return;
    setAddingToCart(true);
    try {
      const data = await api("/api/cart", {
        method: "POST",
        body: JSON.stringify({ variantId: variant.id, qty: 1 }),
      });
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: data }));
      setIsOpen(false);
      setTimeout(() => {
        window.dispatchEvent(new Event("open-cart"));
      }, 200);
    } catch {
      /* ignore */
    } finally {
      setAddingToCart(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Screen 2 Mockup Layout */}
      <aside
        className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[540px] w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl z-50 animate-in slide-in-from-bottom sm:zoom-in-95 duration-250 overflow-hidden"
        aria-label={product.name}
      >
        {/* Top Header Bar: Back Arrow, Heart & Share (Matches Screen 2 Mockup) */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 bg-white sticky top-0 z-10">
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-neutral-100/80 text-neutral-800 hover:bg-neutral-200 transition cursor-pointer active:scale-90"
            aria-label="Back"
          >
            ←
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWishlisted(!wishlisted)}
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-neutral-100/80 hover:bg-red-50 text-neutral-700 hover:text-red-500 transition cursor-pointer active:scale-90"
              aria-label="Wishlist"
            >
              <svg
                className={`w-5 h-5 ${wishlisted ? "fill-red-500 text-red-500" : "text-neutral-600"}`}
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

            <button
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: product.name,
                      text: `Check out ${product.name} on Central Mart Kota!`,
                      url: window.location.href,
                    });
                  } catch {
                    /* ignore */
                  }
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-neutral-100/80 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer active:scale-90"
              aria-label="Share"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scroll-touch">
          {/* Hero Product Media */}
          <div className="relative flex flex-col items-center">
            <div className="relative h-60 sm:h-72 w-full rounded-3xl bg-[#fafafa] border border-neutral-100 p-4 flex items-center justify-center">
              {/* Bestseller Badge */}
              <span className="absolute top-3 left-3 bg-[#0c831f] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                Bestseller
              </span>

              <ProductImage
                src={activeImage}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Carousel Dots Underneath (Matches Screen 2 Mockup) */}
            <div className="flex items-center gap-1.5 mt-3">
              <span className="h-2 w-5 rounded-full bg-[#0c831f]" />
              <span className="h-2 w-2 rounded-full bg-neutral-300" />
              <span className="h-2 w-2 rounded-full bg-neutral-300" />
            </div>
          </div>

          {/* Product Title & Pack Size */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-[#1c1c1c] leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-neutral-400 font-semibold">
              ~ {variant?.packSize ?? "1 kg"}
            </p>
          </div>

          {/* Pricing Row with Stepper (Matches Screen 2 Mockup) */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1c1c1c]">
                {formatPaise(price)}
              </span>
              {mrp > price && (
                <span className="text-sm text-neutral-400 line-through">
                  {formatPaise(mrp)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-xs font-black text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* Stepper on Right */}
            {variant && (
              <div className="w-28">
                <AddButton variantId={variant.id} />
              </div>
            )}
          </div>

          {/* Delivery Promise Container (Matches Screen 2 Mockup) */}
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#f2f7fc] border border-neutral-200/80">
            <span className="text-lg">🚚</span>
            <div className="text-xs leading-tight">
              <p className="font-bold text-[#1c1c1c]">
                Get it by Today, 6:00 – 8:00 PM
              </p>
              <p className="text-[11px] text-[#0c831f] font-semibold mt-0.5">
                ⚡ 12-15 MINS Superfast Kota Delivery
              </p>
            </div>
          </div>

          {/* Product Details Paragraph */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-100">
            <h3 className="text-sm font-black text-[#1c1c1c]">Product Details</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {product.description ||
                "Fresh, 100% genuine quality product carefully inspected and packed by Central Mart store partners for superfast delivery across Kota."}
            </p>
          </div>

          {/* 3 Trust Feature Badges (Matches Screen 2 Mockup) */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#f8faf8] border border-neutral-100 text-center">
              <span className="text-lg mb-1">🍃</span>
              <span className="text-[10px] font-bold text-[#1c1c1c] leading-tight">Farm Fresh</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#f8faf8] border border-neutral-100 text-center">
              <span className="text-lg mb-1">🛡️</span>
              <span className="text-[10px] font-bold text-[#1c1c1c] leading-tight">Handpicked Quality</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#f8faf8] border border-neutral-100 text-center">
              <span className="text-lg mb-1">🌾</span>
              <span className="text-[10px] font-bold text-[#1c1c1c] leading-tight">Rich in Nutrients</span>
            </div>
          </div>
        </div>

        {/* Sticky Full-Width Dark Green Bottom Button (Matches Screen 2 Mockup) */}
        <div className="border-t border-neutral-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sticky bottom-0 z-10 shadow-lg">
          <button
            onClick={handleDirectAddToCart}
            disabled={addingToCart}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] py-3.5 text-white font-black text-sm shadow-md active:scale-[0.98] transition cursor-pointer"
          >
            <span>🛒</span>
            <span>Add to Cart – {formatPaise(price)}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

export default ProductDetailModal;
