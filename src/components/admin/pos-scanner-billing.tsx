"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  mrpPaise: number;
  sellingPaise: number;
  qty: number;
  gstRate: number; // 0, 5, 12, 18
  batchNo?: string;
  expiryDate?: string;
  sku?: string;
  imageUrl?: string;
  discountPct?: number;
}

export interface HeldBill {
  id: string;
  billNumber: string;
  heldAt: string;
  customerName: string;
  customerPhone: string;
  items: PosBillItem[];
  discountPaise: number;
  paymentMode: "CASH" | "UPI" | "CARD" | "SPLIT" | "KHATA";
  notes?: string;
}

export interface CompletedReceipt {
  voucherNumber: string;
  orderNumber: string;
  counterId: string;
  cashierName: string;
  customerName: string;
  customerPhone?: string;
  customerGstin?: string;
  customerAddress?: string;
  paymentMode: string;
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  grandTotalPaise: number;
  cashTenderedPaise?: number;
  changeDuePaise?: number;
  timestamp: string;
  items: Array<{
    name: string;
    packSize: string;
    qty: number;
    mrpPaise?: number;
    sellingPaise: number;
    gstRate?: number;
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

const QUICK_CATALOG: Record<string, Array<{ name: string; pack: string; price: number; mrp: number; gst: number; barcode: string; image: string }>> = {
  grocery: [
    { name: "Aashirvaad Atta", pack: "5 kg", price: 269, mrp: 315, gst: 5, barcode: "8901491101837", image: "/images/products/aashirvaad-shudh-chakki-atta.jpg" },
    { name: "Tata Salt", pack: "1 kg", price: 27, mrp: 30, gst: 0, barcode: "8901030383451", image: "/images/products/tata-salt-vacuum-evaporated-iodised.jpg" },
    { name: "Fortune Oil", pack: "1 L", price: 159, mrp: 180, gst: 5, barcode: "8906007281234", image: "/images/products/fortune-sunlite-refined-sunflower-oil.jpg" },
    { name: "Daawat Basmati Rice", pack: "1 kg", price: 145, mrp: 175, gst: 5, barcode: "8901537001015", image: "/images/products/india-gate-classic-super-basmati-rice.jpg" },
  ],
  snacks: [
    { name: "Maggi Noodles", pack: "70 g", price: 14, mrp: 14, gst: 12, barcode: "8901058852441", image: "/images/products/maggi-2-minute-masala-instant-noodles.jpg" },
    { name: "Haldiram's Bhujia", pack: "200 g", price: 62, mrp: 65, gst: 12, barcode: "8904063200125", image: "/images/products/crispy-potato-chips.jpg" },
    { name: "Britannia Good Day", pack: "100 g", price: 30, mrp: 35, gst: 18, barcode: "8901063012111", image: "/images/products/britannia-good-day-cashew-cookies.jpg" },
  ],
  beverages: [
    { name: "Coca Cola", pack: "750 ml", price: 40, mrp: 45, gst: 18, barcode: "8901764012211", image: "/images/products/coca-cola-original-soft-drink.jpg" },
    { name: "Red Label Tea", pack: "250 g", price: 140, mrp: 155, gst: 5, barcode: "8901030012234", image: "/images/products/brooke-bond-red-label-tea.jpg" },
  ],
  "home-care": [
    { name: "Surf Excel Easy Wash", pack: "1 kg", price: 139, mrp: 160, gst: 18, barcode: "8901030384729", image: "/images/products/surf-excel-easy-wash-detergent-powder.jpg" },
    { name: "Harpic Power Plus", pack: "500 ml", price: 95, mrp: 105, gst: 18, barcode: "8901396010111", image: "/images/products/harpic-power-plus-disinfectant-toilet-cleaner.jpg" },
  ],
  dairy: [
    { name: "Amul Butter", pack: "100 g", price: 62, mrp: 62, gst: 12, barcode: "8901262010046", image: "/images/products/amul-salted-butter.jpg" },
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
  const [items, setItems] = useState<PosBillItem[]>([
    {
      variantId: "pos-seed-atta-5kg",
      barcode: "8901491101837",
      name: "Aashirvaad Atta",
      packSize: "5 kg",
      mrpPaise: 31500,
      sellingPaise: 26900,
      qty: 2,
      gstRate: 5,
      batchNo: "B-2610",
      expiryDate: "10/27",
      sku: "ATT005",
      imageUrl: "/images/products/aashirvaad-shudh-chakki-atta.jpg",
    },
    {
      variantId: "pos-seed-tata-salt-1kg",
      barcode: "8901030383451",
      name: "Tata Salt",
      packSize: "1 kg",
      mrpPaise: 3000,
      sellingPaise: 2700,
      qty: 1,
      gstRate: 0,
      batchNo: "B-2611",
      expiryDate: "11/28",
      sku: "SAL001",
      imageUrl: "/images/products/tata-salt-vacuum-evaporated-iodised.jpg",
    },
    {
      variantId: "pos-seed-fortune-oil-1l",
      barcode: "8906007281234",
      name: "Fortune Oil",
      packSize: "1 L",
      mrpPaise: 18000,
      sellingPaise: 15900,
      qty: 1,
      gstRate: 5,
      batchNo: "B-2609",
      expiryDate: "09/27",
      sku: "OIL001",
      imageUrl: "/images/products/fortune-sunlite-refined-sunflower-oil.jpg",
    },
  ]);

  const [billNumber, setBillNumber] = useState("CM-4287");
  const [voucherSeries, setVoucherSeries] = useState("POS-01 (Main)");
  const [priceMode, setPriceMode] = useState<"RETAIL" | "MRP" | "WHOLESALE">("RETAIL");
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Offline Capability & Zero-Downtime POS State
  const [isOnline, setIsOnline] = useState(true);
  const [offlineBillsCount, setOfflineBillsCount] = useState(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [settling, setSettling] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "CARD" | "SPLIT" | "KHATA">("CASH");
  const [cashTendered, setCashTendered] = useState("");
  const [customerPhone, setCustomerPhone] = useState("9876543210");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [discountPaise, setDiscountPaise] = useState(2000); // ₹20 pre-applied from mockup
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedReceipt, setCompletedReceipt] = useState<CompletedReceipt | null>(null);
  const [receiptPrintFormat, setReceiptPrintFormat] = useState<"THERMAL_80MM" | "A4_TAX_INVOICE">("THERMAL_80MM");
  const [notification, setNotification] = useState<string | null>(null);

  // Split Payment state
  const [splitCashPaise, setSplitCashPaise] = useState(0);
  const [splitUpiPaise, setSplitUpiPaise] = useState(0);

  // Held Bills System (F5 / F6)
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [showRecallModal, setShowRecallModal] = useState(false);

  // Modals state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showSettlementSheet, setShowSettlementSheet] = useState(false);
  const [showQuickCatalog, setShowQuickCatalog] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showDayClosingModal, setShowDayClosingModal] = useState(false);
  const [showQuickMasterModal, setShowQuickMasterModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [calcInput, setCalcInput] = useState("");

  // Quick Master Product Form
  const [qmBarcode, setQmBarcode] = useState("");
  const [qmName, setQmName] = useState("");
  const [qmPack, setQmPack] = useState("Pack");
  const [qmMrp, setQmMrp] = useState("100");
  const [qmPrice, setQmPrice] = useState("90");
  const [qmGst, setQmGst] = useState("500");
  const [qmCategory, setQmCategory] = useState("1c11122d-5278-4abd-b8f6-a7949d9b4747"); // Staples default
  const [qmSaving, setQmSaving] = useState(false);

  const [searchResults, setSearchResults] = useState<Array<{ name: string; pack: string; price: number; mrp: number; gst: number; barcode: string; image: string }>>([]);

  const scannerInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Live Clock
  useEffect(() => {
    const update = () => setCurrentTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Offline Catalog Pre-caching & Network Connectivity Listeners
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      try {
        const queue = JSON.parse(localStorage.getItem("CM_OFFLINE_POS_QUEUE") || "[]");
        setOfflineBillsCount(queue.length);
      } catch {}

      const handleOnline = () => {
        setIsOnline(true);
        triggerOfflineSync();
      };
      const handleOffline = () => {
        setIsOnline(false);
        setNotification("Network disconnected. Offline POS mode activated.");
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Pre-cache catalog into localStorage for 100% offline barcode lookup
      fetch("/api/products?limit=100")
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.items) {
            localStorage.setItem("CM_POS_OFFLINE_CATALOG", JSON.stringify(data.data.items));
          }
        })
        .catch(() => {});

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const triggerOfflineSync = async () => {
    if (typeof window === "undefined") return;
    try {
      const queue = JSON.parse(localStorage.getItem("CM_OFFLINE_POS_QUEUE") || "[]");
      if (!queue.length) return;

      setIsSyncingOffline(true);
      const csrfRes = await fetch("/api/auth/csrf");
      const csrfData = await csrfRes.json();
      const token = csrfData.data?.csrfToken || csrfData.data?.token || "";

      let syncedCount = 0;
      const remaining: any[] = [];

      for (const bill of queue) {
        try {
          const res = await fetch("/api/admin/pos/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": token,
            },
            body: JSON.stringify(bill.payload),
          });
          if (res.ok) {
            syncedCount++;
          } else {
            remaining.push(bill);
          }
        } catch {
          remaining.push(bill);
        }
      }

      localStorage.setItem("CM_OFFLINE_POS_QUEUE", JSON.stringify(remaining));
      setOfflineBillsCount(remaining.length);
      setIsSyncingOffline(false);

      if (syncedCount > 0) {
        setNotification(`Synced ${syncedCount} offline bill(s) to database successfully!`);
      }
    } catch {
      setIsSyncingOffline(false);
    }
  };

  const lookupOfflineItem = (code: string): PosBillItem => {
    try {
      const cached = JSON.parse(localStorage.getItem("CM_POS_OFFLINE_CATALOG") || "[]");
      const match = cached.find((p: any) =>
        p.variants?.some((v: any) => v.barcode === code || v.sku === code) ||
        p.name.toLowerCase().includes(code.toLowerCase())
      );
      if (match) {
        const v = match.variants?.find((x: any) => x.barcode === code) || match.variants?.[0];
        return {
          variantId: v.id || `v-${code}`,
          barcode: v.barcode || code,
          name: match.name,
          packSize: v.name || "Pack",
          mrpPaise: v.mrpPaise || v.sellingPaise,
          sellingPaise: isReturnMode ? -Math.abs(v.sellingPaise) : v.sellingPaise,
          qty: 1,
          gstRate: 5,
          batchNo: `B-${code.slice(-4) || "OFF"}`,
          expiryDate: "12/27",
          sku: v.sku || `SKU-${code}`,
          imageUrl: match.imageUrl || "/images/products/aashirvaad-shudh-chakki-atta.jpg",
        };
      }
    } catch {}

    for (const cat of Object.values(QUICK_CATALOG)) {
      const q = cat.find(
        (i) => i.barcode === code || i.name.toLowerCase().includes(code.toLowerCase())
      );
      if (q) {
        return {
          variantId: `pos-${q.barcode}`,
          barcode: q.barcode,
          name: q.name,
          packSize: q.pack,
          mrpPaise: q.mrp * 100,
          sellingPaise: isReturnMode ? -Math.abs(q.price * 100) : q.price * 100,
          qty: 1,
          gstRate: q.gst,
          batchNo: `B-${code.slice(-4)}`,
          expiryDate: "12/27",
          sku: `SKU-${code}`,
          imageUrl: q.image,
        };
      }
    }

    return {
      variantId: `offline-item-${code}`,
      barcode: code,
      name: `Offline FMCG Item (${code})`,
      packSize: "Standard",
      mrpPaise: 10000,
      sellingPaise: isReturnMode ? -10000 : 10000,
      qty: 1,
      gstRate: 5,
      batchNo: "B-OFF",
      expiryDate: "12/27",
      sku: `SKU-${code}`,
      imageUrl: "/images/products/aashirvaad-shudh-chakki-atta.jpg",
    };
  };

  // Auto-focus scanner on mount
  useEffect(() => {
    scannerInputRef.current?.focus();
  }, [completedReceipt, showRecallModal, showQuickMasterModal, showDayClosingModal]);

  // Global keydown listeners for cashier shortcuts (BUSY F1 to F12)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F1: Help / Shortcuts
      if (e.key === "F1") {
        e.preventDefault();
        setShowShortcutsModal(true);
      }
      // F2: Settle & Print
      else if (e.key === "F2" || (e.ctrlKey && e.key === "Enter")) {
        e.preventDefault();
        if (items.length > 0) handleSettleBill();
      }
      // F3: Quick Item Master
      else if (e.key === "F3") {
        e.preventDefault();
        setShowQuickMasterModal(true);
      }
      // F4: Cash Mode
      else if (e.key === "F4") {
        e.preventDefault();
        setPaymentMode("CASH");
        if (soundEnabled) playBeep(1600, 0.05);
      }
      // F5: Hold Bill
      else if (e.key === "F5") {
        e.preventDefault();
        handleHoldBill();
      }
      // F6: Recall Bills
      else if (e.key === "F6") {
        e.preventDefault();
        setShowRecallModal(true);
      }
      // F7: Discount
      else if (e.key === "F7") {
        e.preventDefault();
        setShowDiscountModal(true);
      }
      // F8: UPI QR
      else if (e.key === "F8") {
        e.preventDefault();
        setPaymentMode("UPI");
        if (soundEnabled) playBeep(2000, 0.05);
      }
      // F9: Card
      else if (e.key === "F9") {
        e.preventDefault();
        setPaymentMode("CARD");
        if (soundEnabled) playBeep(1800, 0.05);
      }
      // F10: Return / Credit Note
      else if (e.key === "F10") {
        e.preventDefault();
        setIsReturnMode(!isReturnMode);
        if (soundEnabled) playBeep(800, 0.1);
      }
      // F11: Day Closing Z-Report
      else if (e.key === "F11") {
        e.preventDefault();
        setShowDayClosingModal(true);
      }
      // F12: Calculator
      else if (e.key === "F12") {
        e.preventDefault();
        setShowCalculatorModal(true);
      }
      // Esc: Close any active modal
      else if (e.key === "Escape") {
        setShowShortcutsModal(false);
        setShowRecallModal(false);
        setShowQuickMasterModal(false);
        setShowDayClosingModal(false);
        setShowCalculatorModal(false);
        setShowCustomerModal(false);
        setShowDiscountModal(false);
        setShowSettlementSheet(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [items, paymentMode, cashTendered, customerPhone, customerName, discountPaise, isReturnMode, heldBills]);

  // Real-time product search
  useEffect(() => {
    const query = barcodeInput.trim().toLowerCase();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const matched: Array<{ name: string; pack: string; price: number; mrp: number; gst: number; barcode: string; image: string }> = [];
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
            mrpPaise: p.mrpPaise || p.sellingPaise,
            sellingPaise: isReturnMode ? -Math.abs(p.sellingPaise) : p.sellingPaise,
            qty: 1,
            gstRate: 5,
            batchNo: `B-${clean.slice(-4)}`,
            expiryDate: "12/27",
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
            mrpPaise: sug.suggestedMrpPaise || sug.suggestedSellingPaise,
            sellingPaise: isReturnMode ? -Math.abs(sug.suggestedSellingPaise) : sug.suggestedSellingPaise,
            qty: 1,
            gstRate: 5,
            batchNo: `B-${clean.slice(-4)}`,
            expiryDate: "12/27",
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
        // Fallback to offline catalog if not found online
        const offlineItem = lookupOfflineItem(clean);
        if (soundEnabled) playBeep(1800, 0.08);
        setItems((prev) => {
          const idx = prev.findIndex((i) => i.barcode === clean);
          if (idx >= 0) {
            const next = [...prev];
            next[idx].qty += 1;
            return next;
          }
          return [offlineItem, ...prev];
        });
        setNotification(`Added "${offlineItem.name}"`);
        setBarcodeInput("");
        setSearchResults([]);
      }
    } catch {
      // Offline fallback: Use offline catalog without interrupting cashier
      const offlineItem = lookupOfflineItem(clean);
      if (soundEnabled) playBeep(1800, 0.08);
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.barcode === clean);
        if (idx >= 0) {
          const next = [...prev];
          next[idx].qty += 1;
          return next;
        }
        return [offlineItem, ...prev];
      });
      setNotification(`[Offline] Added "${offlineItem.name}"`);
      setBarcodeInput("");
      setSearchResults([]);
    } finally {
      setScanning(false);
      setTimeout(() => scannerInputRef.current?.focus(), 50);
    }
  };

  const handleAddQuickItem = (quickItem: { name: string; pack: string; price: number; mrp: number; gst: number; barcode: string; image: string }) => {
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
          mrpPaise: quickItem.mrp * 100,
          sellingPaise: isReturnMode ? -(quickItem.price * 100) : quickItem.price * 100,
          qty: 1,
          gstRate: quickItem.gst,
          batchNo: `B-${quickItem.barcode.slice(-4)}`,
          expiryDate: "12/27",
          sku: `SKU-${quickItem.barcode.slice(-4)}`,
          imageUrl: quickItem.image,
        },
        ...prev,
      ];
    });
    setNotification(`Added ${quickItem.name}`);
  };

  const updateQty = (idx: number, delta: number) => {
    setItems((prev) => {
      const next = [...prev];
      const newQty = next[idx].qty + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== idx);
      }
      next[idx].qty = newQty;
      return next;
    });
  };

  const removeItem = (idx: number) => {
    if (soundEnabled) playBeep(500, 0.08);
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calculations
  const rawSubtotalPaise = useMemo(
    () => items.reduce((acc, it) => acc + it.sellingPaise * it.qty, 0),
    [items]
  );
  const totalMrpPaise = useMemo(
    () => items.reduce((acc, it) => acc + (it.mrpPaise || it.sellingPaise) * it.qty, 0),
    [items]
  );
  const customerSavingsPaise = Math.max(0, totalMrpPaise - rawSubtotalPaise + discountPaise);

  const taxableAmountPaise = Math.max(0, rawSubtotalPaise - discountPaise);
  const taxPaise = Math.round(taxableAmountPaise * 0.05); // Standard average FMCG GST
  const grandTotalPaise = taxableAmountPaise; // All MRP and selling prices are GST inclusive

  const grandTotalRupees = grandTotalPaise / 100;
  const tenderedRupees = parseFloat(cashTendered) || grandTotalRupees;
  const changeDueRupees = Math.max(0, tenderedRupees - grandTotalRupees);

  // Hold Bill Logic (F5)
  const handleHoldBill = () => {
    if (items.length === 0) {
      setNotification("No items in bill to hold");
      return;
    }
    const newHold: HeldBill = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      billNumber,
      heldAt: new Date().toLocaleTimeString(),
      customerName,
      customerPhone,
      items: [...items],
      discountPaise,
      paymentMode,
    };
    setHeldBills((prev) => [newHold, ...prev]);
    setItems([]);
    setDiscountPaise(0);
    setCustomerName("Walk-in Customer");
    setCustomerPhone("9876543210");
    if (soundEnabled) playBeep(1200, 0.15);
    setNotification(`Bill ${billNumber} held successfully. Counter free for next customer.`);
    const nextNum = parseInt(billNumber.replace("CM-", ""), 10) + 1;
    setBillNumber(`CM-${nextNum}`);
  };

  // Resume Held Bill Logic (F6)
  const handleResumeBill = (held: HeldBill) => {
    setItems(held.items);
    setDiscountPaise(held.discountPaise);
    setCustomerName(held.customerName);
    setCustomerPhone(held.customerPhone);
    setPaymentMode(held.paymentMode);
    setBillNumber(held.billNumber);
    setHeldBills((prev) => prev.filter((b) => b.id !== held.id));
    setShowRecallModal(false);
    if (soundEnabled) playBeep(2200, 0.1);
    setNotification(`Resumed bill ${held.billNumber}`);
  };

  // Quick Master Product Creation (F3)
  const handleCreateQuickMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qmBarcode.trim() || !qmName.trim()) {
      setNotification("Barcode and Product Name are mandatory");
      return;
    }
    setQmSaving(true);
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
          barcode: qmBarcode.trim(),
          name: qmName.trim(),
          categoryId: qmCategory,
          packSize: qmPack.trim(),
          mrpPaise: Math.round(parseFloat(qmMrp) * 100),
          sellingPaise: Math.round(parseFloat(qmPrice) * 100),
          initialStock: 50,
          gstBps: parseInt(qmGst, 10),
        }),
      });

      const data = await res.json();
      if (data.ok) {
        const newProduct = data.data;
        const newItem: PosBillItem = {
          variantId: newProduct.variantId || `v-${qmBarcode}`,
          barcode: qmBarcode.trim(),
          name: qmName.trim(),
          packSize: qmPack.trim(),
          mrpPaise: Math.round(parseFloat(qmMrp) * 100),
          sellingPaise: Math.round(parseFloat(qmPrice) * 100),
          qty: 1,
          gstRate: parseInt(qmGst, 10) / 100,
          batchNo: `B-${qmBarcode.slice(-4)}`,
          expiryDate: "12/28",
          sku: newProduct.sku,
        };
        setItems((prev) => [newItem, ...prev]);
        setShowQuickMasterModal(false);
        setQmBarcode("");
        setQmName("");
        if (soundEnabled) playBeep(2400, 0.15);
        setNotification(`Created and added "${newItem.name}" to bill!`);
      } else {
        setNotification(data.error?.message || "Failed to create product");
      }
    } catch {
      setNotification("Network error adding product");
    } finally {
      setQmSaving(false);
    }
  };

  // Settlement Checkout Execution (With 100% Offline Zero-Downtime Guarantee)
  const handleSettleBill = async () => {
    if (items.length === 0) {
      setNotification("Add at least 1 item before billing");
      return;
    }

    setSettling(true);
    let settledOnline = false;
    let receiptData: any = null;

    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const csrfRes = await fetch("/api/auth/csrf");
        const csrfData = await csrfRes.json();
        const token = csrfData.data?.csrfToken || csrfData.data?.token || "";

        const payload = {
          counterId: defaultCounter,
          cashierName: defaultCashier,
          customerName: customerName.trim() || "Walk-in Customer",
          customerPhone: customerPhone.trim() || "9876543210",
          customerGstin: customerGstin.trim() || undefined,
          customerAddress: customerAddress.trim() || undefined,
          paymentMode,
          items,
          discountPaise,
        };

        const res = await fetch("/api/admin/pos/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": token,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.ok) {
          settledOnline = true;
          receiptData = data.data;
        }
      } catch {
        // Fallback to offline settlement
      }
    }

    if (!settledOnline) {
      // 100% Guaranteed Offline Settlement
      const offlineVoucherNo = `CM-OFF-${Date.now().toString().slice(-6)}`;
      const offlineReceipt: CompletedReceipt = {
        voucherNumber: offlineVoucherNo,
        orderNumber: `ORD-OFF-${Date.now().toString().slice(-6)}`,
        counterId: defaultCounter,
        cashierName: defaultCashier,
        customerName: customerName.trim() || "Walk-in Customer",
        customerPhone: customerPhone.trim() || "9876543210",
        customerGstin: customerGstin.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        paymentMode,
        subtotalPaise: rawSubtotalPaise,
        discountPaise,
        taxPaise,
        grandTotalPaise,
        cashTenderedPaise: Math.round(tenderedRupees * 100),
        changeDuePaise: Math.round(changeDueRupees * 100),
        timestamp: new Date().toISOString(),
        items: items.map((i) => ({
          name: i.name,
          packSize: i.packSize,
          qty: i.qty,
          mrpPaise: i.mrpPaise,
          sellingPaise: i.sellingPaise,
          gstRate: i.gstRate,
          totalPaise: i.sellingPaise * i.qty,
        })),
      };

      try {
        const queue = JSON.parse(localStorage.getItem("CM_OFFLINE_POS_QUEUE") || "[]");
        queue.push({
          id: offlineVoucherNo,
          createdAt: new Date().toISOString(),
          payload: {
            counterId: defaultCounter,
            cashierName: defaultCashier,
            customerName: customerName.trim() || "Walk-in Customer",
            customerPhone: customerPhone.trim() || "9876543210",
            customerGstin: customerGstin.trim() || undefined,
            customerAddress: customerAddress.trim() || undefined,
            paymentMode,
            items,
            discountPaise,
          },
        });
        localStorage.setItem("CM_OFFLINE_POS_QUEUE", JSON.stringify(queue));
        setOfflineBillsCount(queue.length);
      } catch {}

      receiptData = offlineReceipt;
      setNotification(`⚡ Bill #${offlineVoucherNo} Settled Offline & Queued for Cloud Sync!`);
    }

    if (receiptData) {
      if (soundEnabled) {
        playBeep(2400, 0.12);
        setTimeout(() => playBeep(2800, 0.15), 120);
      }
      setCompletedReceipt({
        ...receiptData,
        customerGstin: customerGstin.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        cashTenderedPaise: Math.round(tenderedRupees * 100),
        changeDuePaise: Math.round(changeDueRupees * 100),
        discountPaise,
      });
      setItems([]);
      setCashTendered("");
      setShowSettlementSheet(false);
      // Advance bill number
      const nextNum = parseInt(billNumber.replace(/[^0-9]/g, "") || "4287", 10) + 1;
      setBillNumber(`CM-${nextNum}`);
    } else {
      setNotification("Failed to settle bill");
    }

    setSettling(false);
  };

  const activeCategoryItems =
    selectedCategory === "all"
      ? Object.values(QUICK_CATALOG).flat().slice(0, 8)
      : QUICK_CATALOG[selectedCategory] || [];

  return (
    <div className="w-full">
      {/* =========================================================================
          MOBILE VIEW (Blinkit/Zepto Fast Mobile Billing matching Screen 2)
          ========================================================================= */}
      <div className="block lg:hidden pb-24 bg-[#f8faf9] min-h-screen">
        {/* Mobile Header (Forest Green #062c19) */}
        <header className="sticky top-0 z-30 bg-[#062c19] text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 active:bg-white/20 text-white transition text-lg font-bold"
            >
              ←
            </Link>
            <div>
              <h1 className="text-base font-black tracking-tight text-white leading-tight">BUSY POS - New Bill</h1>
              <span className="text-[10px] text-emerald-300 font-bold">Kota Main Branch · {currentTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isOnline && (
              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[9px] font-black animate-pulse">
                ⚡ Offline
              </span>
            )}
            {offlineBillsCount > 0 && (
              <button
                type="button"
                onClick={triggerOfflineSync}
                disabled={isSyncingOffline || !isOnline}
                className="rounded-full bg-amber-400 text-neutral-900 px-2 py-0.5 text-[9px] font-black"
              >
                ☁️ Sync ({offlineBillsCount})
              </button>
            )}
            {heldBills.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRecallModal(true)}
                className="flex items-center gap-1 rounded-full bg-amber-500 text-neutral-900 px-2.5 py-1 text-[11px] font-black animate-pulse"
              >
                <span>⏸️</span>
                <span>{heldBills.length}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (soundEnabled) playBeep(2000, 0.05);
                mobileSearchInputRef.current?.focus();
                setShowQuickCatalog(!showQuickCatalog);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 active:bg-white/20 text-white transition cursor-pointer"
              title="Quick Add Catalog"
            >
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                <line x1="7" y1="8" x2="7" y2="16" strokeWidth="2" strokeLinecap="round" />
                <line x1="11" y1="8" x2="11" y2="16" strokeWidth="2" strokeLinecap="round" />
                <line x1="14" y1="8" x2="14" y2="16" strokeWidth="2" strokeLinecap="round" />
                <line x1="17" y1="8" x2="17" y2="16" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        {/* Subheader Bar (Store Branch & Bill Number) */}
        <div className="bg-white px-4 py-2 border-b border-neutral-200/80 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-neutral-800 bg-neutral-100 rounded-full px-2.5 py-0.5">
              🏢 Main Store
            </span>
            {isReturnMode && (
              <span className="text-[10px] font-black bg-red-100 text-red-700 rounded-full px-2 py-0.5">
                🚨 Return Mode
              </span>
            )}
          </div>

          <div className="text-xs font-black text-neutral-800 tracking-tight">
            Bill No: <span className="font-extrabold text-[#062c19]">{billNumber}</span>
          </div>
        </div>

        {/* Search & Barcode Bar */}
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
              placeholder="Scan barcode or search FMCG product..."
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
                      <Image src={sr.image} alt={sr.name} fill unoptimized className="object-cover" />
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

        {/* Category Filter Chips */}
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

        {/* Quick Pick Products Drawer */}
        {showQuickCatalog && activeCategoryItems.length > 0 && (
          <div className="bg-emerald-50/70 p-3 border-b border-emerald-200/60">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900">
                ⚡ Quick Add FMCG Items
              </span>
              <button
                type="button"
                onClick={() => setShowQuickCatalog(false)}
                className="text-[11px] font-bold text-neutral-500 hover:text-black"
              >
                ✕ Close
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {activeCategoryItems.map((item) => (
                <button
                  key={item.barcode}
                  type="button"
                  onClick={() => handleAddQuickItem(item)}
                  className="flex items-center gap-2 rounded-xl bg-white border border-emerald-200/80 p-2 shrink-0 shadow-2xs hover:border-[#0c831f] transition"
                >
                  <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                    <Image src={item.image} alt={item.name} fill unoptimized className="object-cover" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-neutral-800 whitespace-nowrap">{item.name}</div>
                    <div className="text-[10px] text-neutral-500 font-semibold">{item.pack} · ₹{item.price}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className="mx-4 my-2 rounded-xl bg-[#062c19] text-white p-2.5 text-xs font-bold flex items-center justify-between shadow-md">
            <span>✨ {notification}</span>
            <button type="button" onClick={() => setNotification(null)} className="font-bold text-emerald-300 ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Card-based Scanned Items List */}
        <div className="px-4 py-3 space-y-2.5">
          {items.map((item, idx) => {
            const lineTotal = (item.qty * item.sellingPaise) / 100;
            return (
              <div
                key={`${item.barcode}-${idx}`}
                className="rounded-2xl bg-white border border-neutral-200/90 p-3.5 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-13 w-13 rounded-xl overflow-hidden bg-neutral-50 shrink-0 border border-neutral-100">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-contain p-1" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-lg">📦</div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-neutral-900 truncate">{item.name}</h3>
                    <p className="text-[11px] font-bold text-neutral-500">({item.packSize})</p>
                    <p className="text-xs font-black text-neutral-700 mt-1">
                      ₹{(item.sellingPaise / 100).toFixed(0)} × {item.qty}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-neutral-300 hover:text-red-500 font-black text-xs"
                    title="Remove item"
                  >
                    ✕
                  </button>

                  <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">
                    <button
                      type="button"
                      onClick={() => updateQty(idx, -1)}
                      className="text-sm font-black text-neutral-600 active:scale-90"
                    >
                      -
                    </button>
                    <span className="text-xs font-black text-neutral-900 w-4 text-center">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(idx, 1)}
                      className="text-sm font-black text-[#0c831f] active:scale-90"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-sm font-black text-neutral-900">₹{lineTotal.toFixed(0)}</span>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="rounded-3xl bg-white border border-dashed border-neutral-200 p-8 text-center text-neutral-400">
              <span className="text-4xl block mb-2">🛒</span>
              <p className="font-extrabold text-sm text-neutral-800">Your counter bill is empty</p>
              <p className="text-xs text-neutral-400 mt-1">Scan product barcodes or pick from categories above</p>
            </div>
          )}
        </div>

        {/* Mobile Action Pills (Add Customer, Discount, Hold Bill) */}
        <div className="px-4 py-2 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-white border border-neutral-200/90 py-2.5 px-2 text-xs font-black text-neutral-700 shadow-2xs active:bg-neutral-50"
          >
            <span>👤</span>
            <span className="truncate">{customerName === "Walk-in Customer" ? "Customer" : customerName}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDiscountModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-white border border-neutral-200/90 py-2.5 px-2 text-xs font-black text-neutral-700 shadow-2xs active:bg-neutral-50"
          >
            <span>🏷️</span>
            <span>{discountPaise > 0 ? `-₹${discountPaise / 100}` : "Discount"}</span>
          </button>

          <button
            type="button"
            onClick={handleHoldBill}
            disabled={items.length === 0}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-white border border-neutral-200/90 py-2.5 px-2 text-xs font-black text-amber-700 shadow-2xs active:bg-neutral-50 disabled:opacity-50"
          >
            <span>⏸️</span>
            <span>Hold Bill</span>
          </button>
        </div>

        {/* Bill Summary Box */}
        <div className="mx-4 my-2 rounded-2xl bg-white border border-neutral-200/90 p-4 shadow-2xs space-y-2 text-xs">
          <div className="flex justify-between font-bold text-neutral-600">
            <span>Items ({items.length})</span>
            <span className="text-neutral-900 font-extrabold">₹{(rawSubtotalPaise / 100).toFixed(0)}</span>
          </div>

          {discountPaise > 0 && (
            <div className="flex justify-between font-bold text-emerald-600">
              <span>Discount</span>
              <span className="font-extrabold">-₹{(discountPaise / 100).toFixed(0)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-neutral-600">
            <span>Included GST (5%)</span>
            <span className="text-neutral-900 font-extrabold">₹{(taxPaise / 100).toFixed(2)}</span>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-sm font-black text-neutral-900">Total Payable</span>
            <span className="text-xl font-black text-[#062c19]">
              ₹{grandTotalRupees.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Fixed Bottom Button (Generate Bill & Collect) */}
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
          DESKTOP VIEW: 1000000% AUTHENTIC BUSY RETAIL POS WORKSTATION
          ========================================================================= */}
      <div className="hidden lg:block space-y-4">
        {/* 1. BUSY Top Command Header */}
        <div className="rounded-3xl bg-[#032210] p-4 text-white shadow-xl border border-emerald-900/70 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#22c55e] to-[#15803d] flex items-center justify-center text-white text-2xl shadow-lg ring-2 ring-emerald-500/30 shrink-0">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>BUSY 21 RETAIL POS</span>
                  <span className="text-xs font-normal text-emerald-400">·</span>
                  <span className="text-sm font-extrabold text-emerald-300">Central Mart Supermarket</span>
                </h1>
                {isOnline ? (
                  <span className="rounded-full bg-emerald-500/20 text-[#86efac] border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-ping" />
                    Live Cloud Sync
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-black flex items-center gap-1 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    ⚡ Offline POS
                  </span>
                )}
                {offlineBillsCount > 0 && (
                  <button
                    type="button"
                    onClick={triggerOfflineSync}
                    disabled={isSyncingOffline || !isOnline}
                    className="rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-900 px-2.5 py-0.5 text-[10px] font-black flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-xs"
                    title="Click to sync offline bills to cloud database"
                  >
                    <span>☁️ {isSyncingOffline ? "Syncing..." : `Sync (${offlineBillsCount} Pending)`}</span>
                  </button>
                )}
                {isReturnMode && (
                  <span className="rounded-full bg-red-500/30 text-red-200 border border-red-500/50 px-2.5 py-0.5 text-[10px] font-black animate-pulse">
                    🚨 Return Mode (F10)
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-200/90 font-medium mt-0.5 flex items-center gap-3">
                <span>Vch Type: <strong className="text-white">POS Sales Invoice</strong></span>
                <span>·</span>
                <span>Series: <strong className="text-white">{voucherSeries}</strong></span>
                <span>·</span>
                <span>Counter: <strong className="text-white">{defaultCounter}</strong></span>
                <span>·</span>
                <span>Cashier: <strong className="text-white">{defaultCashier}</strong></span>
                <span>·</span>
                <span>Bill No: <strong className="text-[#86efac] font-black text-sm">{billNumber}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-mono text-emerald-300 uppercase block">GSTIN: 08AAAAA0000A1Z5</span>
              <span className="text-xs font-mono font-black text-white">{currentTime}</span>
            </div>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer"
            >
              <span>{soundEnabled ? "🔊 Beep" : "🔇 Mute"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              className="flex items-center gap-1 rounded-xl bg-[#22c55e]/20 hover:bg-[#22c55e]/30 border border-emerald-400/40 px-3 py-1.5 text-xs font-black text-emerald-300 transition cursor-pointer"
            >
              <span>⌨️ Shortcuts (F1)</span>
            </button>
          </div>
        </div>

        {/* 2. BUSY Function Key Shortcuts Dock (F1 to F12) */}
        <div className="grid grid-cols-12 gap-1.5 bg-neutral-900 p-2 rounded-2xl border border-neutral-800 text-center text-white text-[11px] font-bold shadow-md">
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="col-span-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 py-1.5 px-1 border border-neutral-700 transition"
          >
            <span className="block text-[9px] text-amber-400 font-black">F1</span>
            <span>Help</span>
          </button>

          <button
            type="button"
            onClick={handleSettleBill}
            disabled={items.length === 0}
            className="col-span-1 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 py-1.5 px-1 border border-emerald-600 transition disabled:opacity-40"
          >
            <span className="block text-[9px] text-[#86efac] font-black">F2</span>
            <span>Settle</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQuickMasterModal(true)}
            className="col-span-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 py-1.5 px-1 border border-neutral-700 transition"
          >
            <span className="block text-[9px] text-sky-400 font-black">F3</span>
            <span>Item+</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMode("CASH")}
            className={`col-span-1 rounded-xl py-1.5 px-1 border transition ${
              paymentMode === "CASH" ? "bg-emerald-600 border-emerald-400 text-white font-black" : "bg-neutral-800 hover:bg-neutral-700 border-neutral-700"
            }`}
          >
            <span className="block text-[9px] text-emerald-300 font-black">F4</span>
            <span>Cash</span>
          </button>

          <button
            type="button"
            onClick={handleHoldBill}
            disabled={items.length === 0}
            className="col-span-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 py-1.5 px-1 border border-neutral-700 transition disabled:opacity-40"
          >
            <span className="block text-[9px] text-amber-300 font-black">F5</span>
            <span>Hold</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRecallModal(true)}
            className="col-span-1 rounded-xl bg-amber-900/60 hover:bg-amber-800 py-1.5 px-1 border border-amber-600/70 transition relative"
          >
            <span className="block text-[9px] text-amber-300 font-black">F6</span>
            <span>Recall {heldBills.length > 0 && `(${heldBills.length})`}</span>
            {heldBills.length > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-black">
                {heldBills.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowDiscountModal(true)}
            className="col-span-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 py-1.5 px-1 border border-neutral-700 transition"
          >
            <span className="block text-[9px] text-yellow-300 font-black">F7</span>
            <span>Disc</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMode("UPI")}
            className={`col-span-1 rounded-xl py-1.5 px-1 border transition ${
              paymentMode === "UPI" ? "bg-purple-600 border-purple-400 text-white font-black" : "bg-neutral-800 hover:bg-neutral-700 border-neutral-700"
            }`}
          >
            <span className="block text-[9px] text-purple-300 font-black">F8</span>
            <span>UPI QR</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMode("CARD")}
            className={`col-span-1 rounded-xl py-1.5 px-1 border transition ${
              paymentMode === "CARD" ? "bg-blue-600 border-blue-400 text-white font-black" : "bg-neutral-800 hover:bg-neutral-700 border-neutral-700"
            }`}
          >
            <span className="block text-[9px] text-blue-300 font-black">F9</span>
            <span>Card</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReturnMode(!isReturnMode)}
            className={`col-span-1 rounded-xl py-1.5 px-1 border transition ${
              isReturnMode ? "bg-red-600 border-red-400 text-white font-black animate-pulse" : "bg-neutral-800 hover:bg-neutral-700 border-neutral-700"
            }`}
          >
            <span className="block text-[9px] text-red-300 font-black">F10</span>
            <span>Return</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDayClosingModal(true)}
            className="col-span-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 py-1.5 px-1 border border-neutral-700 transition"
          >
            <span className="block text-[9px] text-teal-300 font-black">F11</span>
            <span>Z-Report</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCalculatorModal(true)}
            className="col-span-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 py-1.5 px-1 border border-neutral-700 transition"
          >
            <span className="block text-[9px] text-neutral-400 font-black">F12</span>
            <span>Calc</span>
          </button>
        </div>

        {/* 3. Customer & Party Header Bar */}
        <div className="rounded-2xl bg-white border border-neutral-200/90 p-3 shadow-xs grid grid-cols-12 gap-3 items-center">
          <div className="col-span-3">
            <label className="block text-[10px] font-black uppercase text-neutral-500 mb-0.5">Party / Customer (F)</label>
            <div className="relative">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-1.5 text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-[10px] font-black uppercase text-neutral-500 mb-0.5">Mobile Number</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-1.5 text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-[10px] font-black uppercase text-neutral-500 mb-0.5">Pricing Mode</label>
            <select
              value={priceMode}
              onChange={(e) => setPriceMode(e.target.value as any)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-1.5 text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
            >
              <option value="RETAIL">Retail Selling Price</option>
              <option value="MRP">Maximum Retail Price (MRP)</option>
              <option value="WHOLESALE">Wholesale Rate</option>
            </select>
          </div>

          <div className="col-span-5 flex items-center justify-between pl-2 border-l border-neutral-200">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase block">Customer Khata / Ledger</span>
              <span className="text-xs font-extrabold text-neutral-700">
                Balance: <strong className="text-emerald-700 font-black">₹0.00</strong> · Loyalty: <strong className="text-amber-600 font-black">120 Pts (₹30)</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/api/admin/busy/export-orders"
                download
                className="flex items-center gap-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2.5 py-1 text-xs font-bold transition"
                title="Export Vouchers to BUSY XML"
              >
                <span>📥</span>
                <span>BUSY XML</span>
              </a>

              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="rounded-xl bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 text-xs font-bold transition"
                >
                  Clear Bill
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Laser Barcode Scanner Input Bar */}
        <div className="rounded-2xl border-2 border-emerald-500 bg-white p-3 shadow-sm flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-black uppercase text-emerald-950 tracking-wider">
              Scan Barcode / SKU
            </span>
          </div>

          <div className="flex-1 relative">
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
              placeholder="Scan product barcode (or type barcode / item name and press Enter)..."
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm font-black text-neutral-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
            />

            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl bg-white border border-neutral-200 shadow-2xl z-40 max-h-60 overflow-y-auto divide-y divide-neutral-100">
                {searchResults.map((sr) => (
                  <button
                    key={sr.barcode}
                    type="button"
                    onClick={() => {
                      handleAddQuickItem(sr);
                      setBarcodeInput("");
                      setSearchResults([]);
                    }}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-emerald-50 text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-neutral-900">{sr.name} ({sr.pack})</span>
                      <span className="text-[10px] font-mono text-neutral-400">{sr.barcode}</span>
                    </div>
                    <span className="text-xs font-black text-[#0c831f]">₹{sr.price} (+ Add)</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleScanItem(barcodeInput)}
            disabled={scanning || !barcodeInput.trim()}
            className="rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-5 py-2 text-xs font-black transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {scanning ? "Scanning..." : "Add Item"}
          </button>
        </div>

        {/* 5. Main Workstation 2-Column Layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column: Full BUSY Item Grid Table (8 cols) */}
          <div className="col-span-8 space-y-3">
            <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
              <div className="bg-neutral-800 text-white px-4 py-2 flex items-center justify-between text-xs font-black">
                <span>VOUCHER ITEM GRID ({items.length} ITEMS · {items.reduce((acc, i) => acc + i.qty, 0)} UNITS)</span>
                <span className="text-emerald-300 font-mono">Series: {voucherSeries}</span>
              </div>

              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-neutral-100 border-b border-neutral-200 text-[10px] font-black uppercase text-neutral-600">
                    <tr>
                      <th className="py-2 px-2.5 text-center w-8">#</th>
                      <th className="py-2 px-2">Item Description</th>
                      <th className="py-2 px-2">Barcode</th>
                      <th className="py-2 px-2">Batch/Exp</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-2 text-right">MRP</th>
                      <th className="py-2 px-2 text-right">Rate</th>
                      <th className="py-2 px-2 text-center">GST</th>
                      <th className="py-2 px-2.5 text-right">Amount (₹)</th>
                      <th className="py-2 px-1 text-center w-6">✕</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {items.map((item, idx) => (
                      <tr key={`${item.barcode}-${idx}`} className="hover:bg-neutral-50/80 transition">
                        <td className="py-2 px-2.5 text-center font-bold text-neutral-400">{idx + 1}</td>
                        <td className="py-2 px-2 font-black text-neutral-900">
                          <div className="flex items-center gap-2">
                            {item.imageUrl && (
                              <div className="relative h-7 w-7 rounded overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                                <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-cover" />
                              </div>
                            )}
                            <div>
                              <span>{item.name}</span>
                              <span className="text-[10px] font-semibold text-neutral-500 ml-1">({item.packSize})</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 font-mono text-[10px] text-neutral-500">{item.barcode}</td>
                        <td className="py-2 px-2 font-mono text-[10px] text-neutral-500">{item.batchNo || "B-101"} · {item.expiryDate || "12/27"}</td>
                        <td className="py-2 px-2 text-center">
                          <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQty(idx, -1)}
                              className="h-5 w-5 rounded bg-white hover:bg-neutral-200 font-black text-neutral-700 flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-black text-xs">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(idx, 1)}
                              className="h-5 w-5 rounded bg-white hover:bg-neutral-200 font-black text-neutral-700 flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right font-semibold text-neutral-400 line-through">
                          {formatPaise(item.mrpPaise || item.sellingPaise)}
                        </td>
                        <td className="py-2 px-2 text-right font-black text-neutral-800">
                          {formatPaise(item.sellingPaise)}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-emerald-700">
                          {item.gstRate || 5}%
                        </td>
                        <td className="py-2 px-2.5 text-right font-black text-[#0c831f] text-sm">
                          {formatPaise(item.qty * item.sellingPaise)}
                        </td>
                        <td className="py-2 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-neutral-300 hover:text-red-600 font-bold text-sm cursor-pointer"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}

                    {items.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-neutral-400">
                          <p className="text-3xl mb-1">🧾</p>
                          <p className="font-bold text-neutral-600">No items in active bill</p>
                          <p className="text-xs mt-0.5">Scan product barcode or press F3 to add a new item master</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Quick Category Strip */}
              <div className="bg-neutral-50 px-3 py-2 border-t border-neutral-200 flex items-center gap-2 overflow-x-auto text-xs font-bold text-neutral-600">
                <span className="text-[10px] font-black uppercase text-neutral-400">Quick Pick:</span>
                {activeCategoryItems.map((item) => (
                  <button
                    key={item.barcode}
                    type="button"
                    onClick={() => handleAddQuickItem(item)}
                    className="flex items-center gap-1.5 rounded-lg bg-white border border-neutral-200 px-2 py-1 shrink-0 hover:border-[#0c831f] transition"
                  >
                    <span>{item.name}</span>
                    <span className="text-[#0c831f] font-black">₹{item.price}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: BUSY Bill Sundry, Tax Summary & Tender (4 cols) */}
          <div className="col-span-4 space-y-3">
            {/* Bill Sundry & Tax Summary Box */}
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs space-y-3">
              <h3 className="font-black text-xs text-neutral-800 pb-2 border-b border-neutral-100 flex items-center justify-between">
                <span>BILL SUNDRY &amp; TAX BREAKUP</span>
                <span className="text-emerald-700 font-extrabold">{items.length} Items</span>
              </h3>

              <div className="space-y-1.5 text-xs font-bold text-neutral-600">
                <div className="flex justify-between">
                  <span>Gross Total (MRP):</span>
                  <span className="text-neutral-800">{formatPaise(totalMrpPaise)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Basic Subtotal:</span>
                  <span className="text-neutral-800">{formatPaise(rawSubtotalPaise)}</span>
                </div>

                {discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Bill Discount (F7):</span>
                    <span>-{formatPaise(discountPaise)}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-500">
                  <span>Taxable Value:</span>
                  <span>{formatPaise(taxableAmountPaise)}</span>
                </div>

                <div className="flex justify-between text-neutral-500">
                  <span>CGST (2.5%) + SGST (2.5%):</span>
                  <span>{formatPaise(taxPaise)}</span>
                </div>

                {customerSavingsPaise > 0 && (
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-black flex items-center justify-between border border-emerald-200">
                    <span>🎉 Total Customer Savings:</span>
                    <span>{formatPaise(customerSavingsPaise)}</span>
                  </div>
                )}
              </div>

              {/* Big Digital Total Display */}
              <div className="p-3 rounded-2xl bg-[#062c19] text-white text-center shadow-inner">
                <span className="text-[10px] font-black tracking-wider uppercase text-emerald-300 block">
                  NET AMOUNT PAYABLE
                </span>
                <div className="text-3xl font-black tracking-tight text-white mt-0.5">
                  ₹{grandTotalRupees.toFixed(2)}
                </div>
              </div>

              {/* Payment Mode Selector Tabs */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentMode("CASH")}
                  className={`rounded-xl py-2 text-center text-xs transition cursor-pointer border ${
                    paymentMode === "CASH"
                      ? "bg-emerald-600 text-white font-black border-emerald-500 shadow-sm"
                      : "bg-neutral-50 text-neutral-700 font-bold border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  <span className="block text-sm">💵</span>
                  <span className="text-[10px]">Cash (F4)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode("UPI")}
                  className={`rounded-xl py-2 text-center text-xs transition cursor-pointer border ${
                    paymentMode === "UPI"
                      ? "bg-purple-600 text-white font-black border-purple-500 shadow-sm"
                      : "bg-neutral-50 text-neutral-700 font-bold border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  <span className="block text-sm">📱</span>
                  <span className="text-[10px]">UPI QR (F8)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode("CARD")}
                  className={`rounded-xl py-2 text-center text-xs transition cursor-pointer border ${
                    paymentMode === "CARD"
                      ? "bg-blue-600 text-white font-black border-blue-500 shadow-sm"
                      : "bg-neutral-50 text-neutral-700 font-bold border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  <span className="block text-sm">💳</span>
                  <span className="text-[10px]">Card (F9)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode("SPLIT")}
                  className={`rounded-xl py-2 text-center text-xs transition cursor-pointer border ${
                    paymentMode === "SPLIT"
                      ? "bg-amber-600 text-white font-black border-amber-500 shadow-sm"
                      : "bg-neutral-50 text-neutral-700 font-bold border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  <span className="block text-sm">⚖️</span>
                  <span className="text-[10px]">Split</span>
                </button>
              </div>

              {/* Cash Tender & Change Calculator */}
              {paymentMode === "CASH" && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-amber-900">Cash Tendered (₹):</span>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder={grandTotalRupees.toFixed(0)}
                      className="w-28 rounded-lg border border-amber-300 bg-white px-2 py-1 text-right text-xs font-black text-neutral-900 outline-hidden focus:border-amber-600"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setCashTendered(grandTotalRupees.toFixed(0))}
                      className="rounded-lg bg-white border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-900 hover:bg-amber-100"
                    >
                      Exact
                    </button>
                    {[50, 100, 200, 500, 2000].map((note) => (
                      <button
                        key={note}
                        type="button"
                        onClick={() => setCashTendered(String(note))}
                        className="rounded-lg bg-white border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-900 hover:bg-amber-100"
                      >
                        ₹{note}
                      </button>
                    ))}
                  </div>

                  {changeDueRupees > 0 && (
                    <div className="flex items-center justify-between text-xs font-black text-amber-900 pt-1.5 border-t border-amber-200">
                      <span>Change Due to Customer:</span>
                      <span className="text-base text-amber-800">₹{changeDueRupees.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic UPI QR Display */}
              {paymentMode === "UPI" && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-center space-y-1.5">
                  <p className="text-[11px] font-black text-purple-900">Scan to Pay via Any UPI App (GPay/PhonePe/Paytm)</p>
                  <div className="h-28 w-28 mx-auto rounded-xl bg-white border-2 border-purple-300 flex items-center justify-center p-1.5 shadow-inner">
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
                  <p className="text-[10px] font-bold text-purple-700">
                    centralmart@upi · ₹{grandTotalRupees.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Settle Bill Button */}
              <button
                type="button"
                onClick={handleSettleBill}
                disabled={settling || items.length === 0}
                className="w-full rounded-2xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white py-3.5 px-4 text-sm font-black shadow-lg shadow-emerald-900/30 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🧾</span>
                <span>{settling ? "Recording Bill..." : "Settle Bill & Print Receipt (F2)"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ALL BUSY MODALS & SHEETS
          ========================================================================= */}

      {/* 1. Mobile Settlement Sheet */}
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

            {/* Payment Mode Pills */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode("CASH")}
                className={`rounded-2xl p-3 text-center border font-black text-xs transition ${
                  paymentMode === "CASH" ? "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs" : "border-neutral-200 bg-white text-neutral-700"
                }`}
              >
                <span className="block text-xl mb-1">💵</span>
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("UPI")}
                className={`rounded-2xl p-3 text-center border font-black text-xs transition ${
                  paymentMode === "UPI" ? "border-purple-600 bg-purple-50 text-purple-900 shadow-xs" : "border-neutral-200 bg-white text-neutral-700"
                }`}
              >
                <span className="block text-xl mb-1">📱</span>
                <span>UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("CARD")}
                className={`rounded-2xl p-3 text-center border font-black text-xs transition ${
                  paymentMode === "CARD" ? "border-blue-600 bg-blue-50 text-blue-900 shadow-xs" : "border-neutral-200 bg-white text-neutral-700"
                }`}
              >
                <span className="block text-xl mb-1">💳</span>
                <span>Card</span>
              </button>
            </div>

            {/* Cash Tendered Input */}
            {paymentMode === "CASH" && (
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900">Cash Received (₹):</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={grandTotalRupees.toFixed(0)}
                    className="w-28 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-right font-black text-sm text-neutral-900 outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCashTendered(grandTotalRupees.toFixed(0))}
                    className="rounded-lg bg-white border border-amber-300 px-2.5 py-1 text-xs font-black text-amber-900"
                  >
                    Exact
                  </button>
                  {[500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(String(amt))}
                      className="rounded-lg bg-white border border-amber-300 px-2.5 py-1 text-xs font-black text-amber-900"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {changeDueRupees > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-amber-200 text-xs font-black text-amber-900">
                    <span>Change Due:</span>
                    <span className="text-base text-amber-800">₹{changeDueRupees.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* UPI QR */}
            {paymentMode === "UPI" && (
              <div className="rounded-2xl bg-purple-50 border border-purple-200 p-4 text-center space-y-2">
                <p className="text-xs font-black text-purple-900">Scan to Pay via UPI</p>
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
                <p className="text-xs font-black text-purple-800">centralmart@upi · ₹{grandTotalRupees.toFixed(2)}</p>
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

      {/* 2. Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-neutral-200 space-y-4">
            <h3 className="text-sm font-black text-neutral-900 pb-2 border-b border-neutral-100">
              Customer Information &amp; Khata
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">GSTIN (Optional B2B)</label>
                <input
                  type="text"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  placeholder="08AAAAA0000A1Z5"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#0c831f] focus:outline-hidden uppercase"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="w-full rounded-xl bg-[#0c831f] text-white py-2 text-xs font-black cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-neutral-200 space-y-4">
            <h3 className="text-sm font-black text-neutral-900 pb-2 border-b border-neutral-100">
              Apply Bill Sundry / Discount (F7)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Discount Amount (₹)</label>
                <input
                  type="number"
                  value={discountPaise / 100}
                  onChange={(e) => setDiscountPaise(Math.max(0, parseFloat(e.target.value) || 0) * 100)}
                  placeholder="0"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[10, 20, 50, 100].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiscountPaise(d * 100)}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 py-1.5 text-xs font-bold text-neutral-700 hover:bg-emerald-50 hover:border-emerald-500"
                  >
                    -₹{d}
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

      {/* 4. Recall Held Bills Modal (F6) */}
      {showRecallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-black text-neutral-900">Held / Parked Bills (F6)</h3>
                <p className="text-xs text-neutral-500 font-semibold">{heldBills.length} active bills on hold</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecallModal(false)}
                className="rounded-full bg-neutral-100 h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 flex-1 divide-y divide-neutral-100">
              {heldBills.map((b) => {
                const bTotal = b.items.reduce((acc, i) => acc + i.qty * i.sellingPaise, 0) - b.discountPaise;
                return (
                  <div key={b.id} className="pt-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-neutral-900 flex items-center gap-2">
                        <span>{b.billNumber}</span>
                        <span className="text-[10px] text-neutral-400 font-normal">Held at {b.heldAt}</span>
                      </div>
                      <div className="text-[11px] text-neutral-600 mt-0.5">
                        Customer: <strong className="text-neutral-800">{b.customerName}</strong> ({b.customerPhone})
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {b.items.length} items · Total: <strong className="text-[#0c831f] font-black">{formatPaise(bTotal)}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResumeBill(b)}
                        className="rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-3 py-1.5 text-xs font-black shadow-xs cursor-pointer"
                      >
                        Resume Bill →
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeldBills((prev) => prev.filter((x) => x.id !== b.id))}
                        className="rounded-xl bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1.5 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}

              {heldBills.length === 0 && (
                <div className="py-12 text-center text-neutral-400">
                  <p className="text-3xl mb-1">⏸️</p>
                  <p className="font-bold text-neutral-700">No held bills</p>
                  <p className="text-xs text-neutral-400 mt-1">Press F5 anytime to hold an active bill</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Quick Master Item Modal (F3) */}
      {showQuickMasterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-black text-neutral-900">Quick Item Master (F3)</h3>
                <p className="text-xs text-neutral-500 font-semibold">Create new product &amp; insert into bill</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickMasterModal(false)}
                className="rounded-full bg-neutral-100 h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuickMaster} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-neutral-600 mb-1">Barcode / GTIN</label>
                <input
                  type="text"
                  required
                  value={qmBarcode}
                  onChange={(e) => setQmBarcode(e.target.value)}
                  placeholder="8901234567890"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-mono font-bold text-neutral-900 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-neutral-600 mb-1">Product Description</label>
                <input
                  type="text"
                  required
                  value={qmName}
                  onChange={(e) => setQmName(e.target.value)}
                  placeholder="e.g. Parle-G Gold Biscuits"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-neutral-600 mb-1">Pack Size</label>
                  <input
                    type="text"
                    value={qmPack}
                    onChange={(e) => setQmPack(e.target.value)}
                    placeholder="250 g"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-neutral-600 mb-1">GST Rate</label>
                  <select
                    value={qmGst}
                    onChange={(e) => setQmGst(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
                  >
                    <option value="0">0% (Nil)</option>
                    <option value="500">5% GST</option>
                    <option value="1200">12% GST</option>
                    <option value="1800">18% GST</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-neutral-600 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={qmMrp}
                    onChange={(e) => setQmMrp(e.target.value)}
                    placeholder="100"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-neutral-600 mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={qmPrice}
                    onChange={(e) => setQmPrice(e.target.value)}
                    placeholder="90"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#0c831f] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowQuickMasterModal(false)}
                  className="rounded-xl bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={qmSaving}
                  className="rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-5 py-2 text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {qmSaving ? "Creating..." : "Save & Add to Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Day Closing Z-Report Modal (F11) */}
      {showDayClosingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-black text-neutral-900">Day Closing Z-Report (F11)</h3>
                <p className="text-xs text-neutral-500 font-semibold">Counter: {defaultCounter} · Cashier: {defaultCashier}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDayClosingModal(false)}
                className="rounded-full bg-neutral-100 h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="font-bold text-neutral-600">Opening Cash Float:</span>
                <span className="font-mono font-black text-neutral-900">₹2,000.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="font-bold text-neutral-600">Total Cash Sales:</span>
                <span className="font-mono font-black text-emerald-700">₹48,250.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="font-bold text-neutral-600">Total UPI / QR Collections:</span>
                <span className="font-mono font-black text-purple-700">₹32,180.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="font-bold text-neutral-600">Total Card / POS Collections:</span>
                <span className="font-mono font-black text-blue-700">₹14,390.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="font-bold text-neutral-600">Total Tax Collected (GST):</span>
                <span className="font-mono font-black text-neutral-700">₹4,741.00</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-neutral-900 text-sm font-black text-neutral-900">
                <span>Closing Cash in Drawer:</span>
                <span className="text-[#0c831f]">₹50,250.00</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-2xl bg-neutral-900 hover:bg-black text-white py-2.5 text-xs font-black shadow-md cursor-pointer text-center"
              >
                🖨️ Print Z-Report
              </button>
              <button
                type="button"
                onClick={() => setShowDayClosingModal(false)}
                className="flex-1 rounded-2xl bg-neutral-100 py-2.5 text-xs font-bold text-neutral-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Retail Calculator Modal (F12) */}
      {showCalculatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-xs rounded-3xl bg-neutral-900 p-5 shadow-2xl border border-neutral-800 text-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-black text-emerald-400">POS Calculator (F12)</span>
              <button
                type="button"
                onClick={() => setShowCalculatorModal(false)}
                className="text-neutral-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-neutral-800 p-3 text-right font-mono text-xl font-black text-[#86efac] tracking-wider min-h-[46px] overflow-x-auto">
              {calcInput || "0"}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {["C", "CE", "/", "*", "7", "8", "9", "-", "4", "5", "6", "+", "1", "2", "3", "=", "0", ".", "%"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === "C" || key === "CE") {
                      setCalcInput("");
                    } else if (key === "=") {
                      try {
                        const sanitized = calcInput.replace(/[^0-9+\-*/.]/g, "");
                        // eslint-disable-next-line no-eval
                        const res = Function(`"use strict"; return (${sanitized})`)();
                        setCalcInput(String(res));
                      } catch {
                        setCalcInput("Err");
                      }
                    } else {
                      setCalcInput((prev) => prev + key);
                    }
                  }}
                  className={`rounded-xl py-3 font-mono font-black text-sm transition active:scale-95 ${
                    key === "="
                      ? "col-span-2 bg-[#22c55e] text-neutral-950 font-black shadow-md"
                      : key === "C" || key === "CE"
                      ? "bg-red-500/20 text-red-300"
                      : ["+", "-", "*", "/"].includes(key)
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : "bg-neutral-800 text-white hover:bg-neutral-700"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. BUSY Shortcuts Help Modal (F1) */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-black text-neutral-900">BUSY POS Keyboard Shortcuts (F1)</h3>
                <p className="text-xs text-neutral-500 font-semibold">Fast cashier operation commands</p>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="rounded-full bg-neutral-100 h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <span className="font-black text-emerald-700 font-mono">F2 / Ctrl+Enter</span>
                <span className="block text-neutral-600 font-semibold">Settle &amp; Print Bill</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <span className="font-black text-sky-700 font-mono">F3</span>
                <span className="block text-neutral-600 font-semibold">Quick Item Master</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <span className="font-black text-emerald-700 font-mono">F4</span>
                <span className="block text-neutral-600 font-semibold">Cash Tender Mode</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <span className="font-black text-amber-700 font-mono">F5</span>
                <span className="block text-neutral-600 font-semibold">Hold / Park Bill</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <span className="font-black text-amber-700 font-mono">F6</span>
                <span className="block text-neutral-600 font-semibold">Recall Held Bills</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <span className="font-black text-yellow-700 font-mono">F7</span>
                <span className="block text-neutral-600 font-semibold">Bill Sundry / Discount</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <span className="font-black text-purple-700 font-mono">F8</span>
                <span className="block text-neutral-600 font-semibold">UPI Dynamic QR</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <span className="font-black text-blue-700 font-mono">F9</span>
                <span className="block text-neutral-600 font-semibold">Card Swipe Mode</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <span className="font-black text-red-700 font-mono">F10</span>
                <span className="block text-neutral-600 font-semibold">Return Mode / Credit Note</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <span className="font-black text-teal-700 font-mono">F11</span>
                <span className="block text-neutral-600 font-semibold">Day Closing Z-Report</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <span className="font-black text-neutral-700 font-mono">F12</span>
                <span className="block text-neutral-600 font-semibold">Cashier Calculator</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <span className="font-black text-neutral-700 font-mono">Esc</span>
                <span className="block text-neutral-600 font-semibold">Close Active Modal</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowShortcutsModal(false)}
              className="w-full rounded-2xl bg-neutral-900 text-white py-2.5 text-xs font-black"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 9. Completed Receipt & Tax Invoice Modal (Dual 80mm & A4 GST Formats) */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200">
            {/* Format Switcher Tab */}
            <div className="flex items-center gap-2 mb-4 p-1 rounded-2xl bg-neutral-100 text-xs font-bold text-neutral-600">
              <button
                type="button"
                onClick={() => setReceiptPrintFormat("THERMAL_80MM")}
                className={`flex-1 py-1.5 rounded-xl transition ${
                  receiptPrintFormat === "THERMAL_80MM" ? "bg-white text-neutral-900 font-black shadow-xs" : "hover:text-black"
                }`}
              >
                🧾 80mm Thermal Slip
              </button>
              <button
                type="button"
                onClick={() => setReceiptPrintFormat("A4_TAX_INVOICE")}
                className={`flex-1 py-1.5 rounded-xl transition ${
                  receiptPrintFormat === "A4_TAX_INVOICE" ? "bg-white text-neutral-900 font-black shadow-xs" : "hover:text-black"
                }`}
              >
                📄 A4 GST Tax Invoice
              </button>
            </div>

            {/* Thermal Print Area */}
            {receiptPrintFormat === "THERMAL_80MM" ? (
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
                      <span className="max-w-[210px] truncate">
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
                  {completedReceipt.changeDuePaise !== undefined && completedReceipt.changeDuePaise > 0 && (
                    <div className="flex justify-between text-xs text-amber-800 pt-0.5">
                      <span>Change Returned:</span>
                      <span>{formatPaise(completedReceipt.changeDuePaise)}</span>
                    </div>
                  )}
                </div>

                <div className="text-center pt-3 border-t border-dashed border-neutral-300 text-[10px] text-neutral-500">
                  <p className="font-bold">Thank you for shopping at Central Mart!</p>
                  <p>Fast Delivery · Quality FMCG Essentials</p>
                </div>
              </div>
            ) : (
              /* Standard Indian A4 GST Tax Invoice Format */
              <div className="font-sans text-xs text-neutral-900 space-y-3 p-2 border border-neutral-200 rounded-xl bg-neutral-50">
                <div className="text-center pb-2 border-b border-neutral-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">TAX INVOICE (ORIGINAL FOR RECIPIENT)</span>
                  <h2 className="text-base font-black text-neutral-900 mt-0.5">CENTRAL MART FMCG SUPERMARKET</h2>
                  <p className="text-[10px] text-neutral-600">Kota Main Branch · Kota, Rajasthan 324005</p>
                  <p className="text-[10px] font-mono font-bold text-neutral-800">GSTIN: 08AAAAA0000A1Z5 · State Code: 08 (Rajasthan)</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] pb-2 border-b border-neutral-200">
                  <div>
                    <span className="font-bold text-neutral-500 block">Billed To (Customer):</span>
                    <span className="font-black text-neutral-900">{completedReceipt.customerName}</span>
                    <span className="block text-neutral-600">Tel: {completedReceipt.customerPhone || "N/A"}</span>
                    {completedReceipt.customerGstin && (
                      <span className="font-mono text-neutral-800 block">GSTIN: {completedReceipt.customerGstin}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-neutral-500 block">Invoice Details:</span>
                    <span className="font-mono font-black text-neutral-900">Inv: {completedReceipt.voucherNumber}</span>
                    <span className="block text-neutral-600">Date: {new Date(completedReceipt.timestamp).toLocaleDateString()}</span>
                    <span className="block text-neutral-600">Mode: {completedReceipt.paymentMode}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black uppercase text-neutral-500 pb-1 border-b border-neutral-200">
                    <span>Description</span>
                    <span>Rate</span>
                    <span>Qty</span>
                    <span>GST</span>
                    <span>Amount</span>
                  </div>
                  {completedReceipt.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-[11px] py-0.5">
                      <span className="max-w-[140px] truncate">{it.name}</span>
                      <span>{formatPaise(it.sellingPaise)}</span>
                      <span>{it.qty}</span>
                      <span>5%</span>
                      <span className="font-bold">{formatPaise(it.totalPaise)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t-2 border-neutral-300 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Total Taxable:</span>
                    <span>{formatPaise(completedReceipt.subtotalPaise - completedReceipt.discountPaise)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>CGST (2.5%) + SGST (2.5%):</span>
                    <span>{formatPaise(completedReceipt.taxPaise)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-neutral-200">
                    <span>Invoice Total:</span>
                    <span>{formatPaise(completedReceipt.grandTotalPaise)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200 text-[9px] text-neutral-400 flex items-center justify-between">
                  <span>Bank: HDFC Bank · A/c: 50200012345678 · IFSC: HDFC0001234</span>
                  <span>Authorized Signatory</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex items-center justify-between gap-2.5 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-2xl bg-neutral-900 hover:bg-black text-white py-2.5 text-xs font-black transition active:scale-95 cursor-pointer text-center"
              >
                🖨️ Print Bill
              </button>

              <a
                href="/api/admin/busy/export-orders"
                download
                className="rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-2.5 px-3 text-xs font-bold transition text-center"
                title="Export Voucher to BUSY XML"
              >
                📥 BUSY XML
              </a>

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
