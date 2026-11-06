"use client";

import { useState, useRef, useEffect } from "react";
import { formatPaise } from "@/lib/money";

function playScannerBeep(success = true) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = success ? 1800 : 400; // high pitch for success, low buzz for error
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (success ? 0.09 : 0.2));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (success ? 0.09 : 0.2));
  } catch {
    // audio fallback
  }
}

export interface QuickAddCategory {
  id: string;
  name: string;
}

export function BarcodeProductLister({
  categories,
  onProductAdded,
}: {
  categories: QuickAddCategory[];
  onProductAdded?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form State
  const [productData, setProductData] = useState({
    barcode: "",
    name: "",
    brandName: "",
    categoryId: categories[0]?.id || "",
    categoryName: categories[0]?.name || "",
    packSize: "Standard Pack",
    mrp: "100", // in Rupees
    sellingPrice: "92", // in Rupees
    initialStock: "30",
    hsnSac: "21069099",
    gstBps: "500", // 5%
    unit: "pack",
  });

  const [alreadyExists, setAlreadyExists] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleBarcodeLookup = async (codeToLookup: string) => {
    const clean = codeToLookup.trim();
    if (!clean) return;

    setLoadingLookup(true);
    setMessage(null);
    setAlreadyExists(false);

    try {
      const res = await fetch(`/api/admin/products/barcode-lookup?barcode=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (data.ok) {
        playScannerBeep(true);
        if (data.data.exists) {
          // Product already in DB
          setAlreadyExists(true);
          const p = data.data;
          setProductData({
            barcode: p.barcode || clean,
            name: p.name,
            brandName: p.brand || "",
            categoryId: categories.find((c) => c.name === p.categoryName)?.id || categories[0]?.id || "",
            categoryName: p.categoryName,
            packSize: "Standard Pack",
            mrp: (p.mrpPaise / 100).toString(),
            sellingPrice: (p.sellingPaise / 100).toString(),
            initialStock: p.stock.toString(),
            hsnSac: "21069099",
            gstBps: "500",
            unit: "pack",
          });
          setMessage({
            text: `Product already exists in catalogue! Current stock: ${p.stock} units.`,
            type: "error",
          });
        } else {
          // FMCG Master Catalog match or heuristic
          const sug = data.data.suggestion;
          const matchedCatId = categories.find((c) => c.name === sug.matchedCategoryName)?.id || categories[0]?.id || "";

          setProductData({
            barcode: clean,
            name: sug.name,
            brandName: sug.brand,
            categoryId: matchedCatId,
            categoryName: sug.matchedCategoryName,
            packSize: sug.packSize,
            mrp: (sug.mrpPaise / 100).toString(),
            sellingPrice: (sug.suggestedSellingPaise / 100).toString(),
            initialStock: "30",
            hsnSac: sug.hsnSac || "21069099",
            gstBps: sug.gstBps ? sug.gstBps.toString() : "500",
            unit: sug.unit || "pack",
          });

          setMessage({
            text: `✨ Auto-detected "${sug.name}" from FMCG Master Database! Ready to list in 1 click.`,
            type: "success",
          });
        }
      }
    } catch {
      playScannerBeep(false);
      setMessage({ text: "Error looking up barcode", type: "error" });
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleKeyDownScanner = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBarcodeLookup(barcodeInput);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productData.barcode || !productData.name || !productData.categoryId) {
      setMessage({ text: "Please enter barcode, name and category", type: "error" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const csrfData = await csrfRes.json();
      const token = csrfData.data?.csrfToken || csrfData.data?.token || "";

      const res = await fetch("/api/admin/products/quick-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({
          barcode: productData.barcode,
          name: productData.name,
          brandName: productData.brandName,
          categoryId: productData.categoryId,
          packSize: productData.packSize,
          mrpPaise: Math.round(parseFloat(productData.mrp) * 100),
          sellingPaise: Math.round(parseFloat(productData.sellingPrice) * 100),
          initialStock: parseInt(productData.initialStock, 10) || 0,
          hsnSac: productData.hsnSac,
          gstBps: parseInt(productData.gstBps, 10) || 500,
          unit: productData.unit,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        playScannerBeep(true);
        setMessage({
          text: `✅ "${productData.name}" listed successfully with ${productData.initialStock} units stock!`,
          type: "success",
        });

        // Reset for next scan
        setBarcodeInput("");
        setProductData({
          barcode: "",
          name: "",
          brandName: "",
          categoryId: categories[0]?.id || "",
          categoryName: categories[0]?.name || "",
          packSize: "Standard Pack",
          mrp: "100",
          sellingPrice: "92",
          initialStock: "30",
          hsnSac: "21069099",
          gstBps: "500",
          unit: "pack",
        });

        if (onProductAdded) onProductAdded();
        setTimeout(() => barcodeInputRef.current?.focus(), 150);
      } else {
        playScannerBeep(false);
        setMessage({ text: data.error?.message || "Failed to list product", type: "error" });
      }
    } catch {
      playScannerBeep(false);
      setMessage({ text: "Error submitting product to database", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white px-4 py-2.5 text-xs font-black shadow-lg shadow-emerald-950/20 transition active:scale-95 cursor-pointer"
      >
        <span className="text-base">📷</span>
        <span>Scan &amp; List Product (3s)</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-[#0c831f] flex items-center justify-center text-xl font-bold">
                  ⚡
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1c1c1c] tracking-tight">
                    Fast Barcode Product Lister
                  </h2>
                  <p className="text-xs text-neutral-500 font-semibold">
                    Scan any FMCG barcode — auto-fills title, brand &amp; category in 3 seconds!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Barcode Scanner Input */}
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/80">
              <label className="block text-xs font-black uppercase tracking-wider text-emerald-900 mb-1.5 flex items-center justify-between">
                <span>Point Barcode Scanner or Type Barcode</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-300">
                  USB / Laser Scanner Active
                </span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleKeyDownScanner}
                  placeholder="Scan barcode (e.g. 8901058852441 for Maggi, 8901262010053 for Amul)..."
                  className="flex-1 rounded-xl border-2 border-emerald-500 bg-white px-4 py-2.5 text-sm font-black text-[#1c1c1c] outline-hidden placeholder:text-neutral-400 focus:ring-4 focus:ring-emerald-400/20"
                />

                <button
                  type="button"
                  onClick={() => handleBarcodeLookup(barcodeInput)}
                  disabled={loadingLookup || !barcodeInput.trim()}
                  className="rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-5 py-2.5 text-xs font-black transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {loadingLookup ? "Scanning..." : "Lookup Barcode"}
                </button>
              </div>

              {/* Quick Barcode Demo Pills */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[11px] font-bold text-emerald-800">
                <span className="text-neutral-500 font-semibold">Try sample:</span>
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput("8901058852441");
                    handleBarcodeLookup("8901058852441");
                  }}
                  className="bg-white hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md cursor-pointer"
                >
                  Maggi 280g
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput("8901262010053");
                    handleBarcodeLookup("8901262010053");
                  }}
                  className="bg-white hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md cursor-pointer"
                >
                  Amul Butter 500g
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput("8901030384729");
                    handleBarcodeLookup("8901030384729");
                  }}
                  className="bg-white hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md cursor-pointer"
                >
                  Surf Excel 1kg
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput("8901491101837");
                    handleBarcodeLookup("8901491101837");
                  }}
                  className="bg-white hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md cursor-pointer"
                >
                  Aashirvaad Atta 5kg
                </button>
              </div>
            </div>

            {/* Notification Alert */}
            {message && (
              <div
                className={`mt-4 rounded-2xl p-3 text-xs font-bold border flex items-center justify-between ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                <span>{message.text}</span>
                <button
                  type="button"
                  onClick={() => setMessage(null)}
                  className="text-neutral-500 hover:text-black font-black"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Auto-filled Product Form */}
            <form onSubmit={handleSaveProduct} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={productData.name}
                    onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                    placeholder="e.g. Maggi 2-Minute Masala Instant Noodles"
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-bold text-[#1c1c1c] outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={productData.brandName}
                    onChange={(e) => setProductData({ ...productData, brandName: e.target.value })}
                    placeholder="e.g. Nestlé, Amul, ITC"
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold text-[#1c1c1c] outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Category *</label>
                  <select
                    value={productData.categoryId}
                    onChange={(e) => setProductData({ ...productData, categoryId: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold text-[#1c1c1c] outline-hidden focus:border-emerald-600 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Pack Size / Weight
                  </label>
                  <input
                    type="text"
                    value={productData.packSize}
                    onChange={(e) => setProductData({ ...productData, packSize: e.target.value })}
                    placeholder="e.g. 500g, 1L, Pack of 4"
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold text-[#1c1c1c] outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Barcode (EAN-13)
                  </label>
                  <input
                    type="text"
                    required
                    value={productData.barcode}
                    onChange={(e) => setProductData({ ...productData, barcode: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-mono font-bold text-neutral-700 outline-hidden focus:border-emerald-600 bg-neutral-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={productData.mrp}
                    onChange={(e) => setProductData({ ...productData, mrp: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-black text-neutral-700 outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-emerald-800 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={productData.sellingPrice}
                    onChange={(e) => setProductData({ ...productData, sellingPrice: e.target.value })}
                    className="w-full rounded-xl border-2 border-emerald-600 bg-emerald-50/30 px-3 py-2 text-xs font-black text-emerald-900 outline-hidden focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Opening Stock (Units)
                  </label>
                  <input
                    type="number"
                    value={productData.initialStock}
                    onChange={(e) => setProductData({ ...productData, initialStock: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-bold text-[#1c1c1c] outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">GST Rate (%)</label>
                  <select
                    value={productData.gstBps}
                    onChange={(e) => setProductData({ ...productData, gstBps: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold text-[#1c1c1c] outline-hidden focus:border-emerald-600 bg-white"
                  >
                    <option value="0">0% (Exempt / Salt / Grains)</option>
                    <option value="500">5% (Staples / Edible Oil / Milk)</option>
                    <option value="1200">12% (Butter / Ghee / Instant Food)</option>
                    <option value="1800">18% (Biscuits / Cleaning / Personal Care)</option>
                    <option value="2800">28% (Aerated Drinks)</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !productData.barcode || alreadyExists}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white px-6 py-2.5 text-xs font-black shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <span>⚡</span>
                  <span>{submitting ? "Listing..." : "Instant List Product (Enter)"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

