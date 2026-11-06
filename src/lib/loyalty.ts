import { prisma } from "./prisma";
import { badRequest } from "./errors";
import { getSetting } from "./settings";
import type { Prisma } from "@prisma/client";

export async function getOrCreateLoyaltyAccount(tx: Prisma.TransactionClient, userId: string) {
  return tx.loyaltyAccount.upsert({
    where: { userId },
    create: { userId, points: 0 },
    update: {},
  });
}

/** Loyalty settings (stored in settings table; defaults shown). */
export async function getLoyaltySettings() {
  const cfg = (await getSetting("loyalty", {
    enabled: true,
    rupeesPerPoint: 100,
    pointValuePaise: 100,
    minRedeemPoints: 10,
    maxRedeemPointsPerOrder: 500,
    expiryDays: 365,
  })) as {
    enabled: boolean;
    rupeesPerPoint: number;
    pointValuePaise: number;
    minRedeemPoints: number;
    maxRedeemPointsPerOrder: number;
    expiryDays: number;
  };
  return cfg;
}

/** Earn points for a delivered/paid order. Ledger is the source of truth; account.points is a cached balance updated in the same transaction. */
export async function earnLoyalty(
  tx: Prisma.TransactionClient,
  userId: string,
  orderId: string,
  grandTotalPaise: number,
): Promise<number> {
  const cfg = await getLoyaltySettings();
  if (!cfg.enabled) return 0;
  const points = Math.floor(grandTotalPaise / 100 / cfg.rupeesPerPoint);
  if (points <= 0) return 0;
  const account = await getOrCreateLoyaltyAccount(tx, userId);
  await tx.loyaltyTransaction.create({
    data: { accountId: account.id, type: "EARN", pointsDelta: points, referenceType: "ORDER", referenceId: orderId, reason: `Earned on order ${orderId}` },
  });
  await tx.loyaltyAccount.update({ where: { id: account.id }, data: { points: { increment: points } } });
  return points;
}

export async function redeemLoyalty(
  tx: Prisma.TransactionClient,
  userId: string,
  points: number,
  orderId: string,
): Promise<{ points: number; discountPaise: number }> {
  const cfg = await getLoyaltySettings();
  if (!cfg.enabled) throw badRequest("Loyalty is disabled");
  if (points < cfg.minRedeemPoints) throw badRequest(`Minimum redemption is ${cfg.minRedeemPoints} points`);
  if (points > cfg.maxRedeemPointsPerOrder) throw badRequest(`Maximum redemption per order is ${cfg.maxRedeemPointsPerOrder} points`);
  const account = await getOrCreateLoyaltyAccount(tx, userId);
  if (account.points < points) throw badRequest("Insufficient loyalty points");
  await tx.loyaltyTransaction.create({
    data: { accountId: account.id, type: "REDEEM", pointsDelta: -points, referenceType: "ORDER", referenceId: orderId, reason: "Redeemed at checkout" },
  });
  await tx.loyaltyAccount.update({ where: { id: account.id }, data: { points: { decrement: points } } });
  return { points, discountPaise: points * cfg.pointValuePaise };
}

export async function refundLoyalty(tx: Prisma.TransactionClient, userId: string, points: number, orderId: string) {
  if (points <= 0) return;
  const account = await getOrCreateLoyaltyAccount(tx, userId);
  await tx.loyaltyTransaction.create({
    data: { accountId: account.id, type: "ADJUST", pointsDelta: points, referenceType: "ORDER", referenceId: orderId, reason: "Points returned on order cancel/refund" },
  });
  await tx.loyaltyAccount.update({ where: { id: account.id }, data: { points: { increment: points } } });
}
