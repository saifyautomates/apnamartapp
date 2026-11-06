import { badRequest } from "./errors";
import type { Prisma } from "@prisma/client";

export type CartLineInput = {
  variantId: string;
  qty: number;
  unitPricePaise: number;
  mrpPaise: number;
  productId: string;
  categoryId: string;
};

type Db = Prisma.TransactionClient | typeof import("./prisma").prisma;

/**
 * Server-side coupon validation. Never trust a discount computed by the client.
 * Runs inside the checkout transaction when a tx client is passed, so usage
 * limits cannot be raced. Cancelled / failed orders do NOT consume usage.
 * Returns the discount in paise (0 if the coupon does not apply).
 */
export async function validateCoupon(
  db: Db,
  code: string,
  userId: string,
  lines: CartLineInput[],
  subtotalPaise: number,
): Promise<{ couponId: string; discountPaise: number }> {
  const coupon = await db.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { rules: true },
  });
  if (!coupon || !coupon.isActive) throw badRequest("Invalid coupon code");
  const now = new Date();
  if (coupon.startsAt > now) throw badRequest("Coupon is not active yet");
  if (coupon.endsAt && coupon.endsAt < now) throw badRequest("Coupon has expired");
  if (subtotalPaise < coupon.minOrderPaise) {
    throw badRequest(`Minimum order for this coupon is ₹${(coupon.minOrderPaise / 100).toFixed(0)}`);
  }
  const validUsageWhere: Prisma.CouponUsageWhereInput = {
    couponId: coupon.id,
    order: { status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] } },
  };
  if (coupon.usageLimit != null) {
    const used = await db.couponUsage.count({ where: validUsageWhere });
    if (used >= coupon.usageLimit) throw badRequest("Coupon usage limit reached");
  }
  if (coupon.perUserLimit != null) {
    const mine = await db.couponUsage.count({ where: { ...validUsageWhere, userId } });
    if (mine >= coupon.perUserLimit) throw badRequest("You have already used this coupon");
  }
  if (coupon.firstOrderOnly) {
    const prior = await db.order.count({
      where: { userId, status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] } },
    });
    if (prior > 0) throw badRequest("This coupon is for first orders only");
  }

  // Eligible subtotal: if rules exist, only matching lines count.
  let eligiblePaise = subtotalPaise;
  if (coupon.rules.length > 0) {
    eligiblePaise = 0;
    for (const line of lines) {
      const matches = coupon.rules.some((r) => {
        if (r.ruleType === "PRODUCT" && r.productId === line.productId) return true;
        if (r.ruleType === "CATEGORY" && r.categoryId === line.categoryId) return true;
        if (r.ruleType === "CUSTOMER" && r.customerId === userId) return true;
        return false;
      });
      if (matches) eligiblePaise += line.unitPricePaise * line.qty;
    }
    if (eligiblePaise <= 0) throw badRequest("Coupon does not apply to items in your cart");
  }

  let discount = 0;
  if (coupon.type === "PERCENT") {
    discount = Math.round((eligiblePaise * (coupon.discountPercent ?? 0)) / 100);
  } else {
    discount = coupon.discountPaise ?? 0;
  }
  if (coupon.maxDiscountPaise != null) discount = Math.min(discount, coupon.maxDiscountPaise);
  discount = Math.min(discount, eligiblePaise);
  return { couponId: coupon.id, discountPaise: discount };
}
