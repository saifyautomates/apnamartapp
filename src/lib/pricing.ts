import { prisma } from "./prisma";
import { assertNonNegativePaise, discountPercent } from "./money";
import { badRequest } from "./errors";
import type { Prisma, PriceSource } from "@prisma/client";

export type VariantPriceRow = {
  id: string;
  mrpPaise: number;
  sellingPaise: number;
  onlinePricePaise: number | null;
  priceSource: PriceSource;
};

/** Single source of truth for "what does the customer pay". */
export function getEffectivePricePaise(v: VariantPriceRow): number {
  if (v.priceSource === "CUSTOM" && v.onlinePricePaise != null) return v.onlinePricePaise;
  return v.sellingPaise;
}

/** Alias used by storefront pages. */
export const effectivePrice = getEffectivePricePaise;
export { discountPercent } from "./money";

export function getDiscountInfo(mrpPaise: number, effectivePaise: number) {
  return {
    mrpPaise,
    sellingPaise: effectivePaise,
    discountPaise: Math.max(0, mrpPaise - effectivePaise),
    discountPercent: discountPercent(mrpPaise, effectivePaise),
  };
}

export async function changePrice(
  tx: Prisma.TransactionClient,
  variantId: string,
  input: { mrpPaise: number; sellingPaise: number; onlinePricePaise?: number | null; priceSource: PriceSource },
  changedById: string | null,
  reason?: string,
) {
  assertNonNegativePaise(input.mrpPaise, "mrpPaise");
  assertNonNegativePaise(input.sellingPaise, "sellingPaise");
  if (input.sellingPaise > input.mrpPaise) throw badRequest("Selling price cannot exceed MRP");
  if (input.onlinePricePaise != null) {
    assertNonNegativePaise(input.onlinePricePaise, "onlinePricePaise");
    if (input.onlinePricePaise > input.mrpPaise) throw badRequest("Online price cannot exceed MRP");
  }
  const updated = await tx.productVariant.update({
    where: { id: variantId },
    data: {
      mrpPaise: input.mrpPaise,
      sellingPaise: input.sellingPaise,
      onlinePricePaise: input.onlinePricePaise ?? null,
      priceSource: input.priceSource,
    },
  });
  await tx.price.upsert({
    where: { variantId },
    create: {
      variantId,
      mrpPaise: input.mrpPaise,
      sellingPaise: input.sellingPaise,
      onlinePricePaise: input.onlinePricePaise ?? null,
      priceSource: input.priceSource,
    },
    update: {
      mrpPaise: input.mrpPaise,
      sellingPaise: input.sellingPaise,
      onlinePricePaise: input.onlinePricePaise ?? null,
      priceSource: input.priceSource,
    },
  });
  await tx.priceHistory.create({
    data: {
      variantId,
      mrpPaise: input.mrpPaise,
      sellingPaise: input.sellingPaise,
      onlinePricePaise: input.onlinePricePaise ?? null,
      priceSource: input.priceSource,
      changedById,
      reason,
    },
  });
  return updated;
}

export async function getVariantWithInventory(variantId: string) {
  return prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { inventory: true, product: { include: { category: true, brand: true } } },
  });
}
