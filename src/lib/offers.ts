import { prisma, withDbTimeout } from "./prisma";
import { cachedJson } from "./cache";

export interface StoreOffer {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  code: string;
  type: "FLAT" | "PERCENT" | "FREE_DELIVERY";
  discountValue: number; // ₹ amount or %
  minOrderValue: number; // ₹ amount, e.g. 1000
  maxDiscountValue?: number; // ₹ amount cap for %
  startsAt: string;
  endsAt: string; // ISO string used for live countdown timer
  isActive: boolean;
  autoApply: boolean;
  bgGradient: string;
  createdAt: string;

  // Targeted Scope (Admin Product / Category Filtering)
  targetType?: "ALL" | "SPECIFIC_PRODUCTS" | "SPECIFIC_CATEGORIES";
  targetProductIds?: string[];
  targetCategorySlugs?: string[];
}

export const DEFAULT_STORE_OFFERS: StoreOffer[] = [
  {
    id: "offer-mega-100-over-1000",
    title: "Flat ₹100 OFF on orders over ₹1,000",
    subtitle: "Special darkstore delivery saving on all groceries & essentials",
    badgeText: "⚡ FLASH SALE",
    code: "SAVE100",
    type: "FLAT",
    discountValue: 100,
    minOrderValue: 1000,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(), // 6 hours from now
    isActive: true,
    autoApply: false,
    bgGradient: "from-[#b91c1c] via-[#c2410c] to-[#d97706]",
    createdAt: new Date().toISOString(),
  },
  {
    id: "offer-daily-50-over-499",
    title: "Flat ₹50 OFF on orders over ₹499",
    subtitle: "Kota daily essentials express doorstep delivery",
    badgeText: "🔥 DAILY SAVER",
    code: "KOTA50",
    type: "FLAT",
    discountValue: 50,
    minOrderValue: 499,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(), // 12 hours from now
    isActive: true,
    autoApply: false,
    bgGradient: "from-[#0a6833] via-[#0c831f] to-[#15803d]",
    createdAt: new Date().toISOString(),
  },
  {
    id: "offer-free-delivery-over-299",
    title: "FREE Express Delivery on orders over ₹299",
    subtitle: "No delivery charges across Kota darkstore network",
    badgeText: "🚚 FREE DELIVERY",
    code: "FREEDEL",
    type: "FREE_DELIVERY",
    discountValue: 40,
    minOrderValue: 299,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), // 24 hours from now
    isActive: true,
    autoApply: true,
    bgGradient: "from-[#0284c7] via-[#0369a1] to-[#075985]",
    createdAt: new Date().toISOString(),
  },
];

let memoryOffers: StoreOffer[] = [...DEFAULT_STORE_OFFERS];

/**
 * Syncs an offer to the Coupon table in Prisma so standard checkout validations
 * and order discounts are also recognized at the SQL database transaction level.
 */
async function syncOfferToCoupon(offer: StoreOffer): Promise<void> {
  if (!offer.code) return;
  const upperCode = offer.code.trim().toUpperCase();
  try {
    const couponType = offer.type === "PERCENT" ? "PERCENT" : "FLAT";
    const discountPaise =
      offer.type === "FREE_DELIVERY"
        ? Math.round(Number(offer.discountValue || 40) * 100)
        : offer.type === "FLAT"
          ? Math.round(Number(offer.discountValue) * 100)
          : null;
    const discountPercent = offer.type === "PERCENT" ? Math.round(Number(offer.discountValue)) : null;
    const minOrderPaise = Math.round(Number(offer.minOrderValue) * 100);
    const maxDiscountPaise = offer.maxDiscountValue ? Math.round(Number(offer.maxDiscountValue) * 100) : null;
    const startsAt = new Date(offer.startsAt);
    const endsAt = offer.endsAt ? new Date(offer.endsAt) : null;

    await withDbTimeout(
      prisma.coupon.upsert({
        where: { code: upperCode },
        create: {
          code: upperCode,
          type: couponType,
          discountPaise,
          discountPercent,
          minOrderPaise,
          maxDiscountPaise,
          startsAt,
          endsAt,
          isActive: offer.isActive,
          usageLimit: 10000,
          perUserLimit: 5,
        },
        update: {
          type: couponType,
          discountPaise,
          discountPercent,
          minOrderPaise,
          maxDiscountPaise,
          startsAt,
          endsAt,
          isActive: offer.isActive,
        },
      }),
      350
    );
  } catch (err) {
    // If DB is offline, continue gracefully
  }
}

/**
 * Fetch active store offers for customer storefront (cached for 15s).
 * Filters only currently active offers whose countdown timer hasn't expired.
 */
export async function getStoreOffers(): Promise<StoreOffer[]> {
  try {
    return await cachedJson("home_store_offers_v3", 15, async () => {
      try {
        const row = await withDbTimeout(prisma.setting.findUnique({ where: { key: "store_offers" } }), 200);
        if (row?.value && Array.isArray(row.value) && row.value.length > 0) {
          memoryOffers = row.value as unknown as StoreOffer[];
        }
      } catch {
        /* fallback */
      }
      const now = new Date();
      return memoryOffers.filter((o) => {
        if (!o.isActive) return false;
        if (o.startsAt && new Date(o.startsAt) > now) return false;
        if (o.endsAt && new Date(o.endsAt) < now) return false;
        return true;
      });
    });
  } catch {
    const now = new Date();
    return memoryOffers.filter((o) => {
      if (!o.isActive) return false;
      if (o.startsAt && new Date(o.startsAt) > now) return false;
      if (o.endsAt && new Date(o.endsAt) < now) return false;
      return true;
    });
  }
}

/**
 * Fetch all offers for Admin panel management (including paused and expired).
 */
export async function getAllStoreOffers(): Promise<StoreOffer[]> {
  try {
    const row = await withDbTimeout(prisma.setting.findUnique({ where: { key: "store_offers" } }), 250);
    if (row?.value && Array.isArray(row.value) && row.value.length > 0) {
      memoryOffers = row.value as unknown as StoreOffer[];
    }
  } catch {
    /* fallback */
  }
  return memoryOffers;
}

/**
 * Save / Create / Update a store offer from Admin panel.
 */
export async function saveStoreOffer(offer: StoreOffer): Promise<StoreOffer[]> {
  const existingIdx = memoryOffers.findIndex((o) => o.id === offer.id || o.code === offer.code);
  if (existingIdx >= 0) {
    memoryOffers[existingIdx] = { ...offer, createdAt: memoryOffers[existingIdx].createdAt };
  } else {
    memoryOffers.unshift(offer);
  }

  // Persist to Prisma settings
  try {
    await withDbTimeout(
      prisma.setting.upsert({
        where: { key: "store_offers" },
        create: { key: "store_offers", value: JSON.parse(JSON.stringify(memoryOffers)) },
        update: { value: JSON.parse(JSON.stringify(memoryOffers)) },
      }),
      400
    );
  } catch {
    /* local memory updated */
  }

  // Sync to coupon
  await syncOfferToCoupon(offer);
  return memoryOffers;
}

/**
 * Toggle active state of an offer from Admin panel.
 */
export async function toggleStoreOffer(id: string, isActive: boolean): Promise<StoreOffer | null> {
  const target = memoryOffers.find((o) => o.id === id);
  if (!target) return null;
  target.isActive = isActive;

  try {
    await withDbTimeout(
      prisma.setting.upsert({
        where: { key: "store_offers" },
        create: { key: "store_offers", value: JSON.parse(JSON.stringify(memoryOffers)) },
        update: { value: JSON.parse(JSON.stringify(memoryOffers)) },
      }),
      400
    );
  } catch {
    /* memory updated */
  }

  await syncOfferToCoupon(target);
  return target;
}

/**
 * Delete an offer from Admin panel.
 */
export async function deleteStoreOffer(id: string): Promise<boolean> {
  const target = memoryOffers.find((o) => o.id === id);
  memoryOffers = memoryOffers.filter((o) => o.id !== id);

  try {
    await withDbTimeout(
      prisma.setting.upsert({
        where: { key: "store_offers" },
        create: { key: "store_offers", value: JSON.parse(JSON.stringify(memoryOffers)) },
        update: { value: JSON.parse(JSON.stringify(memoryOffers)) },
      }),
      400
    );
    if (target?.code) {
      await withDbTimeout(
        prisma.coupon.updateMany({
          where: { code: target.code.trim().toUpperCase() },
          data: { isActive: false },
        }),
        300
      );
    }
  } catch {
    /* memory updated */
  }

  return true;
}

/**
 * Calculate the discount amount in paise for a given cart subtotal and offer.
 */
export function calculateOfferDiscount(subtotalPaise: number, offer: StoreOffer): number {
  const minPaise = Math.round(Number(offer.minOrderValue) * 100);
  if (subtotalPaise < minPaise) return 0;

  if (offer.type === "FLAT") {
    const flatPaise = Math.round(Number(offer.discountValue) * 100);
    return Math.min(flatPaise, subtotalPaise);
  }

  if (offer.type === "PERCENT") {
    const rawDiscount = Math.round((subtotalPaise * Number(offer.discountValue)) / 100);
    if (offer.maxDiscountValue) {
      const maxPaise = Math.round(Number(offer.maxDiscountValue) * 100);
      return Math.min(rawDiscount, maxPaise, subtotalPaise);
    }
    return Math.min(rawDiscount, subtotalPaise);
  }

  if (offer.type === "FREE_DELIVERY") {
    // Delivery fee discount in paise (typically ₹40)
    return Math.min(Math.round(Number(offer.discountValue || 40) * 100), subtotalPaise);
  }

  return 0;
}

