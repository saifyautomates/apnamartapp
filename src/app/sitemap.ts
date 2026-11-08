import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Sitemap reflects the live catalogue; never bake it at build time.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true, onlineVisible: true, deletedAt: null },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      prisma.category.findMany({
        where: { isVisible: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return [
      {
        url: `${base}/`,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 1.0,
      },
      {
        url: `${base}/category`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      ...categories.map((c) => ({
        url: `${base}/category/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.85,
      })),
      ...products.map((p) => ({
        url: `${base}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return [
      {
        url: `${base}/`,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 1.0,
      },
      {
        url: `${base}/category`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
    ];
  }
}
