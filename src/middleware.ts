import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Edge Middleware for Central Mart.
 * Strictly enforces that the Admin Panel (/admin and /api/admin/*)
 * is ONLY accessible to authorized administrators.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect HTML Admin Routes: /admin and all sub-routes
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("gcp_access")?.value;
    if (!token) {
      const loginUrl = new URL("/staff-login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl, 307);
    }

    try {
      // Decode JWT payload without node crypto dependency at edge
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.kind !== "ADMIN") {
          const loginUrl = new URL("/staff-login", request.url);
          loginUrl.searchParams.set("next", pathname);
          return NextResponse.redirect(loginUrl, 307);
        }
      }
    } catch {
      const loginUrl = new URL("/staff-login", request.url);
      return NextResponse.redirect(loginUrl, 307);
    }
  }

  // Protect Admin API Routes: /api/admin/*
  if (pathname.startsWith("/api/admin")) {
    const token = request.cookies.get("gcp_access")?.value;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Admin session required" } },
        { status: 401 }
      );
    }

    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.kind !== "ADMIN") {
          return NextResponse.json(
            { ok: false, error: { code: "FORBIDDEN", message: "Admin privilege required" } },
            { status: 403 }
          );
        }
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid admin session" } },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

