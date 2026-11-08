import { prisma, withDbTimeout } from "./prisma";

export interface DeliveryConfig {
  mode: "SAME_DAY" | "LOCATION_BASED" | "SCHEDULED" | "EXPRESS";
  promiseText: string;
  badgeText: string;
  defaultEta: string;
  cutoffTime: string;
  cutoffNotice: string;
  minOrderPaise: number;
  defaultChargePaise: number;
  freeThresholdPaise: number | null;
  expressAvailable: boolean;
  expressChargePaise: number;
  expressEta: string;
  locationBasedEnabled: boolean;
}

export interface ZoneDeliveryRule {
  estimatedTime?: string;
  badgeText?: string;
  deliveryChargePaise?: number;
  freeThresholdPaise?: number | null;
  minOrderPaise?: number;
}

export const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
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

export const DEFAULT_SETTINGS: Record<string, unknown> = {
  store: {
    name: "Central Mart",
    tagline: "Kota's #1 Online Supermarket — 80 Feet Road Same-Day Grocery Delivery",
    phone: "+91 98290 12345",
    email: "contact@centralmart.in",
    address: "80 Feet Road, Kota, Rajasthan - 324005",
    gstin: "08AABCC1234D1Z5",
    currency: "INR",
    logoUrl: "",
    appIconUrl: "",
    displayMode: "IMAGE_ONLY",
  },
  businessHours: { open: "08:00", close: "21:00", days: "Mon-Sun" },
  delivery: DEFAULT_DELIVERY_CONFIG,
  zoneDeliveryRules: {
    "00000000-0000-0000-0000-000000000001": {
      estimatedTime: "Same Day in 2-3 Hours",
      badgeText: "⚡ Fast Same-Day",
      deliveryChargePaise: 3000,
      freeThresholdPaise: 49900,
      minOrderPaise: 19900,
    },
  },
  pickup: { enabled: true, instructions: "Show your order number at the counter." },
  tax: { inclusive: true, note: "Prices are inclusive of GST (Indian MRP)." },
  payments: { cod: true, upi: true, online: true },
  cancellation: { allowedUntil: "PREPARING", policy: "Orders can be cancelled until preparation starts." },
  busy: { postingTrigger: "OUT_FOR_DELIVERY", enabled: false },
  loyalty: { enabled: true, rupeesPerPoint: 100, pointValuePaise: 100, minRedeemPoints: 10, maxRedeemPointsPerOrder: 500, expiryDays: 365 },
  reservations: { expiryMinutes: 30 },
};

let memorySettings: Record<string, unknown> | null = null;
let lastSettingsFetch = 0;
const SETTINGS_CACHE_TTL_MS = 5000;

export async function getAllSettings(forceFresh = false): Promise<Record<string, unknown>> {
  const now = Date.now();
  if (!forceFresh && memorySettings && now - lastSettingsFetch < SETTINGS_CACHE_TTL_MS) {
    return memorySettings;
  }
  try {
    const rows = await withDbTimeout(prisma.setting.findMany(), 500);
    const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const r of rows) {
      if (typeof r.value === "object" && r.value !== null && typeof out[r.key] === "object") {
        out[r.key] = { ...(out[r.key] as object), ...(r.value as object) };
      } else {
        out[r.key] = r.value;
      }
    }
    memorySettings = out;
    lastSettingsFetch = now;
    return out;
  } catch {
    return memorySettings ?? { ...DEFAULT_SETTINGS };
  }
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const all = await getAllSettings();
  return all[key] !== undefined ? (all[key] as T) : fallback;
}

export async function setSetting(key: string, value: unknown) {
  if (!memorySettings) memorySettings = { ...DEFAULT_SETTINGS };
  if (typeof value === "object" && value !== null && typeof memorySettings[key] === "object") {
    memorySettings[key] = { ...(memorySettings[key] as object), ...(value as object) };
  } else {
    memorySettings[key] = value;
  }
  lastSettingsFetch = Date.now();
  try {
    return await withDbTimeout(
      prisma.setting.upsert({
        where: { key },
        create: { key, value: value as object },
        update: { value: value as object },
      }),
      500
    );
  } catch {
    /* fallback */
  }
  return { key, value };
}

export async function getBusyPostingTrigger(): Promise<string> {
  const busy = await getSetting<{ postingTrigger?: string }>("busy", { postingTrigger: "OUT_FOR_DELIVERY" });
  const allowed = ["ORDER_CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];
  return allowed.includes(busy.postingTrigger ?? "") ? (busy.postingTrigger as string) : "OUT_FOR_DELIVERY";
}
