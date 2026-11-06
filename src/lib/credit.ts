import { prisma } from "./prisma";
import { badRequest } from "./errors";
import type { Prisma, CreditTxnType } from "@prisma/client";

export async function getOrCreateCreditAccount(tx: Prisma.TransactionClient, userId: string) {
  return tx.storeCreditAccount.upsert({
    where: { userId },
    create: { userId, balancePaise: 0 },
    update: {},
  });
}

async function writeTxn(
  tx: Prisma.TransactionClient,
  userId: string,
  type: CreditTxnType,
  amountPaise: number,
  reason: string,
  adminId: string | null,
  referenceType?: string,
  referenceId?: string,
) {
  if (!reason.trim()) throw badRequest("Store credit transactions require a reason");
  const account = await getOrCreateCreditAccount(tx, userId);
  const next = account.balancePaise + amountPaise;
  if (next < 0) throw badRequest("Insufficient store credit");
  await tx.storeCreditTransaction.create({
    data: { accountId: account.id, type, amountPaise, reason, adminId, referenceType, referenceId },
  });
  await tx.storeCreditAccount.update({ where: { id: account.id }, data: { balancePaise: next } });
  return next;
}

export async function issueCredit(tx: Prisma.TransactionClient, userId: string, amountPaise: number, reason: string, adminId: string) {
  if (amountPaise <= 0) throw badRequest("Issue amount must be positive");
  return writeTxn(tx, userId, "ISSUE", amountPaise, reason, adminId);
}

export async function redeemCredit(tx: Prisma.TransactionClient, userId: string, amountPaise: number, orderId: string) {
  if (amountPaise <= 0) throw badRequest("Redeem amount must be positive");
  return writeTxn(tx, userId, "REDEEM", -amountPaise, `Redeemed on order ${orderId}`, null, "ORDER", orderId);
}

export async function reverseCredit(tx: Prisma.TransactionClient, userId: string, amountPaise: number, reason: string, orderId?: string) {
  if (amountPaise <= 0) throw badRequest("Reverse amount must be positive");
  return writeTxn(tx, userId, "REVERSE", amountPaise, reason, null, orderId ? "ORDER" : undefined, orderId);
}

export async function adjustCredit(tx: Prisma.TransactionClient, userId: string, amountPaise: number, reason: string, adminId: string) {
  return writeTxn(tx, userId, "ADJUST", amountPaise, reason, adminId);
}
