"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDelivery, type ActiveDeliveryLocation } from "@/lib/delivery-context";
import {
  MapPin,
  Navigation,
  Search,
  X,
  Check,
  Home,
  Briefcase,
  Clock,
  Zap,
  Building2,
  Loader2,
  Compass,
} from "lucide-react";

import { KOTA_LOCALITIES, type KotaLocality } from "@/lib/kota-localities";
export { KOTA_LOCALITIES, type KotaLocality };

export interface GoogleMapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress?: (addr: {
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    locality: string;
  }) => void;
}

export function GoogleMapPicker({ isOpen, onClose, onSelectAddress }: GoogleMapPickerProps) {
  const { activeLocation, setActiveLocation, zones } = useDelivery();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const isMovingRef = useRef(false);

  const [selectedLocality, setSelectedLocality] = useState<KotaLocality>(
    KOTA_LOCALITIES.find((l) => l.pincode === activeLocation.pincode) || KOTA_LOCALITIES[0]
  );
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: selectedLocality.lat,
    lng: selectedLocality.lng,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [houseNo, setHouseNo] = useState("");
  const [landmark, setLandmark] = useState("");
  const [tag, setTag] = useState<"Home" | "Work" | "Other">("Home");
  const [isLocating, setIsLocating] = useState(false);
  const [isPinLifted, setIsPinLifted] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [detectedRoad, setDetectedRoad] = useState<string>("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Filter localities by search query
  const filteredLocalities = KOTA_LOCALITIES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.pincode.includes(searchQuery) ||
      l.zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reverse Geocoding with debounce
  const performReverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`/api/delivery/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (json.data.road) setDetectedRoad(json.data.road);
          // Find closest locality to update pincode & ETA
          const closest = KOTA_LOCALITIES.reduce((prev, curr) => {
            const dPrev = Math.hypot(prev.lat - lat, prev.lng - lng);
            const dCurr = Math.hypot(curr.lat - lat, curr.lng - lng);
            return dCurr < dPrev ? curr : prev;
          }, KOTA_LOCALITIES[0]);

          setSelectedLocality({
            ...closest,
            name: json.data.locality || closest.name,
            pincode: json.data.pincode || closest.pincode,
            eta: json.data.eta || closest.eta,
          });
        }
      }
    } catch {
      /* ignore - fallback to client locality */
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  // Initialize or re-center Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let mapInstance = leafletMapRef.current;
    let isCancelled = false;

    async function initMap() {
      // Dynamic import of Leaflet on client side
      const L = (await import("leaflet")).default;
      if (isCancelled || !mapContainerRef.current) return;

      if (!mapInstance) {
        // Create Leaflet map centered at selected location or 80 Feet Road
        const initialCenter: [number, number] = [
          selectedLocality.lat || 25.1485,
          selectedLocality.lng || 75.8458,
        ];

        mapInstance = L.map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 16,
          zoomControl: false,
          attributionControl: false,
        });

        // Add retina-sharp CARTO Voyager Tiles (Clean, fast, road-detailed)
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            maxZoom: 19,
            subdomains: "abcd",
          }
        ).addTo(mapInstance);

        // Add Central Mart Store Flagship Hub Marker
        const storeIcon = L.divIcon({
          className: "cm-store-marker",
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute h-8 w-8 rounded-full bg-emerald-500/30 animate-ping"></span>
              <div class="h-6 w-6 rounded-full bg-[#0c831f] border-2 border-white shadow-md flex items-center justify-center text-white text-[11px] font-black">
                CM
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([25.1485, 75.8458], { icon: storeIcon, interactive: true })
          .addTo(mapInstance)
          .bindPopup(
            "<b>Central Mart Flagship Store</b><br>80 Feet Road, Kota<br>Dispatch Hub (Same-Day Delivery)",
            { offset: [0, -10] }
          );

        // Handle Pin lift on drag start and drop on drag end
        mapInstance.on("movestart", () => {
          isMovingRef.current = true;
          setIsPinLifted(true);
        });

        mapInstance.on("moveend", () => {
          isMovingRef.current = false;
          setIsPinLifted(false);
          const center = mapInstance.getCenter();
          setCurrentCoords({ lat: center.lat, lng: center.lng });
          performReverseGeocode(center.lat, center.lng);
        });

        leafletMapRef.current = mapInstance;
        setIsMapReady(true);
      }

      // Refresh dimensions once container is visible
      setTimeout(() => {
        if (mapInstance) {
          mapInstance.invalidateSize();
        }
      }, 150);
    }

    initMap();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, performReverseGeocode, selectedLocality.lat, selectedLocality.lng]);

  // Clean up Leaflet on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Animate map when user chooses a locality chip or search result
  const flyToLocality = (loc: KotaLocality) => {
    setSelectedLocality(loc);
    setCurrentCoords({ lat: loc.lat, lng: loc.lng });
    setSearchQuery("");
    setIsSearching(false);

    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([loc.lat, loc.lng], 16, {
        duration: 1.0,
      });
    }
    performReverseGeocode(loc.lat, loc.lng);
  };

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
        setCurrentCoords({ lat: latitude, lng: longitude });

        if (leafletMapRef.current) {
          leafletMapRef.current.flyTo([latitude, longitude], 17, {
            duration: 1.2,
          });
        }
        performReverseGeocode(latitude, longitude);
      },
      (err) => {
        setIsLocating(false);
        // Default to Central Mart 80 Feet Road
        flyToLocality(KOTA_LOCALITIES[0]);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [performReverseGeocode]);

  const handleConfirm = () => {
    const roadText = detectedRoad || houseNo;
    const fullAddress = `${roadText ? roadText + ", " : ""}${selectedLocality.name}, ${landmark ? landmark + ", " : ""}Kota - ${selectedLocality.pincode}`;
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
      localStorage.setItem("cm_delivery_lat", currentCoords.lat.toString());
      localStorage.setItem("cm_delivery_lng", currentCoords.lng.toString());
    } catch {
      /* ignore */
    }

    if (onSelectAddress) {
      onSelectAddress({
        label: tag,
        line1: roadText ? `${roadText}, ${selectedLocality.name}` : selectedLocality.name,
        line2: landmark || undefined,
        city: "Kota",
        state: "Rajasthan",
        pincode: selectedLocality.pincode,
        locality: selectedLocality.name,
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg sm:max-h-[94vh] h-full sm:h-auto rounded-none sm:rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col border border-neutral-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100 z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-[#0c831f] font-black">
              <MapPin className="w-4 h-4 text-[#0c831f]" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#1c1c1c] leading-tight">
                Pin Delivery Location on Map
              </h3>
              <p className="text-[11px] text-neutral-500 font-semibold flex items-center gap-1">
                <span>Kota, Rajasthan</span>
                <span>•</span>
                <span className="text-[#0c831f] font-bold">10-15 Min Hyperlocal Delivery</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold transition active:scale-90 cursor-pointer"
            aria-label="Close Map"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar Row */}
        <div className="px-3.5 py-2.5 bg-neutral-50 border-b border-neutral-200/80 z-10 space-y-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              placeholder="Search area, landmark or PIN in Kota (e.g. Talwandi, Kunhari)..."
              className="w-full rounded-2xl border border-neutral-300 bg-white pl-9 pr-8 py-2 text-xs sm:text-sm font-semibold text-[#1c1c1c] outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setIsSearching(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Autocomplete Search Dropdown */}
          {isSearching && searchQuery ? (
            <div className="max-h-48 overflow-y-auto rounded-2xl bg-white border border-neutral-200 shadow-xl divide-y divide-neutral-100 animate-in fade-in-50 duration-150 z-30">
              {filteredLocalities.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => flyToLocality(loc)}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="block text-xs font-black text-[#1c1c1c]">{loc.name}</span>
                      <span className="block text-[10px] text-neutral-500">
                        {loc.zone} · PIN {loc.pincode}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-600" />
                    <span>{loc.eta}</span>
                  </span>
                </button>
              ))}
              {filteredLocalities.length === 0 ? (
                <div className="p-3 text-center text-xs text-neutral-500">
                  No exact match. Central Mart delivers to all Kota PINs (324001 - 324010).
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* REAL INTERACTIVE LEAFLET & OPENSTREETMAP MAP CANVAS */}
        <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-neutral-100 select-none">
          {/* Map Container Ref for Leaflet */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Central Mart Fixed Floating Pin (Blinkit / Swiggy / Uber UX) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div
              className={`flex flex-col items-center transition-all duration-200 ${
                isPinLifted ? "-translate-y-8 scale-105" : "-translate-y-5 scale-100"
              }`}
            >
              {/* Order Delivery Here Floating Badge */}
              <div className="mb-1 rounded-full bg-[#1c1c1c] text-white px-3 py-1 text-[10px] font-black shadow-xl flex items-center gap-1.5 border border-white/20">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span className="truncate max-w-[190px]">
                  {isReverseGeocoding ? "Detecting location..." : selectedLocality.name}
                </span>
                {isReverseGeocoding && <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-400" />}
              </div>

              {/* Glowing High-Definition Map Pin */}
              <div className="relative">
                <svg
                  className="w-10 h-10 text-red-600 drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>

              {/* Ground Shadow that responds to lift height */}
              <div
                className={`rounded-full bg-black/35 blur-[1.5px] transition-all duration-200 ${
                  isPinLifted ? "h-1.5 w-3 opacity-40 mt-1" : "h-2 w-4 opacity-80 mt-0.5"
                }`}
              />
            </div>
          </div>

          {/* GPS "Use Current Location" Floating Button */}
          <button
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-black text-emerald-700 shadow-xl border border-emerald-200 hover:bg-emerald-50 active:scale-95 transition cursor-pointer"
            title="Detect GPS Location"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <Navigation className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            )}
            <span>{isLocating ? "Locating..." : "Use Current Location"}</span>
          </button>

          {/* Drag instruction badge at top */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-3 py-1 rounded-full pointer-events-none shadow-md flex items-center gap-1">
            <Compass className="w-3 h-3 text-emerald-400" />
            <span>Pan map to set exact doorstep pin</span>
          </div>
        </div>

        {/* Quick Kota Localities Horizontal Chips */}
        <div className="px-3.5 py-2 bg-white border-b border-neutral-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-touch-x">
          <span className="text-[10px] font-black uppercase text-neutral-400 shrink-0">Popular:</span>
          {KOTA_LOCALITIES.slice(0, 7).map((loc) => {
            const isSel = selectedLocality.name === loc.name;
            return (
              <button
                key={loc.name}
                onClick={() => flyToLocality(loc)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold transition active:scale-95 cursor-pointer border flex items-center gap-1 ${
                  isSel
                    ? "bg-[#0c831f] text-white border-emerald-800 shadow-xs"
                    : "bg-neutral-100/90 text-neutral-700 border-neutral-200 hover:bg-neutral-200"
                }`}
              >
                {loc.isStoreHub && <Building2 className="w-3 h-3 text-amber-300" />}
                <span>{loc.name.replace(/ \(.*\)/, "")}</span>
              </button>
            );
          })}
        </div>

        {/* Address Details Bottom Sheet */}
        <div className="p-4 bg-white flex-1 overflow-y-auto space-y-3">
          {/* Selected Area Card */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0c831f] shrink-0" />
                <span className="text-xs font-black text-emerald-950 truncate">
                  {selectedLocality.name}, Kota
                </span>
                <span className="text-[10px] font-black text-emerald-800 bg-white border border-emerald-300 px-1.5 py-0.2 rounded-md">
                  {selectedLocality.pincode}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/80 mt-0.5 font-medium truncate">
                {detectedRoad ? `${detectedRoad} · ` : ""}
                {selectedLocality.zone} · 100% Serviceable
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-white px-2.5 py-1 rounded-xl shadow-xs border border-emerald-200">
                <Zap className="w-3 h-3 fill-emerald-600 text-emerald-600" />
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
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black transition border cursor-pointer flex items-center justify-center gap-1.5 ${
                    tag === t
                      ? "bg-[#1c1c1c] text-white border-[#1c1c1c] shadow-xs"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  {t === "Home" ? (
                    <Home className="w-3.5 h-3.5" />
                  ) : t === "Work" ? (
                    <Briefcase className="w-3.5 h-3.5" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5" />
                  )}
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button CTA */}
        <div className="p-3.5 bg-white border-t border-neutral-100 z-10">
          <button
            onClick={handleConfirm}
            className={`w-full py-3.5 rounded-2xl font-black text-sm text-white tracking-wide shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
              savedSuccess
                ? "bg-emerald-600"
                : "bg-gradient-to-r from-[#0c831f] via-[#0d8e23] to-[#0a701a] hover:opacity-95 shadow-emerald-900/20"
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
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
