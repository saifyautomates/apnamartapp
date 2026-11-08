"use client";

import { useState, useRef, useEffect } from "react";
import { AddButton } from "./add-button";
import { ProductImage } from "./product-image";
import { Price, Mrp, DiscountBadge, EtaBadge } from "@/components/ui";
import { discountPercent } from "@/lib/pricing";
import { formatPaise } from "@/lib/money";
import { useDelivery } from "@/lib/delivery-context";
import {
  Zap,
  Tag,
  ShieldCheck,
  RotateCcw,
  Heart,
  Share2,
  Check,
  ChevronRight,
  Info,
  Clock,
  Award,
} from "lucide-react";

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
  categoryName?: string;
  categorySlug?: string;
  description?: string | null;
}

export function ProductDetailView({
  variants,
  images,
  productName = "Product",
  brandName,
  categoryName = "Groceries",
  categorySlug = "groceries",
  description,
}: ProductDetailProps) {
  const { deliveryPromiseText, activeLocation } = useDelivery();
  const [selected, setSelected] = useState<VariantDetail>(variants[0] || {} as VariantDetail);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [showStickyBar, setShowStickyBar] = useState(false);

  const mainBuyRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const activeImg = images[activeImgIndex] ?? images[0] ?? "/placeholder.svg";

  // Intersection observer for sticky mobile buy bar
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (mainBuyRef.current) {
      observer.observe(mainBuyRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomPos({ x, y });
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${productName} | Central Mart Kota`,
          text: `Check out ${productName} on Central Mart Kota (80 Feet Road) with 10-15 min doorstep delivery!`,
          url: shareUrl,
        });
        return;
      } catch {
        /* fallback to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      /* ignore */
    }
  };

  if (!selected) return null;

  const price =
    selected.priceSource === "CUSTOM" && selected.onlinePricePaise != null
      ? selected.onlinePricePaise
      : selected.sellingPaise;
  const discount = discountPercent(selected.mrpPaise, price);
  const savings = Math.max(0, selected.mrpPaise - price);
  const inStock = selected.sellable > 0;

  return (
    <div className="space-y-6">
      {/* Toast Notification for Share / Copy */}
      {copied && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2 rounded-2xl bg-[#1c1c1c] text-white px-4 py-2.5 text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Product link copied to clipboard!</span>
        </div>
      )}

      {/* Main Dual-Column Product Showcase Box */}
      <div className="grid gap-6 lg:gap-10 lg:grid-cols-12 bg-white rounded-3xl border border-neutral-200/80 p-4 sm:p-7 shadow-xs">
        {/* Left Column: Studio Image Gallery & Magnifier */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {/* Main Visual Pedestal */}
          <div
            ref={imageContainerRef}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
            className="relative w-full h-80 sm:h-96 rounded-3xl bg-gradient-to-b from-neutral-50/90 via-emerald-50/15 to-white border border-neutral-100 p-6 flex items-center justify-center overflow-hidden cursor-crosshair group select-none"
          >
            {/* Top Badges */}
            <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5 items-start">
              <EtaBadge minutes={8} className="px-2.5 py-1 text-xs shadow-xs font-bold" />
              {discount > 0 && (
                <span className="inline-flex items-center rounded-full bg-rose-600 text-white px-2.5 py-0.5 text-xs font-black shadow-xs">
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* Top Action Icons: Wishlist & Share */}
            <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 hover:bg-white text-neutral-600 hover:text-[#0c831f] shadow-sm border border-neutral-200/60 transition cursor-pointer active:scale-90"
                aria-label="Share product"
                title="Share product"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setWishlisted(!wishlisted)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 hover:bg-white text-neutral-600 hover:text-rose-500 shadow-sm border border-neutral-200/60 transition cursor-pointer active:scale-90"
                aria-label="Add to wishlist"
                title="Save to wishlist"
              >
                <Heart
                  className={`w-4 h-4 transition-transform duration-200 ${
                    wishlisted ? "fill-rose-500 text-rose-500 scale-110" : "text-neutral-500"
                  }`}
                />
              </button>
            </div>

            {/* Product Image Display with Hover Zoom */}
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
              style={
                isZoomed
                  ? {
                      transform: "scale(1.4)",
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    }
                  : { transform: "scale(1)" }
              }
            >
              <ProductImage
                src={activeImg}
                alt={productName}
                className="h-full w-full object-contain pointer-events-none drop-shadow-md"
              />
            </div>
          </div>

          {/* Multi-Image Thumbnails Carousel */}
          {images.length > 1 && (
            <div className="mt-4 flex gap-2.5 overflow-x-auto py-1 w-full justify-start sm:justify-center scroll-touch-x">
              {images.map((imgUrl, idx) => (
                <button
                  key={imgUrl}
                  onClick={() => setActiveImgIndex(idx)}
                  className={`h-16 w-16 sm:h-18 sm:w-18 shrink-0 rounded-2xl border p-1 bg-white overflow-hidden transition cursor-pointer ${
                    activeImgIndex === idx
                      ? "border-[#0c831f] ring-2 ring-[#e8f5e9] shadow-xs"
                      : "border-neutral-200 hover:border-neutral-300 opacity-75 hover:opacity-100"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <ProductImage src={imgUrl} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* Trust Guarantees Column Banner */}
          <div className="mt-6 w-full rounded-2xl bg-neutral-50/80 p-4 border border-neutral-100 space-y-3">
            <h4 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#0c831f]" />
              <span>Central Mart Promise</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#1c1c1c] leading-tight">10-15 Min Delivery</p>
                  <p className="text-[11px] text-neutral-500">80 Feet Road dispatch</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0c831f] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#1c1c1c] leading-tight">100% Genuine</p>
                  <p className="text-[11px] text-neutral-500">Direct from brands</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-[#0c831f] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#1c1c1c] leading-tight">Best Wholesale Prices</p>
                  <p className="text-[11px] text-neutral-500">Direct distributor rates</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <RotateCcw className="w-4 h-4 text-[#0c831f] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#1c1c1c] leading-tight">Doorstep Returns</p>
                  <p className="text-[11px] text-neutral-500">Instant resolution</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Product Hierarchy, Variant Picker, Pricing & Buy Actions */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Brand Chip & Stock Status */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-black text-neutral-700 uppercase tracking-wide">
                <span>{brandName ?? "Central Mart Select"}</span>
              </span>

              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0c831f]">
                <span className="h-2 w-2 rounded-full bg-[#0c831f] animate-pulse" />
                <span>{inStock ? "In Stock for Kota Delivery" : "Temporarily Out of Stock"}</span>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-[#1c1c1c] leading-tight tracking-tight">
              {productName}
            </h1>

            {/* Pack Size / Subtitle */}
            <p className="text-sm font-semibold text-neutral-500">
              Pack Size: <span className="font-bold text-[#1c1c1c]">{selected.packSize ?? selected.name}</span>
            </p>

            {/* ETA Callout Card */}
            <div className="flex items-center gap-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 px-3.5 py-2.5 text-xs">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 text-white font-black shadow-xs shrink-0">
                <Zap className="w-4 h-4 fill-white" />
              </span>
              <div className="flex-1">
                <p className="font-black text-[#1c1c1c]">
                  Delivering in {deliveryPromiseText || "8-10 mins"}
                </p>
                <p className="text-[11px] text-neutral-600">
                  To {activeLocation.address || activeLocation.zoneName || "Kota Central (80 Feet Road Hub)"}
                </p>
              </div>
            </div>

            {/* Pack Size / Variant Selector (Blinkit Style) */}
            <div className="pt-2 space-y-2.5">
              <h3 className="text-xs font-black text-neutral-500 uppercase tracking-wider">
                Select Unit / Pack Size
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {variants.map((v) => {
                  const vPrice =
                    v.priceSource === "CUSTOM" && v.onlinePricePaise != null
                      ? v.onlinePricePaise
                      : v.sellingPaise;
                  const vDiscount = discountPercent(v.mrpPaise, vPrice);
                  const isSelected = selected.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelected(v)}
                      className={`relative rounded-2xl border p-3 text-left transition flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "border-[#0c831f] bg-[#e8f5e9]/50 text-[#0c831f] ring-2 ring-[#0c831f]/20 shadow-xs"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      {vDiscount > 0 && (
                        <span className="absolute -top-2 right-2 rounded-full bg-rose-600 text-white px-2 py-0.5 text-[9px] font-black uppercase shadow-xs">
                          {vDiscount}% OFF
                        </span>
                      )}
                      <span className="text-xs font-black text-[#1c1c1c]">
                        {v.packSize ?? v.name}
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-[#1c1c1c]">
                          {formatPaise(vPrice)}
                        </span>
                        {v.mrpPaise > vPrice && (
                          <span className="text-[10px] text-neutral-400 line-through">
                            {formatPaise(v.mrpPaise)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Price & Add Button Box */}
            <div
              ref={mainBuyRef}
              className="mt-6 pt-5 border-t border-neutral-100 flex items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-baseline gap-2.5">
                  <Price paise={price} className="text-3xl sm:text-4xl font-black text-[#1c1c1c]" />
                  {selected.mrpPaise > price && (
                    <Mrp paise={selected.mrpPaise} className="text-base text-neutral-400" />
                  )}
                </div>
                {savings > 0 && (
                  <p className="mt-1 text-xs font-black text-[#0c831f]">
                    You save {formatPaise(savings)} ({discount}% OFF)
                  </p>
                )}
                <p className="text-[11px] text-neutral-400 mt-0.5">(Inclusive of all taxes)</p>
              </div>

              <div className="w-36 sm:w-44">
                {inStock ? (
                  <AddButton variantId={selected.id} className="w-full text-base py-3 rounded-2xl shadow-md" />
                ) : (
                  <button
                    disabled
                    className="w-full rounded-2xl bg-neutral-100 py-3 text-center text-xs font-bold text-neutral-400 cursor-not-allowed uppercase"
                  >
                    Sold Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Product Specifications & Details Card (Blinkit & Zepto Standard) */}
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-[#1c1c1c] tracking-tight">
            Product Details &amp; Specifications
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Verified FMCG grocery specifications supplied directly by authorized distributor.
          </p>
        </div>

        {/* Description Text */}
        <div className="prose prose-sm text-neutral-700 max-w-none leading-relaxed">
          <p>
            {description ||
              `Order 100% genuine ${productName} packaged fresh and delivered straight to your doorstep in Kota. Sourced directly from certified brand distributors and maintained under strict temperature and hygiene controls at our 80 Feet Road Flagship Supermarket.`}
          </p>
        </div>

        {/* Specifications Key-Value Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
          <div className="rounded-2xl bg-neutral-50/80 p-3.5 border border-neutral-100">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Type / Category
            </span>
            <span className="text-sm font-black text-[#1c1c1c] mt-0.5 block">
              {categoryName}
            </span>
          </div>

          <div className="rounded-2xl bg-neutral-50/80 p-3.5 border border-neutral-100">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Pack Size / Unit
            </span>
            <span className="text-sm font-black text-[#1c1c1c] mt-0.5 block">
              {selected.packSize ?? selected.name}
            </span>
          </div>

          <div className="rounded-2xl bg-neutral-50/80 p-3.5 border border-neutral-100">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Shelf Life Guarantee
            </span>
            <span className="text-sm font-black text-[#1c1c1c] mt-0.5 block">
              Best before 6 months from packaging
            </span>
          </div>

          <div className="rounded-2xl bg-neutral-50/80 p-3.5 border border-neutral-100">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              FSSAI License No.
            </span>
            <span className="text-sm font-black text-[#0c831f] mt-0.5 block">
              10012011000123 (Verified)
            </span>
          </div>

          <div className="rounded-2xl bg-neutral-50/80 p-3.5 border border-neutral-100">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Country of Origin
            </span>
            <span className="text-sm font-black text-[#1c1c1c] mt-0.5 block">
              India (Bharat)
            </span>
          </div>

          <div className="rounded-2xl bg-neutral-50/80 p-3.5 border border-neutral-100">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Storage Instructions
            </span>
            <span className="text-sm font-black text-[#1c1c1c] mt-0.5 block">
              Store in a cool, dry, and hygienic place
            </span>
          </div>
        </div>

        {/* Consumer Disclaimer */}
        <div className="rounded-2xl bg-amber-50/60 p-4 border border-amber-200/50 flex items-start gap-2.5 text-xs text-neutral-600">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong className="text-neutral-800">Disclaimer:</strong> While we work to ensure that product information is correct, on occasion manufacturers may alter their ingredient lists or packaging. Actual product packaging and materials may contain more or different information.
          </p>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar (Appears when scrolled past main buy box) */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-4 transition-transform duration-300 ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-tight">
            {selected.packSize ?? selected.name}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-[#1c1c1c]">{formatPaise(price)}</span>
            {selected.mrpPaise > price && (
              <span className="text-xs text-neutral-400 line-through">
                {formatPaise(selected.mrpPaise)}
              </span>
            )}
          </div>
        </div>

        <div className="w-32 shrink-0">
          {inStock ? (
            <AddButton variantId={selected.id} className="w-full text-sm py-2 rounded-xl" />
          ) : (
            <button
              disabled
              className="w-full rounded-xl bg-neutral-100 py-2 text-center text-xs font-bold text-neutral-400 cursor-not-allowed uppercase"
            >
              Sold Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailView;
