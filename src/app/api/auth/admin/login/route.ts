import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { verifyPassword, signAccess, signRefresh, setSessionCookies, storeRefreshToken, assertCsrf } from "@/lib/auth";
import { adminLoginSchema } from "@/lib/validation";
import { getAdminPermissions } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { unauthorized, forbidden } from "@/lib/errors";
import { rateLimitOrThrow } from "@/lib/rateLimit";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const body = adminLoginSchema.parse(await readJson(req));
  rateLimitOrThrow(`admin-login:${body.username}`, 10, 15 * 60 * 1000, "Too many login attempts");
  const admin = await prisma.adminUser.findUnique({ where: { username: body.username } });
  if (!admin || !admin.isActive) throw unauthorized("Invalid credentials");
  const okPass = await verifyPassword(body.password, admin.passwordHash);
  if (!okPass) throw unauthorized("Invalid credentials");
  const permissions = await getAdminPermissions(admin.id);
  const roles = (await prisma.adminUserRole.findMany({ where: { adminUserId: admin.id }, include: { role: true } })).map(
    (r) => r.role.name,
  );
  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  const access = signAccess({ kind: "ADMIN", adminId: admin.id, roles, permissions });
  const refresh = signRefresh({ adminId: admin.id });
  await storeRefreshToken({ adminId: admin.id }, refresh);
  setSessionCookies(access, refresh);
  return ok({
    admin: { id: admin.id, username: admin.username, email: admin.email, roles, mustChangePassword: admin.mustChangePassword },
  });
});
