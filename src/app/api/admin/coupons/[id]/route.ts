import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/errors";
import { z } from "zod";

export const runtime = "nodejs";

export const PATCH = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "coupons:write");
  const body = z.object({ isActive: z.boolean().optional(), endsAt: z.string().optional().nullable() }).parse(await readJson(req));
  const existing = await prisma.coupon.findUnique({ where: { id: ctx.params.id } });
  if (!existing) throw notFound("Coupon not found");
  const updated = await prisma.coupon.update({
    where: { id: ctx.params.id },
    data: { isActive: body.isActive ?? undefined, endsAt: body.endsAt === null ? null : body.endsAt ? new Date(body.endsAt) : undefined },
  });
  return ok(updated);
});

export const DELETE = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "coupons:write");
  const existing = await prisma.coupon.findUnique({ where: { id: ctx.params.id } });
  if (!existing) throw notFound("Coupon not found");
  await prisma.coupon.update({ where: { id: ctx.params.id }, data: { isActive: false } });
  return ok({ deleted: true });
});
