import { NextRequest } from "next/server";
import { handler, ok, readJson, getPagination } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { productUpsertSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";
import { badRequest } from "@/lib/errors";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "products:read");
  const url = new URL(req.url);
  const { page, pageSize } = getPagination(req);
  const q = url.searchParams.get("q") ?? "";
  const where: Record<string, unknown> = { deletedAt: null };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { barcode: { contains: q, mode: "insensitive" } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where: where as never,
      include: {
        brand: true,
        category: true,
        variants: { include: { inventory: true }, orderBy: { sellingPaise: "asc" } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where: where as never }),
  ]);
  return ok({ items, total, page, pageSize });
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "products:write");
  const body = productUpsertSchema.parse(await readJson(req));
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        internalId: `INT-${Date.now()}`,
        sku: body.sku,
        barcode: body.barcode ?? null,
        name: body.name,
        shortName: body.shortName ?? null,
        slug,
        brandId: body.brandId ?? null,
        categoryId: body.categoryId,
        subcategoryId: body.subcategoryId ?? null,
        description: body.description ?? null,
        hsnSac: body.hsnSac ?? null,
        gstBps: body.gstBps,
        unit: body.unit ?? "pack",
        featured: body.featured ?? false,
        isActive: body.isActive ?? true,
        onlineVisible: body.onlineVisible ?? true,
        deliveryEligible: body.deliveryEligible ?? true,
      },
    });
    for (const v of body.variants) {
      const variant = await tx.productVariant.create({
        data: {
          productId: created.id,
          name: v.name,
          sku: v.sku,
          barcode: v.barcode ?? null,
          mrpPaise: v.mrpPaise,
          sellingPaise: v.sellingPaise,
          onlinePricePaise: v.onlinePricePaise ?? null,
          priceSource: v.priceSource ?? "SOURCE",
          packSize: v.packSize ?? null,
          maxOrderQty: v.maxOrderQty ?? 50,
          isActive: v.isActive ?? true,
        },
      });
      await tx.inventory.create({ data: { variantId: variant.id, availableQty: 0, reservedQty: 0 } });
      await tx.price.create({
        data: { variantId: variant.id, mrpPaise: v.mrpPaise, sellingPaise: v.sellingPaise, onlinePricePaise: v.onlinePricePaise ?? null, priceSource: v.priceSource ?? "SOURCE" },
      });
    }
    return created;
  });
  await auditLog(prisma, { actorType: "ADMIN", actorId: session.adminId, action: "PRODUCT_CREATE", entityType: "Product", entityId: product.id, after: { name: body.name, sku: body.sku }, ip: getClientIp(req) });
  return ok(product, 201);
});
