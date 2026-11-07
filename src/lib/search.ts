import { prisma } from "./prisma";
import { FMCG_CATEGORIES } from "./fmcg-catalog";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function searchFallbackFmcg(q: string, page = 1, pageSize = 20) {
  const tokens = normalizeQuery(q);
  const matched = [];

  for (const cat of FMCG_CATEGORIES) {
    for (const item of cat.items) {
      const isMatch =
        tokens.length === 0 ||
        tokens.some(
          (t) =>
            item.name.toLowerCase().includes(t) ||
            item.brand.toLowerCase().includes(t) ||
            cat.name.toLowerCase().includes(t) ||
            cat.slug.toLowerCase().includes(t)
        );

      if (isMatch) {
        const prodSlug = slugify(item.name);
        matched.push({
          id: `fmcg-prod-${prodSlug}`,
          name: item.name,
          slug: prodSlug,
          brand: { name: item.brand },
          category: { name: cat.name, slug: cat.slug },
          images: [{ url: `/images/products/${prodSlug}.jpg` }],
          variants: item.variants.map((v) => ({
            id: `fmcg-var-${prodSlug}-${slugify(v.pack)}`,
            name: `${item.name} (${v.pack})`,
            packSize: v.pack,
            mrpPaise: Math.round(v.mrp * 100),
            sellingPaise: Math.round(v.selling * 100),
            inventory: { availableQty: v.stock ?? 100, reservedQty: 0 },
          })),
        });
      }
    }
  }

  const start = (page - 1) * pageSize;
  const paged = matched.slice(start, start + pageSize);
  return { items: paged, total: matched.length, page, pageSize };
}

// Search for thousands of SKUs: tokenized, case-insensitive matching across
// name / brand / category / SKU / barcode (including variant SKUs/barcodes),
// with DB indexes (not in-browser filtering). Debounce lives on the client.
// Typo tolerance: tokens are matched independently (any token may match), and
// a normalized form strips spaces and hyphens so "aashirvaad" matches
// "Aashirvaad Atta". When tokenized search returns nothing, a pg_trgm
// word-similarity fallback runs ("amull" finds Amul) — see migration
// 20261025113113_add_pg_trgm_search. If pg_trgm is unavailable the fallback
// degrades to no results instead of erroring; exact search is never polluted
// by fuzzy results because the fallback only runs on an empty result set.

export function normalizeQuery(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

export function buildSearchWhere(q: string) {
  const tokens = normalizeQuery(q);
  if (tokens.length === 0) return {};
  const tokenFilters = tokens.map((t) => ({
    OR: [
      { name: { contains: t, mode: "insensitive" as const } },
      { sku: { contains: t, mode: "insensitive" as const } },
      { barcode: { contains: t, mode: "insensitive" as const } },
      { brand: { name: { contains: t, mode: "insensitive" as const } } },
      { category: { name: { contains: t, mode: "insensitive" as const } } },
      // Variant-level identifiers: a shopper typing a pack's printed SKU or
      // barcode (e.g. DEMO-AMUL-TAAZA-TONED-MILK-500-ML) must find the product.
      {
        variants: {
          some: {
            OR: [
              { sku: { contains: t, mode: "insensitive" as const } },
              { barcode: { contains: t, mode: "insensitive" as const } },
            ],
          },
        },
      },
    ],
  }));
  return { AND: tokenFilters };
}

export async function searchProducts(q: string, page = 1, pageSize = 20) {
  try {
    const where = { isActive: true, onlineVisible: true, deletedAt: null, ...buildSearchWhere(q) };
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
      prisma.product.count({ where }),
    ]);
    if (total > 0 || normalizeQuery(q).length === 0) return { items, total, page, pageSize };
    // Fuzzy fallback (typo tolerance): only when tokenized search found nothing.
    const ids = await fuzzyProductIds(normalizeQuery(q), 100);
    const pageIds = ids.slice((page - 1) * pageSize, page * pageSize);
    if (pageIds.length === 0) {
      const fb = searchFallbackFmcg(q, page, pageSize);
      if (fb.total > 0) return fb as unknown as { items: typeof items; total: number; page: number; pageSize: number };
      return { items: [], total: 0, page, pageSize };
    }
    const fuzzyItems = await prisma.product.findMany({
      where: { id: { in: pageIds } },
      include: {
        brand: true,
        category: true,
        variants: { where: { isActive: true }, include: { inventory: true }, orderBy: { sellingPaise: "asc" } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    });
    const order = new Map(pageIds.map((id, i) => [id, i]));
    fuzzyItems.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return { items: fuzzyItems, total: ids.length, page, pageSize };
  } catch (err) {
    console.warn("[searchProducts] Database query failed, serving resilient FMCG search:", err);
    return searchFallbackFmcg(q, page, pageSize) as unknown as { items: any[]; total: number; page: number; pageSize: number };
  }
}

/**
 * pg_trgm word-similarity fallback. Per token, products whose name, brand
 * name, or variant SKU/barcode is word-similar (<% operator, default 0.3
 * threshold) are collected; ranking is tokens-matched first, then similarity.
 * Returns [] if pg_trgm is unavailable so callers degrade gracefully.
 */
export async function fuzzyProductIds(tokens: string[], limit = 100): Promise<string[]> {
  const scores = new Map<string, { matched: number; sim: number }>();
  for (const tok of tokens) {
    try {
      const rows = await prisma.$queryRaw<Array<{ id: string; sim: number }>>`
        SELECT p.id AS id,
          GREATEST(word_similarity(p."name", ${tok}), COALESCE(word_similarity(b."name", ${tok}), 0)) AS sim
        FROM "Product" p
        LEFT JOIN "Brand" b ON b.id = p."brandId"
        WHERE p."isActive" = true AND p."onlineVisible" = true AND p."deletedAt" IS NULL
          AND (p."name" <% ${tok} OR b."name" <% ${tok}
            OR EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p.id
              AND (v."sku" <% ${tok} OR v."barcode" <% ${tok})))
        ORDER BY sim DESC
        LIMIT 100
      `;
      for (const r of rows) {
        const cur = scores.get(r.id) ?? { matched: 0, sim: 0 };
        cur.matched += 1;
        cur.sim = Math.max(cur.sim, Number(r.sim));
        scores.set(r.id, cur);
      }
    } catch {
      return [];
    }
  }
  return [...scores.entries()]
    .sort((a, b) => b[1].matched - a[1].matched || b[1].sim - a[1].sim)
    .slice(0, limit)
    .map(([id]) => id);
}

export async function autocomplete(q: string, limit = 10) {
  try {
    const tokens = normalizeQuery(q);
    if (tokens.length === 0) return [];
    const t = tokens[0];
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        onlineVisible: true,
        deletedAt: null,
        OR: [
          { name: { contains: t, mode: "insensitive" } },
          { brand: { name: { contains: t, mode: "insensitive" } } },
          { sku: { contains: t, mode: "insensitive" } },
          {
            variants: {
              some: {
                OR: [
                  { sku: { contains: t, mode: "insensitive" } },
                  { barcode: { contains: t, mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      },
      select: { id: true, name: true, slug: true, brand: { select: { name: true } } },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take: limit,
    });
    if (products.length > 0) return products;
    // Fuzzy fallback for typo'd first tokens.
    const ids = await fuzzyProductIds([t], limit);
    if (ids.length === 0) return [];
    const fuzzy = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, slug: true, brand: { select: { name: true } } },
    });
    const order = new Map(ids.map((id, i) => [id, i]));
    fuzzy.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return fuzzy;
  } catch {
    const fb = searchFallbackFmcg(q, 1, limit);
    return fb.items.map((i) => ({ id: i.id, name: i.name, slug: i.slug, brand: i.brand }));
  }
}
