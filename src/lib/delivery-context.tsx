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

interface DeliveryContextValue {
  deliveryConfig: DeliveryConfig;
  activeLocation: ActiveDeliveryLocation;
  setActiveLocation: (loc: ActiveDeliveryLocation) => void;
  deliveryPromiseText: string;
  deliveryBadgeText: string;
  estimatedArrivalNotice: string;
  zones: DeliveryZoneItem[];
  zoneRules: Record<string, ZoneDeliveryRule>;
  activeZone: DeliveryZoneItem | null;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_CONFIG: DeliveryConfig = {
  mode: "SAME_DAY",
  promiseText: "Same Day Delivery",
  badgeText: "⚡ Same Day Delivery",
  defaultEta: "Today by 8:00 PM",
  cutoffTime: "19:00",
  cutoffNotice: "Orders placed before 7:00 PM are delivered today. Later orders arrive tomorrow morning.",
  minOrderPaise: 19900,
  defaultChargePaise: 3000,
  freeThresholdPaise: 49900,
  expressAvailable: true,
  expressChargePaise: 4900,
  expressEta: "Within 60-90 mins",
  locationBasedEnabled: true,
};

const DEFAULT_LOCATION: ActiveDeliveryLocation = {
  pincode: "302001",
  zoneName: "City Centre",
  address: "R K Nagar, Police Line, Kota, Rajasthan - 324001",
  estimatedTime: "Today by 8:00 PM",
};

const DeliveryContext = createContext<DeliveryContextValue>({
  deliveryConfig: DEFAULT_CONFIG,
  activeLocation: DEFAULT_LOCATION,
  setActiveLocation: () => {},
  deliveryPromiseText: "Same Day Delivery",
  deliveryBadgeText: "⚡ Same Day Delivery",
  estimatedArrivalNotice: "Order before 7:00 PM for Same-Day Delivery",
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
    // 1. Load active location from localStorage
    try {
      const saved = localStorage.getItem("centralmart_location");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.pincode) {
          setActiveLocationState(parsed);
        }
      }
    } catch {
      /* fallback */
    }

    // 2. Fetch latest store settings & zones
    refreshSettings();

    // 3. Listen for cross-component location changes
    const onLocationChanged = (e: Event) => {
      const customEvent = e as CustomEvent<ActiveDeliveryLocation>;
      if (customEvent.detail?.pincode) {
        setActiveLocationState(customEvent.detail);
      }
    };
    window.addEventListener("location-changed", onLocationChanged);
    window.addEventListener("delivery-settings-updated", refreshSettings);

    return () => {
      window.removeEventListener("location-changed", onLocationChanged);
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

  // Match active pincode to zone
  const activeZone = useMemo(() => {
    if (!activeLocation.pincode || zones.length === 0) return null;
    return zones.find((z) => z.pincodes.includes(activeLocation.pincode)) ?? null;
  }, [activeLocation.pincode, zones]);

  // Compute live promise text based on Admin Mode and Active Location
  const deliveryPromiseText = useMemo(() => {
    const mode = deliveryConfig.mode;
    if (mode === "LOCATION_BASED") {
      if (activeZone) {
        const rule = zoneRules[activeZone.id];
        if (rule?.estimatedTime) return rule.estimatedTime;
        return `${activeZone.name} · Same Day`;
      }
      return deliveryConfig.promiseText || "Same Day Delivery";
    }

    if (mode === "SAME_DAY") {
      return deliveryConfig.promiseText || "Same Day Delivery";
    }

    if (mode === "EXPRESS") {
      return deliveryConfig.expressEta || "Within 60-90 mins";
    }

    if (mode === "SCHEDULED") {
      return deliveryConfig.promiseText || "Scheduled Delivery";
    }

    return deliveryConfig.promiseText || "Same Day Delivery";
  }, [deliveryConfig, activeZone, zoneRules]);

  const deliveryBadgeText = useMemo(() => {
    if (deliveryConfig.mode === "LOCATION_BASED" && activeZone) {
      const rule = zoneRules[activeZone.id];
      if (rule?.badgeText) return rule.badgeText;
    }
    return deliveryConfig.badgeText || "⚡ Same Day Delivery";
  }, [deliveryConfig, activeZone, zoneRules]);

  const estimatedArrivalNotice = useMemo(() => {
    const [cutoffHours, cutoffMinutes] = (deliveryConfig.cutoffTime || "19:00").split(":").map(Number);
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const isBeforeCutoff =
      currentHours < cutoffHours || (currentHours === cutoffHours && currentMinutes < cutoffMinutes);

    if (isBeforeCutoff) {
      return `Order before ${deliveryConfig.cutoffTime || "19:00"} for Same-Day Delivery!`;
    }
    return deliveryConfig.cutoffNotice || "Orders placed now will be delivered tomorrow morning.";
  }, [deliveryConfig]);

  return (
    <DeliveryContext.Provider
      value={{
        deliveryConfig,
        activeLocation,
        setActiveLocation,
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

