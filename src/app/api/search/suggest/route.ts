import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { autocomplete } from "@/lib/search";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const suggestions = await autocomplete(q, 10);
  return ok({ suggestions });
});
