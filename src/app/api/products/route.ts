import { NextRequest } from "next/server";
import { handler, ok, getPagination } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { buildSearchWhere, searchProducts } from "@/lib/search";
import { cachedJson } from "@/lib/cache";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const { page, pageSize } = getPagination(req);
  const q = url.searchParams.get("q") ?? "";
  const category = url.searchParams.get("category");
  const brand = url.searchParams.get("brand");
  const featured = url.searchParams.get("featured") === "true";

  const cacheKey = `products:v2:${category ?? ""}:${brand ?? ""}:${featured}:${q.trim().toLowerCase()}:${page}:${pageSize}`;

  const data = await cachedJson(cacheKey, 30, async () => {
    try {
      const where: Record<string, unknown> = { isActive: true, onlineVisible: true, deletedAt: null };
      if (category) where.category = { slug: category };
      if (brand) where.brand = { slug: brand };
      if (featured) where.featured = true;
      if (q) Object.assign(where, buildSearchWhere(q));

      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where: where as never,
          include: {
            brand: true,
            category: true,
            variants: { where: { isActive: true }, include: { inventory: true }, orderBy: { sellingPaise: "asc" } },
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
          },
          orderBy: [{ featured: "desc" }, { name: "asc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.product.count({ where: where as never }),
      ]);

      if (items.length > 0) {
        return { items, total, page, pageSize };
      }
    } catch {
      /* fallback to resilient catalog */
    }

    return searchProducts(q || category || "", page, pageSize);
  });

  return ok(data);
});
