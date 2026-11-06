import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "./errors";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

/** Wrap a route handler with uniform error handling. */
export function handler(
  fn: (req: NextRequest, ctx: { params: Record<string, string> }) => Promise<NextResponse>,
) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      const { status, body } = toErrorResponse(err);
      return NextResponse.json(body, { status });
    }
  };
}

export async function readJson<T>(req: NextRequest): Promise<T> {
  const text = await req.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export function getPagination(req: NextRequest): { page: number; pageSize: number } {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20", 10) || 20));
  return { page, pageSize };
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
