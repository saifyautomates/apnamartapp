import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { inventoryAdjustSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { adjustStock, receiveStock } from "@/lib/inventory";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const schema = inventoryAdjustSchema.extend({
  kind: z.enum(["ADJUST", "RECEIVE"]).default("ADJUST"),
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "inventory:write");
  const body = schema.parse(await readJson(req));
  const before = await prisma.inventory.findUnique({ where: { variantId: body.variantId } });
  const result = await prisma.$transaction(async (tx) => {
    if (body.kind === "RECEIVE") {
      await receiveStock(tx, body.variantId, Math.abs(body.delta), body.reason);
    } else {
      await adjustStock(tx, body.variantId, body.delta, body.reason, session.adminId);
    }
    return tx.inventory.findUnique({ where: { variantId: body.variantId } });
  });
  await auditLog(prisma, {
    actorType: "ADMIN", actorId: session.adminId, action: "STOCK_ADJUST", entityType: "Inventory",
    entityId: body.variantId,
    before: { availableQty: before?.availableQty ?? 0 },
    after: { availableQty: result?.availableQty ?? 0, delta: body.delta, reason: body.reason },
    ip: getClientIp(req),
  });
  return ok(result);
});
