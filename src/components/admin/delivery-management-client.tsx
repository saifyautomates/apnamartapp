"use client";

import { useState } from "react";
import { formatPaise } from "@/lib/money";
import { ensureCsrf } from "@/lib/api/client";
import type { DeliveryConfig, ZoneDeliveryRule } from "@/lib/settings";

export interface ZoneWithSlots {
  id: string;
  name: string;
  pincodes: string[];
  minOrderPaise: number;
  deliveryChargePaise: number;
  freeThresholdPaise: number | null;
  isActive: boolean;
  slots: Array<{
    id: string;
    label: string;
    startTime: string;
    endTime: string;
    maxOrdersPerDay: number;
    isActive: boolean;
  }>;
}

export function DeliveryManagementClient({
  initialConfig,
  initialZones,
  initialZoneRules,
}: {
  initialConfig: DeliveryConfig;
  initialZones: ZoneWithSlots[];
  initialZoneRules: Record<string, ZoneDeliveryRule>;
}) {
  const [activeTab, setActiveTab] = useState<"PROMISE" | "ZONES" | "PREVIEW">("PROMISE");

  // Global Delivery Configuration State
  const [config, setConfig] = useState<DeliveryConfig>(initialConfig);
  const [zones, setZones] = useState<ZoneWithSlots[]>(initialZones);
  const [zoneRules, setZoneRules] = useState<Record<string, ZoneDeliveryRule>>(initialZoneRules);

  // Status & Feedback State
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Zone Modal State
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoneForm, setZoneForm] = useState({
    name: "",
    pincodes: "",
    estimatedTime: "Same Day in 2-3 Hours",
    minOrderRupees: "199",
    deliveryChargeRupees: "30",
    freeThresholdRupees: "499",
  });

  // Slot Modal State
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slotZoneId, setSlotZoneId] = useState<string>("");
  const [slotForm, setSlotForm] = useState({
    label: "Today 4 PM – 8 PM",
    startTime: "16:00",
    endTime: "20:00",
    maxOrdersPerDay: "100",
  });

  // Save Settings to Backend
  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const csrfToken = await ensureCsrf();
      const res = await fetch("/api/admin/delivery?kind=config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          delivery: config,
          zoneDeliveryRules: zoneRules,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message ?? "Failed to save settings");
      }

      setMessage({
        type: "success",
        text: "✓ Delivery promise & settings updated! Storefront is now instantly updated.",
      });

      // Dispatch event for any open tabs
      window.dispatchEvent(new Event("delivery-settings-updated"));
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error saving settings",
      });
    } finally {
      setSaving(false);
    }
  };

  // Open Add Zone Modal
  const openAddZone = () => {
    setEditingZoneId(null);
    setZoneForm({
      name: "",
      pincodes: "",
      estimatedTime: "Same Day in 2-3 Hours",
      minOrderRupees: "199",
      deliveryChargeRupees: "30",
      freeThresholdRupees: "499",
    });
    setZoneModalOpen(true);
  };

  // Open Edit Zone Modal
  const openEditZone = (z: ZoneWithSlots) => {
    setEditingZoneId(z.id);
    const rule = zoneRules[z.id];
    setZoneForm({
      name: z.name,
      pincodes: z.pincodes.join(", "),
      estimatedTime: rule?.estimatedTime ?? "Same Day in 2-3 Hours",
      minOrderRupees: (z.minOrderPaise / 100).toString(),
      deliveryChargeRupees: (z.deliveryChargePaise / 100).toString(),
      freeThresholdRupees: z.freeThresholdPaise ? (z.freeThresholdPaise / 100).toString() : "",
    });
    setZoneModalOpen(true);
  };

  // Save Zone Form (Add or Edit)
  const handleSaveZone = async () => {
    const rawPins = zoneForm.pincodes
      .split(/[,;\s]+/)
      .map((p) => p.trim())
      .filter((p) => /^\d{6}$/.test(p));

    if (!zoneForm.name.trim()) {
      alert("Please provide a Zone Name.");
      return;
    }
    if (rawPins.length === 0) {
      alert("Please provide at least one valid 6-digit PIN code.");
      return;
    }

    const payload = {
      name: zoneForm.name.trim(),
      pincodes: rawPins,
      minOrderPaise: Math.round(Number(zoneForm.minOrderRupees || "0") * 100),
      deliveryChargePaise: Math.round(Number(zoneForm.deliveryChargeRupees || "0") * 100),
      freeThresholdPaise: zoneForm.freeThresholdRupees
        ? Math.round(Number(zoneForm.freeThresholdRupees) * 100)
        : null,
      isActive: true,
    };

    try {
      const csrfToken = await ensureCsrf();
      let zoneId = editingZoneId;

      if (editingZoneId) {
        // Update Zone
        const res = await fetch(`/api/admin/delivery?kind=zones&id=${editingZoneId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update zone");
        const json = await res.json();
        setZones((prev) => prev.map((z) => (z.id === editingZoneId ? { ...z, ...json.data } : z)));
      } else {
        // Create Zone
        const res = await fetch("/api/admin/delivery?kind=zones", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create zone");
        const json = await res.json();
        zoneId = json.data.id;
        setZones((prev) => [...prev, { ...json.data, slots: [] }]);
      }

      // Update zone delivery rules
      if (zoneId) {
        const updatedRules = {
          ...zoneRules,
          [zoneId]: {
            estimatedTime: zoneForm.estimatedTime,
            badgeText: "⚡ Fast Same-Day",
            deliveryChargePaise: payload.deliveryChargePaise,
            freeThresholdPaise: payload.freeThresholdPaise,
            minOrderPaise: payload.minOrderPaise,
          },
        };
        setZoneRules(updatedRules);

        // Auto-save zone rules to settings
        await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
          body: JSON.stringify({ zoneDeliveryRules: updatedRules }),
        });
      }

      setZoneModalOpen(false);
      setMessage({ type: "success", text: "✓ Zone saved successfully!" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving zone");
    }
  };

  // Delete Zone
  const handleDeleteZone = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete delivery zone "${name}"?`)) return;
    try {
      const csrfToken = await ensureCsrf();
      const res = await fetch(`/api/admin/delivery?kind=zones&id=${id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken },
      });
      if (!res.ok) throw new Error("Failed to delete zone");
      setZones((prev) => prev.filter((z) => z.id !== id));
      const nextRules = { ...zoneRules };
      delete nextRules[id];
      setZoneRules(nextRules);
      setMessage({ type: "success", text: `✓ Zone "${name}" deleted.` });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting zone");
    }
  };

  // Open Add Slot Modal
  const openAddSlot = (zoneId: string) => {
    setSlotZoneId(zoneId);
    setSlotForm({
      label: "Today 4 PM – 8 PM",
      startTime: "16:00",
      endTime: "20:00",
      maxOrdersPerDay: "100",
    });
    setSlotModalOpen(true);
  };

  // Save Slot Form
  const handleSaveSlot = async () => {
    try {
      const csrfToken = await ensureCsrf();
      const payload = {
        zoneId: slotZoneId,
        label: slotForm.label,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        maxOrdersPerDay: parseInt(slotForm.maxOrdersPerDay, 10) || 100,
        isActive: true,
      };

      const res = await fetch("/api/admin/delivery?kind=slots", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to add slot");
      const json = await res.json();

      setZones((prev) =>
        prev.map((z) => (z.id === slotZoneId ? { ...z, slots: [...(z.slots || []), json.data] } : z))
      );

      setSlotModalOpen(false);
      setMessage({ type: "success", text: "✓ Delivery slot added to zone!" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error adding slot");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🚚</span>
            <h1 className="text-xl sm:text-2xl font-black text-[#1c1c1c] tracking-tight">
              Delivery &amp; Location Control Center
            </h1>
            <span className="rounded-full bg-emerald-100 text-[#0c831f] text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider border border-emerald-300">
              Admin Controlled
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-medium">
            Configure Same-Day delivery promise, order cutoff times, and zone-wise location speeds for Central Mart.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-6 py-3 text-sm font-black shadow-lg shadow-emerald-950/20 transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
        >
          <span>💾</span>
          <span>{saving ? "Saving Changes..." : "Save Delivery Settings"}</span>
        </button>
      </div>

      {/* Feedback Message */}
      {message ? (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
              : "bg-red-50 text-red-800 border-red-300"
          }`}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-sm font-bold">
            ✕
          </button>
        </div>
      ) : null}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("PROMISE")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition cursor-pointer ${
            activeTab === "PROMISE"
              ? "bg-[#1c1c1c] text-white shadow-md"
              : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          <span>⚡</span>
          <span>Delivery Promise &amp; Cutoff</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ZONES")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition cursor-pointer ${
            activeTab === "ZONES"
              ? "bg-[#1c1c1c] text-white shadow-md"
              : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          <span>📍</span>
          <span>Pincodes &amp; Location Zones ({zones.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PREVIEW")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition cursor-pointer ${
            activeTab === "PREVIEW"
              ? "bg-[#1c1c1c] text-white shadow-md"
              : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          <span>👁️</span>
          <span>Customer Live Preview</span>
        </button>
      </div>

      {/* TAB 1: Global Delivery Mode & Promise Settings */}
      {activeTab === "PROMISE" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Controls (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Delivery Mode Selection */}
            <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-[#1c1c1c] uppercase tracking-wider flex items-center gap-2">
                <span>1. Select Delivery Model</span>
                <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
                  Core Setting
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: SAME_DAY */}
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      mode: "SAME_DAY",
                      promiseText: "Same Day Delivery",
                      badgeText: "⚡ Same Day Delivery",
                      defaultEta: "Today by 8:00 PM",
                    }))
                  }
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    config.mode === "SAME_DAY"
                      ? "border-[#0c831f] bg-emerald-50/50 ring-2 ring-[#0c831f]/20 shadow-xs"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl">🚚</span>
                    {config.mode === "SAME_DAY" && (
                      <span className="h-5 w-5 rounded-full bg-[#0c831f] text-white text-xs flex items-center justify-center font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-[#1c1c1c]">Same-Day Delivery</h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-snug">
                    Standard FMCG delivery: orders before cutoff delivered today; later orders arrive next morning.
                  </p>
                </button>

                {/* Option 2: LOCATION_BASED */}
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      mode: "LOCATION_BASED",
                      promiseText: "Location Based Delivery",
                      badgeText: "📍 Location Based",
                    }))
                  }
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    config.mode === "LOCATION_BASED"
                      ? "border-[#0c831f] bg-emerald-50/50 ring-2 ring-[#0c831f]/20 shadow-xs"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl">📍</span>
                    {config.mode === "LOCATION_BASED" && (
                      <span className="h-5 w-5 rounded-full bg-[#0c831f] text-white text-xs flex items-center justify-center font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-[#1c1c1c]">Location / Zone Based</h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-snug">
                    Speed depends on customer PIN code (e.g. City Hub = 2 hrs, Outer Zone = Evening/Next Day).
                  </p>
                </button>

                {/* Option 3: SCHEDULED */}
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      mode: "SCHEDULED",
                      promiseText: "Scheduled Slots",
                      badgeText: "🕒 Scheduled Delivery",
                    }))
                  }
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    config.mode === "SCHEDULED"
                      ? "border-[#0c831f] bg-emerald-50/50 ring-2 ring-[#0c831f]/20 shadow-xs"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl">🕒</span>
                    {config.mode === "SCHEDULED" && (
                      <span className="h-5 w-5 rounded-full bg-[#0c831f] text-white text-xs flex items-center justify-center font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-[#1c1c1c]">Scheduled Delivery Slots</h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-snug">
                    Customer selects specific time window (e.g. Morning 9-12, Afternoon 1-4, Evening 5-8).
                  </p>
                </button>

                {/* Option 4: EXPRESS */}
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      mode: "EXPRESS",
                      promiseText: "Express Delivery (60-90 Mins)",
                      badgeText: "⚡ 60-90 Mins Express",
                    }))
                  }
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    config.mode === "EXPRESS"
                      ? "border-[#0c831f] bg-emerald-50/50 ring-2 ring-[#0c831f]/20 shadow-xs"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl">🚀</span>
                    {config.mode === "EXPRESS" && (
                      <span className="h-5 w-5 rounded-full bg-[#0c831f] text-white text-xs flex items-center justify-center font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-[#1c1c1c]">Express Delivery (60-90 Mins)</h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-snug">
                    Ultra-fast dispatch for urgent orders within central delivery zones.
                  </p>
                </button>
              </div>
            </div>

            {/* Custom Texts & Customer Badges */}
            <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-[#1c1c1c] uppercase tracking-wider flex items-center gap-2">
                <span>2. Storefront Delivery Text &amp; Badges</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Headline Delivery Promise
                  </label>
                  <input
                    type="text"
                    value={config.promiseText}
                    onChange={(e) => setConfig({ ...config, promiseText: e.target.value })}
                    placeholder="e.g. Same Day Delivery"
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-black text-[#1c1c1c] outline-hidden focus:border-[#0c831f]"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Shown in header, banner and product details.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Badge Text (Product Cards)
                  </label>
                  <input
                    type="text"
                    value={config.badgeText}
                    onChange={(e) => setConfig({ ...config, badgeText: e.target.value })}
                    placeholder="e.g. ⚡ Same Day Delivery"
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-black text-[#1c1c1c] outline-hidden focus:border-[#0c831f]"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Shown on product cards and category listings.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Default Arrival ETA
                  </label>
                  <input
                    type="text"
                    value={config.defaultEta}
                    onChange={(e) => setConfig({ ...config, defaultEta: e.target.value })}
                    placeholder="e.g. Today by 8:00 PM"
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-black text-[#1c1c1c] outline-hidden focus:border-[#0c831f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Same-Day Order Cutoff Time (24h)
                  </label>
                  <input
                    type="time"
                    value={config.cutoffTime}
                    onChange={(e) => setConfig({ ...config, cutoffTime: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-black text-[#1c1c1c] outline-hidden focus:border-[#0c831f]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Cutoff Notice (Displayed to customers ordering after cutoff)
                </label>
                <input
                  type="text"
                  value={config.cutoffNotice}
                  onChange={(e) => setConfig({ ...config, cutoffNotice: e.target.value })}
                  placeholder="e.g. Orders placed after 7 PM are delivered tomorrow morning."
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs font-medium text-[#1c1c1c] outline-hidden focus:border-[#0c831f]"
                />
              </div>
            </div>

            {/* Thresholds & Charges */}
            <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-[#1c1c1c] uppercase tracking-wider flex items-center gap-2">
                <span>3. Delivery Fees &amp; Order Thresholds</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Minimum Order Value (₹)
                  </label>
                  <input
                    type="number"
                    value={(config.minOrderPaise / 100).toString()}
                    onChange={(e) =>
                      setConfig({ ...config, minOrderPaise: Math.round(Number(e.target.value || "0") * 100) })
                    }
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-black text-[#1c1c1c] outline-hidden focus:border-[#0c831f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Standard Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={(config.defaultChargePaise / 100).toString()}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        defaultChargePaise: Math.round(Number(e.target.value || "0") * 100),
                      })
                    }
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-black text-[#1c1c1c] outline-hidden focus:border-[#0c831f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Free Delivery Threshold (₹)
                  </label>
                  <input
                    type="number"
                    value={config.freeThresholdPaise ? (config.freeThresholdPaise / 100).toString() : ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        freeThresholdPaise: e.target.value
                          ? Math.round(Number(e.target.value) * 100)
                          : null,
                      })
                    }
                    placeholder="e.g. 499 (0 for always free)"
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-black text-[#1c1c1c] outline-hidden focus:border-[#0c831f]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Side Mini Live Preview (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="sticky top-6 rounded-3xl bg-neutral-900 text-white p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Storefront Live Preview
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* Preview 1: Header Pill */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Header Location Display</span>
                <div className="rounded-xl bg-neutral-800 p-3 border border-neutral-700 text-left">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>{config.promiseText || "Same Day Delivery"}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5 truncate">
                    City Centre, Jaipur - 302001 ▾
                  </div>
                </div>
              </div>

              {/* Preview 2: Product Card Badge */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Product Card Badge</span>
                <div className="rounded-xl bg-neutral-800 p-3 border border-neutral-700 flex items-center justify-between">
                  <span className="rounded bg-neutral-700 px-2 py-0.5 text-[10px] font-black text-white">
                    {config.badgeText || "⚡ Same Day Delivery"}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold">12% OFF</span>
                </div>
              </div>

              {/* Preview 3: Cart Delivery Notice */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Cart &amp; Checkout Alert</span>
                <div className="rounded-xl bg-neutral-800 p-3 border border-neutral-700 text-xs">
                  <p className="font-black text-white">{config.promiseText || "Same Day Delivery"}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Cutoff: {config.cutoffTime || "19:00"} · Free delivery above ₹
                    {config.freeThresholdPaise ? (config.freeThresholdPaise / 100).toFixed(0) : "0"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#052e16] py-2.5 text-xs font-black transition active:scale-95 cursor-pointer shadow-md"
              >
                {saving ? "Saving..." : "Apply Changes to Live App"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Pincodes & Location Zones Management */}
      {activeTab === "ZONES" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-xs">
            <div>
              <h2 className="text-base font-black text-[#1c1c1c]">Configured Delivery Zones</h2>
              <p className="text-xs text-neutral-500 font-medium">
                Set individual delivery speeds, fees, and time slots per location/zone.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddZone}
              className="flex items-center gap-1.5 rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-4 py-2.5 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <span>➕</span>
              <span>Add New Delivery Zone</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map((zone) => {
              const rule = zoneRules[zone.id];
              const eta = rule?.estimatedTime || "Same Day in 2-3 Hours";

              return (
                <div
                  key={zone.id}
                  className="rounded-3xl border border-neutral-200/90 bg-white p-5 shadow-sm space-y-4 hover:border-[#0c831f] transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📍</span>
                        <h3 className="font-black text-base text-[#1c1c1c]">{zone.name}</h3>
                      </div>
                      <span className="inline-block mt-1 text-[11px] font-bold text-[#0c831f] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ⚡ {eta}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditZone(zone)}
                        className="rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2.5 py-1 text-xs font-bold transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteZone(zone.id, zone.name)}
                        className="rounded-lg bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 text-xs font-bold transition cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Pincode Pills */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1.5">
                      Covered PIN Codes ({zone.pincodes.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {zone.pincodes.map((pin) => (
                        <span
                          key={pin}
                          className="rounded-lg bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-xs font-bold text-neutral-800"
                        >
                          {pin}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-neutral-50 text-xs font-bold text-neutral-600">
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Min Order</span>
                      <span className="text-[#1c1c1c] font-black">{formatPaise(zone.minOrderPaise)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Delivery Fee</span>
                      <span className="text-[#0c831f] font-black">
                        {zone.deliveryChargePaise === 0 ? "FREE" : formatPaise(zone.deliveryChargePaise)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Free Above</span>
                      <span className="text-neutral-800 font-black">
                        {zone.freeThresholdPaise ? formatPaise(zone.freeThresholdPaise) : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Slots */}
                  <div className="pt-2 border-t border-neutral-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-neutral-500">
                        Delivery Slots ({zone.slots?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => openAddSlot(zone.id)}
                        className="text-[11px] font-black text-[#0c831f] hover:underline cursor-pointer"
                      >
                        + Add Slot
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {zone.slots?.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-md bg-white border border-neutral-200 px-2 py-1 text-[11px] font-semibold text-neutral-700 shadow-2xs"
                        >
                          🕒 {s.label}
                        </span>
                      ))}
                      {(!zone.slots || zone.slots.length === 0) && (
                        <span className="text-xs text-neutral-400 italic">No specific slots configured.</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Full Customer View Preview */}
      {activeTab === "PREVIEW" && (
        <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-black text-[#1c1c1c]">Customer Experience Simulation</h2>
            <p className="text-xs text-neutral-500 font-medium">
              See exactly how your delivery promise appears to Indian consumers across all digital touchpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Header Simulator */}
            <div className="rounded-2xl border border-neutral-200 p-4 space-y-2 bg-[#fbfbfb]">
              <span className="text-[11px] font-black uppercase text-neutral-400">1. App Bar Header</span>
              <div className="rounded-xl bg-white p-4 border border-neutral-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-[#1c1c1c] flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>{config.promiseText}</span>
                  </p>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">
                    City Centre, Jaipur - 302001 ▾
                  </p>
                </div>
                <div className="rounded-xl bg-[#0c831f] text-white px-3 py-1.5 text-xs font-black">
                  Cart (3)
                </div>
              </div>
            </div>

            {/* Product Card Simulator */}
            <div className="rounded-2xl border border-neutral-200 p-4 space-y-2 bg-[#fbfbfb]">
              <span className="text-[11px] font-black uppercase text-neutral-400">2. Product Grid Card</span>
              <div className="rounded-xl bg-white p-4 border border-neutral-200 shadow-xs flex items-center justify-between max-w-sm">
                <div>
                  <span className="rounded bg-[#f4f6fb] px-1.5 py-0.5 text-[10px] font-black text-[#333]">
                    {config.badgeText}
                  </span>
                  <p className="text-xs font-bold text-[#1c1c1c] mt-1.5">Aashirvaad Shudh Chakki Atta 5kg</p>
                  <p className="text-sm font-black text-[#0c831f] mt-0.5">₹269</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-[#0c831f] text-[#0c831f] font-black text-xs px-4 py-1.5 uppercase"
                >
                  ADD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ZONE MODAL */}
      {zoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-black text-base text-[#1c1c1c]">
                {editingZoneId ? "Edit Delivery Zone" : "Add New Delivery Zone"}
              </h3>
              <button
                type="button"
                onClick={() => setZoneModalOpen(false)}
                className="h-8 w-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  placeholder="e.g. Jaipur City Center or South Delhi"
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Pincodes (Comma separated 6-digit Indian PINs)
                </label>
                <input
                  type="text"
                  value={zoneForm.pincodes}
                  onChange={(e) => setZoneForm({ ...zoneForm, pincodes: e.target.value })}
                  placeholder="e.g. 302001, 302002, 302003, 302004"
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Location Delivery Promise (ETA)
                </label>
                <input
                  type="text"
                  value={zoneForm.estimatedTime}
                  onChange={(e) => setZoneForm({ ...zoneForm, estimatedTime: e.target.value })}
                  placeholder="e.g. Same Day in 2 Hours or Same Day Evening"
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    value={zoneForm.minOrderRupees}
                    onChange={(e) => setZoneForm({ ...zoneForm, minOrderRupees: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Fee (₹)</label>
                  <input
                    type="number"
                    value={zoneForm.deliveryChargeRupees}
                    onChange={(e) => setZoneForm({ ...zoneForm, deliveryChargeRupees: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Free Above (₹)</label>
                  <input
                    type="number"
                    value={zoneForm.freeThresholdRupees}
                    onChange={(e) => setZoneForm({ ...zoneForm, freeThresholdRupees: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setZoneModalOpen(false)}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveZone}
                className="rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-5 py-2 text-xs font-black shadow-xs cursor-pointer"
              >
                Save Zone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SLOT MODAL */}
      {slotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-black text-base text-[#1c1c1c]">Add Delivery Time Slot</h3>
              <button
                type="button"
                onClick={() => setSlotModalOpen(false)}
                className="h-8 w-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Slot Label</label>
                <input
                  type="text"
                  value={slotForm.label}
                  onChange={(e) => setSlotForm({ ...slotForm, label: e.target.value })}
                  placeholder="e.g. Today 4 PM – 8 PM"
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={slotForm.startTime}
                    onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={slotForm.endTime}
                    onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Max Orders Per Day</label>
                <input
                  type="number"
                  value={slotForm.maxOrdersPerDay}
                  onChange={(e) => setSlotForm({ ...slotForm, maxOrdersPerDay: e.target.value })}
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs font-bold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSlotModalOpen(false)}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSlot}
                className="rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-5 py-2 text-xs font-black shadow-xs cursor-pointer"
              >
                Add Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
