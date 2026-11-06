import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { getStoreBanners } from "@/lib/banners";

export const runtime = "nodejs";

/** Public API to retrieve active store banners for storefront slider */
export const GET = handler(async (_req: NextRequest) => {
  const banners = await getStoreBanners();
  return ok({ banners });
});

