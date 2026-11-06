import { prisma } from "./prisma";
import { badRequest, conflict, notFound } from "./errors";
import { getEffectivePricePaise } from "./pricing";
import { reserveStock, releaseReservation, consumeReservation, expireReservations } from "./inventory";
import { validateCoupon } from "./coupons";
import { redeemLoyalty, refundLoyalty, earnLoyalty } from "./loyalty";
import { redeemCredit, reverseCredit } from "./credit";
import { getPaymentProvider } from "./payments";
import { getSetting } from "./settings";
import { notifyOrderEvent } from "./notify";
import { auditLog } from "./audit";
import type { ActorType, OrderStatus, Prisma } from "@prisma/client";

// Prices in India are tax-inclusive (MRP includes GST). taxPaise on an order
// is therefore the GST COMPONENT embedded in the price, shown for transparency
// ("incl. GST"), and is NOT added on top of the grand total:
//   grandTotal = subtotal - couponDiscount - loyaltyDiscount + delivery - creditUsed

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PLACED", "PAYMENT_FAILED", "CANCELLED"],
  PAYMENT_FAILED: ["PENDING_PAYMENT", "CANCELLED"],
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["PACKED", "CANCELLED"],
  PACKED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["REFUND_PENDING"],
  CANCELLED: [],
  REFUND_PENDING: ["REFUNDED"],
  REFUNDED: [],
};

export const CUSTOMER_TIMELINE = ["PLACED", "CONFIRMED", "PREPARING", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

function orderNumberFor(date: Date, seq: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `ORD-${y}${m}${d}-${String(seq).padStart(4, "0")}`;
}

async function nextOrderNumber(): Promise<string> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const count = await prisma.order.count({ where: { createdAt: { gte: start } } });
  return orderNumberFor(new Date(), count + 1);
}

/** Fulfilment transitions (admin). PACKED consumes reservations; DELIVERED earns loyalty + captures COD. */
export async function transitionOrder(orderId: string, to: OrderStatus, actorId: string | null, note?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw notFound("Order not found");
    const allowed = ORDER_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(to)) {
      throw conflict(`Invalid transition: ${order.status} → ${to}`);
    }
    const updated = await tx.order.update({ where: { id: orderId }, data: { status: to } });
    await tx.orderStatusHistory.create({
      data: { orderId, fromStatus: order.status, toStatus: to, changedById: actorId, note },
    });
    if (to === "PACKED") {
      const reservations = await tx.stockReservation.findMany({ where: { orderId, status: "ACTIVE" } });
      for (const r of reservations) {
        await consumeReservation(tx, r.id);
      }
      await tx.delivery.upsert({
        where: { orderId },
        create: { orderId, status: "PACKED" },
        update: { status: "PACKED" },
      });
    }
    if (to === "OUT_FOR_DELIVERY") {
      await tx.delivery.upsert({
        where: { orderId },
        create: { orderId, status: "OUT_FOR_DELIVERY" },
        update: { status: "OUT_FOR_DELIVERY" },
      });
    }
    if (to === "DELIVERED") {
      await tx.delivery.upsert({
        where: { orderId },
        create: { orderId, status: "DELIVERED", deliveredAt: new Date() },
        update: { status: "DELIVERED", deliveredAt: new Date() },
      });
      if (order.paymentMethod === "COD") {
        await tx.payment.updateMany({ where: { orderId }, data: { status: "CAPTURED" } });
        await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "CAPTURED" } });
      }
      const earned = await earnLoyalty(tx, order.userId, orderId, order.grandTotalPaise);
      if (earned > 0) {
        await tx.order.update({ where: { id: orderId }, data: { loyaltyEarnedPoints: earned } });
      }
    }
    return updated;
  });
}

const CANCELLABLE: OrderStatus[] = ["PENDING_PAYMENT", "PAYMENT_FAILED", "PLACED", "CONFIRMED", "PREPARING"];

/** Cancel an order: releases reservations, returns loyalty + credit. Paid orders go to REFUND_PENDING.
 * Audited inside the same transaction (ORDER_CANCEL). NOTE: AuditLog.actorId
 * has a FK to AdminUser, so CUSTOMER cancels record actorId=null and carry
 * the customer id in `after` instead — otherwise the cancel itself would fail. */
export async function cancelOrder(orderId: string, actorId: string | null, reason: string, actorType: "ADMIN" | "CUSTOMER", opts?: { ip?: string | null }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { payments: true } });
    if (!order) throw notFound("Order not found");
    if (!CANCELLABLE.includes(order.status)) {
      throw conflict(`Order in ${order.status} cannot be cancelled`);
    }
    const reservations = await tx.stockReservation.findMany({ where: { orderId, status: "ACTIVE" } });
    for (const r of reservations) {
      await releaseReservation(tx, r.id, `Order cancelled (${actorType})`);
    }
    if (order.loyaltyRedeemedPoints > 0) {
      await refundLoyalty(tx, order.userId, order.loyaltyRedeemedPoints, orderId);
    }
    if (order.storeCreditUsedPaise > 0) {
      await reverseCredit(tx, order.userId, order.storeCreditUsedPaise, "Order cancelled", orderId);
    }
    const paid = order.payments.some((p) => p.status === "CAPTURED");
    const to: OrderStatus = paid ? "REFUND_PENDING" : "CANCELLED";
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: to, cancelledReason: reason },
    });
    await tx.orderStatusHistory.create({
      data: { orderId, fromStatus: order.status, toStatus: to, changedById: actorId, note: reason },
    });
    await auditLog(tx, {
      actorType: actorType as ActorType,
      actorId: actorType === "ADMIN" ? actorId : null,
      action: "ORDER_CANCEL",
      entityType: "Order",
      entityId: orderId,
      before: { status: order.status, paymentStatus: order.paymentStatus },
      after: {
        status: to,
        paymentStatus: order.paymentStatus,
        cancelledReason: reason,
        cancelledBy: actorType,
        ...(actorType === "CUSTOMER" ? { cancelledByUserId: actorId } : {}),
      },
      ip: opts?.ip ?? null,
    });
    return updated;
  });
}

/** Process a refund (admin). Full refund of a REFUND_PENDING order moves it to REFUNDED.
 * Audited inside the same transaction (ORDER_REFUND) so a completed refund
 * can never exist without its audit entry. */
export async function processRefund(orderId: string, amountPaise: number, reason: string, adminId: string, opts?: { ip?: string | null }) {
  if (amountPaise <= 0) throw badRequest("Refund amount must be positive");
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payments: true, refunds: true } });
  if (!order) throw notFound("Order not found");
  if (order.status !== "REFUND_PENDING" && order.status !== "DELIVERED") {
    throw conflict(`Refunds are not allowed from ${order.status}`);
  }
  const paid = order.payments.filter((p) => p.status === "CAPTURED").reduce((s, p) => s + p.amountPaise, 0);
  const already = order.refunds.filter((r) => r.status === "COMPLETED").reduce((s, r) => s + r.amountPaise, 0);
  if (amountPaise > paid - already) throw badRequest("Refund exceeds refundable amount");
  const payment = order.payments.find((p) => p.status === "CAPTURED") ?? order.payments[0];
  if (!payment) throw badRequest("No captured payment to refund against");
  const provider = await getPaymentProvider(order.paymentMethod);
  const result = await provider.refundPayment(payment.providerPaymentId ?? payment.id, amountPaise);
  if (!result.ok) throw badRequest("Payment provider refund failed");
  return prisma.$transaction(async (tx) => {
    await tx.refund.create({
      data: { paymentId: payment.id, orderId, amountPaise, reason, status: "COMPLETED", adminId },
    });
    const totalRefunded = already + amountPaise;
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: totalRefunded >= paid ? "REFUNDED" : "PARTIALLY_REFUNDED" },
    });
    if (order.status === "REFUND_PENDING" && totalRefunded >= paid) {
      await tx.order.update({ where: { id: orderId }, data: { status: "REFUNDED", paymentStatus: "REFUNDED" } });
      await tx.orderStatusHistory.create({ data: { orderId, fromStatus: "REFUND_PENDING", toStatus: "REFUNDED", changedById: adminId, note: reason } });
    }
    const finalOrder = await tx.order.findUnique({ where: { id: orderId } });
    await auditLog(tx, {
      actorType: "ADMIN",
      actorId: adminId,
      action: "ORDER_REFUND",
      entityType: "Order",
      entityId: orderId,
      before: { status: order.status, paymentStatus: order.paymentStatus, refundedPaise: already },
      after: {
        status: finalOrder?.status ?? order.status,
        paymentStatus: finalOrder?.paymentStatus ?? order.paymentStatus,
        refundAmountPaise: amountPaise,
        totalRefundedPaise: totalRefunded,
        reason,
      },
      ip: opts?.ip ?? null,
    });
    return finalOrder;
  });
}

export type CheckoutInput = {
  userId: string;
  addressId?: string;
  deliveryMethod: "DELIVERY" | "PICKUP";
  deliverySlotId?: string;
  paymentMethod: "COD" | "UPI" | "ONLINE";
  couponCode?: string;
  loyaltyPoints?: number;
  storeCreditPaise?: number;
  notes?: string;
  idempotencyKey?: string;
};

/**
 * Checkout: server-side repricing, inventory reservation, coupon/loyalty/credit,
 * all inside ONE transaction. Double-tap Place Order with the same idempotency
 * key returns the SAME order (never two orders). Provider creation happens
 * after the transaction; on provider failure the order is compensated.
 */
export async function checkout(input: CheckoutInput) {
  await expireReservations().catch(() => undefined);
  if (input.idempotencyKey) {
    const existing = await prisma.idempotencyKey.findUnique({ where: { key: input.idempotencyKey } });
    if (existing?.responseBody) {
      return existing.responseBody as unknown as { orderId: string; orderNumber: string };
    }
  }
  const reservationCfg = await getSetting<{ expiryMinutes?: number }>("reservations", { expiryMinutes: 30 });
  const reservationMinutes = reservationCfg.expiryMinutes ?? 30;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const orderNumber = await nextOrderNumber();
      const result = await prisma.$transaction(
        async (tx) => {
          const cart = await tx.cart.findFirst({
            where: { userId: input.userId, status: "ACTIVE" },
            include: {
              items: {
                include: {
                  variant: {
                    include: {
                      product: true,
                      inventory: true,
                    },
                  },
                },
              },
            },
          });
          if (!cart || cart.items.length === 0) throw badRequest("Cart is empty");

          // Validate + compute (prices are ALWAYS recomputed server-side).
          let subtotalPaise = 0;
          let taxPaise = 0;
          const lines: Array<{
            variantId: string; productId: string; categoryId: string; qty: number;
            unitPricePaise: number; mrpPaise: number; productName: string; variantName: string; gstBps: number;
          }> = [];
          for (const item of cart.items) {
            const v = item.variant;
            if (!v.isActive || !v.product.isActive || !v.product.onlineVisible) {
              throw badRequest(`"${v.product.name}" is no longer available`);
            }
            if (item.qty > v.maxOrderQty) throw badRequest(`Max ${v.maxOrderQty} units allowed for "${v.product.name}"`);
            // Row lock for the race-critical check.
            await tx.$queryRaw`SELECT id FROM "Inventory" WHERE "variantId" = ${v.id} FOR UPDATE`;
            const inv = await tx.inventory.findUnique({ where: { variantId: v.id } });
            const sellable = Math.max(0, (inv?.availableQty ?? 0) - (inv?.reservedQty ?? 0));
            if (sellable < item.qty) throw conflict(`"${v.product.name}" is out of stock (only ${sellable} left)`);
            const unit = getEffectivePricePaise(v);
            const lineTotal = unit * item.qty;
            subtotalPaise += lineTotal;
            // Tax-inclusive: GST component embedded in the price.
            taxPaise += lineTotal - Math.round(lineTotal / (1 + v.product.gstBps / 10000));
            lines.push({
              variantId: v.id,
              productId: v.product.id,
              categoryId: v.product.categoryId,
              qty: item.qty,
              unitPricePaise: unit,
              mrpPaise: v.mrpPaise,
              productName: v.product.name,
              variantName: v.name,
              gstBps: v.product.gstBps,
            });
          }

          // Delivery validation.
          let addressSnapshot: Record<string, unknown> | null = null;
          let deliveryChargePaise = 0;
          if (input.deliveryMethod === "DELIVERY") {
            if (!input.addressId) throw badRequest("Delivery address is required");
            const address = await tx.customerAddress.findFirst({ where: { id: input.addressId, userId: input.userId } });
            if (!address) throw badRequest("Address not found");
            addressSnapshot = {
              name: address.name, phone: address.phone, line1: address.line1, line2: address.line2,
              city: address.city, state: address.state, pincode: address.pincode,
            };
            const zone = await tx.deliveryZone.findFirst({
              where: { isActive: true, pincodes: { has: address.pincode } },
            });
            if (!zone) throw badRequest(`Delivery is not available for PIN ${address.pincode}`);
            if (subtotalPaise < zone.minOrderPaise) {
              throw badRequest(`Minimum order for this zone is ₹${(zone.minOrderPaise / 100).toFixed(0)}`);
            }
            deliveryChargePaise = zone.freeThresholdPaise != null && subtotalPaise >= zone.freeThresholdPaise ? 0 : zone.deliveryChargePaise;
            if (input.deliverySlotId) {
              const slot = await tx.deliverySlot.findUnique({ where: { id: input.deliverySlotId } });
              if (!slot || !slot.isActive) throw badRequest("Delivery slot is not available");
              const dayStart = new Date();
              dayStart.setHours(0, 0, 0, 0);
              const booked = await tx.order.count({
                where: { deliverySlotId: slot.id, createdAt: { gte: dayStart }, status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] } },
              });
              if (booked >= slot.maxOrdersPerDay) throw badRequest("Delivery slot is full");
            }
          }

          // Coupon (server-side, inside the transaction).
          let couponId: string | null = null;
          let couponDiscount = 0;
          if (input.couponCode) {
            const c = await validateCoupon(tx, input.couponCode, input.userId, lines, subtotalPaise);
            couponId = c.couponId;
            couponDiscount = c.discountPaise;
          }

          // Create the order (provisional totals; loyalty/credit applied below with the real order id).
          const order = await tx.order.create({
            data: {
              orderNumber,
              userId: input.userId,
              addressId: input.addressId ?? null,
              addressSnapshot: addressSnapshot ? JSON.parse(JSON.stringify(addressSnapshot)) : undefined,
              deliveryMethod: input.deliveryMethod,
              deliverySlotId: input.deliverySlotId ?? null,
              deliveryChargePaise,
              subtotalPaise,
              discountPaise: couponDiscount,
              taxPaise,
              grandTotalPaise: subtotalPaise - couponDiscount + deliveryChargePaise,
              savingsPaise: lines.reduce((s, l) => s + (l.mrpPaise - l.unitPricePaise) * l.qty, 0) + couponDiscount,
              couponId,
              couponCode: input.couponCode?.trim().toUpperCase() ?? null,
              paymentMethod: input.paymentMethod,
              paymentStatus: "PENDING",
              status: input.paymentMethod === "COD" ? "PLACED" : "PENDING_PAYMENT",
              notes: input.notes ?? null,
              idempotencyKey: input.idempotencyKey ?? null,
            },
          });
          for (const line of lines) {
            const lineTotal = line.unitPricePaise * line.qty;
            const lineTax = lineTotal - Math.round(lineTotal / (1 + line.gstBps / 10000));
            await tx.orderItem.create({
              data: {
                orderId: order.id,
                variantId: line.variantId,
                productName: line.productName,
                variantName: line.variantName,
                qty: line.qty,
                mrpPaise: line.mrpPaise,
                unitPricePaise: line.unitPricePaise,
                taxPaise: lineTax,
                totalPaise: lineTotal,
              },
            });
          }
          await tx.orderStatusHistory.create({
            data: { orderId: order.id, fromStatus: null, toStatus: order.status, note: "Order created" },
          });
          // Reserve stock immediately (expiry configurable).
          const expiresAt = new Date(Date.now() + reservationMinutes * 60 * 1000);
          for (const line of lines) {
            await reserveStock(tx, line.variantId, order.id, line.qty, expiresAt);
          }
          if (couponId) {
            await tx.couponUsage.create({
              data: { couponId, userId: input.userId, orderId: order.id, discountPaise: couponDiscount },
            });
          }
          // Loyalty + credit redemption (ledger entries reference the real order id).
          let loyaltyDiscount = 0;
          if (input.loyaltyPoints && input.loyaltyPoints > 0) {
            const r = await redeemLoyalty(tx, input.userId, input.loyaltyPoints, order.id);
            loyaltyDiscount = r.discountPaise;
          }
          let creditUsed = 0;
          if (input.storeCreditPaise && input.storeCreditPaise > 0) {
            const account = await tx.storeCreditAccount.findUnique({ where: { userId: input.userId } });
            const balance = account?.balancePaise ?? 0;
            const payableBeforeCredit = subtotalPaise - couponDiscount - loyaltyDiscount + deliveryChargePaise;
            creditUsed = Math.max(0, Math.min(input.storeCreditPaise, balance, payableBeforeCredit));
            if (creditUsed > 0) {
              await redeemCredit(tx, input.userId, creditUsed, order.id);
            }
          }
          const grandTotal = Math.max(0, subtotalPaise - couponDiscount - loyaltyDiscount + deliveryChargePaise - creditUsed);
          const finalStatus: "PLACED" | "PENDING_PAYMENT" =
            input.paymentMethod === "COD" || grandTotal === 0 ? "PLACED" : "PENDING_PAYMENT";
          const finalOrder = await tx.order.update({
            where: { id: order.id },
            data: {
              loyaltyRedeemedPoints: input.loyaltyPoints ?? 0,
              loyaltyDiscountPaise: loyaltyDiscount,
              storeCreditUsedPaise: creditUsed,
              grandTotalPaise: grandTotal,
              status: finalStatus,
              paymentStatus: grandTotal === 0 ? "CAPTURED" : "PENDING",
            },
          });
          await tx.payment.create({
            data: {
              orderId: order.id,
              method: input.paymentMethod,
              status: grandTotal === 0 ? "CAPTURED" : "PENDING",
              amountPaise: grandTotal,
              provider: input.paymentMethod === "COD" ? "COD" : "MOCK",
            },
          });
          await tx.cart.update({ where: { id: cart.id }, data: { status: "CHECKED_OUT" } });
          if (input.idempotencyKey) {
            await tx.idempotencyKey.create({
              data: {
                key: input.idempotencyKey,
                userId: input.userId,
                endpoint: "checkout",
                responseBody: { orderId: order.id, orderNumber: order.orderNumber },
                expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
              },
            });
          }
          return { order: finalOrder };
        },
        { timeout: 20000, maxWait: 8000 },
      );

      // Provider payment creation happens AFTER the transaction (never inside it).
      const { order } = result;
      if (order.paymentMethod !== "COD" && order.grandTotalPaise > 0) {
        try {
          const provider = await getPaymentProvider(order.paymentMethod);
          const created = await provider.createPayment({
            orderId: order.id,
            amountPaise: order.grandTotalPaise,
            method: order.paymentMethod,
          });
          await prisma.payment.updateMany({
            where: { orderId: order.id },
            data: { provider: "MOCK", providerPaymentId: created.providerRef },
          });
        } catch (providerErr) {
          // Compensate: mark failed, release reservations, reverse loyalty/credit.
          await compensateFailedCheckout(order.id).catch(() => undefined);
          throw providerErr;
        }
      }
      await notifyOrderEvent(order.id, "ORDER_PLACED").catch(() => undefined);
      return { orderId: order.id, orderNumber: order.orderNumber };
    } catch (err) {
      lastError = err;
      // Unique order-number collision → retry with a fresh number.
      const code = (err as { code?: string }).code;
      if (code === "P2002" && attempt < 2) continue;
      throw err;
    }
  }
  throw lastError;
}

async function compensateFailedCheckout(orderId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== "PENDING_PAYMENT") return;
    const reservations = await tx.stockReservation.findMany({ where: { orderId, status: "ACTIVE" } });
    for (const r of reservations) {
      await releaseReservation(tx, r.id, "Payment provider failure");
    }
    if (order.loyaltyRedeemedPoints > 0) {
      await refundLoyalty(tx, order.userId, order.loyaltyRedeemedPoints, orderId);
    }
    if (order.storeCreditUsedPaise > 0) {
      await reverseCredit(tx, order.userId, order.storeCreditUsedPaise, "Payment provider failure", orderId);
    }
    await tx.order.update({ where: { id: orderId }, data: { status: "PAYMENT_FAILED", paymentStatus: "FAILED" } });
    await tx.payment.updateMany({ where: { orderId }, data: { status: "FAILED" } });
    await tx.orderStatusHistory.create({ data: { orderId, fromStatus: "PENDING_PAYMENT", toStatus: "PAYMENT_FAILED", note: "Payment provider failure" } });
  });
}

/** Reorder: rebuild an ACTIVE cart from a past order at CURRENT prices. */
export async function reorder(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { variant: { include: { product: true, inventory: true } } } } },
  });
  if (!order || order.userId !== userId) throw notFound("Order not found");
  const added: Array<{ variantId: string; qty: number }> = [];
  const unavailable: Array<{ name: string; reason: string }> = [];
  const existingCart = await prisma.cart.findFirst({ where: { userId, status: "ACTIVE" } });
  const cart = existingCart ?? (await prisma.cart.create({ data: { userId, status: "ACTIVE" } }));
  // Clear current cart items, then add what is available now.
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  for (const item of order.items) {
    const v = item.variant;
    const sellable = Math.max(0, (v.inventory?.availableQty ?? 0) - (v.inventory?.reservedQty ?? 0));
    if (!v.isActive || !v.product.isActive || !v.product.onlineVisible) {
      unavailable.push({ name: `${item.productName} ${item.variantName}`, reason: "No longer available" });
      continue;
    }
    if (sellable <= 0) {
      unavailable.push({ name: `${item.productName} ${item.variantName}`, reason: "Out of stock" });
      continue;
    }
    const qty = Math.min(item.qty, sellable, v.maxOrderQty);
    await prisma.cartItem.create({ data: { cartId: cart.id, variantId: v.id, qty } });
    added.push({ variantId: v.id, qty });
  }
  return { cartId: cart.id, added, unavailable };
}

export function getOrderTimeline(status: string): Array<{ key: string; label: string; done: boolean; current: boolean }> {
  const steps = [
    { key: "PLACED", label: "Order Placed" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "PREPARING", label: "Preparing" },
    { key: "PACKED", label: "Packed" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
    { key: "DELIVERED", label: "Delivered" },
  ];
  if (status === "PENDING_PAYMENT" || status === "PAYMENT_FAILED") {
    return [{ key: status, label: status === "PENDING_PAYMENT" ? "Payment Pending" : "Payment Failed", done: false, current: true }];
  }
  if (status === "CANCELLED") {
    return [{ key: "CANCELLED", label: "Cancelled", done: false, current: true }];
  }
  if (status === "REFUND_PENDING" || status === "REFUNDED") {
    return [{ key: status, label: status === "REFUND_PENDING" ? "Refund Pending" : "Refunded", done: status === "REFUNDED", current: status === "REFUND_PENDING" }];
  }
  const idx = CUSTOMER_TIMELINE.indexOf(status as (typeof CUSTOMER_TIMELINE)[number]);
  return steps.map((s, i) => ({ ...s, done: idx >= 0 && i < idx, current: CUSTOMER_TIMELINE[i] === status }));
}
