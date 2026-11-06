import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { changePrice } from "@/lib/pricing";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";
import { notFound } from "@/lib/errors";
import { z } from "zod";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  const session = await requireAdmin(req);
  requirePermission(session, "products:read");
  const product = await prisma.product.findUnique({
    where: { id: ctx.params.id },
    include: {
      brand: true,
      category: true,
      variants: { include: { inventory: true, priceHistory: { orderBy: { createdAt: "desc" }, take: 10 } } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) throw notFound("Product not found");
  return ok(product);
});

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  onlineVisible: z.boolean().optional(),
  deliveryEligible: z.boolean().optional(),
  price: z.object({
    variantId: z.string(),
    mrpPaise: z.number().int().min(0),
    sellingPaise: z.number().int().min(0),
    onlinePricePaise: z.number().int().min(0).optional(),
    priceSource: z.enum(["SOURCE", "CUSTOM"]),
    reason: z.string().max(300).optional(),
  }).optional(),
});

export const PATCH = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "products:write");
  const body = patchSchema.parse(await readJson(req));
  const before = await prisma.product.findUnique({ where: { id: ctx.params.id } });
  if (!before) throw notFound("Product not found");
  const updated = await prisma.$transaction(async (tx) => {
    if (body.price) {
      await changePrice(tx, body.price.variantId, {
        mrpPaise: body.price.mrpPaise,
        sellingPaise: body.price.sellingPaise,
        onlinePricePaise: body.price.onlinePricePaise ?? null,
        priceSource: body.price.priceSource,
      }, session.adminId, body.price.reason);
    }
    return tx.product.update({
      where: { id: ctx.params.id },
      data: {
        name: body.name ?? undefined,
        description: body.description ?? undefined,
        featured: body.featured ?? undefined,
        isActive: body.isActive ?? undefined,
        onlineVisible: body.onlineVisible ?? undefined,
        deliveryEligible: body.deliveryEligible ?? undefined,
      },
    });
  });
  await auditLog(prisma, { actorType: "ADMIN", actorId: session.adminId, action: "PRODUCT_UPDATE", entityType: "Product", entityId: updated.id, before: { name: before.name }, after: { name: updated.name }, ip: getClientIp(req) });
  return ok(updated);
});

export const DELETE = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "products:write");
  const product = await prisma.product.findUnique({ where: { id: ctx.params.id } });
  if (!product) throw notFound("Product not found");
  await prisma.product.update({ where: { id: ctx.params.id }, data: { deletedAt: new Date(), isActive: false } });
  await auditLog(prisma, { actorType: "ADMIN", actorId: session.adminId, action: "PRODUCT_DELETE", entityType: "Product", entityId: product.id, ip: getClientIp(req) });
  return ok({ deleted: true });
});
