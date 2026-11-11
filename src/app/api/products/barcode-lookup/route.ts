import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { lookupMasterFmcgBarcode } from "@/lib/fmcg-master-catalog";

export const runtime = "nodejs";

function getAisleForCategory(categorySlug: string): string {
  const map: Record<string, string> = {
    snacks: "Aisle 1 — Snacks & Namkeen (Bay A1–A4)",
    "cold-drinks": "Aisle 2 — Beverages & Juices (Bay B1–B3)",
    beverages: "Aisle 2 — Beverages, Tea & Coffee (Bay B4–B6)",
    "personal-care": "Aisle 3 — Personal Care & Hygiene (Bay C1–C5)",
    "cleaning-essentials": "Aisle 4 — Cleaning & Home Care (Bay D1–D4)",
    "dairy-eggs": "Chiller Section — Dairy & Fresh Breakfast",
    breakfast: "Aisle 5 — Cereals, Noodles & Sauces (Bay E1–E3)",
    staples: "Aisle 6 — Atta, Rice, Dal & Edible Oils (Bay F1–F6)",
    "instant-food": "Aisle 5 — Instant Food & Ready to Eat",
  };
  return map[categorySlug] || "Aisle 1 — General FMCG Display";
}

export const GET = handler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const barcode = (url.searchParams.get("barcode") ?? "").trim();

  if (!barcode) {
    return ok({ error: "Barcode is required" }, 400);
  }

  // 1. Direct variant match
  const variant = await prisma.productVariant.findFirst({
    where: { barcode },
    include: {
      product: {
        include: {
          brand: true,
          category: true,
          images: { take: 1 },
        },
      },
      inventory: true,
    },
  });

  if (variant && variant.product) {
    const sellable = variant.inventory
      ? Math.max(0, variant.inventory.availableQty - variant.inventory.reservedQty)
      : 0;

    return ok({
      found: true,
      variantId: variant.id,
      productId: variant.productId,
      name: `${variant.product.name} (${variant.packSize || variant.name})`,
      productName: variant.product.name,
      slug: variant.product.slug,
      brand: variant.product.brand?.name ?? "Central Mart Select",
      categoryName: variant.product.category.name,
      categorySlug: variant.product.category.slug,
      packSize: variant.packSize || variant.name,
      mrpPaise: variant.mrpPaise,
      sellingPaise: variant.sellingPaise,
      stock: sellable,
      inStock: sellable > 0,
      aisle: getAisleForCategory(variant.product.category.slug),
      image: variant.product.images?.[0]?.url || `/images/products/${variant.product.slug}.jpg`,
      barcode: variant.barcode,
    });
  }

  // 2. Product-level barcode match
  const product = await prisma.product.findFirst({
    where: { barcode },
    include: {
      brand: true,
      category: true,
      images: { take: 1 },
      variants: {
        include: { inventory: true },
        take: 1,
      },
    },
  });

  if (product && product.variants.length > 0) {
    const v = product.variants[0];
    const sellable = v.inventory
      ? Math.max(0, v.inventory.availableQty - v.inventory.reservedQty)
      : 0;

    return ok({
      found: true,
      variantId: v.id,
      productId: product.id,
      name: `${product.name} (${v.packSize || v.name})`,
      productName: product.name,
      slug: product.slug,
      brand: product.brand?.name ?? "Central Mart Select",
      categoryName: product.category.name,
      categorySlug: product.category.slug,
      packSize: v.packSize || v.name,
      mrpPaise: v.mrpPaise,
      sellingPaise: v.sellingPaise,
      stock: sellable,
      inStock: sellable > 0,
      aisle: getAisleForCategory(product.category.slug),
      image: product.images?.[0]?.url || `/images/products/${product.slug}.jpg`,
      barcode: product.barcode,
    });
  }

  // 3. Fallback to Master Catalog suggestions
  const master = lookupMasterFmcgBarcode(barcode);
  if (master) {
    const keyword = master.name.split(" ")[0];
    const localMatch = await prisma.productVariant.findFirst({
      where: {
        product: { name: { contains: keyword, mode: "insensitive" } },
      },
      include: {
        product: {
          include: {
            brand: true,
            category: true,
            images: { take: 1 },
          },
        },
        inventory: true,
      },
    });

    if (localMatch && localMatch.product) {
      // Auto-assign barcode
      await prisma.productVariant
        .update({
          where: { id: localMatch.id },
          data: { barcode },
        })
        .catch(() => {});

      const sellable = localMatch.inventory
        ? Math.max(0, localMatch.inventory.availableQty - localMatch.inventory.reservedQty)
        : 0;

      return ok({
        found: true,
        variantId: localMatch.id,
        productId: localMatch.productId,
        name: `${localMatch.product.name} (${localMatch.packSize || localMatch.name})`,
        productName: localMatch.product.name,
        slug: localMatch.product.slug,
        brand: localMatch.product.brand?.name ?? master.brand,
        categoryName: localMatch.product.category.name,
        categorySlug: localMatch.product.category.slug,
        packSize: localMatch.packSize || localMatch.name,
        mrpPaise: localMatch.mrpPaise,
        sellingPaise: localMatch.sellingPaise,
        stock: sellable,
        inStock: sellable > 0,
        aisle: getAisleForCategory(localMatch.product.category.slug),
        image: localMatch.product.images?.[0]?.url || `/images/products/${localMatch.product.slug}.jpg`,
        barcode,
      });
    }
  }

  return ok({
    found: false,
    message: "Product not found for this barcode. Please ask a store executive at 80 Feet Road Hub.",
  });
});

