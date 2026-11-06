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
  requirePermission(session, "users:write");
  const body = z.object({ isActive: z.boolean().optional() }).parse(await readJson(req));
  const existing = await prisma.adminUser.findUnique({ where: { id: ctx.params.id } });
  if (!existing) throw notFound("Admin user not found");
  const updated = await prisma.adminUser.update({ where: { id: ctx.params.id }, data: { isActive: body.isActive ?? undefined } });
  return ok({ id: updated.id, isActive: updated.isActive });
});

export const DELETE = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "users:write");
  const existing = await prisma.adminUser.findUnique({ where: { id: ctx.params.id } });
  if (!existing) throw notFound("Admin user not found");
  await prisma.adminUser.update({ where: { id: ctx.params.id }, data: { deletedAt: new Date(), isActive: false } });
  return ok({ deleted: true });
});
