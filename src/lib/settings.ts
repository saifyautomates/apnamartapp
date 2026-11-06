import { prisma } from "./prisma";

export const DEFAULT_SETTINGS: Record<string, unknown> = {
  store: {
    name: "Apna Grocery Store",
    tagline: "Fresh groceries, delivered fast",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    currency: "INR",
    logoUrl: "",
  },
  businessHours: { open: "08:00", close: "21:00", days: "Mon-Sun" },
  delivery: { minOrderPaise: 0, defaultChargePaise: 0, freeThresholdPaise: null as number | null },
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
