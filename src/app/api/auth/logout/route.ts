import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { clearSessionCookies, revokeRefreshToken, assertCsrf } from "@/lib/auth";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const refresh = req.cookies.get("gcp_refresh")?.value;
  if (refresh) await revokeRefreshToken(refresh).catch(() => undefined);
  clearSessionCookies();
  return ok({ loggedOut: true });
});
