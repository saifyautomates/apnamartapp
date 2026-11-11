"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { DeliveryConfig, ZoneDeliveryRule } from "@/lib/settings";

export interface ActiveDeliveryLocation {
  pincode: string;
  zoneId?: string;
  zoneName?: string;
  areaName?: string;
  address?: string;
  estimatedTime?: string;
}

export interface DeliveryZoneItem {
  id: string;
  name: string;
  pincodes: string[];
  minOrderPaise: number;
  deliveryChargePaise: number;
  freeThresholdPaise?: number | null;
  isActive: boolean;
  slots?: Array<{
    id: string;
    label: string;
    startTime: string;
    endTime: string;
    maxOrdersPerDay: number;
  }>;
}

export type ShoppingMode = "DELIVERY" | "PICKUP" | "IN_STORE";

export interface CentralMartStoreInfo {
  id: string;
  name: string;
  tagline: string;
  address: string;
  landmark: string;
  city: string;
  pincode: string;
  phone: string;
  hours: string;
  inStoreAisles: Array<{ aisleNumber: number; name: string; category: string }>;
}

export const CENTRAL_MART_FLAGSHIP_STORE: CentralMartStoreInfo = {
  id: "store-kota-80ft",
  name: "Central Mart Flagship Supermarket & Darkstore",
  tagline: "Smart Shopping. Better Living.",
  address: "80 Feet Road, Near Nayapura & CAD Circle",
  landmark: "Opp. City Mall Extension",
  city: "Kota, Rajasthan",
  pincode: "324001",
  phone: "+91 98765 43210",
  hours: "7:00 AM – 11:00 PM Daily",
  inStoreAisles: [
    { aisleNumber: 1, name: "Cold Drinks, Juices & Beverages", category: "cold-drinks" },
    { aisleNumber: 2, name: "Snacks, Chips, Namkeen & Biscuits", category: "snacks" },
    { aisleNumber: 3, name: "Dairy, Milk, Bread, Butter & Eggs", category: "dairy-eggs" },
    { aisleNumber: 4, name: "Instant Foods, Maggi & Noodles", category: "breakfast" },
    { aisleNumber: 5, name: "Atta, Rice, Dal, Oil & Staples", category: "staples" },
    { aisleNumber: 6, name: "Soaps, Shampoos & Personal Care", category: "personal-care" },
    { aisleNumber: 7, name: "Detergents & Cleaning Essentials", category: "cleaning-essentials" },
    { aisleNumber: 8, name: "Chocolates, Sweets & Baby Care", category: "sweet-tooth" },
  ],
};

interface DeliveryContextValue {
  deliveryConfig: DeliveryConfig;
  activeLocation: ActiveDeliveryLocation;
  setActiveLocation: (loc: ActiveDeliveryLocation) => void;
  shoppingMode: ShoppingMode;
  setShoppingMode: (mode: ShoppingMode) => void;
  storeInfo: CentralMartStoreInfo;
  deliveryPromiseText: string;
  deliveryBadgeText: string;
  estimatedArrivalNotice: string;
  zones: DeliveryZoneItem[];
  zoneRules: Record<string, ZoneDeliveryRule>;
  activeZone: DeliveryZoneItem | null;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_CONFIG: DeliveryConfig = {
  mode: "EXPRESS",
  promiseText: "15–30 Mins Express Delivery in Kota",
  badgeText: "⚡ 15–30 Mins (Kota Only)",
  defaultEta: "Arriving in 15–30 mins",
  cutoffTime: "22:30",
  cutoffNotice: "Kota orders placed before 10:30 PM are delivered in 15-30 minutes.",
  minOrderPaise: 9900,
  defaultChargePaise: 1500,
  freeThresholdPaise: 19900,
  expressAvailable: true,
  expressChargePaise: 0,
  expressEta: "15–30 Mins Express",
  locationBasedEnabled: true,
};

const DEFAULT_LOCATION: ActiveDeliveryLocation = {
  pincode: "324001",
  zoneName: "Central Kota",
  address: "80 Feet Road / Nayapura, Kota, Rajasthan - 324001",
  estimatedTime: "15–30 Mins",
};

const DeliveryContext = createContext<DeliveryContextValue>({
  deliveryConfig: DEFAULT_CONFIG,
  activeLocation: DEFAULT_LOCATION,
  setActiveLocation: () => {},
  shoppingMode: "DELIVERY",
  setShoppingMode: () => {},
  storeInfo: CENTRAL_MART_FLAGSHIP_STORE,
  deliveryPromiseText: "15–30 Mins Express Delivery",
  deliveryBadgeText: "⚡ 15–30 Mins",
  estimatedArrivalNotice: "Delivered in 15–30 mins from 80 Feet Road Darkstore",
  zones: [],
  zoneRules: {},
  activeZone: null,
  refreshSettings: async () => {},
});

export function DeliveryProvider({
  children,
  initialConfig,
}: {
  children: React.ReactNode;
  initialConfig?: Partial<DeliveryConfig>;
}) {
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...(initialConfig ?? {}),
  }));

  const [zones, setZones] = useState<DeliveryZoneItem[]>([]);
  const [zoneRules, setZoneRules] = useState<Record<string, ZoneDeliveryRule>>({});
  const [activeLocation, setActiveLocationState] = useState<ActiveDeliveryLocation>(DEFAULT_LOCATION);
  const [shoppingMode, setShoppingModeState] = useState<ShoppingMode>("DELIVERY");

  const refreshSettings = async () => {
    try {
      const res = await fetch("/api/store-info");
      if (res.ok) {
        const json = await res.json();
        if (json.data?.delivery) {
          setDeliveryConfig((prev) => ({ ...prev, ...json.data.delivery }));
        }
        if (json.data?.zoneDeliveryRules) {
          setZoneRules(json.data.zoneDeliveryRules);
        }
        if (Array.isArray(json.data?.zones)) {
          setZones(json.data.zones);
        }
      }
    } catch {
      /* ignore offline/error */
    }
  };

  useEffect(() => {
    // 1. Load active location & shopping mode from localStorage
    try {
      const savedLoc = localStorage.getItem("centralmart_location");
      if (savedLoc) {
        const parsed = JSON.parse(savedLoc);
        if (parsed?.pincode) {
          setActiveLocationState(parsed);
        }
      }
      const savedMode = localStorage.getItem("centralmart_shopping_mode") as ShoppingMode;
      if (savedMode === "DELIVERY" || savedMode === "PICKUP" || savedMode === "IN_STORE") {
        setShoppingModeState(savedMode);
      }
    } catch {
      /* fallback */
    }

    // 2. Fetch latest store settings & zones
    refreshSettings();

    // 3. Listen for cross-component location and mode changes
    const onLocationChanged = (e: Event) => {
      const customEvent = e as CustomEvent<ActiveDeliveryLocation>;
      if (customEvent.detail?.pincode) {
        setActiveLocationState(customEvent.detail);
      }
    };
    const onModeChanged = (e: Event) => {
      const customEvent = e as CustomEvent<ShoppingMode>;
      if (customEvent.detail) {
        setShoppingModeState(customEvent.detail);
      }
    };
    window.addEventListener("location-changed", onLocationChanged);
    window.addEventListener("shopping-mode-changed", onModeChanged);
    window.addEventListener("delivery-settings-updated", refreshSettings);

    return () => {
      window.removeEventListener("location-changed", onLocationChanged);
      window.removeEventListener("shopping-mode-changed", onModeChanged);
      window.removeEventListener("delivery-settings-updated", refreshSettings);
    };
  }, []);

  const setActiveLocation = (loc: ActiveDeliveryLocation) => {
    setActiveLocationState(loc);
    try {
      localStorage.setItem("centralmart_location", JSON.stringify(loc));
      window.dispatchEvent(new CustomEvent("location-changed", { detail: loc }));
    } catch {
      /* ignore storage errors */
    }
  };

  const setShoppingMode = (mode: ShoppingMode) => {
    setShoppingModeState(mode);
    try {
      localStorage.setItem("centralmart_shopping_mode", mode);
      window.dispatchEvent(new CustomEvent("shopping-mode-changed", { detail: mode }));
    } catch {
      /* ignore storage errors */
    }
  };

  // Match active pincode to zone
  const activeZone = useMemo(() => {
    if (!activeLocation.pincode || zones.length === 0) return null;
    return zones.find((z) => z.pincodes.includes(activeLocation.pincode)) ?? null;
  }, [activeLocation.pincode, zones]);

  // Compute live promise text based on Shopping Mode & Admin Mode
  const deliveryPromiseText = useMemo(() => {
    if (shoppingMode === "PICKUP") {
      return "Store Pickup · Ready in 15 mins (80 Feet Road)";
    }
    if (shoppingMode === "IN_STORE") {
      return "In-Store Shopping · 80 Feet Road Supermarket";
    }

    const mode = deliveryConfig.mode;
    if (mode === "LOCATION_BASED") {
      if (activeZone) {
        const rule = zoneRules[activeZone.id];
        if (rule?.estimatedTime) return rule.estimatedTime;
        return `${activeZone.name} · 15-30 Mins`;
      }
      return deliveryConfig.promiseText || "15–30 Mins Delivery";
    }

    if (mode === "EXPRESS") {
      return "15–30 Mins Doorstep Delivery";
    }

    return deliveryConfig.promiseText || "15–30 Mins Express Delivery";
  }, [shoppingMode, deliveryConfig, activeZone, zoneRules]);

  const deliveryBadgeText = useMemo(() => {
    if (shoppingMode === "PICKUP") {
      return "🏬 Store Pickup (Ready in 15m)";
    }
    if (shoppingMode === "IN_STORE") {
      return "🛒 In-Store Scan & Go";
    }
    return "⚡ 15–30 Mins Express";
  }, [shoppingMode]);

  const estimatedArrivalNotice = useMemo(() => {
    if (shoppingMode === "PICKUP") {
      return "Collect from Central Mart Flagship Counter, 80 Feet Road, Kota (7 AM - 11 PM)";
    }
    if (shoppingMode === "IN_STORE") {
      return "Self-service shopping at 80 Feet Road Supermarket with barcode scan & bag builder";
    }
    return "Dispatched from Kota 80 Feet Road Darkstore in 15–30 minutes";
  }, [shoppingMode]);

  return (
    <DeliveryContext.Provider
      value={{
        deliveryConfig,
        activeLocation,
        setActiveLocation,
        shoppingMode,
        setShoppingMode,
        storeInfo: CENTRAL_MART_FLAGSHIP_STORE,
        deliveryPromiseText,
        deliveryBadgeText,
        estimatedArrivalNotice,
        zones,
        zoneRules,
        activeZone,
        refreshSettings,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  return useContext(DeliveryContext);
}

