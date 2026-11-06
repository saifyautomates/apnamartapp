import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireCustomer, assertCsrf } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validation";
import { checkout } from "@/lib/orders";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const { userId } = await requireCustomer(req);
  const body = checkoutSchema.parse(await readJson(req));
  const headerKey = req.headers.get("Idempotency-Key") ?? undefined;
  const result = await checkout({
    ...body,
    userId,
    idempotencyKey: headerKey ?? body.idempotencyKey,
  });
  return ok(result, 201);
});
