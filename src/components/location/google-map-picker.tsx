"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useDelivery, type ActiveDeliveryLocation } from "@/lib/delivery-context";

export interface KotaLocality {
  name: string;
  pincode: string;
  zone: string;
  lat: number;
  lng: number;
  eta: string;
}

export const KOTA_LOCALITIES: KotaLocality[] = [
  { name: "Talwandi", pincode: "324005", zone: "Zone B — South Kota", lat: 25.1524, lng: 75.8315, eta: "10-12 Mins" },
  { name: "Vigyan Nagar", pincode: "324005", zone: "Zone B — South Kota", lat: 25.142, lng: 75.84, eta: "10-14 Mins" },
  { name: "Mahaveer Nagar (Ext 1, 2, 3)", pincode: "324005", zone: "Zone B — South Kota", lat: 25.145, lng: 75.828, eta: "12-15 Mins" },
  { name: "Nayapura & Collectorate", pincode: "324001", zone: "Zone A — Central Kota", lat: 25.1873, lng: 75.845, eta: "8-10 Mins" },
  { name: "Rampura Bazaar", pincode: "324006", zone: "Zone A — Central Kota", lat: 25.195, lng: 75.847, eta: "10-12 Mins" },
  { name: "Kunhari (Landmark City & Allen)", pincode: "324008", zone: "Zone C — North Kota", lat: 25.215, lng: 75.84, eta: "12-15 Mins" },
  { name: "Dadabari & Shrinath Puram", pincode: "324009", zone: "Zone B — South Kota", lat: 25.156, lng: 75.817, eta: "12-15 Mins" },
  { name: "Gumanpura Shopping Market", pincode: "324007", zone: "Zone A — Central Kota", lat: 25.176, lng: 75.842, eta: "10-12 Mins" },
  { name: "Chawani & Aerodrome Circle", pincode: "324007", zone: "Zone A — Central Kota", lat: 25.168, lng: 75.846, eta: "10-14 Mins" },
  { name: "Jawahar Nagar & Coaching Hub", pincode: "324005", zone: "Zone B — South Kota", lat: 25.15, lng: 75.848, eta: "10-12 Mins" },
  { name: "Indra Vihar (Commerce College Rd)", pincode: "324005", zone: "Zone B — South Kota", lat: 25.154, lng: 75.839, eta: "10-12 Mins" },
  { name: "Rajeev Gandhi Nagar", pincode: "324005", zone: "Zone B — South Kota", lat: 25.151, lng: 75.855, eta: "12-15 Mins" },
  { name: "Keshavpura", pincode: "324009", zone: "Zone B — South Kota", lat: 25.138, lng: 75.825, eta: "14-16 Mins" },
  { name: "Borkhera & Baran Road", pincode: "324001", zone: "Zone D — East Kota", lat: 25.19, lng: 75.875, eta: "14-18 Mins" },
];

export interface GoogleMapPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleMapPicker({ isOpen, onClose }: GoogleMapPickerProps) {
  const { activeLocation, setActiveLocation, zones } = useDelivery();

  const [selectedLocality, setSelectedLocality] = useState<KotaLocality>(
    KOTA_LOCALITIES.find((l) => l.pincode === activeLocation.pincode) || KOTA_LOCALITIES[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [houseNo, setHouseNo] = useState("");
  const [landmark, setLandmark] = useState("");
  const [tag, setTag] = useState<"Home" | "Work" | "Other">("Home");
  const [isLocating, setIsLocating] = useState(false);
  const [mapZoom, setMapZoom] = useState(15);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Filter localities by search query
  const filteredLocalities = KOTA_LOCALITIES.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.pincode.includes(searchQuery) ||
    l.zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sync when open
  useEffect(() => {
    if (isOpen) {
      const match = KOTA_LOCALITIES.find((l) => l.pincode === activeLocation.pincode);
      if (match) setSelectedLocality(match);
      setSavedSuccess(false);
    }
  }, [isOpen, activeLocation.pincode]);

  // GPS Geolocation Handler
  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        // Find closest Kota locality
        let closest = KOTA_LOCALITIES[0];
        let minDistance = Infinity;
        for (const loc of KOTA_LOCALITIES) {
          const dist = Math.hypot(loc.lat - latitude, loc.lng - longitude);
          if (dist < minDistance) {
            minDistance = dist;
            closest = loc;
          }
        }
        setSelectedLocality(closest);
        setMapOffset({ x: 0, y: 0 });
      },
      () => {
        setIsLocating(false);
        // Fallback default: Talwandi
        setSelectedLocality(KOTA_LOCALITIES[0]);
      },
      { timeout: 8000 }
    );
  }, []);

  const handleConfirm = () => {
    const fullAddress = `${houseNo ? houseNo + ", " : ""}${selectedLocality.name}, ${landmark ? landmark + ", " : ""}Kota - ${selectedLocality.pincode}`;
    const matchedZone = zones.find((z) => z.pincodes.includes(selectedLocality.pincode));

    const newLoc: ActiveDeliveryLocation = {
      pincode: selectedLocality.pincode,
      zoneId: matchedZone?.id || "zone-kota",
      zoneName: selectedLocality.name,
      areaName: selectedLocality.name,
      address: fullAddress,
      estimatedTime: selectedLocality.eta,
    };

    setActiveLocation(newLoc);
    try {
      localStorage.setItem("cm_delivery_address", fullAddress);
      localStorage.setItem("cm_delivery_pincode", selectedLocality.pincode);
    } catch {
      /* ignore */
    }

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg sm:max-h-[92vh] h-full sm:h-auto rounded-none sm:rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col border border-neutral-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100 z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-black text-sm">
              📍
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#1c1c1c] leading-tight">
                Pin Delivery Location on Map
              </h3>
              <p className="text-[11px] text-neutral-500 font-semibold">
                Kota, Rajasthan (Hyperlocal 10-15 Min Delivery)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold transition active:scale-90 cursor-pointer"
            aria-label="Close Map"
          >
            ✕
          </button>
        </div>

        {/* Search Bar & GPS Locate Row */}
        <div className="px-3.5 py-2.5 bg-neutral-50 border-b border-neutral-200/80 z-10 space-y-2">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              placeholder="Search area, landmark or PIN in Kota (e.g. Talwandi)..."
              className="w-full rounded-2xl border border-neutral-300 bg-white pl-9 pr-8 py-2 text-xs sm:text-sm font-semibold text-[#1c1c1c] outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setIsSearching(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* Autocomplete Search Dropdown */}
          {isSearching && searchQuery ? (
            <div className="max-h-48 overflow-y-auto rounded-2xl bg-white border border-neutral-200 shadow-xl divide-y divide-neutral-100 animate-in fade-in-50 duration-150">
              {filteredLocalities.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => {
                    setSelectedLocality(loc);
                    setSearchQuery("");
                    setIsSearching(false);
                    setMapOffset({ x: 0, y: 0 });
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50 flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <span className="block text-xs font-black text-[#1c1c1c]">{loc.name}</span>
                    <span className="block text-[10px] text-neutral-500">{loc.zone} · PIN {loc.pincode}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    ⚡ {loc.eta}
                  </span>
                </button>
              ))}
              {filteredLocalities.length === 0 ? (
                <div className="p-3 text-center text-xs text-neutral-500">
                  No matching Kota area. We deliver to all Kota PINs (324001 - 324010).
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* INTERACTIVE MAP CANVAS / SIMULATOR (Like Zomato/Blinkit) */}
        <div
          className="relative h-56 sm:h-64 w-full bg-[#e8ede6] overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={(e) => {
            setIsDragging(true);
            setDragStart({ x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y });
          }}
          onMouseMove={(e) => {
            if (!isDragging) return;
            setMapOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          {/* Grid / Roads Representation */}
          <div
            className="absolute inset-[-100px] transition-transform duration-75"
            style={{
              transform: `translate(${mapOffset.x}px, ${mapOffset.y}px)`,
              backgroundImage: `
                radial-gradient(circle at 50% 50%, rgba(12,131,31,0.08) 0, rgba(12,131,31,0) 65%),
                linear-gradient(to right, #d4ddd0 1px, transparent 1px),
                linear-gradient(to bottom, #d4ddd0 1px, transparent 1px),
                linear-gradient(45deg, #f0f4ee 25%, transparent 25%),
                linear-gradient(-45deg, #f0f4ee 25%, transparent 25%)
              `,
              backgroundSize: "40px 40px, 40px 40px, 40px 40px, 80px 80px, 80px 80px",
            }}
          >
            {/* Chambal River Graphic (Kota Landmark) */}
            <div className="absolute top-10 -left-10 w-[600px] h-12 bg-sky-200/70 -rotate-12 rounded-full blur-[1px]" />
            <div className="absolute top-12 left-20 text-[9px] font-bold text-sky-700/80 uppercase tracking-widest pointer-events-none">
              ~ Chambal River ~
            </div>

            {/* City Landmarks Placed relative to center */}
            {KOTA_LOCALITIES.slice(0, 8).map((loc, idx) => {
              const angles = [0, 45, 90, 135, 180, 225, 270, 315];
              const dist = 70 + (idx % 3) * 35;
              const rad = (angles[idx] * Math.PI) / 180;
              const px = 200 + Math.cos(rad) * dist;
              const py = 120 + Math.sin(rad) * dist;

              return (
                <div
                  key={loc.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLocality(loc);
                    setMapOffset({ x: 0, y: 0 });
                  }}
                  className="absolute cursor-pointer flex items-center gap-1 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-neutral-300 shadow-xs hover:scale-105 hover:bg-emerald-50 transition"
                  style={{ left: `${px}px`, top: `${py}px` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span className="text-[10px] font-bold text-neutral-800">{loc.name}</span>
                </div>
              );
            })}
          </div>

          {/* Central Target Reticle & Floating Pin (Fixed in center like Blinkit/Zomato) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="flex flex-col items-center -translate-y-5">
              {/* Order Delivery Here Bubble */}
              <div className="mb-1 rounded-full bg-[#1c1c1c] text-white px-3 py-1 text-[10px] font-black shadow-lg animate-bounce flex items-center gap-1">
                <span>📍</span>
                <span>Deliver to: {selectedLocality.name}</span>
              </div>
              {/* Glowing Pin Marker */}
              <div className="relative">
                <svg className="w-9 h-9 text-red-600 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              {/* Shadow on Ground */}
              <div className="h-2 w-4 rounded-full bg-black/25 blur-[1px] mt-0.5" />
            </div>
          </div>

          {/* GPS Use Current Location Button on Bottom-Right */}
          <button
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-700 shadow-lg border border-emerald-200 hover:bg-emerald-50 active:scale-95 transition cursor-pointer"
          >
            <span className={`text-sm ${isLocating ? "animate-spin" : ""}`}>
              {isLocating ? "⏳" : "🎯"}
            </span>
            <span>{isLocating ? "Locating..." : "Use Current Location"}</span>
          </button>

          {/* Hint Overlay at Top */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full pointer-events-none">
            Drag map or tap area to move pin
          </div>
        </div>

        {/* Quick Kota Localities Horizontal Pills */}
        <div className="px-3.5 py-2 bg-white border-b border-neutral-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-touch-x">
          <span className="text-[10px] font-black uppercase text-neutral-400 shrink-0">Popular:</span>
          {KOTA_LOCALITIES.slice(0, 6).map((loc) => {
            const isSel = selectedLocality.name === loc.name;
            return (
              <button
                key={loc.name}
                onClick={() => {
                  setSelectedLocality(loc);
                  setMapOffset({ x: 0, y: 0 });
                }}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold transition active:scale-95 cursor-pointer border ${
                  isSel
                    ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                    : "bg-neutral-100/80 text-neutral-700 border-neutral-200 hover:bg-neutral-200"
                }`}
              >
                {loc.name}
              </button>
            );
          })}
        </div>

        {/* Address Details Form (Zomato/Blinkit bottom sheet) */}
        <div className="p-4 bg-white flex-1 overflow-y-auto space-y-3">
          {/* Selected Area Card */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">📍</span>
                <span className="text-xs font-black text-emerald-950 truncate">
                  {selectedLocality.name}, Kota
                </span>
                <span className="text-[10px] font-black text-emerald-800 bg-white border border-emerald-300 px-1.5 py-0.2 rounded-md">
                  {selectedLocality.pincode}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/80 mt-0.5 font-medium">
                {selectedLocality.zone} · 100% Serviceable
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-white px-2 py-1 rounded-xl shadow-xs border border-emerald-200">
                <span>⚡</span>
                <span>{selectedLocality.eta}</span>
              </span>
            </div>
          </div>

          {/* Form Inputs: House No & Landmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-1">
                House / Flat / Building No. *
              </label>
              <input
                type="text"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                placeholder="e.g. Flat 302, Royal Residency"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold text-[#1c1c1c] outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-1">
                Landmark / Street (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Allen Sangyan / City Mall"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold text-[#1c1c1c] outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Tag Selector: Home / Work / Other */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-1.5">
              Save Address As
            </label>
            <div className="flex gap-2">
              {(["Home", "Work", "Other"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black transition border cursor-pointer ${
                    tag === t
                      ? "bg-[#1c1c1c] text-white border-[#1c1c1c] shadow-xs"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  {t === "Home" ? "🏠 Home" : t === "Work" ? "💼 Work" : "📍 Other"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button CTA */}
        <div className="p-3.5 bg-white border-t border-neutral-100 z-10">
          <button
            onClick={handleConfirm}
            className={`w-full py-3 rounded-2xl font-black text-sm text-white tracking-wide shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
              savedSuccess
                ? "bg-emerald-600"
                : "bg-gradient-to-r from-[#0c831f] via-[#0d8e23] to-[#0a701a] hover:opacity-95 shadow-emerald-900/20"
            }`}
          >
            {savedSuccess ? (
              <>
                <span>✓</span>
                <span>Address Confirmed &amp; Saved!</span>
              </>
            ) : (
              <>
                <span>Confirm &amp; Deliver Here</span>
                <span className="text-base">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoogleMapPicker;
