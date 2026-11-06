import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let cacheStatus = "healthy";

  // 1. Verify Database
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    dbStatus = `unhealthy: ${e instanceof Error ? e.message : "connection failed"}`;
  }

  // 2. Verify Cache
  try {
    const cache = getCache();
    await cache.set("__healthcheck__", "1", 5);
    const cached = await cache.get("__healthcheck__");
    if (cached !== "1") cacheStatus = "degraded";
  } catch {
    cacheStatus = "degraded";
  }

  const isHealthy = dbStatus === "healthy";
  const durationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      latencyMs: durationMs,
      services: {
        database: dbStatus,
        cache: cacheStatus,
      },
      environment: process.env.NODE_ENV ?? "development",
    },
    { status: isHealthy ? 200 : 503 }
  );
}
