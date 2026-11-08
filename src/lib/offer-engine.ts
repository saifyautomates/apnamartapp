import { StoreOffer } from "./offers";

export interface TargetableItem {
  id: string;
  productId?: string;
  slug?: string;
  categorySlug?: string;
  unitPricePaise: number;
  qty: number;
  name?: string;
}

export interface ProductOfferResult {
  hasOffer: boolean;
  offer: StoreOffer | null;
  originalPricePaise: number;
  finalPricePaise: number;
  savingsPaise: number;
  discountBadge: string | null;
  code: string | null;
}

export interface CartEvaluationResult {
  subtotalPaise: number;
  discountPaise: number;
  finalTotalPaise: number;
  appliedOffer: StoreOffer | null;
  freeDelivery: boolean;
  itemDiscounts: Record<string, number>; // itemId -> paise discount
  message: string | null;
}

/**
 * Checks if a product matches an offer's targeting criteria
 */
export function isOfferEligibleForProduct(
  offer: StoreOffer,
  product: { id?: string; slug?: string; categorySlug?: string }
): boolean {
  if (!offer.isActive) return false;
  const now = new Date();
  if (offer.startsAt && new Date(offer.startsAt) > now) return false;
  if (offer.endsAt && new Date(offer.endsAt) < now) return false;

  const targetType = offer.targetType || "ALL";

  if (targetType === "ALL") {
    return true;
  }

  if (targetType === "SPECIFIC_PRODUCTS" && offer.targetProductIds && offer.targetProductIds.length > 0) {
    const targets = offer.targetProductIds.map((t) => t.trim().toLowerCase());
    const prodId = product.id?.trim().toLowerCase();
    const prodSlug = product.slug?.trim().toLowerCase();
    return Boolean((prodId && targets.includes(prodId)) || (prodSlug && targets.includes(prodSlug)));
  }

  if (targetType === "SPECIFIC_CATEGORIES" && offer.targetCategorySlugs && offer.targetCategorySlugs.length > 0) {
    const targets = offer.targetCategorySlugs.map((t) => t.trim().toLowerCase());
    const catSlug = product.categorySlug?.trim().toLowerCase();
    return Boolean(catSlug && targets.includes(catSlug));
  }

  return false;
}

/**
 * Evaluates live offers for a single product / variant.
 * Used on Storefront Product Cards, Carousel, and Product Details.
 */
export function evaluateProductOffer(
  product: { id?: string; slug?: string; categorySlug?: string; pricePaise: number },
  offers: StoreOffer[]
): ProductOfferResult {
  const original = product.pricePaise;
  let bestOffer: StoreOffer | null = null;
  let maxSavings = 0;

  for (const offer of offers) {
    if (!isOfferEligibleForProduct(offer, product)) continue;

    const isTargeted = offer.targetType === "SPECIFIC_PRODUCTS" || offer.targetType === "SPECIFIC_CATEGORIES";
    // General ALL cart coupons only apply on a single card if minOrderValue is 0 or product price meets minOrderValue
    if (!isTargeted && (offer.minOrderValue || 0) > 0 && original < (offer.minOrderValue * 100)) {
      continue;
    }

    // Calculate saving on this single product unit
    let saving = 0;
    if (offer.type === "FLAT") {
      saving = Math.min(Math.round(Number(offer.discountValue) * 100), original);
    } else if (offer.type === "PERCENT") {
      const raw = Math.round((original * Number(offer.discountValue)) / 100);
      const cap = offer.maxDiscountValue ? Math.round(Number(offer.maxDiscountValue) * 100) : raw;
      saving = Math.min(raw, cap, original);
    }

    if (saving > maxSavings) {
      maxSavings = saving;
      bestOffer = offer;
    }
  }

  if (bestOffer && maxSavings > 0) {
    const finalPrice = Math.max(0, original - maxSavings);
    const badge =
      bestOffer.type === "PERCENT"
        ? `${bestOffer.discountValue}% OFF`
        : `₹${bestOffer.discountValue} OFF`;

    return {
      hasOffer: true,
      offer: bestOffer,
      originalPricePaise: original,
      finalPricePaise: finalPrice,
      savingsPaise: maxSavings,
      discountBadge: badge,
      code: bestOffer.code,
    };
  }

  return {
    hasOffer: false,
    offer: null,
    originalPricePaise: original,
    finalPricePaise: original,
    savingsPaise: 0,
    discountBadge: null,
    code: null,
  };
}

/**
 * Evaluates cart lines against active offers or an entered promo code.
 * Used in Cart Drawer, Checkout, and Busy POS Billing.
 */
export function evaluateCartOffers(
  lines: TargetableItem[],
  subtotalPaise: number,
  appliedCode: string | null | undefined,
  offers: StoreOffer[]
): CartEvaluationResult {
  const upperCode = appliedCode?.trim().toUpperCase();

  // Find candidate offer: either by explicitly entered code, or auto-apply candidate
  let candidateOffer: StoreOffer | null = null;

  if (upperCode) {
    candidateOffer = offers.find((o) => o.isActive && o.code.trim().toUpperCase() === upperCode) || null;
  }

  // If no user code, check auto-apply offers with highest discount
  if (!candidateOffer) {
    const autoOffers = offers.filter((o) => o.isActive && o.autoApply);
    for (const auto of autoOffers) {
      const minOrderPaise = Math.round(Number(auto.minOrderValue) * 100);
      if (subtotalPaise >= minOrderPaise) {
        if (!candidateOffer || auto.discountValue > candidateOffer.discountValue) {
          candidateOffer = auto;
        }
      }
    }
  }

  if (!candidateOffer) {
    return {
      subtotalPaise,
      discountPaise: 0,
      finalTotalPaise: subtotalPaise,
      appliedOffer: null,
      freeDelivery: false,
      itemDiscounts: {},
      message: null,
    };
  }

  const minOrderPaise = Math.round(Number(candidateOffer.minOrderValue) * 100);
  if (subtotalPaise < minOrderPaise) {
    return {
      subtotalPaise,
      discountPaise: 0,
      finalTotalPaise: subtotalPaise,
      appliedOffer: null,
      freeDelivery: false,
      itemDiscounts: {},
      message: `Minimum order value ₹${candidateOffer.minOrderValue} required for ${candidateOffer.code}`,
    };
  }

  // Determine eligible items
  const targetType = candidateOffer.targetType || "ALL";
  let eligibleSubtotal = 0;
  const eligibleLines: TargetableItem[] = [];

  for (const line of lines) {
    if (isOfferEligibleForProduct(candidateOffer, { id: line.productId, slug: line.slug, categorySlug: line.categorySlug })) {
      eligibleLines.push(line);
      eligibleSubtotal += line.unitPricePaise * line.qty;
    }
  }

  if (targetType !== "ALL" && eligibleLines.length === 0) {
    return {
      subtotalPaise,
      discountPaise: 0,
      finalTotalPaise: subtotalPaise,
      appliedOffer: null,
      freeDelivery: false,
      itemDiscounts: {},
      message: `Offer ${candidateOffer.code} is valid only on selected items.`,
    };
  }

  const calculationBase = targetType === "ALL" ? subtotalPaise : eligibleSubtotal;
  let totalDiscount = 0;
  let isFreeDel = false;
  const itemDiscounts: Record<string, number> = {};

  if (candidateOffer.type === "FLAT") {
    totalDiscount = Math.min(Math.round(Number(candidateOffer.discountValue) * 100), calculationBase);
  } else if (candidateOffer.type === "PERCENT") {
    const raw = Math.round((calculationBase * Number(candidateOffer.discountValue)) / 100);
    const cap = candidateOffer.maxDiscountValue ? Math.round(Number(candidateOffer.maxDiscountValue) * 100) : raw;
    totalDiscount = Math.min(raw, cap, calculationBase);
  } else if (candidateOffer.type === "FREE_DELIVERY") {
    isFreeDel = true;
    totalDiscount = Math.round(Number(candidateOffer.discountValue || 40) * 100);
  }

  // Distribute line-item discounts proportionally for audit and receipt transparency
  if (totalDiscount > 0 && eligibleSubtotal > 0) {
    let allocated = 0;
    eligibleLines.forEach((line, idx) => {
      const lineTotal = line.unitPricePaise * line.qty;
      const share =
        idx === eligibleLines.length - 1
          ? totalDiscount - allocated
          : Math.round((lineTotal / eligibleSubtotal) * totalDiscount);
      itemDiscounts[line.id] = share;
      allocated += share;
    });
  }

  return {
    subtotalPaise,
    discountPaise: totalDiscount,
    finalTotalPaise: Math.max(0, subtotalPaise - totalDiscount),
    appliedOffer: candidateOffer,
    freeDelivery: isFreeDel,
    itemDiscounts,
    message: `Offer ${candidateOffer.code} applied! Saved ₹${(totalDiscount / 100).toFixed(2)}`,
  };
}
