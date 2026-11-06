"use client";

import { useState, useRef, useEffect } from "react";
import { formatPaise } from "@/lib/money";

function playBeep(freq = 1800, duration = 0.08) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
    // ignore
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

export function PosScannerBilling({
  defaultCashier = "Ramesh Sharma",
  defaultCounter = "POS-01",
}: {
  defaultCashier?: string;
  defaultCounter?: string;
}) {
  const [items, setItems] = useState<PosBillItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [settling, setSettling] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [cashTendered, setCashTendered] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedReceipt, setCompletedReceipt] = useState<CompletedReceipt | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const scannerInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus scanner on mount and after actions
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
  }, [items, paymentMode, cashTendered, customerPhone, customerName]);

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
            packSize: "Standard",
            sellingPaise: p.sellingPaise,
            qty: 1,
            sku: p.sku,
          };
        } else {
          // Master catalog match
          const sug = data.data.suggestion;
          itemToAdd = {
            variantId: `master-${clean}`,
            barcode: clean,
            name: sug.name,
            packSize: sug.packSize,
            sellingPaise: sug.suggestedSellingPaise,
            qty: 1,
            sku: `SKU-${clean}`,
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

        setNotification(`Scanned "${itemToAdd.name}"`);
        setBarcodeInput("");
      } else {
        if (soundEnabled) playBeep(400, 0.2);
        setNotification("Barcode not found. Check code or list it first.");
      }
    } catch {
      if (soundEnabled) playBeep(400, 0.2);
      setNotification("Scanner lookup error");
    } finally {
      setScanning(false);
      setTimeout(() => scannerInputRef.current?.focus(), 50);
    }
  };

  const updateQty = (index: number, delta: number) => {
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
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotalPaise = items.reduce((acc, i) => acc + i.qty * i.sellingPaise, 0);
  const taxPaise = Math.round(subtotalPaise * 0.05); // 5% average FMCG GST
  const grandTotalPaise = subtotalPaise;
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
          customerPhone: customerPhone.trim() || "9999999999",
          paymentMode,
          items,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        if (soundEnabled) {
          playBeep(2400, 0.12);
          setTimeout(() => playBeep(2800, 0.15), 120);
        }
        setCompletedReceipt(data.data);
        setItems([]);
        setCashTendered("");
      } else {
        setNotification(data.error?.message || "Failed to settle bill");
      }
    } catch {
      setNotification("Error completing POS transaction");
    } finally {
      setSettling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Cashier POS Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-[#052b14] p-5 text-white shadow-xl border border-emerald-900/60">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#22c55e] to-[#16a34a] flex items-center justify-center text-white text-xl shadow-md">
            🛒
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Offline &amp; In-Store POS Scanner Billing
              </h2>
              <span className="rounded-full bg-emerald-500/20 text-[#86efac] border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black">
                ● Live Terminal
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
              Counter: <span className="font-bold text-white">{defaultCounter}</span> · Cashier:{" "}
              <span className="font-bold text-white">{defaultCashier}</span>
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
            Zero-Lag Mode
          </span>
        </div>
      </div>

      {/* 2. Main Cashier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Barcode Scanner & Cart (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Scanner Big Input */}
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

            {/* Quick Demo Scan Buttons */}
            <div className="mt-3 flex items-center gap-2 flex-wrap text-xs font-bold text-neutral-600">
              <span className="text-neutral-400 font-semibold text-[11px]">Quick Barcodes:</span>
              <button
                type="button"
                onClick={() => handleScanItem("8901058852441")}
                className="rounded-lg bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-800 px-2.5 py-1 text-[11px] border border-neutral-200 cursor-pointer"
              >
                🍜 Maggi 280g (₹54)
              </button>
              <button
                type="button"
                onClick={() => handleScanItem("8901262010053")}
                className="rounded-lg bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-800 px-2.5 py-1 text-[11px] border border-neutral-200 cursor-pointer"
              >
                🧈 Amul Butter 500g (₹265)
              </button>
              <button
                type="button"
                onClick={() => handleScanItem("8901030384729")}
                className="rounded-lg bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-800 px-2.5 py-1 text-[11px] border border-neutral-200 cursor-pointer"
              >
                🧼 Surf Excel 1kg (₹139)
              </button>
              <button
                type="button"
                onClick={() => handleScanItem("8901491101837")}
                className="rounded-lg bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-800 px-2.5 py-1 text-[11px] border border-neutral-200 cursor-pointer"
              >
                🌾 Aashirvaad Atta 5kg (₹239)
              </button>
            </div>
          </div>

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
                        <div>{item.name}</div>
                        <div className="text-[10px] font-mono text-neutral-400">{item.barcode}</div>
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
                          className="text-neutral-400 hover:text-red-600 font-black text-sm"
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

        {/* Right: Payment, Customer & Settle (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Bill Totals Card */}
          <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-black text-base text-[#1c1c1c] border-b border-neutral-100 pb-3">
              Payment &amp; Settlement
            </h3>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 mb-1.5">
                Payment Mode (Shortcut: F4 / F8 / F9)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode("CASH")}
                  className={`rounded-2xl p-3 text-center border transition active:scale-95 cursor-pointer ${
                    paymentMode === "CASH"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-black shadow-xs"
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
                    placeholder={grandTotalRupees.toString()}
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

            {/* Dynamic UPI QR Code Display */}
            {paymentMode === "UPI" && (
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center space-y-2">
                <p className="text-xs font-black text-purple-900">Scan to Pay via Any UPI App</p>
                <div className="h-32 w-32 mx-auto rounded-xl bg-white border-2 border-purple-300 flex items-center justify-center p-2 shadow-inner">
                  {/* Dynamic Synthetic SVG QR Graphic */}
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
                  GPay · PhonePe · Paytm · UPI ID: centralmart@upi
                </p>
              </div>
            )}

            {/* Total Summary */}
            <div className="space-y-2 pt-3 border-t border-neutral-100 text-xs font-bold text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPaise(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Included GST (5%):</span>
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

      {/* 3. Printable Thermal Receipt Modal */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200">
            {/* Thermal Print Area */}
            <div id="thermal-receipt" className="font-mono text-xs text-[#1c1c1c] space-y-3">
              <div className="text-center pb-3 border-b border-dashed border-neutral-300">
                <h2 className="text-base font-black tracking-wider">CENTRAL MART</h2>
                <p className="text-[11px] font-bold text-neutral-600">Online &amp; In-Store Supermarket</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">GSTIN: 07AAAAA0000A1Z5</p>
                <p className="text-[10px] text-neutral-400">Delhi NCR, India · Tel: 011-45678900</p>
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
                  <span>Total Qty:</span>
                  <span>{completedReceipt.items.reduce((acc, i) => acc + i.qty, 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-1 border-t border-neutral-200">
                  <span>Grand Total:</span>
                  <span>{formatPaise(completedReceipt.grandTotalPaise)}</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-neutral-300 text-[10px] text-neutral-500">
                <p className="font-bold">Thank you for shopping at Central Mart!</p>
                <p>Visit centralmart.in for 10-min delivery</p>
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
