"use client";

import { useState } from "react";
import { useDelivery, type ActiveDeliveryLocation } from "@/lib/delivery-context";

export interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (addr: string) => void;
  currentLocation?: string;
}

export function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const { zones, zoneRules, activeLocation, setActiveLocation, deliveryConfig } = useDelivery();
  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePincodeCheck = () => {
    const cleanPin = pincodeInput.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setPincodeStatus("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    const matchedZone = zones.find((z) => z.pincodes.includes(cleanPin));
    if (matchedZone) {
      const rule = zoneRules[matchedZone.id];
      const customEta = rule?.estimatedTime || deliveryConfig.promiseText || "Same Day Delivery";
      const newLoc: ActiveDeliveryLocation = {
        pincode: cleanPin,
        zoneId: matchedZone.id,
        zoneName: matchedZone.name,
        address: `${matchedZone.name} · PIN ${cleanPin}`,
        estimatedTime: customEta,
      };
      setActiveLocation(newLoc);
      setPincodeStatus(`✓ Serviceable! ${customEta}`);
      setTimeout(() => onClose(), 600);
    } else {
      setPincodeStatus(`Pin ${cleanPin} is outside our direct same-day delivery zones. Try 302001, 302002 or pick a zone below.`);
    }
  };

  const selectZone = (zone: (typeof zones)[0]) => {
    const defaultPin = zone.pincodes[0] || "302001";
    const rule = zoneRules[zone.id];
    const customEta = rule?.estimatedTime || deliveryConfig.promiseText || "Same Day Delivery";
    const newLoc: ActiveDeliveryLocation = {
      pincode: defaultPin,
      zoneId: zone.id,
      zoneName: zone.name,
      address: `${zone.name} (PIN: ${zone.pincodes.join(", ")})`,
      estimatedTime: customEta,
    };
    setActiveLocation(newLoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 border border-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
          <div>
            <h3 className="font-black text-[#1c1c1c] text-base">Select Delivery Location</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {deliveryConfig.mode === "SAME_DAY"
                ? "⚡ Same-Day Delivery available in active zones"
                : "📍 Delivery speed based on your location"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Pincode Search Box */}
        <div className="mt-4 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
          <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-600 mb-1.5">
            Check Your PIN Code
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={pincodeInput}
              onChange={(e) => {
                setPincodeInput(e.target.value.slice(0, 6));
                setPincodeStatus(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handlePincodeCheck()}
              placeholder="Enter 6-digit PIN (e.g. 302001)"
              maxLength={6}
              className="flex-1 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-bold text-[#1c1c1c] outline-hidden focus:border-[#0c831f] focus:ring-2 focus:ring-[#0c831f]/20"
            />
            <button
              type="button"
              onClick={handlePincodeCheck}
              className="rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-4 py-2 text-xs font-black transition active:scale-95 cursor-pointer shadow-xs"
            >
              Check
            </button>
          </div>
          {pincodeStatus ? (
            <p
              className={`mt-2 text-xs font-bold ${
                pincodeStatus.startsWith("✓") ? "text-[#0c831f]" : "text-amber-700"
              }`}
            >
              {pincodeStatus}
            </p>
          ) : null}
        </div>

        {/* Active Delivery Zones List */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400">
              Active Store Delivery Zones ({zones.length})
            </span>
            <span className="text-[11px] text-[#0c831f] font-bold">Admin Managed</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {zones.map((zone) => {
              const rule = zoneRules[zone.id];
              const isSelected = activeLocation.zoneId === zone.id || zone.pincodes.includes(activeLocation.pincode);
              const etaLabel = rule?.estimatedTime || deliveryConfig.promiseText || "Same Day";
              const badgeLabel = rule?.badgeText || deliveryConfig.badgeText || "⚡ Same Day";

              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => selectZone(zone)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "border-[#0c831f] bg-emerald-50/60 ring-2 ring-[#0c831f]/20"
                      : "border-neutral-200/90 hover:border-[#0c831f] hover:bg-neutral-50"
                  }`}
                >
                  <span className="text-2xl shrink-0">📍</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black text-[#1c1c1c] truncate">{zone.name}</p>
                      <span className="text-[10px] font-black text-[#0c831f] bg-white border border-emerald-300 px-2 py-0.5 rounded-full shrink-0 shadow-xs">
                        {badgeLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                      Pincodes: {zone.pincodes.join(", ")}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-neutral-400">
                      <span>Speed: <strong className="text-neutral-700">{etaLabel}</strong></span>
                      <span>·</span>
                      <span>Delivery: <strong className="text-[#0c831f]">{zone.deliveryChargePaise === 0 ? "FREE" : `₹${(zone.deliveryChargePaise / 100).toFixed(0)}`}</strong></span>
                    </div>
                  </div>
                </button>
              );
            })}

            {zones.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-neutral-300 text-center text-xs text-neutral-500">
                All India Pincodes covered under default Same-Day Delivery.
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400 font-medium">
          <span>📦 Fresh groceries packed at store</span>
          <span>🛵 Real-time live tracking</span>
        </div>
      </div>
    </div>
  );
}

export default LocationModal;
