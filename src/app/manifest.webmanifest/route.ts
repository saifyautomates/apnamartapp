import { NextResponse } from "next/server";
import { getSetting, DEFAULT_SETTINGS } from "@/lib/settings";
import { buildManifest } from "@/lib/manifest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await getSetting<Record<string, string>>(
    "store",
    DEFAULT_SETTINGS.store as Record<string, string>
  );
  const manifest = buildManifest(store);

  return new NextResponse(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=5, stale-while-revalidate=30",
    },
  });
}

