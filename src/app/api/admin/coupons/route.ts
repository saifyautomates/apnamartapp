import { NextRequest } from "next/server";
import { handler, ok, readJson, getClientIp } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { couponUpsertSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "coupons:write");
  const items = await prisma.coupon.findMany({
    include: { rules: true, _count: { select: { usage: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(items);
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "coupons:write");
  const body = couponUpsertSchema.parse(await readJson(req));
  const created = await prisma.coupon.create({
    data: {
      code: body.code.trim().toUpperCase(),
      type: body.type,
      discountPercent: body.discountPercent ?? null,
      discountPaise: body.discountPaise ?? null,
      minOrderPaise: body.minOrderPaise ?? 0,
      maxDiscountPaise: body.maxDiscountPaise ?? null,
      startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      usageLimit: body.usageLimit ?? null,
      perUserLimit: body.perUserLimit ?? null,
      firstOrderOnly: body.firstOrderOnly ?? false,
      isActive: body.isActive ?? true,
    },
  });
  await auditLog(prisma, { actorType: "ADMIN", actorId: session.adminId, action: "COUPON_CREATE", entityType: "Coupon", entityId: created.id, after: { code: created.code, type: created.type }, ip: getClientIp(req) });
  return ok(created, 201);
});
