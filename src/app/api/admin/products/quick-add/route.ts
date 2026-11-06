import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "products:write");

  const body = await req.json().catch(() => ({}));
  const {
    barcode,
    name,
    brandName,
    categoryId,
    packSize,
    mrpPaise,
    sellingPaise,
    initialStock,
    hsnSac,
    gstBps,
    unit,
  } = body;

  if (!barcode || !name || !categoryId) {
    return ok({ error: "Barcode, Product Name, and Category are required." }, 400);
  }

  // 1. Resolve or create Brand
  let brandId: string | null = null;
  if (brandName) {
    const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const existingBrand = await prisma.brand.findFirst({
      where: {
        OR: [{ name: { equals: brandName, mode: "insensitive" } }, { slug: brandSlug }],
      },
    });

    if (existingBrand) {
      brandId = existingBrand.id;
    } else {
      const createdBrand = await prisma.brand.create({
        data: { name: brandName, slug: `${brandSlug}-${Date.now().toString(36)}` },
      });
      brandId = createdBrand.id;
    }
  }

  // 2. Generate clean SKU and Slug
  const cleanSku = `SKU-${barcode.trim()}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);

  const parsedMrp = Math.max(100, parseInt(mrpPaise, 10) || 5000);
  const parsedSelling = Math.min(parsedMrp, Math.max(100, parseInt(sellingPaise, 10) || parsedMrp));
  const parsedStock = Math.max(0, parseInt(initialStock, 10) || 24);

  // 3. Atomically create Product, Variant, Inventory, and Price
  const created = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        internalId: `INT-${Date.now()}`,
        sku: cleanSku,
        barcode: barcode.trim(),
        name: name.trim(),
        shortName: name.trim().slice(0, 40),
        slug,
        brandId,
        categoryId,
        description: `Fresh grocery product: ${name.trim()} (${packSize || "Standard"}). Fast delivery in 10 minutes.`,
        hsnSac: hsnSac || "21069099",
        gstBps: gstBps ? parseInt(gstBps, 10) : 500,
        unit: unit || "pack",
        featured: true,
        isActive: true,
        onlineVisible: true,
        deliveryEligible: true,
      },
    });

    const variant = await tx.productVariant.create({
      data: {
        productId: product.id,
        name: packSize || "Standard Pack",
        sku: cleanSku,
        barcode: barcode.trim(),
        mrpPaise: parsedMrp,
        sellingPaise: parsedSelling,
        onlinePricePaise: parsedSelling,
        priceSource: "SOURCE",
        packSize: packSize || "Standard Pack",
        maxOrderQty: 50,
        isActive: true,
      },
    });

    // Opening inventory
    await tx.inventory.create({
      data: {
        variantId: variant.id,
        availableQty: parsedStock,
        reservedQty: 0,
        minStock: 5,
      },
    });

    // Price master
    await tx.price.create({
      data: {
        variantId: variant.id,
        mrpPaise: parsedMrp,
        sellingPaise: parsedSelling,
        onlinePricePaise: parsedSelling,
        priceSource: "SOURCE",
      },
    });

    return { product, variant };
  });

  // 4. Invalidate metrics cache so dashboard updates
  await cache.del("admin:dashboard:metrics:v2");

  // 5. Audit Log
  await prisma.auditLog.create({
    data: {
      action: "FAST_BARCODE_PRODUCT_LIST",
      actorType: "ADMIN",
      entityType: "Product",
      entityId: created.product.id,
      actorId: session.adminId,
      after: {
        barcode,
        name,
        sellingPaise: parsedSelling,
        initialStock: parsedStock,
      },
    },
  });

  return ok({
    success: true,
    product: created.product,
    variant: created.variant,
    message: `"${name}" listed successfully with barcode ${barcode} and ${parsedStock} units opening stock!`,
  });
});
