import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { prisma, withDbTimeout } from "@/lib/prisma";
import { getFallbackProduct } from "@/lib/resilient-catalog";

export const runtime = "nodejs";

export const GET = handler(async (_req: NextRequest, ctx: { params: Record<string, string> }) => {
  const slug = ctx.params.slug;
  let product: unknown = null;
  let related: unknown[] = [];

  try {
    product = await withDbTimeout(
      prisma.product.findFirst({
        where: { slug, isActive: true, deletedAt: null },
        include: {
          brand: true,
          category: true,
          subcategory: true,
          variants: { where: { isActive: true }, include: { inventory: true }, orderBy: { sellingPaise: "asc" } },
          images: { orderBy: { sortOrder: "asc" } },
        },
      }),
      1500
    );

    if (product && typeof product === "object" && "categoryId" in product && "id" in product) {
      related = await withDbTimeout(
        prisma.product.findMany({
          where: { categoryId: (product as { categoryId: string }).categoryId, id: { not: (product as { id: string }).id }, isActive: true, onlineVisible: true, deletedAt: null },
          include: {
            brand: true,
            variants: { where: { isActive: true }, include: { inventory: true }, orderBy: { sellingPaise: "asc" }, take: 1 },
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
          },
          take: 8,
        }),
        1000
      ).catch(() => []);
    }
  } catch {
    /* fallback to resilient catalogue */
  }

  if (!product) {
    product = getFallbackProduct(slug);
  }

  if (!product) {
    return ok({ product: null, related: [] });
  }

  return ok({ product, related });
});
