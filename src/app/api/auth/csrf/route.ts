import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { newCsrfToken } from "@/lib/auth";

export const runtime = "nodejs";

export const GET = handler(async () => {
  const token = newCsrfToken();
  return ok({ csrfToken: token });
});
