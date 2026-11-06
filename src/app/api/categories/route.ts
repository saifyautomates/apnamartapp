import { NextRequest } from "next/server";
import { handler, ok, getPagination } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { cachedJson } from "@/lib/cache";

export const runtime = "nodejs";

export const GET = handler(async () => {
  const data = await cachedJson("categories:visible", 300, async () => {
    const categories = await prisma.category.findMany({
      where: { isVisible: true, deletedAt: null },
      include: {
        subcategories: { where: { isVisible: true, deletedAt: null }, orderBy: { sortOrder: "asc" } },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    });
    return categories;
  });
  return ok(data);
});
