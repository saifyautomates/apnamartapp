"use client";

import { useState, useTransition } from "react";
import { formatPaise } from "@/lib/money";
import type { BusyPosConfig, BusyPosMetrics, BusyPosCounter, BusyPosVoucher } from "@/lib/busy-pos";

export function BusyPosTerminal({
  initialConfig,
  initialMetrics,
}: {
  initialConfig: BusyPosConfig;
  initialMetrics: BusyPosMetrics;
}) {
  const [config, setConfig] = useState<BusyPosConfig>(initialConfig);
  const [metrics, setMetrics] = useState<BusyPosMetrics>(initialMetrics);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Search & Filter for Vouchers
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "CASH" | "UPI" | "CARD">("ALL");
  const [counterFilter, setCounterFilter] = useState<string>("ALL");

  // Modals state
  const [selectedVoucher, setSelectedVoucher] = useState<BusyPosVoucher | null>(null);
  const [showAddCounterModal, setShowAddCounterModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showSetupGuideModal, setShowSetupGuideModal] = useState(false);

  // Test Connection Diagnostics state
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);

  // New Counter Form state
  const [newCounterName, setNewCounterName] = useState("");
  const [newCounterCashier, setNewCounterCashier] = useState("");
  const [newCounterIp, setNewCounterIp] = useState("192.168.1.104");

  // Import File state
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  const isConnected = config.enabled;

  const refreshMetrics = async () => {
    try {
      const res = await fetch("/api/admin/busy/status");
      const data = await res.json();
      if (data.ok && data.data?.metrics) {
        setMetrics(data.data.metrics);
        if (data.data?.config) setConfig(data.data.config);
      }
    } catch {
      /* ignore */
    }
  };

  const handleToggleConnect = async () => {
    setConnecting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/busy/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: !isConnected,
          bridgeUrl: config.bridgeUrl,
          companyCode: config.companyCode,
          financialYear: config.financialYear,
          apiKey: config.apiKey,
          autoSync: config.autoSync,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setConfig(data.data.config);
        setMessage(data.data.message);
        await refreshMetrics();
      } else {
        setMessage(data.error?.message || "Failed to update connection");
      }
    } catch {
      setMessage("Network error communicating with server");
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/busy/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.ok) {
        setConfig(data.data.config);
        setMessage("✓ BUSY POS settings saved successfully!");
        await refreshMetrics();
      } else {
        setMessage(data.error?.message || "Failed to save configuration");
      }
    } catch {
      setMessage("Error saving configuration");
    } finally {
      setConnecting(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/busy/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("✓ " + data.data.message);
        await refreshMetrics();
      } else {
        setMessage(data.error?.message || "Failed to sync");
      }
    } catch {
      setMessage("Error triggering sync");
    } finally {
      setSyncing(false);
    }
  };

  const handleRunDiagnosticTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/busy/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bridgeUrl: config.bridgeUrl,
          companyCode: config.companyCode,
          financialYear: config.financialYear,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestResult(data.data);
      } else {
        setTestResult({
          connected: false,
          status: "FAILED",
          message: data.error?.message || "Could not reach BUSY POS Bridge port",
        });
      }
    } catch (err: any) {
      setTestResult({
        connected: false,
        status: "ERROR",
        message: err.message || "Network error",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleAddCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCounterName.trim()) return;

    try {
      const res = await fetch("/api/admin/busy/counters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCounterName,
          cashier: newCounterCashier || "Store Cashier",
          terminalIp: newCounterIp,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setShowAddCounterModal(false);
        setNewCounterName("");
        setNewCounterCashier("");
        setMessage("✓ New billing terminal added successfully!");
        await refreshMetrics();
      }
    } catch {
      /* ignore */
    }
  };

  const handleImportFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;
    setImporting(true);
    setImportSummary(null);

    try {
      const res = await fetch("/api/admin/busy/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: importText }),
      });
      const data = await res.json();
      if (data.ok) {
        setImportSummary(data.data.message);
        setMessage("✓ " + data.data.message);
        setImportText("");
        await refreshMetrics();
      } else {
        setImportSummary("Error: " + (data.error?.message || "Invalid voucher format"));
      }
    } catch {
      setImportSummary("Network error during file import");
    } finally {
      setImporting(false);
    }
  };

  // Filter vouchers
  const filteredVouchers = metrics.recentVouchers.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      v.voucherNo.toLowerCase().includes(q) ||
      v.customerName.toLowerCase().includes(q) ||
      (v.customerPhone && v.customerPhone.includes(q)) ||
      v.itemsSummary.toLowerCase().includes(q);

    const matchPayment = paymentFilter === "ALL" || v.paymentMode === paymentFilter;
    const matchCounter = counterFilter === "ALL" || v.counterId === counterFilter;

    return matchQuery && matchPayment && matchCounter;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#052b14] via-[#06381b] to-[#04200f] p-6 text-white shadow-xl border border-emerald-900/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl">🖥️</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                BUSY POS Integration &amp; Terminal Hub
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black border ${
                  isConnected
                    ? "bg-[#e8f5e9] text-[#0c831f] border-[#0c831f]/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-400/30"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? "bg-[#0c831f] animate-ping" : "bg-amber-400"
                  }`}
                />
                {isConnected ? "Connected (Live Omnichannel Sync)" : "Standby Mode"}
              </span>
            </div>
            <p className="mt-2 text-sm text-emerald-100/90 font-medium max-w-2xl">
              Attach in-store BUSY Accounting POS terminals directly to Central Mart. Sync physical counter billing slips, inventory quantities, and accounting ledgers in real-time without barriers.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setShowTestModal(true);
                handleRunDiagnosticTest();
              }}
              className="flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-bold text-white shadow-sm backdrop-blur-md transition active:scale-95 cursor-pointer"
            >
              <span>🔌</span>
              <span>Test Connection</span>
            </button>

            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-bold text-white shadow-sm backdrop-blur-md transition active:scale-95 cursor-pointer"
            >
              <span>📥</span>
              <span>Import BUSY File</span>
            </button>

            <a
              href="/api/admin/busy/export-orders"
              download
              className="flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-bold text-white shadow-sm backdrop-blur-md transition active:scale-95 cursor-pointer"
            >
              <span>📤</span>
              <span>Export to BUSY XML</span>
            </a>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-2xl bg-emerald-500/30 hover:bg-emerald-500/40 border border-emerald-400/40 px-3.5 py-2 text-xs font-bold text-white shadow-sm backdrop-blur-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span className={syncing ? "animate-spin" : ""}>🔄</span>
              <span>{syncing ? "Syncing..." : "Sync Now"}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleConnect}
              disabled={connecting}
              className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-black shadow-lg transition active:scale-95 cursor-pointer ${
                isConnected
                  ? "bg-red-500/80 hover:bg-red-600 text-white"
                  : "bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white"
              }`}
            >
              <span>{isConnected ? "Disconnect" : "Attach BUSY POS"}</span>
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div className="relative z-10 mt-4 rounded-xl bg-white/15 p-3 text-xs font-bold text-emerald-200 border border-white/20 flex items-center justify-between">
            <span>✨ {message}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-white hover:text-emerald-100 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 2. Top Counter Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's In-Store Counter Sales */}
        <div className="rounded-3xl bg-white p-5 border border-neutral-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase">Today&apos;s POS Sales</span>
            <span className="text-xl">🧾</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1c1c1c]">
              {formatPaise(metrics.todaySalesPaise)}
            </div>
            <div className="mt-1 text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span>↑ Live Synced</span>
              <span className="text-neutral-400 font-normal">from {metrics.counters.length} counters</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Counter Receipts */}
        <div className="rounded-3xl bg-white p-5 border border-neutral-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase">Counter Bills Count</span>
            <span className="text-xl">🔢</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1c1c1c]">
              {metrics.todayBillsCount} Bills
            </div>
            <div className="mt-1 text-xs font-bold text-neutral-500">
              Avg Bill: {formatPaise(Math.round(metrics.todaySalesPaise / Math.max(1, metrics.todayBillsCount)))}
            </div>
          </div>
        </div>

        {/* Card 3: Counter Payment Modes */}
        <div className="rounded-3xl bg-white p-5 border border-neutral-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase">Cash vs Digital</span>
            <span className="text-xl">💵</span>
          </div>
          <div className="mt-3 space-y-1 text-xs font-bold">
            <div className="flex justify-between">
              <span className="text-neutral-600">Cash:</span>
              <span className="text-[#1c1c1c]">{formatPaise(metrics.cashPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">UPI / QR:</span>
              <span className="text-emerald-700">{formatPaise(metrics.upiPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Card:</span>
              <span className="text-blue-700">{formatPaise(metrics.cardPaise)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Terminal Bridge Status */}
        <div className="rounded-3xl bg-white p-5 border border-neutral-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase">Bridge Latency</span>
            <span className="text-xl">⚡</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1c1c1c]">
              {metrics.latencyMs} ms
            </div>
            <div className="mt-1 text-xs font-bold text-neutral-500">
              Last Synced: {new Date(metrics.lastSyncAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Real-time Counter Terminals Grid with '+ Add Counter' */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-[#1c1c1c] flex items-center gap-2">
            <span>🏪</span> Active Counter Terminals ({metrics.counters.length})
          </h2>
          <button
            type="button"
            onClick={() => setShowAddCounterModal(true)}
            className="rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 text-xs font-black transition cursor-pointer flex items-center gap-1"
          >
            <span>+</span> Add Billing Counter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.counters.map((counter) => (
            <div
              key={counter.id}
              className="rounded-3xl bg-white p-5 border border-neutral-200 shadow-xs hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-[#1c1c1c]">{counter.name}</h3>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">
                    Terminal IP: {counter.terminalIp}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-black border border-emerald-300">
                  {counter.status}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase">Cashier</span>
                  <p className="text-xs font-black text-neutral-800">{counter.cashier}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase">Counter Total</span>
                  <p className="text-sm font-black text-emerald-700">
                    {formatPaise(counter.todaySalesPaise)}
                  </p>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {counter.billsCount} bills
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Connection Setup & Barrier-Free Wizard */}
      <div className="rounded-3xl bg-white p-6 border border-neutral-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-black text-[#1c1c1c] flex items-center gap-2">
              <span>⚡</span> Link BUSY POS Without Any Barriers (4 Easy Ways)
            </h2>
            <p className="text-xs text-neutral-500 font-semibold mt-0.5">
              Choose the linking method that fits your store setup — from Cloud Webhooks to Local Windows Agents.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSetupGuideModal(true)}
            className="text-xs font-bold text-[#0c831f] hover:underline cursor-pointer"
          >
            📖 View Step-by-Step Guide →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Method 1 */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-black text-xs text-emerald-800 uppercase tracking-wider mb-2">
                <span>🌐</span> Method 1 (Cloud Webhook)
              </div>
              <h3 className="font-black text-sm text-[#1c1c1c]">No Port Forwarding</h3>
              <p className="text-xs text-neutral-600 mt-1">
                Post sales vouchers directly to Central Mart cloud from any store PC with internet.
              </p>
            </div>
            <div className="mt-3">
              <span className="inline-block rounded-md bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5">
                Recommended for Cloud
              </span>
            </div>
          </div>

          {/* Method 2 */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-black text-xs text-blue-800 uppercase tracking-wider mb-2">
                <span>🖥️</span> Method 2 (LAN Bridge)
              </div>
              <h3 className="font-black text-sm text-[#1c1c1c]">Direct Port 8085 BAP</h3>
              <p className="text-xs text-neutral-600 mt-1">
                Direct connection to local BUSY Agent Program (BAP) running on store billing computer.
              </p>
            </div>
            <div className="mt-3">
              <span className="inline-block rounded-md bg-blue-600 text-white text-[10px] font-black px-2 py-0.5">
                For Local Networks
              </span>
            </div>
          </div>

          {/* Method 3 */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-black text-xs text-purple-800 uppercase tracking-wider mb-2">
                <span>💻</span> Method 3 (Windows Agent)
              </div>
              <h3 className="font-black text-sm text-[#1c1c1c]">1-Click Sync Service</h3>
              <p className="text-xs text-neutral-600 mt-1">
                Download ready-to-run Windows agent script that auto-watches your BUSY folder.
              </p>
            </div>
            <div className="mt-3">
              <a
                href="/api/admin/busy/download-agent"
                download
                className="inline-block rounded-md bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black px-2 py-1 transition cursor-pointer"
              >
                Download Agent Script ↓
              </a>
            </div>
          </div>

          {/* Method 4 */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-black text-xs text-amber-800 uppercase tracking-wider mb-2">
                <span>📁</span> Method 4 (File Upload)
              </div>
              <h3 className="font-black text-sm text-[#1c1c1c]">BUSY XML / JSON Import</h3>
              <p className="text-xs text-neutral-600 mt-1">
                Export vouchers from BUSY software and upload file directly with 1 click.
              </p>
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="inline-block rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black px-2 py-1 transition cursor-pointer"
              >
                Upload Voucher File ↑
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              BUSY Bridge Agent URL (Local LAN)
            </label>
            <input
              type="text"
              value={config.bridgeUrl}
              onChange={(e) => setConfig({ ...config, bridgeUrl: e.target.value })}
              className="w-full rounded-2xl border border-neutral-300 px-3.5 py-2 text-xs font-semibold focus:border-emerald-600 focus:outline-hidden"
              placeholder="http://127.0.0.1:8085"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              BUSY Company Code
            </label>
            <input
              type="text"
              value={config.companyCode}
              onChange={(e) => setConfig({ ...config, companyCode: e.target.value })}
              className="w-full rounded-2xl border border-neutral-300 px-3.5 py-2 text-xs font-semibold focus:border-emerald-600 focus:outline-hidden"
              placeholder="CENTRAL_MART_2026"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Financial Year
            </label>
            <input
              type="text"
              value={config.financialYear}
              onChange={(e) => setConfig({ ...config, financialYear: e.target.value })}
              className="w-full rounded-2xl border border-neutral-300 px-3.5 py-2 text-xs font-semibold focus:border-emerald-600 focus:outline-hidden"
              placeholder="2026-2027"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              API Sync Key
            </label>
            <input
              type="text"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              className="w-full rounded-2xl border border-neutral-300 px-3.5 py-2 text-xs font-semibold focus:border-emerald-600 focus:outline-hidden"
              placeholder="busy_live_sec_..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Auto Sync Interval (Seconds)
            </label>
            <input
              type="number"
              value={config.syncIntervalSeconds}
              onChange={(e) => setConfig({ ...config, syncIntervalSeconds: parseInt(e.target.value, 10) || 15 })}
              className="w-full rounded-2xl border border-neutral-300 px-3.5 py-2 text-xs font-semibold focus:border-emerald-600 focus:outline-hidden"
              min={5}
              max={300}
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={connecting}
              className="w-full rounded-2xl bg-neutral-900 hover:bg-black text-white px-5 py-2.5 text-xs font-black shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* 5. Live In-Store Sales Vouchers Table */}
      <div className="rounded-3xl bg-white p-6 border border-neutral-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-black text-[#1c1c1c] flex items-center gap-2">
              <span>🧾</span> Live In-Store Sales Vouchers ({filteredVouchers.length})
            </h2>
            <p className="text-xs text-neutral-500 font-semibold mt-0.5">
              Click any bill to view itemized GST tax invoice slip and thermal print receipt.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bill no or customer..."
              className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold focus:border-emerald-600 focus:outline-hidden w-48"
            />

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="rounded-xl border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold bg-white focus:outline-hidden"
            >
              <option value="ALL">All Payments</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
            </select>

            <select
              value={counterFilter}
              onChange={(e) => setCounterFilter(e.target.value)}
              className="rounded-xl border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold bg-white focus:outline-hidden"
            >
              <option value="ALL">All Counters</option>
              {metrics.counters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider">
                <th className="pb-3 pl-2">Voucher No</th>
                <th className="pb-3">Counter</th>
                <th className="pb-3">Cashier</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Items Summary</th>
                <th className="pb-3 text-right">Total (₹)</th>
                <th className="pb-3 text-center">Payment</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredVouchers.map((vch) => (
                <tr
                  key={vch.id}
                  onClick={() => setSelectedVoucher(vch)}
                  className="hover:bg-emerald-50/60 transition cursor-pointer"
                >
                  <td className="py-3 pl-2 font-black text-[#1c1c1c]">{vch.voucherNo}</td>
                  <td className="py-3 font-semibold text-neutral-700">{vch.counterName}</td>
                  <td className="py-3 font-semibold text-neutral-600">{vch.cashierName}</td>
                  <td className="py-3 font-semibold text-neutral-800">{vch.customerName}</td>
                  <td className="py-3 text-neutral-500 max-w-xs truncate">{vch.itemsSummary}</td>
                  <td className="py-3 text-right font-black text-emerald-700">
                    {formatPaise(vch.totalPaise)}
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                        vch.paymentMode === "UPI"
                          ? "bg-purple-100 text-purple-800"
                          : vch.paymentMode === "CASH"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {vch.paymentMode}
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <span className="text-[11px] font-bold text-[#0c831f] hover:underline">
                      View Slip →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL 1: ITEMIZED GST BILL SLIP ================= */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧾</span>
                <h3 className="font-black text-base text-[#1c1c1c]">GST Tax Invoice Bill Slip</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="h-8 w-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Bill Receipt Preview (Authentic 58mm / 80mm format) */}
            <div className="mt-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 font-mono text-xs space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-neutral-300">
                <h4 className="font-black text-sm text-[#1c1c1c]">CENTRAL MART GROCERY</h4>
                <p className="text-[11px] text-neutral-500">R K Nagar, Police Line, Kota, Rajasthan</p>
                <p className="text-[10px] text-neutral-500 font-bold mt-0.5">GSTIN: 08AABCC1234D1Z5</p>
                <p className="text-[10px] text-neutral-500">BUSY POS Serial: {selectedVoucher.voucherNo}</p>
              </div>

              <div className="grid grid-cols-2 text-[11px] text-neutral-600 gap-1 pb-2 border-b border-dashed border-neutral-300">
                <div>Date: {new Date().toLocaleDateString("en-IN")}</div>
                <div className="text-right">Time: {selectedVoucher.timestamp}</div>
                <div>Counter: {selectedVoucher.counterName}</div>
                <div className="text-right">Cashier: {selectedVoucher.cashierName}</div>
                <div>Customer: {selectedVoucher.customerName}</div>
                <div className="text-right">Pay: {selectedVoucher.paymentMode}</div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-1.5 py-1">
                <div className="flex justify-between font-bold text-neutral-700 text-[11px] pb-1 border-b border-neutral-200">
                  <span>ITEM</span>
                  <span>TOTAL</span>
                </div>
                {selectedVoucher.items && selectedVoucher.items.length > 0 ? (
                  selectedVoucher.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span>{it.name} (x{it.qty})</span>
                      <span className="font-bold">{formatPaise(it.amountPaise)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-neutral-600">
                    <div>{selectedVoucher.itemsSummary}</div>
                  </div>
                )}
              </div>

              {/* Totals & Tax */}
              <div className="pt-2 border-t border-dashed border-neutral-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPaise(selectedVoucher.totalPaise - selectedVoucher.gstPaise)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>CGST (2.5%):</span>
                  <span>{formatPaise(Math.round(selectedVoucher.gstPaise / 2))}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>SGST (2.5%):</span>
                  <span>{formatPaise(Math.round(selectedVoucher.gstPaise / 2))}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-[#1c1c1c] pt-1 border-t border-neutral-200">
                  <span>NET PAYABLE:</span>
                  <span className="text-emerald-700">{formatPaise(selectedVoucher.totalPaise)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-neutral-400 pt-2 border-t border-dashed border-neutral-300">
                *** THANK YOU FOR SHOPPING AT CENTRAL MART ***
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] text-white py-2.5 text-xs font-black shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🖨️</span> Print Thermal Receipt
              </button>
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="rounded-2xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 px-4 py-2.5 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ADD BILLING COUNTER ================= */}
      {showAddCounterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-black text-base text-[#1c1c1c]">Add Physical Billing Counter</h3>
              <button
                type="button"
                onClick={() => setShowAddCounterModal(false)}
                className="h-8 w-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCounter} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Counter Name / Location
                </label>
                <input
                  type="text"
                  required
                  value={newCounterName}
                  onChange={(e) => setNewCounterName(e.target.value)}
                  placeholder="e.g. Counter 04 (Bakery & Snacks)"
                  className="w-full rounded-2xl border border-neutral-300 px-3.5 py-2 text-xs font-semibold focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Assigned Cashier Name
                </label>
                <input
                  type="text"
                  value={newCounterCashier}
                  onChange={(e) => setNewCounterCashier(e.target.value)}
                  placeholder="e.g. Rajesh Meena"
                  className="w-full rounded-2xl border border-neutral-300 px-3.5 py-2 text-xs font-semibold focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Billing PC IP Address (LAN)
                </label>
                <input
                  type="text"
                  value={newCounterIp}
                  onChange={(e) => setNewCounterIp(e.target.value)}
                  placeholder="e.g. 192.168.1.104"
                  className="w-full rounded-2xl border border-neutral-300 px-3.5 py-2 text-xs font-semibold focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-neutral-900 hover:bg-black text-white py-2.5 text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
                >
                  Save Counter Terminal
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCounterModal(false)}
                  className="rounded-2xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 px-4 py-2.5 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: IMPORT BUSY XML / JSON ================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="font-black text-base text-[#1c1c1c]">Import BUSY POS Sales Vouchers</h3>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Paste or upload XML / JSON exported from BUSY Accounting Software
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportSummary(null);
                }}
                className="h-8 w-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleImportFile} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Voucher Content (XML / JSON)
                </label>
                <textarea
                  rows={8}
                  required
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`<BUSY_DATA>\n  <VOUCHERS>\n    <VOUCHER>\n      <VCH_NO>CM-POS-2026/0485</VCH_NO>\n      <PARTY_NAME>Walk-in Customer</PARTY_NAME>\n      <TOTAL_AMOUNT>1450.00</TOTAL_AMOUNT>\n      <PAYMENT_MODE>UPI</PAYMENT_MODE>\n    </VOUCHER>\n  </VOUCHERS>\n</BUSY_DATA>`}
                  className="w-full rounded-2xl border border-neutral-300 p-3 text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              {importSummary && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  importSummary.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}>
                  {importSummary}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={importing}
                  className="flex-1 rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] text-white py-2.5 text-xs font-black shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {importing ? "Importing & Syncing..." : "Process & Sync Vouchers"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="rounded-2xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 px-4 py-2.5 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: TEST CONNECTION DIAGNOSTIC ================= */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔌</span>
                <h3 className="font-black text-base text-[#1c1c1c]">BUSY POS Bridge Handshake Test</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="h-8 w-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {testing ? (
                <div className="py-8 text-center space-y-3">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
                  <p className="text-xs font-bold text-neutral-600">Testing connection to BUSY Bridge &amp; Webhook API...</p>
                </div>
              ) : testResult ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-2xl text-emerald-600">✓</span>
                    <div>
                      <h4 className="font-black text-sm text-emerald-900">Connection Handshake Success</h4>
                      <p className="text-xs text-emerald-700 font-medium">BUSY POS Bridge is active &amp; ready</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Status:</span>
                      <span className="font-black text-emerald-700">{testResult.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Latency:</span>
                      <span className="font-black text-[#1c1c1c]">{testResult.latencyMs} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Bridge Target:</span>
                      <span className="font-mono text-[11px] text-neutral-700">{testResult.bridgeUrl}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Company Code:</span>
                      <span className="font-black text-neutral-800">{testResult.companyCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Protocol:</span>
                      <span className="text-neutral-800">{testResult.bridgeVersion || "BUSY 21 BAP v4.2"}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRunDiagnosticTest}
                  disabled={testing}
                  className="flex-1 rounded-2xl bg-neutral-900 hover:bg-black text-white py-2.5 text-xs font-black shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {testing ? "Testing..." : "Retest Handshake"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="rounded-2xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 px-4 py-2.5 text-xs font-bold transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: STEP-BY-STEP SETUP GUIDE ================= */}
      {showSetupGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-black text-base text-[#1c1c1c]">How to Link BUSY POS with Central Mart</h3>
              <button
                type="button"
                onClick={() => setShowSetupGuideModal(false)}
                className="h-8 w-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs leading-relaxed text-neutral-700">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <h4 className="font-black text-emerald-900 text-sm mb-1">Recommended: Cloud Webhook Setup</h4>
                <p className="text-emerald-800">
                  You do not need static IP or router port forwarding. Your in-store PC simply pushes sales to Central Mart.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-[#1c1c1c]">Step 1: Get Your Cloud Webhook URL</div>
                <div className="p-2.5 rounded-xl bg-neutral-100 font-mono text-[11px] select-all">
                  https://apnamartapp.vercel.app/api/pos/busy/webhook
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-[#1c1c1c]">Step 2: Get Your Secret API Key</div>
                <div className="p-2.5 rounded-xl bg-neutral-100 font-mono text-[11px] select-all">
                  {config.apiKey || "busy_live_sec_993821734_fmcg"}
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-[#1c1c1c]">Step 3: Run Windows Bridge Agent on Billing PC</div>
                <p className="text-neutral-500">
                  Download <a href="/api/admin/busy/download-agent" download className="text-emerald-700 font-bold underline">busy-bridge-agent.js</a> on your Windows PC and run:
                </p>
                <div className="p-2.5 rounded-xl bg-neutral-900 text-emerald-400 font-mono text-[11px]">
                  node busy-bridge-agent.js
                </div>
                <p className="text-[11px] text-neutral-500">
                  The agent will automatically watch your BUSY export folder and send all new bills to Central Mart every few seconds!
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-[#1c1c1c]">Step 4: Real-time In-Store Sales Appear on Dashboard</div>
                <p className="text-neutral-500">
                  Every bill punched at the counter will immediately increment your in-store sales, bills count, cash/UPI split, and update product inventory.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowSetupGuideModal(false)}
                className="w-full rounded-2xl bg-neutral-900 hover:bg-black text-white py-2.5 text-xs font-black transition cursor-pointer"
              >
                Got It, Let&apos;s Link!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
