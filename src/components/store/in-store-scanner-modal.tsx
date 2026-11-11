"use client";

import React, { useState } from "react";
import Image from "next/image";
import { formatPaise } from "@/lib/money";
import { useDelivery } from "@/lib/delivery-context";
import {
  QrCode,
  Search,
  X,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  MapPin,
  Sparkles,
} from "lucide-react";

export interface InStoreScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScannedProduct {
  variantId: string;
  productId: string;
  name: string;
  brand: string;
  categoryName: string;
  mrpPaise: number;
  sellingPaise: number;
  stock: number;
  barcode: string;
  aisle: string;
  imageUrl?: string;
}

const POPULAR_STORE_BARCODES = [
  { label: "Lay's Classic 52g", barcode: "8901491101837", aisle: "Aisle 2 - Bay B" },
  { label: "Coca-Cola 750ml", barcode: "8901764012204", aisle: "Aisle 1 - Chiller 4" },
  { label: "Dove Soap 100g", barcode: "8901030383846", aisle: "Aisle 6 - Bay C" },
  { label: "Maggi Noodles 70g", barcode: "8901058852232", aisle: "Aisle 4 - Bay A" },
];

export function InStoreScannerModal({ isOpen, onClose }: InStoreScannerModalProps) {
  const { storeInfo } = useDelivery();
  const [barcodeInput, setBarcodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ScannedProduct | null>(null);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLookup = async (codeToLookup?: string) => {
    const code = (codeToLookup || barcodeInput).trim();
    if (!code) {
      setError("Please enter or scan a barcode");
      return;
    }

    setLoading(true);
    setError("");
    setProduct(null);
    setAddedSuccess(false);

    try {
      // Query internal product search / barcode lookup
      const res = await fetch(`/api/search?q=${encodeURIComponent(code)}`);
      if (res.ok) {
        const json = await res.json();
        const items = json.data?.items ?? [];
        if (items.length > 0) {
          const item = items[0];
          // Assign aisle based on category
          const categorySlug = item.product?.category?.slug || "";
          const matchedAisle = storeInfo.inStoreAisles.find((a) =>
            categorySlug.includes(a.category) || a.category.includes(categorySlug)
          );
          const aisleStr = matchedAisle
            ? `Aisle ${matchedAisle.aisleNumber} — ${matchedAisle.name}`
            : "Aisle 2 — FMCG Central Display";

          setProduct({
            variantId: item.id,
            productId: item.product?.id || item.id,
            name: item.product?.name || item.name,
            brand: item.product?.brand?.name || "Central Mart Select",
            categoryName: item.product?.category?.name || "Grocery",
            mrpPaise: item.mrpPaise,
            sellingPaise: item.sellingPaise,
            stock: item.inventory?.availableQty ?? 45,
            barcode: code,
            aisle: aisleStr,
            imageUrl: item.product?.images?.[0]?.url || `/images/products/${item.product?.slug}.jpg`,
          });
          setQty(1);
          return;
        }
      }

      // Fallback demo mock if query is arbitrary
      setProduct({
        variantId: `instore-${code}`,
        productId: `instore-prod-${code}`,
        name: `Scanned Item (${code})`,
        brand: "Central Mart FMCG",
        categoryName: "Supermarket Item",
        mrpPaise: 4000,
        sellingPaise: 3500,
        stock: 50,
        barcode: code,
        aisle: "Aisle 2 — Central Display",
        imageUrl: "/images/products/lays-classic-salted-potato-chips.jpg",
      });
      setQty(1);
    } catch (e) {
      setError("Product lookup failed. Please check barcode.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToBag = async () => {
    if (!product) return;
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: product.variantId, qty }),
      });
      window.dispatchEvent(new Event("cart-updated"));
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    } catch {
      setError("Failed to add to bag");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-neutral-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-800 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/30 border border-indigo-400/40 text-white">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                  Physical Store Mode
                </span>
                <h2 className="text-lg font-black text-white tracking-tight">
                  In-Store Barcode Scanner
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-indigo-200 font-medium">
            Scan any product barcode at Central Mart 80 Feet Road to instantly check price, shelf aisle, and bag it!
          </p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-4">
          {/* Barcode Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan or type barcode (e.g. 8901491...)"
                className="w-full rounded-2xl border border-neutral-300 bg-neutral-50/60 pl-10 pr-3 py-2.5 text-xs font-mono font-bold text-[#1c1c1c] focus:bg-white focus:border-indigo-600 focus:outline-hidden transition"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-black shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loading ? "..." : "Scan"}
            </button>
          </form>

          {/* Quick Demo Barcode Chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
              Quick Test Barcodes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_STORE_BARCODES.map((item) => (
                <button
                  key={item.barcode}
                  type="button"
                  onClick={() => {
                    setBarcodeInput(item.barcode);
                    handleLookup(item.barcode);
                  }}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-bold text-neutral-700 hover:border-indigo-400 hover:bg-indigo-50 transition cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600">
              {error}
            </div>
          )}

          {/* Scanned Product Card */}
          {product && (
            <div className="rounded-3xl border border-indigo-200 bg-gradient-to-b from-indigo-50/40 via-white to-white p-4 space-y-3.5 shadow-sm">
              <div className="flex gap-3 items-center">
                <div className="relative h-20 w-20 rounded-2xl border border-neutral-100 bg-white p-1 overflow-hidden shrink-0 flex items-center justify-center">
                  <Image
                    src={product.imageUrl || "/images/products/lays-classic-salted-potato-chips.jpg"}
                    alt={product.name}
                    fill
                    className="object-contain p-1"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-block rounded-md bg-neutral-100 px-2 py-0.5 text-[9px] font-black text-neutral-600 uppercase">
                    {product.brand}
                  </span>
                  <h3 className="text-sm font-black text-[#1c1c1c] leading-snug line-clamp-2 mt-0.5">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-base font-black text-[#1c1c1c]">
                      {formatPaise(product.sellingPaise)}
                    </span>
                    {product.mrpPaise > product.sellingPaise && (
                      <span className="text-xs text-neutral-400 line-through">
                        {formatPaise(product.mrpPaise)}
                      </span>
                    )}
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                      In Stock
                    </span>
                  </div>
                </div>
              </div>

              {/* In-Store Aisle Callout */}
              <div className="rounded-2xl bg-indigo-50 border border-indigo-200/80 p-2.5 flex items-center gap-2 text-xs">
                <MapPin className="w-4 h-4 text-indigo-700 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase block">
                    Physical Store Location
                  </span>
                  <strong className="text-[#1c1c1c] font-black">{product.aisle}</strong>
                </div>
              </div>

              {/* Stepper & Add to In-Store Bag */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center rounded-xl bg-neutral-100 p-1 border border-neutral-200">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-xs font-bold text-neutral-700 shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-black">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-xs font-bold text-neutral-700 shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleAddToBag}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] text-white py-3 px-4 text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{addedSuccess ? "✓ Added to In-Store Bag!" : "Add to In-Store Bag"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span>Central Mart Kota (80 Feet Road)</span>
          <button
            onClick={onClose}
            className="font-bold text-neutral-700 hover:text-black cursor-pointer"
          >
            Done Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

export default InStoreScannerModal;
