"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { KOTA_LOCALITIES, type KotaLocality } from "@/lib/kota-localities";
import { Navigation, Compass, Layers, Maximize2, ShieldCheck, Zap } from "lucide-react";

export interface LiveMapTrackerProps {
  orderStatus: string;
  deliveryAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    pincode?: string;
  } | null;
  progressPct: number;
  countdown: number;
}

// Store Hub Coordinates: Central Mart Flagship Store, 80 Feet Road, Kota
const STORE_COORDS: [number, number] = [25.1485, 75.8458];

export function LiveMapTracker({
  orderStatus,
  deliveryAddress,
  progressPct,
  countdown,
}: LiveMapTrackerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Determine Customer Destination Coordinates based on address pincode or locality
  const destinationLocality: KotaLocality = useMemo(() => {
    if (!deliveryAddress) return KOTA_LOCALITIES[1]; // Talwandi default

    const addrStr = `${deliveryAddress.line1 || ""} ${deliveryAddress.line2 || ""} ${deliveryAddress.city || ""}`.toLowerCase();
    const pin = deliveryAddress.pincode || "";

    const matchedByPin = KOTA_LOCALITIES.find((l) => l.pincode === pin);
    const matchedByName = KOTA_LOCALITIES.find((l) => addrStr.includes(l.name.toLowerCase()));

    return matchedByName || matchedByPin || KOTA_LOCALITIES[1];
  }, [deliveryAddress]);

  const destCoords: [number, number] = useMemo(() => {
    return [destinationLocality.lat, destinationLocality.lng];
  }, [destinationLocality]);

  // Interpolate Live Rider Coordinates along route
  const currentRiderCoords: [number, number] = useMemo(() => {
    const fraction = Math.min(1, Math.max(0, progressPct / 100));
    // Midpoint curve offset to simulate real street road following
    const midLat = (STORE_COORDS[0] + destCoords[0]) / 2 + 0.002 * Math.sin(fraction * Math.PI);
    const midLng = (STORE_COORDS[1] + destCoords[1]) / 2 + 0.002 * Math.cos(fraction * Math.PI);

    if (fraction <= 0.5) {
      const subFraction = fraction * 2;
      return [
        STORE_COORDS[0] + (midLat - STORE_COORDS[0]) * subFraction,
        STORE_COORDS[1] + (midLng - STORE_COORDS[1]) * subFraction,
      ];
    } else {
      const subFraction = (fraction - 0.5) * 2;
      return [
        midLat + (destCoords[0] - midLat) * subFraction,
        midLng + (destCoords[1] - midLng) * subFraction,
      ];
    }
  }, [progressPct, destCoords]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || typeof window === "undefined") return;

    let isMounted = true;

    async function initLeaflet() {
      try {
        const L = (await import("leaflet")).default;
        if (!isMounted || !mapContainerRef.current) return;

        // If map already initialized, just update markers
        if (leafletMapRef.current) return;

        const map = L.map(mapContainerRef.current, {
          center: [
            (STORE_COORDS[0] + destCoords[0]) / 2,
            (STORE_COORDS[1] + destCoords[1]) / 2,
          ],
          zoom: 14,
          zoomControl: false,
          attributionControl: false,
        });

        leafletMapRef.current = map;

        // Retina Sharp CARTO Voyager Map Tiles
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            maxZoom: 19,
            subdomains: "abcd",
          }
        ).addTo(map);

        // Store Hub Marker Icon
        const storeIcon = L.divIcon({
          className: "store-hub-marker",
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute h-9 w-9 rounded-full bg-emerald-500/25 animate-ping"></span>
              <div class="h-7 w-7 rounded-2xl bg-[#0c831f] border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-black">
                🏪
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        // Customer Home Marker Icon
        const homeIcon = L.divIcon({
          className: "customer-home-marker",
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute h-9 w-9 rounded-full bg-rose-500/25 animate-ping"></span>
              <div class="h-7 w-7 rounded-2xl bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-black">
                📍
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        // Rider Scooter Marker Icon
        const riderIcon = L.divIcon({
          className: "rider-scooter-marker",
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute h-10 w-10 rounded-full bg-amber-400/40 animate-pulse"></span>
              <div class="h-8 w-8 rounded-full bg-[#f8cb46] border-2 border-[#1c1c1c] shadow-xl flex items-center justify-center text-sm font-black drop-shadow-md">
                🛵
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        // Add Markers
        L.marker(STORE_COORDS, { icon: storeIcon })
          .addTo(map)
          .bindPopup("<b>Central Mart Dark Store</b><br>80 Feet Road, Kota");

        L.marker(destCoords, { icon: homeIcon })
          .addTo(map)
          .bindPopup(`<b>Your Delivery Address</b><br>${deliveryAddress?.line1 || "Customer Doorstep"}`);

        const riderMarker = L.marker(currentRiderCoords, { icon: riderIcon }).addTo(map);
        riderMarkerRef.current = riderMarker;

        // Draw Polyline Route
        const routeLine = L.polyline([STORE_COORDS, currentRiderCoords, destCoords], {
          color: "#0c831f",
          weight: 5,
          opacity: 0.85,
          dashArray: "8, 8",
        }).addTo(map);
        routeLineRef.current = routeLine;

        // Fit Bounds
        map.fitBounds([STORE_COORDS, destCoords], {
          padding: [50, 50],
          maxZoom: 16,
        });

        setMapLoaded(true);
      } catch (err) {
        setMapError(true);
      }
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [destCoords, deliveryAddress]);

  // Update Rider Location Dynamically when progress changes
  useEffect(() => {
    if (!leafletMapRef.current || !riderMarkerRef.current || !routeLineRef.current) return;

    riderMarkerRef.current.setLatLng(currentRiderCoords);
    routeLineRef.current.setLatLngs([STORE_COORDS, currentRiderCoords, destCoords]);
  }, [currentRiderCoords, destCoords]);

  const handleRecenter = () => {
    if (!leafletMapRef.current) return;
    leafletMapRef.current.fitBounds([STORE_COORDS, destCoords], {
      padding: [45, 45],
      maxZoom: 16,
    });
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-neutral-300/80 bg-[#eef3f1] shadow-inner">
      {/* Real Leaflet Map Viewport */}
      <div
        ref={mapContainerRef}
        className="w-full h-56 sm:h-72 z-0"
        style={{ minHeight: "224px" }}
      />

      {/* Top Left Floating Pill: Store & Route Info */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-200/90 shadow-sm flex items-center gap-2 text-xs font-black text-[#1c1c1c]">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>80 Feet Rd Hub → {destinationLocality.name}</span>
        </div>
        <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-neutral-200/80 shadow-xs flex items-center gap-1.5 text-[10px] font-bold text-neutral-600 w-fit">
          <Zap className="w-3 h-3 text-emerald-600" />
          <span>Ather 450X · 28 km/h · 82% Battery</span>
        </div>
      </div>

      {/* Bottom Right Floating Pill: Customer Destination */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
        <button
          onClick={handleRecenter}
          className="h-8 w-8 rounded-xl bg-white/95 hover:bg-white text-neutral-700 shadow-md border border-neutral-200 flex items-center justify-center transition active:scale-95 cursor-pointer"
          title="Recenter Map"
        >
          <Maximize2 className="w-4 h-4 text-emerald-700" />
        </button>

        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-200/90 shadow-sm flex items-center gap-1.5 text-xs font-black text-[#1c1c1c]">
          <span>🏠</span>
          <span className="max-w-[150px] truncate">
            {deliveryAddress?.line1 || destinationLocality.name}
          </span>
        </div>
      </div>

      {/* Bottom Left Floating Badge: GPS Status */}
      <div className="absolute bottom-3 left-3 z-10 bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-black text-emerald-300 flex items-center gap-1.5 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span>LIVE GPS RADAR</span>
      </div>
    </div>
  );
}

export default LiveMapTracker;

