import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { getAllSettings } from "@/lib/settings";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const s = await getAllSettings();
  return ok({
    store: s.store ?? {},
    payments: s.payments ?? {},
    delivery: s.delivery ?? {},
    pickup: s.pickup ?? {},
  });
});
