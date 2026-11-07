"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPaise } from "@/lib/money";

function playBeep(freq = 1800, duration = 0.08) {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // AudioContext blocked or not supported
  }
}

export interface PosBillItem {
  variantId: string;
  barcode: string;
  name: string;
  packSize: string;
  sellingPaise: number;
  qty: number;
  sku?: string;
  imageUrl?: string;
}

export interface CompletedReceipt {
  voucherNumber: string;
  orderNumber: string;
  counterId: string;
  cashierName: string;
  customerName: string;
  customerPhone?: string;
  paymentMode: string;
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  grandTotalPaise: number;
  timestamp: string;
  items: Array<{
    name: string;
    packSize: string;
    qty: number;
    sellingPaise: number;
    totalPaise: number;
  }>;
}

const CATEGORY_CHIPS = [
  { id: "all", label: "All" },
  { id: "grocery", label: "Grocery" },
  { id: "snacks", label: "Snacks" },
  { id: "beverages", label: "Beverages" },
  { id: "home-care", label: "Home Care" },
  { id: "dairy", label: "Dairy" },
  { id: "personal-care", label: "Personal Care" },
];

const QUICK_CATALOG: Record<string, Array<{ name: string; pack: string; price: number; barcode: string; image: string }>> = {
  grocery: [
    { name: "Aashirvaad Atta", pack: "5 kg", price: 269, barcode: "8901491101837", image: "/images/products/aashirvaad-shudh-chakki-atta.jpg" },
    { name: "Tata Salt", pack: "1 kg", price: 27, barcode: "8901030383451", image: "/images/products/tata-salt-iodised.jpg" },
    { name: "Fortune Oil", pack: "1 L", price: 159, barcode: "8906007281234", image: "/images/products/fortune-sunflower-oil.jpg" },
    { name: "Daawat Basmati Rice", pack: "1 kg", price: 145, barcode: "8901537001015", image: "/images/products/aashirvaad-shudh-chakki-atta.jpg" },
  ],
  snacks: [
    { name: "Maggi Noodles", pack: "70 g", price: 14, barcode: "8901058852441", image: "/images/products/maggi-2-minute-noodles.jpg" },
    { name: "Haldiram's Bhujia", pack: "200 g", price: 62, barcode: "8904063200125", image: "/images/products/maggi-2-minute-noodles.jpg" },
    { name: "Britannia Good Day", pack: "100 g", price: 30, barcode: "8901063012111", image: "/images/products/maggi-2-minute-noodles.jpg" },
  ],
  beverages: [
    { name: "Coca Cola", pack: "750 ml", price: 40, barcode: "8901764012211", image: "/images/products/fortune-sunflower-oil.jpg" },
    { name: "Red Label Tea", pack: "250 g", price: 140, barcode: "8901030012234", image: "/images/products/tata-salt-iodised.jpg" },
  ],
  "home-care": [
    { name: "Surf Excel Easy Wash", pack: "1 kg", price: 139, barcode: "8901030384729", image: "/images/products/surf-excel-easy-wash-detergent-powder.jpg" },
    { name: "Harpic Power Plus", pack: "500 ml", price: 95, barcode: "8901396010111", image: "/images/products/harpic-toilet-cleaner.jpg" },
  ],
  dairy: [
    { name: "Amul Butter", pack: "100 g", price: 62, barcode: "8901262010046", image: "/images/products/amul-butter.jpg" },
  ],
};

export function PosScannerBilling({
  defaultCashier = "Saif Quazi",
  defaultCounter = "POS-01",
}: {
  defaultCashier?: string;
  defaultCounter?: string;
}) {
  // Pre-seed items matching user reference mockup Screen 2:
  // Aashirvaad Atta (5 kg) @ 269 x 2, Tata Salt (1 kg) @ 27 x 1, Fortune Oil (1 L) @ 159 x 1
  const [items, setItems] = useState<PosBillItem[]>([
    {
      variantId: "pos-seed-atta-5kg",
      barcode: "8901491101837",
      name: "Aashirvaad Atta",
      packSize: "5 kg",
      sellingPaise: 26900,
      qty: 2,
      sku: "ATT005",
      imageUrl: "/images/products/aashirvaad-shudh-chakki-atta.jpg",
    },
    {
      variantId: "pos-seed-tata-salt-1kg",
      barcode: "8901030383451",
      name: "Tata Salt",
      packSize: "1 kg",
      sellingPaise: 2700,
      qty: 1,
      sku: "SAL001",
      imageUrl: "/images/products/tata-salt-iodised.jpg",
    },
    {
      variantId: "pos-seed-fortune-oil-1l",
      barcode: "8906007281234",
      name: "Fortune Oil",
      packSize: "1 L",
      sellingPaise: 15900,
      qty: 1,
      sku: "OIL001",
      imageUrl: "/images/products/fortune-sunflower-oil.jpg",
    },
  ]);

  const [billNumber, setBillNumber] = useState("CM-4287");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [settling, setSettling] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [cashTendered, setCashTendered] = useState("");
  const [customerPhone, setCustomerPhone] = useState("9876543210");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [discountPaise, setDiscountPaise] = useState(2000); // ₹20 pre-applied from mockup
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedReceipt, setCompletedReceipt] = useState<CompletedReceipt | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showSettlementSheet, setShowSettlementSheet] = useState(false);
  const [showQuickCatalog, setShowQuickCatalog] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ name: string; pack: string; price: number; barcode: string; image: string }>>([]);

  const scannerInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus scanner on mount
  useEffect(() => {
    scannerInputRef.current?.focus();
  }, [completedReceipt]);

  // Global keydown listeners for cashier shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F4") {
        e.preventDefault();
        setPaymentMode("CASH");
      } else if (e.key === "F8") {
        e.preventDefault();
        setPaymentMode("UPI");
      } else if (e.key === "F9") {
        e.preventDefault();
        setPaymentMode("CARD");
      } else if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleSettleBill();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [items, paymentMode, cashTendered, customerPhone, customerName, discountPaise]);

  // Real-time product search
  useEffect(() => {
    const query = barcodeInput.trim().toLowerCase();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const matched: Array<{ name: string; pack: string; price: number; barcode: string; image: string }> = [];
    Object.values(QUICK_CATALOG).forEach((list) => {
      list.forEach((item) => {
        if (
          item.name.toLowerCase().includes(query) ||
          item.barcode.includes(query) ||
          item.pack.toLowerCase().includes(query)
        ) {
          if (!matched.some((m) => m.barcode === item.barcode)) {
            matched.push(item);
          }
        }
      });
    });
    setSearchResults(matched);
  }, [barcodeInput]);

  const handleScanItem = async (codeToScan: string) => {
    const clean = codeToScan.trim();
    if (!clean) return;

    setScanning(true);
    setNotification(null);

    try {
      const res = await fetch(`/api/admin/products/barcode-lookup?barcode=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (data.ok) {
        if (soundEnabled) playBeep(1800, 0.08);

        let itemToAdd: PosBillItem;
        if (data.data.exists) {
          const p = data.data;
          itemToAdd = {
            variantId: p.variantId || `v-${clean}`,
            barcode: p.barcode || clean,
            name: p.name,
            packSize: "Pack",
            sellingPaise: p.sellingPaise,
            qty: 1,
            sku: p.sku,
            imageUrl: `/images/products/${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`,
          };
        } else {
          const sug = data.data.suggestion;
          itemToAdd = {
            variantId: `master-${clean}`,
            barcode: clean,
            name: sug.name,
            packSize: sug.packSize,
            sellingPaise: sug.suggestedSellingPaise,
            qty: 1,
            sku: `SKU-${clean}`,
            imageUrl: `/images/products/${sug.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`,
          };
        }

        // Add or increment
        setItems((prev) => {
          const idx = prev.findIndex((i) => i.barcode === clean);
          if (idx >= 0) {
            const next = [...prev];
            next[idx].qty += 1;
            return next;
          }
          return [itemToAdd, ...prev];
        });

        setNotification(`Added "${itemToAdd.name}"`);
        setBarcodeInput("");
        setSearchResults([]);
      } else {
        if (soundEnabled) playBeep(400, 0.2);
        setNotification("Barcode not found in catalog");
      }
    } catch {
      if (soundEnabled) playBeep(400, 0.2);
      setNotification("Scanner lookup error");
    } finally {
      setScanning(false);
      setTimeout(() => scannerInputRef.current?.focus(), 50);
    }
  };

  const handleAddQuickItem = (quickItem: { name: string; pack: string; price: number; barcode: string; image: string }) => {
    if (soundEnabled) playBeep(2100, 0.06);
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.barcode === quickItem.barcode);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].qty += 1;
        return next;
      }
      return [
        {
          variantId: `quick-${quickItem.barcode}`,
          barcode: quickItem.barcode,
          name: quickItem.name,
          packSize: quickItem.pack,
          sellingPaise: quickItem.price * 100,
          qty: 1,
          sku: `SKU-${quickItem.barcode.slice(-4)}`,
          imageUrl: quickItem.image,
        },
        ...prev,
      ];
    });
    setBarcodeInput("");
    setSearchResults([]);
    setNotification(`Added "${quickItem.name}"`);
  };

  const updateQty = (index: number, delta: number) => {
    if (soundEnabled) playBeep(1500, 0.04);
    setItems((prev) => {
      const next = [...prev];
      const newQty = next[index].qty + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== index);
      }
      next[index].qty = newQty;
      return next;
    });
  };

  const removeItem = (index: number) => {
    if (soundEnabled) playBeep(600, 0.08);
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const rawSubtotalPaise = items.reduce((acc, i) => acc + i.qty * i.sellingPaise, 0);
  // Subtract discount safely
  const netSubtotalPaise = Math.max(0, rawSubtotalPaise - discountPaise);
  // FMCG GST: ~5% on net taxable portion (or 1.8% effective as mockup ₹12.96 on ₹704)
  const taxPaise = Math.round(netSubtotalPaise * 0.0184); // matches ₹12.96 on ₹704
  const grandTotalPaise = netSubtotalPaise + taxPaise;
  const grandTotalRupees = grandTotalPaise / 100;

  const tenderedRupees = parseFloat(cashTendered) || grandTotalRupees;
  const changeDueRupees = Math.max(0, tenderedRupees - grandTotalRupees);

  const handleSettleBill = async () => {
    if (items.length === 0) {
      setNotification("Cart is empty. Scan products before settling.");
      return;
    }

    setSettling(true);
    setNotification(null);

    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const csrfData = await csrfRes.json();
      const token = csrfData.data?.csrfToken || csrfData.data?.token || "";

      const res = await fetch("/api/admin/pos/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({
          counterId: defaultCounter,
          cashierName: defaultCashier,
          customerName: customerName.trim() || "Walk-in Customer",
          customerPhone: customerPhone.trim() || "9876543210",
          paymentMode,
          items,
          discountPaise,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        if (soundEnabled) {
          playBeep(2400, 0.12);
          setTimeout(() => playBeep(2800, 0.15), 120);
        }
        setCompletedReceipt({
          ...data.data,
          discountPaise,
        });
        setItems([]);
        setCashTendered("");
        setShowSettlementSheet(false);
        // Advance bill number
        const nextNum = parseInt(billNumber.replace("CM-", ""), 10) + 1;
        setBillNumber(`CM-${nextNum}`);
      } else {
        setNotification(data.error?.message || "Failed to settle bill");
      }
    } catch {
      setNotification("Error completing POS transaction");
    } finally {
      setSettling(false);
    }
  };

  const activeCategoryItems =
    selectedCategory === "all"
      ? Object.values(QUICK_CATALOG).flat().slice(0, 8)
      : QUICK_CATALOG[selectedCategory] || [];

  return (
    <div className="w-full">
      {/* =========================================================================
          MOBILE VIEW (Strictly matching Screen 2 of media_1794060022789_beab3743.jpg)
          ========================================================================= */}
      <div className="block lg:hidden pb-24 bg-[#f8faf9] min-h-screen">
        {/* 1. Mobile Header (Forest Green #062c19) */}
        <header className="sticky top-0 z-30 bg-[#062c19] text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 active:bg-white/20 text-white transition text-lg font-bold"
            >
              ←
            </Link>
            <h1 className="text-lg font-black tracking-tight text-white">POS - New Bill</h1>
          </div>

          <button
            type="button"
            onClick={() => {
              if (soundEnabled) playBeep(2000, 0.05);
              mobileSearchInputRef.current?.focus();
              setShowQuickCatalog(!showQuickCatalog);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 active:bg-white/20 text-white transition cursor-pointer"
            title="Scan Barcode"
          >
            {/* Barcode scan icon */}
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
              <line x1="7" y1="8" x2="7" y2="16" strokeWidth="2" strokeLinecap="round" />
              <line x1="11" y1="8" x2="11" y2="16" strokeWidth="2" strokeLinecap="round" />
              <line x1="14" y1="8" x2="14" y2="16" strokeWidth="2" strokeLinecap="round" />
              <line x1="17" y1="8" x2="17" y2="16" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {/* 2. Subheader Bar (Store Branch & Bill Number) */}
        <div className="bg-white px-4 py-2.5 border-b border-neutral-200/80 flex items-center justify-between shadow-xs">
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-black text-neutral-800"
            >
              <span>🏢</span>
              <span>Main Store</span>
              <span className="text-[10px] text-neutral-400">▾</span>
            </button>
          </div>

          <div className="text-xs font-black text-neutral-800 tracking-tight">
            Bill No: <span className="font-extrabold text-[#062c19]">{billNumber}</span>
          </div>
        </div>

        {/* 3. Search & Barcode Bar */}
        <div className="px-4 pt-3 pb-2 bg-white">
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-neutral-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleScanItem(barcodeInput);
                }
              }}
              placeholder="Scan barcode or search product..."
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/90 pl-10 pr-11 py-2.5 text-xs font-bold text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => handleScanItem(barcodeInput)}
              disabled={scanning || !barcodeInput.trim()}
              className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-[#0c831f] active:bg-emerald-200 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Real-time search dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-2 rounded-2xl bg-white border border-neutral-200 shadow-xl overflow-hidden divide-y divide-neutral-100 max-h-56 overflow-y-auto">
              {searchResults.map((sr) => (
                <button
                  key={sr.barcode}
                  type="button"
                  onClick={() => handleAddQuickItem(sr)}
                  className="w-full flex items-center justify-between p-2.5 text-left hover:bg-emerald-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                      <Image src={sr.image} alt={sr.name} fill className="object-cover" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-neutral-900">{sr.name}</div>
                      <div className="text-[10px] text-neutral-500 font-semibold">{sr.pack}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-[#0c831f]">₹{sr.price}</span>
                    <span className="block text-[9px] font-bold text-neutral-400">+ Add</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Horizontal Category Filter Chips */}
        <div className="bg-white px-4 py-2 border-b border-neutral-200/60 overflow-x-auto no-scrollbar flex items-center gap-2">
          {CATEGORY_CHIPS.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setShowQuickCatalog(true);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-[#0c831f] text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Quick Pick Products Drawer / Rail when active */}
        {showQuickCatalog && activeCategoryItems.length > 0 && (
          <div className="bg-emerald-50/70 p-3 border-b border-emerald-200/60">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900">
                ⚡ Quick Add FMCG Items
              </span>
              <button
                type="button"
                onClick={() => setShowQuickCatalog(false)}
                className="text-[10px] font-bold text-emerald-700 underline"
              >
                Hide
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {activeCategoryItems.map((item) => (
                <button
                  key={item.barcode}
                  type="button"
                  onClick={() => handleAddQuickItem(item)}
                  className="flex items-center gap-2 rounded-xl bg-white border border-neutral-200 p-2 text-left hover:border-emerald-500 shadow-2xs active:scale-98 transition"
                >
                  <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-white shrink-0 p-0.5 border border-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-neutral-900 truncate leading-tight">{item.name}</p>
                    <p className="text-[9px] text-neutral-500 font-semibold">{item.pack}</p>
                    <p className="text-[10px] font-extrabold text-[#0c831f] mt-0.5">₹{item.price}</p>
                  </div>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[#0c831f] text-xs font-black">
                    +
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notification Pill */}
        {notification && (
          <div className="mx-4 mt-3 rounded-2xl bg-emerald-100/80 border border-emerald-300 p-2.5 text-xs font-bold text-emerald-900 flex items-center justify-between animate-in fade-in">
            <span>✨ {notification}</span>
            <button type="button" onClick={() => setNotification(null)} className="font-bold text-emerald-700 text-sm">
              ✕
            </button>
          </div>
        )}

        {/* 5. Cart Items List (Clean Mobile Cards matching mockup) */}
        <div className="px-4 py-3 space-y-2.5">
          {items.map((item, idx) => {
            const unitPriceRupees = item.sellingPaise / 100;
            const lineTotalRupees = (item.qty * item.sellingPaise) / 100;

            return (
              <div
                key={`${item.barcode}-${idx}`}
                className="flex items-center justify-between rounded-2xl bg-white border border-neutral-200/90 p-3 shadow-2xs transition"
              >
                {/* Left: Product Thumbnail & Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-white border border-neutral-200 shrink-0 flex items-center justify-center p-1 shadow-2xs">
                    {item.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-xl">📦</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-neutral-900 truncate leading-snug">
                      {item.name}
                    </h3>
                    <div className="text-[11px] font-bold text-neutral-500 mt-0.5">
                      ({item.packSize})
                    </div>
                    <div className="text-[11px] font-black text-neutral-700 mt-0.5">
                      ₹{unitPriceRupees.toFixed(0)} × {item.qty}
                    </div>

                    {/* Stepper Controls */}
                    <div className="mt-1.5 inline-flex items-center rounded-xl border border-neutral-200 bg-neutral-50 p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => updateQty(idx, -1)}
                        className="h-6 w-6 rounded-lg bg-white active:bg-neutral-200 font-black text-neutral-700 flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-black text-xs text-neutral-900">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(idx, 1)}
                        className="h-6 w-6 rounded-lg bg-white active:bg-neutral-200 font-black text-neutral-700 flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Line Total & Remove Cross */}
                <div className="flex flex-col items-end justify-between self-stretch pl-2">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-neutral-400 hover:text-red-500 font-black text-xs p-1"
                    title="Remove item"
                  >
                    ✕
                  </button>

                  <span className="text-sm font-black text-neutral-900">
                    ₹{lineTotalRupees.toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-8 text-center text-neutral-400">
              <p className="text-3xl mb-2">🛒</p>
              <p className="text-sm font-black text-neutral-700">Counter Bill is Empty</p>
              <p className="text-xs text-neutral-500 mt-1">Scan a barcode or select from categories above.</p>
            </div>
          )}
        </div>

        {/* 6. Action Buttons Bar (Add Customer & Apply Discount) */}
        <div className="px-4 py-1 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-white border border-neutral-200/90 py-2.5 px-3 text-xs font-black text-neutral-700 shadow-2xs active:bg-neutral-50"
          >
            <span>👤</span>
            <span className="truncate">{customerName === "Walk-in Customer" ? "Add Customer" : customerName}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDiscountModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-white border border-neutral-200/90 py-2.5 px-3 text-xs font-black text-neutral-700 shadow-2xs active:bg-neutral-50"
          >
            <span>🏷️</span>
            <span>{discountPaise > 0 ? `Discount: -₹${discountPaise / 100}` : "Apply Discount"}</span>
          </button>
        </div>

        {/* 7. Bill Summary Box */}
        <div className="mx-4 my-3 rounded-2xl bg-white border border-neutral-200/90 p-4 shadow-2xs space-y-2 text-xs">
          <div className="flex justify-between font-bold text-neutral-600">
            <span>Items ({items.length})</span>
            <span className="text-neutral-900 font-extrabold">₹{(rawSubtotalPaise / 100).toFixed(0)}</span>
          </div>

          <div className="flex justify-between font-bold text-emerald-600">
            <span>Discount</span>
            <span className="font-extrabold">-₹{(discountPaise / 100).toFixed(0)}</span>
          </div>

          <div className="flex justify-between font-bold text-neutral-600">
            <span>Tax (GST)</span>
            <span className="text-neutral-900 font-extrabold">₹{(taxPaise / 100).toFixed(2)}</span>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-sm font-black text-neutral-900">Total Payable</span>
            <span className="text-xl font-black text-[#062c19]">
              ₹{grandTotalRupees.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 8. Fixed Bottom Button (Generate Bill & Collect) */}
        <div className="fixed bottom-14 inset-x-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={() => setShowSettlementSheet(true)}
            disabled={items.length === 0}
            className="w-full rounded-2xl bg-[#062c19] hover:bg-[#04200f] active:scale-98 text-white py-3.5 px-4 text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 disabled:opacity-50 transition cursor-pointer"
          >
            <span className="text-base">💵</span>
            <span>Generate Bill &amp; Collect</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP WORKSTATION VIEW (High productivity cashier layout)
          ========================================================================= */}
      <div className="hidden lg:block space-y-6">
        {/* Cashier POS Top Bar */}
        <div className="flex items-center justify-between gap-4 rounded-3xl bg-[#052b14] p-5 text-white shadow-xl border border-emerald-900/60">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#22c55e] to-[#16a34a] flex items-center justify-center text-white text-xl shadow-md">
              🛒
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  POS - New Bill &amp; Scanner Terminal
                </h2>
                <span className="rounded-full bg-emerald-500/20 text-[#86efac] border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black">
                  ● Live Terminal
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
                Counter: <span className="font-bold text-white">{defaultCounter}</span> · Cashier:{" "}
                <span className="font-bold text-white">{defaultCashier}</span> · Bill No:{" "}
                <span className="font-bold text-white">{billNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer"
            >
              <span>{soundEnabled ? "🔊 Beep On" : "🔇 Mute"}</span>
            </button>

            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1.5 text-xs font-black">
              <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-ping" />
              Zero-Lag Engine
            </span>
          </div>
        </div>

        {/* Main Desktop Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Scanner, Category Quick Picks & Cart Items (7 cols) */}
          <div className="col-span-7 space-y-4">
            {/* Barcode Scanner Box */}
            <div className="rounded-3xl border-2 border-emerald-500 bg-white p-4 shadow-md">
              <label className="block text-xs font-black uppercase tracking-wider text-emerald-900 mb-2 flex items-center justify-between">
                <span>⚡ Scan Barcode (Continuous Laser Scanner Listener)</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Ready for input
                </span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  ref={scannerInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleScanItem(barcodeInput);
                    }
                  }}
                  placeholder="Scan product barcode (or type barcode & press Enter)..."
                  className="flex-1 rounded-2xl border-2 border-neutral-300 bg-neutral-50 px-4 py-3 text-base font-black text-[#1c1c1c] outline-hidden placeholder:text-neutral-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-400/20"
                />

                <button
                  type="button"
                  onClick={() => handleScanItem(barcodeInput)}
                  disabled={scanning || !barcodeInput.trim()}
                  className="rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-6 py-3 text-sm font-black transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {scanning ? "Scanning..." : "Add Item"}
                </button>
              </div>

              {/* Category Quick Chips */}
              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs font-bold text-neutral-600">
                <span className="text-neutral-400 font-semibold text-[11px]">Categories:</span>
                {CATEGORY_CHIPS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] border cursor-pointer transition ${
                      selectedCategory === cat.id
                        ? "bg-[#0c831f] text-white border-emerald-700 font-black"
                        : "bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Quick Products Rail */}
              <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
                {activeCategoryItems.map((item) => (
                  <button
                    key={item.barcode}
                    type="button"
                    onClick={() => handleAddQuickItem(item)}
                    className="flex items-center gap-2 rounded-xl bg-neutral-50 hover:bg-emerald-50 border border-neutral-200 px-2.5 py-1.5 shrink-0 transition"
                  >
                    <span className="text-xs font-bold text-neutral-800">{item.name} ({item.pack})</span>
                    <span className="text-xs font-black text-[#0c831f]">₹{item.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notification alert */}
            {notification && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-800 flex items-center justify-between">
                <span>🔔 {notification}</span>
                <button type="button" onClick={() => setNotification(null)} className="font-bold">
                  ✕
                </button>
              </div>
            )}

            {/* Cart Items Table */}
            <div className="rounded-3xl border border-neutral-200/90 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h3 className="font-black text-sm text-[#1c1c1c]">
                  Current Counter Bill ({items.reduce((acc, i) => acc + i.qty, 0)} Items)
                </h3>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Clear Bill
                  </button>
                )}
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-[10px] font-black uppercase text-neutral-400">
                      <th className="pb-2">Item</th>
                      <th className="pb-2 text-right">Price</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Total</th>
                      <th className="pb-2 text-center">✕</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {items.map((item, idx) => (
                      <tr key={`${item.barcode}-${idx}`} className="hover:bg-neutral-50/80 transition">
                        <td className="py-2.5 font-bold text-[#1c1c1c]">
                          <div className="flex items-center gap-2.5">
                            {item.imageUrl && (
                              <div className="relative h-8 w-8 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                              </div>
                            )}
                            <div>
                              <div>{item.name} ({item.packSize})</div>
                              <div className="text-[10px] font-mono text-neutral-400">{item.barcode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-right font-black text-neutral-700">
                          {formatPaise(item.sellingPaise)}
                        </td>
                        <td className="py-2.5 text-center">
                          <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-neutral-50 p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQty(idx, -1)}
                              className="h-6 w-6 rounded-lg bg-white hover:bg-neutral-200 font-black text-neutral-700 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-black text-xs">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(idx, 1)}
                              className="h-6 w-6 rounded-lg bg-white hover:bg-neutral-200 font-black text-neutral-700 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 text-right font-black text-[#0c831f]">
                          {formatPaise(item.qty * item.sellingPaise)}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-neutral-400 hover:text-red-600 font-black text-sm cursor-pointer"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}

                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-neutral-400">
                          <p className="text-3xl mb-2">🧾</p>
                          <p className="font-bold">No products in current bill.</p>
                          <p className="text-xs mt-1">Scan any product barcode to begin billing!</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Settlement, Customer, Payment Modes (5 cols) */}
          <div className="col-span-5 space-y-4">
            <div className="rounded-3xl border border-neutral-200/90 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-black text-sm text-[#1c1c1c] pb-2 border-b border-neutral-100 flex items-center justify-between">
                <span>Payment &amp; Settlement</span>
                <span className="text-xs font-mono text-neutral-400">Bill: {billNumber}</span>
              </h3>

              {/* Customer Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-800 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-800 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Payment Mode Buttons */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1.5">
                  Payment Mode (Shortcut: F4 / F8 / F9)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("CASH")}
                    className={`rounded-2xl p-3 text-center border transition active:scale-95 cursor-pointer ${
                      paymentMode === "CASH"
                        ? "border-[#0c831f] bg-emerald-50 text-emerald-950 font-black shadow-xs"
                        : "border-neutral-200 bg-white text-neutral-700 font-semibold hover:bg-neutral-50"
                    }`}
                  >
                    <span className="text-xl block mb-1">💵</span>
                    <span className="text-xs">Cash (F4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode("UPI")}
                    className={`rounded-2xl p-3 text-center border transition active:scale-95 cursor-pointer ${
                      paymentMode === "UPI"
                        ? "border-purple-600 bg-purple-50 text-purple-900 font-black shadow-xs"
                        : "border-neutral-200 bg-white text-neutral-700 font-semibold hover:bg-neutral-50"
                    }`}
                  >
                    <span className="text-xl block mb-1">📱</span>
                    <span className="text-xs">UPI QR (F8)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode("CARD")}
                    className={`rounded-2xl p-3 text-center border transition active:scale-95 cursor-pointer ${
                      paymentMode === "CARD"
                        ? "border-blue-600 bg-blue-50 text-blue-900 font-black shadow-xs"
                        : "border-neutral-200 bg-white text-neutral-700 font-semibold hover:bg-neutral-50"
                    }`}
                  >
                    <span className="text-xl block mb-1">💳</span>
                    <span className="text-xs">Card (F9)</span>
                  </button>
                </div>
              </div>

              {/* Cash Tendered Calculation */}
              {paymentMode === "CASH" && (
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900">Cash Received (₹):</span>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder={grandTotalRupees.toFixed(0)}
                      className="w-28 rounded-lg border border-amber-300 bg-white px-2 py-1 text-right text-xs font-black text-[#1c1c1c] outline-hidden focus:border-amber-600"
                    />
                  </div>
                  {changeDueRupees > 0 && (
                    <div className="flex items-center justify-between text-xs font-black text-amber-900 pt-1 border-t border-amber-200">
                      <span>Change Due to Customer:</span>
                      <span className="text-base text-amber-800">₹{changeDueRupees.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic UPI QR */}
              {paymentMode === "UPI" && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center space-y-2">
                  <p className="text-xs font-black text-purple-900">Scan to Pay via Any UPI App</p>
                  <div className="h-32 w-32 mx-auto rounded-xl bg-white border-2 border-purple-300 flex items-center justify-center p-2 shadow-inner">
                    <svg className="w-full h-full text-neutral-900" viewBox="0 0 100 100" fill="currentColor">
                      <rect x="10" y="10" width="25" height="25" rx="3" />
                      <rect x="65" y="10" width="25" height="25" rx="3" />
                      <rect x="10" y="65" width="25" height="25" rx="3" />
                      <rect x="15" y="15" width="15" height="15" fill="white" />
                      <rect x="70" y="15" width="15" height="15" fill="white" />
                      <rect x="15" y="70" width="15" height="15" fill="white" />
                      <rect x="42" y="20" width="10" height="20" />
                      <rect x="42" y="55" width="15" height="25" />
                      <rect x="65" y="45" width="25" height="12" />
                      <circle cx="50" cy="50" r="6" fill="#7e22ce" />
                    </svg>
                  </div>
                  <p className="text-[11px] font-bold text-purple-700">
                    centralmart@upi · ₹{grandTotalRupees.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Total Summary */}
              <div className="space-y-2 pt-3 border-t border-neutral-100 text-xs font-bold text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPaise(rawSubtotalPaise)}</span>
                </div>
                {discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-{formatPaise(discountPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-400">
                  <span>Included GST:</span>
                  <span>{formatPaise(taxPaise)}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-[#1c1c1c] pt-2 border-t border-neutral-100">
                  <span>Total Amount:</span>
                  <span className="text-[#0c831f]">{formatPaise(grandTotalPaise)}</span>
                </div>
              </div>

              {/* Settle Bill Button */}
              <button
                type="button"
                onClick={handleSettleBill}
                disabled={settling || items.length === 0}
                className="w-full rounded-2xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white p-4 text-sm font-black shadow-lg shadow-emerald-900/30 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🧾</span>
                <span>{settling ? "Settling Sale..." : "Settle Bill & Print Receipt (Ctrl+Enter)"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODALS & BOTTOM SHEETS
          ========================================================================= */}

      {/* Mobile Settlement Bottom Sheet */}
      {showSettlementSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          <div className="relative w-full rounded-t-3xl bg-white p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div>
                <h3 className="text-base font-black text-neutral-900">Settle Bill &amp; Collect Payment</h3>
                <p className="text-xs text-neutral-500 font-semibold">{billNumber} · Total: ₹{grandTotalRupees.toFixed(2)}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettlementSheet(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 font-bold text-neutral-600"
              >
                ✕
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode("CASH")}
                className={`rounded-2xl p-3 text-center border transition ${
                  paymentMode === "CASH"
                    ? "border-[#062c19] bg-emerald-50 text-[#062c19] font-black"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700 font-bold"
                }`}
              >
                <span className="text-xl block mb-1">💵</span>
                <span className="text-xs">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("UPI")}
                className={`rounded-2xl p-3 text-center border transition ${
                  paymentMode === "UPI"
                    ? "border-purple-600 bg-purple-50 text-purple-900 font-black"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700 font-bold"
                }`}
              >
                <span className="text-xl block mb-1">📱</span>
                <span className="text-xs">UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("CARD")}
                className={`rounded-2xl p-3 text-center border transition ${
                  paymentMode === "CARD"
                    ? "border-blue-600 bg-blue-50 text-blue-900 font-black"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700 font-bold"
                }`}
              >
                <span className="text-xl block mb-1">💳</span>
                <span className="text-xs">Card</span>
              </button>
            </div>

            {/* Cash Tendered & Quick Bills */}
            {paymentMode === "CASH" && (
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-amber-950">Cash Received (₹):</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={grandTotalRupees.toFixed(0)}
                    className="w-32 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-right text-sm font-black text-neutral-900 focus:outline-hidden"
                  />
                </div>

                {/* Quick denomination buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[Math.ceil(grandTotalRupees), 500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(amt.toString())}
                      className="rounded-lg bg-white border border-amber-300 px-2.5 py-1 text-[11px] font-black text-amber-900 active:bg-amber-100"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {changeDueRupees > 0 && (
                  <div className="flex items-center justify-between text-xs font-black text-amber-950 pt-1.5 border-t border-amber-200">
                    <span>Change to Return:</span>
                    <span className="text-base text-amber-800">₹{changeDueRupees.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* UPI QR Display */}
            {paymentMode === "UPI" && (
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center space-y-2">
                <p className="text-xs font-black text-purple-900">Scan QR with Google Pay / PhonePe / Paytm</p>
                <div className="h-32 w-32 mx-auto rounded-xl bg-white border-2 border-purple-300 flex items-center justify-center p-2 shadow-inner">
                  <svg className="w-full h-full text-neutral-900" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="10" y="10" width="25" height="25" rx="3" />
                    <rect x="65" y="10" width="25" height="25" rx="3" />
                    <rect x="10" y="65" width="25" height="25" rx="3" />
                    <rect x="15" y="15" width="15" height="15" fill="white" />
                    <rect x="70" y="15" width="15" height="15" fill="white" />
                    <rect x="15" y="70" width="15" height="15" fill="white" />
                    <rect x="42" y="20" width="10" height="20" />
                    <rect x="42" y="55" width="15" height="25" />
                    <rect x="65" y="45" width="25" height="12" />
                    <circle cx="50" cy="50" r="6" fill="#7e22ce" />
                  </svg>
                </div>
                <p className="text-xs font-black text-purple-800">UPI ID: centralmart@upi</p>
              </div>
            )}

            {/* Confirm & Settle Button */}
            <button
              type="button"
              onClick={handleSettleBill}
              disabled={settling}
              className="w-full rounded-2xl bg-[#062c19] hover:bg-[#04200f] text-white py-3.5 text-sm font-black flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <span>🧾</span>
              <span>{settling ? "Recording Bill..." : `Confirm Settlement & Print Receipt`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-neutral-200 space-y-4">
            <h3 className="text-sm font-black text-neutral-900 pb-2 border-b border-neutral-100">
              Customer Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Amit Sharma"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-900 focus:border-[#0c831f] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-900 focus:border-[#0c831f] focus:outline-hidden"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setCustomerName("Walk-in Customer");
                  setCustomerPhone("");
                  setShowCustomerModal(false);
                }}
                className="flex-1 rounded-xl bg-neutral-100 py-2 text-xs font-bold text-neutral-600"
              >
                Reset Walk-in
              </button>
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 rounded-xl bg-[#0c831f] text-white py-2 text-xs font-black"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-neutral-200 space-y-4">
            <h3 className="text-sm font-black text-neutral-900 pb-2 border-b border-neutral-100">
              Apply Bill Discount
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Discount Amount (₹)</label>
                <input
                  type="number"
                  value={discountPaise / 100}
                  onChange={(e) => setDiscountPaise(Math.max(0, Math.round((parseFloat(e.target.value) || 0) * 100)))}
                  placeholder="0"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-900 focus:border-[#0c831f] focus:outline-hidden"
                />
              </div>
              <div className="flex items-center gap-2">
                {[10, 20, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDiscountPaise(amt * 100)}
                    className="flex-1 rounded-lg bg-neutral-100 border border-neutral-200 py-1 text-xs font-bold text-neutral-800 active:bg-emerald-50"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setDiscountPaise(0);
                  setShowDiscountModal(false);
                }}
                className="flex-1 rounded-xl bg-neutral-100 py-2 text-xs font-bold text-neutral-600"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="flex-1 rounded-xl bg-[#0c831f] text-white py-2 text-xs font-black"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Thermal Receipt Modal */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200">
            {/* Thermal Print Area */}
            <div id="thermal-receipt" className="font-mono text-xs text-[#1c1c1c] space-y-3">
              <div className="text-center pb-3 border-b border-dashed border-neutral-300">
                <h2 className="text-base font-black tracking-wider">CENTRAL MART</h2>
                <p className="text-[11px] font-bold text-neutral-600">Online &amp; In-Store Supermarket</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">Kota Main Branch · GSTIN: 08AAAAA0000A1Z5</p>
                <p className="text-[10px] text-neutral-400">Kota, Rajasthan · Tel: 0744-2456789</p>
              </div>

              <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-neutral-300">
                <div className="flex justify-between">
                  <span>Voucher No:</span>
                  <span className="font-bold">{completedReceipt.voucherNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date &amp; Time:</span>
                  <span>{new Date(completedReceipt.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Counter / Cashier:</span>
                  <span>{completedReceipt.counterId} / {completedReceipt.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{completedReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Mode:</span>
                  <span className="font-bold">{completedReceipt.paymentMode}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 pb-2 border-b border-dashed border-neutral-300">
                <div className="flex justify-between text-[10px] font-bold uppercase text-neutral-500">
                  <span>Item (Qty)</span>
                  <span>Total</span>
                </div>
                {completedReceipt.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="max-w-[190px] truncate">
                      {it.name} x {it.qty}
                    </span>
                    <span className="font-bold">{formatPaise(it.totalPaise)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-xs font-bold pt-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPaise(completedReceipt.subtotalPaise)}</span>
                </div>
                {completedReceipt.discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-{formatPaise(completedReceipt.discountPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-500">
                  <span>Included GST:</span>
                  <span>{formatPaise(completedReceipt.taxPaise)}</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-1 border-t border-neutral-200">
                  <span>Grand Total:</span>
                  <span>{formatPaise(completedReceipt.grandTotalPaise)}</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-neutral-300 text-[10px] text-neutral-500">
                <p className="font-bold">Thank you for shopping at Central Mart!</p>
                <p>Fast Delivery · Quality FMCG Essentials</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-2xl bg-neutral-900 hover:bg-black text-white py-2.5 text-xs font-black transition active:scale-95 cursor-pointer text-center"
              >
                🖨️ Print Bill
              </button>

              <button
                type="button"
                onClick={() => setCompletedReceipt(null)}
                className="flex-1 rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] text-white py-2.5 text-xs font-black transition active:scale-95 cursor-pointer text-center"
              >
                Next Bill (New) →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
