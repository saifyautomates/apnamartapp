import { prisma } from "./prisma";

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
    tagline: "India's Same-Day FMCG Grocery Store",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    currency: "INR",
    logoUrl: "",
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

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row) return fallback;
  return row.value as unknown as T;
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const rows = await prisma.setting.findMany();
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function setSetting(key: string, value: unknown) {
  return prisma.setting.upsert({
    where: { key },
    create: { key, value: value as object },
    update: { value: value as object },
  });
}

export async function getBusyPostingTrigger(): Promise<string> {
  const busy = await getSetting<{ postingTrigger?: string }>("busy", { postingTrigger: "OUT_FOR_DELIVERY" });
  const allowed = ["ORDER_CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];
  return allowed.includes(busy.postingTrigger ?? "") ? (busy.postingTrigger as string) : "OUT_FOR_DELIVERY";
}
