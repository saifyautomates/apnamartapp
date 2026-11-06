import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/errors";

export const runtime = "nodejs";

export const GET = handler(async (_req: NextRequest, ctx: { params: Record<string, string> }) => {
  const slug = ctx.params.slug;
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    include: {
      brand: true,
      category: true,
      subcategory: true,
      variants: { where: { isActive: true }, include: { inventory: true }, orderBy: { sellingPaise: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) throw notFound("Product not found");
  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true, onlineVisible: true, deletedAt: null },
    include: {
      brand: true,
      variants: { where: { isActive: true }, include: { inventory: true }, orderBy: { sellingPaise: "asc" }, take: 1 },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    take: 8,
  });
  return ok({ product, related });
});
