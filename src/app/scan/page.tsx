"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPaise } from "@/lib/money";
import { openLoginModal } from "@/components/auth/login-modal";
import {
  QrCode,
  Barcode,
  Camera,
  CheckCircle2,
  Sparkles,
  Search,
  ShoppingCart,
  ArrowLeft,
  Store,
  MapPin,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface ScannedProduct {
  found: boolean;
  variantId: string;
  productId: string;
  name: string;
  productName: string;
  slug: string;
  brand: string;
  categoryName: string;
  categorySlug: string;
  packSize: string;
  mrpPaise: number;
  sellingPaise: number;
  stock: number;
  inStock: boolean;
  aisle: string;
  image: string;
  barcode: string;
}

const SAMPLE_BARCODES = [
  { label: "Lay's Salted 52g", code: "8901491101837" },
  { label: "Coca-Cola 750ml", code: "8901764012210" },
  { label: "Dove Soap 100g", code: "8901030383452" },
  { label: "Surf Excel 1kg", code: "8901030733851" },
  { label: "Maggi 2-Min Noodles", code: "8901058852444" },
];

export default function InStoreScanPage() {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scannedItem, setScannedItem] = useState<ScannedProduct | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [hasWebcam, setHasWebcam] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Play audio chime on successful scan
  const playScanBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      /* ignore */
    }
  };

  const refreshCart = async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setCartCount(json.data.count ?? 0);
          setCartTotal(json.data.subtotalPaise ?? 0);
        }
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    refreshCart();
    window.addEventListener("cart-updated", refreshCart);
    return () => window.removeEventListener("cart-updated", refreshCart);
  }, []);

  const handleLookup = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;
    setLoading(true);
    setError("");
    setScannedItem(null);

    try {
      const res = await fetch(`/api/products/barcode-lookup?barcode=${encodeURIComponent(cleanCode)}`);
      const json = await res.json();
      if (json.data?.found) {
        playScanBeep();
        setScannedItem(json.data);
      } else {
        setError(json.data?.message || "Product not found. Please scan another shelf barcode.");
      }
    } catch {
      setError("Failed to look up barcode. Check internet connectivity.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (variantId: string) => {
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const csrfData = await csrfRes.json();
      const token = csrfData.data?.csrfToken || "";

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({ variantId, qty: 1 }),
      });

      if (res.ok) {
        setAddedSuccess(true);
        setTimeout(() => setAddedSuccess(false), 2500);
        window.dispatchEvent(new Event("cart-updated"));
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson?.error?.message || "Failed to add to cart");
      }
    } catch {
      setError("Error adding item to cart");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-3 sm:px-4 py-4 space-y-4 pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-neutral-200 text-neutral-700 hover:text-[#0c831f] shadow-xs active:scale-95 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#064221] uppercase tracking-wider">
            <Store className="w-3.5 h-3.5 text-[#0c831f]" />
            <span>Central Mart Physical Store</span>
          </div>
          <h1 className="text-base sm:text-lg font-black text-[#1c1c1c] tracking-tight">
            In-Store Scan &amp; Go
          </h1>
        </div>
        <button
          onClick={() => window.dispatchEvent(new Event("open-cart"))}
          className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-neutral-200 text-neutral-700 hover:text-[#0c831f] shadow-xs active:scale-95 transition"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Store Location Status Badge */}
      <div className="flex items-center justify-between rounded-2xl bg-emerald-50/80 border border-emerald-200/80 p-3 text-xs text-neutral-700">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#0c831f] shrink-0" />
          <div>
            <p className="font-black text-[#1c1c1c]">80 Feet Road Flagship Supermarket, Kota</p>
            <p className="text-[11px] text-neutral-500">Fast digital billing · Skip all queue lines</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-[#064221] px-2 py-0.5 text-[10px] font-black shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0c831f] animate-pulse" />
          <span>Active</span>
        </span>
      </div>

      {/* Simulated / Real Camera Viewport */}
      <div className="relative overflow-hidden rounded-3xl bg-neutral-950 text-white p-6 shadow-xl border border-neutral-800 flex flex-col items-center justify-center min-h-[260px]">
        {/* Animated Scanning Laser Line */}
        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#22c55e] to-transparent shadow-[0_0_12px_#22c55e] animate-pulse" />

        {/* Viewfinder Target Framing */}
        <div className="relative h-44 w-64 border-2 border-dashed border-emerald-400/70 rounded-2xl flex flex-col items-center justify-center p-4 text-center bg-emerald-950/20 backdrop-blur-xs">
          <div className="absolute top-2 left-2 h-4 w-4 border-t-2 border-l-2 border-emerald-400" />
          <div className="absolute top-2 right-2 h-4 w-4 border-t-2 border-r-2 border-emerald-400" />
          <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-emerald-400" />
          <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-emerald-400" />

          <Barcode className="w-12 h-12 text-emerald-400/90 mb-1" />
          <span className="text-xs font-black tracking-wide text-white">
            Point Camera at Product Barcode
          </span>
          <span className="text-[10px] text-emerald-200/80 mt-0.5">
            Hold steady inside the green frame
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-400">
          <Sparkles className="w-3.5 h-3.5 text-[#facc15]" />
          <span>Instant FMCG barcode resolution powered by Central Mart</span>
        </div>
      </div>

      {/* Manual Barcode Search Input & Quick Chips */}
      <div className="rounded-3xl bg-white border border-neutral-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <label className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider block">
          Or Enter Barcode Manually
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup(barcodeInput);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="e.g. 8901491101837"
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm font-mono focus:border-[#0c831f] focus:outline-hidden focus:ring-2 focus:ring-[#0c831f]/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !barcodeInput.trim()}
            className="rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-5 py-3 text-xs font-black shadow-md active:scale-95 transition disabled:opacity-50 cursor-pointer shrink-0"
          >
            {loading ? "Scanning…" : "Scan"}
          </button>
        </form>

        {/* Quick Test Barcode Pills */}
        <div className="pt-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
            Quick Test Shelf Barcodes:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_BARCODES.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setBarcodeInput(item.code);
                  handleLookup(item.code);
                }}
                className="rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-emerald-50 hover:border-emerald-300 px-2.5 py-1 text-[11px] font-bold text-neutral-700 transition cursor-pointer active:scale-95"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scanned Product Card with Live Store Stock & Aisle Location */}
      {scannedItem && (
        <div className="rounded-3xl bg-white border border-emerald-200 shadow-xl p-4 sm:p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start gap-4">
            <div className="relative h-24 w-24 shrink-0 rounded-2xl bg-neutral-50 p-2 border border-neutral-100 flex items-center justify-center">
              <Image
                src={scannedItem.image}
                alt={scannedItem.name}
                fill
                className="object-contain p-1"
                unoptimized
              />
            </div>

            <div className="flex-1 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md inline-block">
                {scannedItem.brand}
              </span>
              <h2 className="text-sm sm:text-base font-black text-[#1c1c1c] leading-snug">
                {scannedItem.name}
              </h2>
              <p className="text-xs text-neutral-500 font-semibold">
                Pack Size: <span className="font-bold text-neutral-800">{scannedItem.packSize}</span>
              </p>

              {/* Physical Aisle & Store Inventory Badge */}
              <div className="pt-1 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#064221]">
                  <span>📍</span>
                  <span>{scannedItem.aisle}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0c831f]" />
                  <span>
                    {scannedItem.inStock
                      ? `In Stock (${scannedItem.stock} available on shelf)`
                      : "Out of Stock"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Add to In-Store Basket */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-[#1c1c1c]">
                  {formatPaise(scannedItem.sellingPaise)}
                </span>
                {scannedItem.mrpPaise > scannedItem.sellingPaise && (
                  <span className="text-xs text-neutral-400 line-through">
                    {formatPaise(scannedItem.mrpPaise)}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-neutral-400">Inclusive of all taxes</span>
            </div>

            <button
              onClick={() => handleAddToCart(scannedItem.variantId)}
              disabled={!scannedItem.inStock}
              className="flex items-center gap-1.5 rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-5 py-3 text-xs font-black shadow-md active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{addedSuccess ? "Added to Basket! ✓" : "Add to In-Store Basket"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Persistent Floating Bottom Bar for In-Store Checkout */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-3 right-3 max-w-2xl mx-auto z-40 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#042c16] via-[#064221] to-[#0a582c] text-white p-3.5 rounded-3xl shadow-2xl border border-emerald-400/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold">
                🛍️
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-emerald-200 tracking-wide">
                  In-Store Basket · {cartCount} {cartCount === 1 ? "Item" : "Items"}
                </p>
                <p className="text-base font-black tracking-tight">{formatPaise(cartTotal)}</p>
              </div>
            </div>

            <Link
              href="/checkout"
              className="flex items-center gap-1.5 rounded-2xl bg-[#facc15] hover:bg-[#eab308] text-neutral-950 px-4 py-2.5 text-xs font-black shadow-md active:scale-95 transition cursor-pointer"
            >
              <span>Instant Self-Pay</span>
              <span className="text-sm">→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

