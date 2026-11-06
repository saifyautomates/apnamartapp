import { prisma } from "./prisma";
import { badRequest, conflict } from "./errors";
import type { Prisma } from "@prisma/client";

export function sellableQty(inv: { availableQty: number; reservedQty: number }): number {
  return Math.max(0, inv.availableQty - inv.reservedQty);
}

/** Row-level lock for an inventory row inside a transaction (prevents overselling races). */
async function lockInventory(tx: Prisma.TransactionClient, variantId: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Inventory" WHERE "variantId" = ${variantId} FOR UPDATE
  `;
  if (rows.length === 0) throw badRequest("Inventory record not found for variant");
  const inv = await tx.inventory.findUnique({ where: { variantId } });
  if (!inv) throw badRequest("Inventory record not found for variant");
  return inv;
}

export async function ensureInventory(tx: Prisma.TransactionClient, variantId: string, minStock = 0) {
  return tx.inventory.upsert({
    where: { variantId },
    create: { variantId, availableQty: 0, reservedQty: 0, minStock },
    update: {},
  });
}

/** Reserve stock for an order. Throws if sellable stock is insufficient. */
export async function reserveStock(
  tx: Prisma.TransactionClient,
  variantId: string,
  orderId: string,
  qty: number,
  expiresAt: Date,
) {
  if (qty <= 0) throw badRequest("Reservation quantity must be positive");
  const inv = await lockInventory(tx, variantId);
  if (sellableQty(inv) < qty) {
    throw conflict(`Insufficient stock for variant ${variantId}: sellable ${sellableQty(inv)}, requested ${qty}`);
  }
  await tx.inventory.update({ where: { variantId }, data: { reservedQty: { increment: qty } } });
  const reservation = await tx.stockReservation.create({
    data: { variantId, orderId, qty, status: "ACTIVE", expiresAt },
  });
  await tx.inventoryMovement.create({
    data: {
      variantId,
      type: "RESERVE",
      qtyDelta: 0,
      reason: `Reserved ${qty} for order ${orderId}`,
      referenceType: "ORDER",
      referenceId: orderId,
    },
  });
  return reservation;
}

/** Release an ACTIVE reservation (payment failed / cancelled). */
export async function releaseReservation(tx: Prisma.TransactionClient, reservationId: string, reason: string) {
  const res = await tx.stockReservation.findUnique({ where: { id: reservationId } });
  if (!res || res.status !== "ACTIVE") return null;
  await lockInventory(tx, res.variantId);
  await tx.inventory.update({ where: { variantId: res.variantId }, data: { reservedQty: { decrement: res.qty } } });
  const updated = await tx.stockReservation.update({ where: { id: reservationId }, data: { status: "RELEASED" } });
  await tx.inventoryMovement.create({
    data: { variantId: res.variantId, type: "RELEASE", qtyDelta: 0, reason, referenceType: "ORDER", referenceId: res.orderId },
  });
  return updated;
}

/** Consume an ACTIVE reservation into a physical sale (at PACKED stage). */
export async function consumeReservation(tx: Prisma.TransactionClient, reservationId: string) {
  const res = await tx.stockReservation.findUnique({ where: { id: reservationId } });
  if (!res || res.status !== "ACTIVE") return null;
  const inv = await lockInventory(tx, res.variantId);
  if (inv.availableQty < res.qty) throw conflict("Available stock below reserved quantity");
  await tx.inventory.update({
    where: { variantId: res.variantId },
    data: { availableQty: { decrement: res.qty }, reservedQty: { decrement: res.qty } },
  });
  const updated = await tx.stockReservation.update({ where: { id: reservationId }, data: { status: "CONSUMED" } });
  await tx.inventoryMovement.create({
    data: { variantId: res.variantId, type: "SALE", qtyDelta: -res.qty, reason: `Sale for order ${res.orderId}`, referenceType: "ORDER", referenceId: res.orderId },
  });
  return updated;
}

/** Manual stock adjustment by an admin (reason + admin are mandatory). */
export async function adjustStock(
  tx: Prisma.TransactionClient,
  variantId: string,
  delta: number,
  reason: string,
  adminId: string,
) {
  if (delta === 0) throw badRequest("Adjustment delta cannot be zero");
  if (!reason.trim()) throw badRequest("Adjustment reason is required");
  const inv = await lockInventory(tx, variantId);
  if (inv.availableQty + delta < 0) throw conflict("Adjustment would make available stock negative");
  await tx.inventory.update({ where: { variantId }, data: { availableQty: { increment: delta } } });
  await tx.inventoryMovement.create({
    data: { variantId, type: "ADJUST", qtyDelta: delta, reason, adminId, referenceType: "MANUAL" },
  });
  return tx.inventory.findUnique({ where: { variantId } });
}

/** Receive new stock (purchase / GRN). */
export async function receiveStock(tx: Prisma.TransactionClient, variantId: string, qty: number, reason: string) {
  if (qty <= 0) throw badRequest("Receive quantity must be positive");
  await lockInventory(tx, variantId);
  await tx.inventory.update({ where: { variantId }, data: { availableQty: { increment: qty } } });
  await tx.inventoryMovement.create({
    data: { variantId, type: "RECEIVE", qtyDelta: qty, reason, referenceType: "PURCHASE" },
  });
}

/** Expire ACTIVE reservations past their expiry. Returns count released. */
export async function expireReservations(): Promise<number> {
  const expired = await prisma.stockReservation.findMany({
    where: { status: "ACTIVE", expiresAt: { lt: new Date() } },
    take: 500,
  });
  let released = 0;
  for (const res of expired) {
    await prisma.$transaction(async (tx) => {
      await releaseReservation(tx, res.id, "Reservation expired");
    });
    released += 1;
  }
  return released;
}

export async function getLowStock(variantIds?: string[]) {
  const rows = await prisma.inventory.findMany({
    where: variantIds ? { variantId: { in: variantIds } } : {},
    include: { variant: { include: { product: true } } },
  });
  return rows.filter((r) => sellableQty(r) <= r.minStock);
}
