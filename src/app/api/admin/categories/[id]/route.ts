import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { categoryUpsertSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/errors";

export const runtime = "nodejs";

export const PATCH = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "categories:write");
  const body = categoryUpsertSchema.partial().parse(await readJson(req));
  const existing = await prisma.category.findUnique({ where: { id: ctx.params.id } });
  if (!existing) throw notFound("Category not found");
  const updated = await prisma.category.update({ where: { id: ctx.params.id }, data: body });
  return ok(updated);
});

export const DELETE = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "categories:write");
  const existing = await prisma.category.findUnique({ where: { id: ctx.params.id } });
  if (!existing) throw notFound("Category not found");
  await prisma.category.update({ where: { id: ctx.params.id }, data: { deletedAt: new Date(), isVisible: false } });
  return ok({ deleted: true });
});
