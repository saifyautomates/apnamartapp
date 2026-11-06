import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { lookupMasterFmcgBarcode } from "@/lib/fmcg-master-catalog";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "products:read");

  const url = new URL(req.url);
  const barcode = (url.searchParams.get("barcode") ?? "").trim();

  if (!barcode) {
    return ok({ error: "Barcode is required" }, 400);
  }

  // 1. Check if barcode already exists in Central Mart database
  const existingVariant = await prisma.productVariant.findFirst({
    where: { barcode },
    include: {
      product: {
        include: { brand: true, category: true },
      },
      inventory: true,
    },
  });

  if (existingVariant) {
    return ok({
      exists: true,
      variantId: existingVariant.id,
      productId: existingVariant.productId,
      name: `${existingVariant.product.name} (${existingVariant.packSize || existingVariant.name})`,
      brand: existingVariant.product.brand?.name ?? "—",
      categoryName: existingVariant.product.category.name,
      mrpPaise: existingVariant.mrpPaise,
      sellingPaise: existingVariant.sellingPaise,
      stock: existingVariant.inventory?.availableQty ?? 0,
      sku: existingVariant.sku,
      barcode: existingVariant.barcode,
    });
  }

  // Also check product.barcode
  const existingProduct = await prisma.product.findFirst({
    where: { barcode },
    include: {
      brand: true,
      category: true,
      variants: { include: { inventory: true }, take: 1 },
    },
  });

  if (existingProduct) {
    const v = existingProduct.variants[0];
    return ok({
      exists: true,
      variantId: v?.id ?? null,
      productId: existingProduct.id,
      name: existingProduct.name,
      brand: existingProduct.brand?.name ?? "—",
      categoryName: existingProduct.category.name,
      mrpPaise: v?.mrpPaise ?? 0,
      sellingPaise: v?.sellingPaise ?? 0,
      stock: v?.inventory?.availableQty ?? 0,
      sku: existingProduct.sku,
      barcode: existingProduct.barcode,
    });
  }

  // 2. Not in local database: Lookup in FMCG Master Database
  const suggestion = lookupMasterFmcgBarcode(barcode);

  // Match category slug with local category ID
  const matchedCat = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: suggestion.categorySlug },
        { name: { contains: suggestion.categoryName, mode: "insensitive" } },
      ],
    },
  });

  return ok({
    exists: false,
    suggestion: {
      ...suggestion,
      matchedCategoryId: matchedCat?.id ?? null,
      matchedCategoryName: matchedCat?.name ?? suggestion.categoryName,
    },
  });
});
