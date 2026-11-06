import type { OrderStatus, PaymentMethod, PaymentStatus, RoleName } from "@prisma/client";

/**
 * Platform User & Session Types
 */
export interface UserSession {
  kind: "CUSTOMER" | "ADMIN";
  userId?: string;
  adminId?: string;
  roles?: string[];
  permissions?: string[];
}

/**
 * Product & Variant Types
 */
export interface FMCGProduct {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  categoryId: string;
  brandId?: string | null;
  isActive: boolean;
  onlineVisible: boolean;
}

export interface FMCGVariant {
  id: string;
  productId: string;
  sku: string;
  name?: string | null;
  packSize?: string | null;
  mrpPaise: number;
  sellingPaise: number;
}

/**
 * Cart & Line Item Types
 */
export interface CartItemSummary {
  variantId: string;
  quantity: number;
  unitPricePaise: number;
  totalPaise: number;
}

export interface CartSummary {
  itemCount: number;
  subtotalPaise: number;
  discountPaise: number;
  deliveryChargePaise: number;
  finalPaise: number;
}

/**
 * Order & Checkout Types
 */
export interface OrderPayload {
  addressId?: string;
  deliverySlotId?: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  useLoyaltyPoints?: number;
  useStoreCreditPaise?: number;
}

export interface OrderSummary {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalPaise: number;
  createdAt: string;
}

/**
 * Category Navigation
 */
export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
  sortOrder: number;
}

