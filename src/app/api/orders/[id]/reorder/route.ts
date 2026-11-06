import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireCustomer, assertCsrf } from "@/lib/auth";
import { reorder } from "@/lib/orders";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  assertCsrf(req);
  const { userId } = await requireCustomer(req);
  const result = await reorder(userId, ctx.params.id);
  return ok(result);
});
