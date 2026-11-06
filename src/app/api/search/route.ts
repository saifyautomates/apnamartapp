import { NextRequest } from "next/server";
import { handler, ok, getPagination } from "@/lib/http";
import { searchProducts, autocomplete } from "@/lib/search";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const { page, pageSize } = getPagination(req);
  if (!q.trim()) {
    return ok({ items: [], total: 0, page, pageSize, suggestions: [] });
  }
  const [results, suggestions] = await Promise.all([
    searchProducts(q, page, pageSize),
    page === 1 ? autocomplete(q, 8) : Promise.resolve([]),
  ]);
  return ok({ ...results, suggestions });
});
