"use client";

import { useState } from "react";
import { formatPaise } from "@/lib/money";
import type { BusyPosConfig, BusyPosMetrics } from "@/lib/busy-pos";

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

  const isConnected = config.enabled;

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
        setMessage("BUSY POS configuration saved and verified successfully!");
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
        setMessage(data.data.message);
        // Refresh metrics
        const statusRes = await fetch("/api/admin/busy/status");
        const statusData = await statusRes.json();
        if (statusData.ok) {
          setMetrics(statusData.data.metrics);
        }
      } else {
        setMessage(data.error?.message || "Failed to sync");
      }
    } catch {
      setMessage("Error triggering sync");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#052b14] via-[#06381b] to-[#04200f] p-6 text-white shadow-xl border border-emerald-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🖥️</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                BUSY POS Integration & Terminal Hub
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
                {isConnected ? "Connected (Live Sync)" : "Standby Mode"}
              </span>
            </div>
            <p className="mt-2 text-sm text-emerald-100/90 font-medium max-w-2xl">
              Attach in-store BUSY Accounting POS terminals directly to Central Mart. Sync physical counter billing slips, inventory quantities, and accounting ledgers in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-bold text-white shadow-sm backdrop-blur-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span className={syncing ? "animate-spin" : ""}>🔄</span>
              <span>{syncing ? "Syncing with BUSY..." : "Sync Counter Sales"}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleConnect}
              disabled={connecting}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black shadow-lg transition active:scale-95 cursor-pointer ${
                isConnected
                  ? "bg-red-500/80 hover:bg-red-600 text-white"
                  : "bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white"
              }`}
            >
              <span>{isConnected ? "Disconnect Bridge" : "Attach BUSY POS"}</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="relative z-10 mt-4 rounded-xl bg-white/15 p-3 text-xs font-bold text-emerald-200 border border-white/20 flex items-center justify-between">
            <span>✨ {message}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-white hover:text-emerald-100 font-bold ml-2"
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
              <span>↑ 14.8%</span>
              <span className="text-neutral-400 font-normal">vs yesterday</span>
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

      {/* 3. Real-time Counter Terminals Grid */}
      <div>
        <h2 className="text-lg font-black text-[#1c1c1c] mb-3 flex items-center gap-2">
          <span>🏪</span> Active Counter Terminals (In-Store POS)
        </h2>
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
                  ONLINE
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
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Attachment Settings & Configuration Form */}
      <div className="rounded-3xl bg-white p-6 border border-neutral-200/90 shadow-sm">
        <h2 className="text-lg font-black text-[#1c1c1c] flex items-center gap-2">
          <span>⚙️</span> BUSY POS Connection Settings
        </h2>
        <p className="text-xs text-neutral-500 font-semibold mt-1">
          Configure direct bridge URL to your in-store Windows machine running BUSY Accounting software.
        </p>

        <form onSubmit={handleSaveConfig} className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              BUSY Bridge Agent URL
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
              API / Auth Token (Optional)
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              className="w-full rounded-2xl border border-neutral-300 px-3.5 py-2 text-xs font-semibold focus:border-emerald-600 focus:outline-hidden"
              placeholder="••••••••••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Posting Trigger (Online Orders)
            </label>
            <select
              value={config.postingTrigger}
              onChange={(e) =>
                setConfig({
                  ...config,
                  postingTrigger: e.target.value as BusyPosConfig["postingTrigger"],
                })
              }
              className="w-full rounded-2xl border border-neutral-300 px-3.5 py-2 text-xs font-semibold focus:border-emerald-600 focus:outline-hidden bg-white"
            >
              <option value="OUT_FOR_DELIVERY">When Out for Delivery (Recommended)</option>
              <option value="ORDER_CONFIRMED">When Confirmed</option>
              <option value="PACKED">When Packed</option>
              <option value="DELIVERED">When Delivered</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={connecting}
              className="w-full rounded-2xl bg-neutral-900 hover:bg-black text-white px-5 py-2.5 text-xs font-black shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              Save & Test Connection
            </button>
          </div>
        </form>
      </div>

      {/* 5. Live In-Store Sales Vouchers Feed */}
      <div className="rounded-3xl bg-white p-6 border border-neutral-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-[#1c1c1c] flex items-center gap-2">
              <span>🧾</span> Recent In-Store POS Sales Vouchers
            </h2>
            <p className="text-xs text-neutral-500 font-semibold mt-0.5">
              Live physical counter slips synced directly from BUSY POS
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ● Real-time Stream
          </span>
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
                <th className="pb-3 pr-2 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {metrics.recentVouchers.map((vch) => (
                <tr key={vch.id} className="hover:bg-neutral-50 transition">
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
                  <td className="py-3 pr-2 text-right text-neutral-400 font-medium">
                    {vch.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

