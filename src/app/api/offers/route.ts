import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { getStoreOffers } from "@/lib/offers";

export const runtime = "nodejs";

export const GET = handler(async (_req: NextRequest) => {
  const offers = await getStoreOffers();
  return ok(offers);
});

