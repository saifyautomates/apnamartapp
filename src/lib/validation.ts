import { z } from "zod";

export const phoneSchema = z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");
export const otpRequestSchema = z.object({ phone: phoneSchema });
export const otpVerifySchema = z.object({ phone: phoneSchema, code: z.string().regex(/^\d{6}$/, "OTP must be 6 digits") });
export const adminLoginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

export const addressSchema = z.object({
  label: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  phone: phoneSchema,
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/, "PIN code must be 6 digits"),
  isDefault: z.boolean().optional(),
});

export const cartAddSchema = z.object({ variantId: z.string().min(1), qty: z.number().int().min(1).max(100) });
export const cartQtySchema = z.object({ variantId: z.string().min(1), qty: z.number().int().min(0).max(100) });

export const checkoutSchema = z.object({
  addressId: z.string().optional(),
  deliveryMethod: z.enum(["DELIVERY", "PICKUP"]),
  deliverySlotId: z.string().optional(),
  paymentMethod: z.enum(["COD", "UPI", "ONLINE"]),
  couponCode: z.string().max(50).optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
  storeCreditPaise: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().max(100).optional(),
});

export const productUpsertSchema = z.object({
  name: z.string().min(1).max(200),
  shortName: z.string().max(100).optional(),
  sku: z.string().min(1).max(100),
  barcode: z.string().max(50).optional(),
  brandId: z.string().optional(),
  categoryId: z.string().min(1),
  subcategoryId: z.string().optional(),
  description: z.string().max(5000).optional(),
  hsnSac: z.string().max(20).optional(),
  gstBps: z.number().int().min(0).max(4000),
  unit: z.string().max(20).optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  onlineVisible: z.boolean().optional(),
  deliveryEligible: z.boolean().optional(),
  variants: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(100),
    sku: z.string().min(1).max(100),
    barcode: z.string().max(50).optional(),
    mrpPaise: z.number().int().min(0),
    sellingPaise: z.number().int().min(0),
    onlinePricePaise: z.number().int().min(0).optional(),
    priceSource: z.enum(["SOURCE", "CUSTOM"]).optional(),
    packSize: z.string().max(50).optional(),
    maxOrderQty: z.number().int().min(1).max(500).optional(),
    isActive: z.boolean().optional(),
  })).min(1),
});

export const categoryUpsertSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
  isVisible: z.boolean().optional(),
});

export const couponUpsertSchema = z.object({
  code: z.string().min(1).max(50),
  type: z.enum(["PERCENT", "FLAT"]),
  discountPercent: z.number().int().min(1).max(100).optional(),
  discountPaise: z.number().int().min(0).optional(),
  minOrderPaise: z.number().int().min(0).optional(),
  maxDiscountPaise: z.number().int().min(0).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  usageLimit: z.number().int().min(1).optional(),
  perUserLimit: z.number().int().min(1).optional(),
  firstOrderOnly: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const inventoryAdjustSchema = z.object({
  variantId: z.string().min(1),
  delta: z.number().int().refine((v) => v !== 0, "Delta cannot be zero"),
  reason: z.string().min(1).max(300),
});

export const orderTransitionSchema = z.object({
  to: z.enum(["CONFIRMED", "PREPARING", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
  note: z.string().max(500).optional(),
});

export const refundSchema = z.object({
  amountPaise: z.number().int().min(1),
  reason: z.string().min(1).max(300),
});

export const adminUserCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100),
  roles: z.array(z.enum(["OWNER", "MANAGER", "ORDER_STAFF", "INVENTORY_STAFF", "DELIVERY_STAFF"])).min(1),
});

export const zoneUpsertSchema = z.object({
  name: z.string().min(1).max(100),
  pincodes: z.array(z.string().regex(/^\d{6}$/)).min(1),
  minOrderPaise: z.number().int().min(0),
  deliveryChargePaise: z.number().int().min(0),
  freeThresholdPaise: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const slotUpsertSchema = z.object({
  zoneId: z.string().optional(),
  label: z.string().min(1).max(100),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  maxOrdersPerDay: z.number().int().min(1).max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const creditAdjustSchema = z.object({
  userId: z.string().min(1),
  amountPaise: z.number().int().refine((v) => v !== 0, "Amount cannot be zero"),
  reason: z.string().min(1).max(300),
});

export const settingsSchema = z.record(z.unknown());
