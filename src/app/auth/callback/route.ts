import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  signAccess,
  signRefresh,
  setSessionCookies,
  storeRefreshToken,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  LOGGED_IN_COOKIE,
  cookieOpts,
} from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const sbUser = data.user;
      const phone = sbUser.phone ? sbUser.phone.replace(/^\+91/, "").replace(/\s/g, "") : null;
      const email = sbUser.email ?? null;
      const fullName =
        (sbUser.user_metadata?.full_name as string) ||
        (sbUser.user_metadata?.name as string) ||
        (phone ? `Customer ${phone.slice(-4)}` : email ? email.split("@")[0] : "Customer");

      // Find or create local customer tied to supabaseId
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { supabaseId: sbUser.id },
            ...(phone ? [{ phone }] : []),
            ...(email ? [{ email }] : []),
          ],
        },
      });

      if (!user) {
        // Create user with phone if available, or synthetic phone for email signups
        const finalPhone = phone || `sp_${sbUser.id.replace(/-/g, "").slice(0, 10)}`;
        user = await prisma.user.create({
          data: {
            supabaseId: sbUser.id,
            phone: finalPhone,
            email,
            name: fullName,
          },
        });
        await prisma.loyaltyAccount.create({ data: { userId: user.id } });
        await prisma.storeCreditAccount.create({ data: { userId: user.id } });
      } else if (!user.supabaseId) {
        // Link existing user to supabaseId
        user = await prisma.user.update({
          where: { id: user.id },
          data: { supabaseId: sbUser.id, email: email || user.email },
        });
      }

      // Merge guest cart
      const guestToken = request.cookies.get("gcp_cart")?.value;
      if (guestToken) {
        await mergeGuestCart(guestToken, user.id);
      }

      // Set platform session cookies
      let finalAccess = signAccess({ kind: "CUSTOMER", userId: user.id });
      let finalRefresh = signRefresh({ userId: user.id });
      await storeRefreshToken({ userId: user.id }, finalRefresh);
      setSessionCookies(finalAccess, finalRefresh);

      let targetUrl = next;

      // Check if this authenticated email is an AdminUser (e.g., jackxparrowww@gmail.com)
      if (email) {
        const admin = await prisma.adminUser.findFirst({
          where: { email: { equals: email, mode: "insensitive" }, isActive: true },
        });
        if (admin) {
          const { getAdminPermissions } = await import("@/lib/rbac");
          const permissions = await getAdminPermissions(admin.id);
          const roles = (
            await prisma.adminUserRole.findMany({
              where: { adminUserId: admin.id },
              include: { role: true },
            })
          ).map((r) => r.role.name);

          finalAccess = signAccess({ kind: "ADMIN", adminId: admin.id, roles, permissions });
          finalRefresh = signRefresh({ adminId: admin.id });
          await storeRefreshToken({ adminId: admin.id }, finalRefresh);
          setSessionCookies(finalAccess, finalRefresh);

          // If standard root redirect was requested, navigate directly to Admin Dashboard
          targetUrl = next === "/" ? "/admin" : next;
        }
      }

      const res = NextResponse.redirect(new URL(targetUrl, requestUrl.origin));
      // Explicitly attach cookies to redirect response for proxy & cross-origin safety
      res.cookies.set(ACCESS_COOKIE, finalAccess, cookieOpts(60 * 15));
      res.cookies.set(REFRESH_COOKIE, finalRefresh, { ...cookieOpts(60 * 60 * 24 * 7), path: "/api/auth/refresh" });
      res.cookies.set(LOGGED_IN_COOKIE, "1", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production" && !requestUrl.origin.includes("localhost"),
      });
      return res;
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

