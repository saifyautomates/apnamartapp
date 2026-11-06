import { prisma } from "./prisma";
import type { Prisma, ActorType } from "@prisma/client";

export async function auditLog(
  tx: Prisma.TransactionClient | typeof prisma,
  entry: {
    actorType: ActorType;
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    before?: unknown;
    after?: unknown;
    ip?: string | null;
    userAgent?: string | null;
  },
) {
  const client = tx as Prisma.TransactionClient;
  await client.auditLog.create({
    data: {
      actorType: entry.actorType,
      actorId: entry.actorId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      before: entry.before === undefined ? null : JSON.parse(JSON.stringify(entry.before)),
      after: entry.after === undefined ? null : JSON.parse(JSON.stringify(entry.after)),
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
    },
  });
}
