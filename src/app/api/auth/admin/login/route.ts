import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { verifyPassword, signAccess, signRefresh, setSessionCookies, storeRefreshToken, assertCsrf } from "@/lib/auth";
import { adminLoginSchema } from "@/lib/validation";
import { getAdminPermissions } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { unauthorized } from "@/lib/errors";
import { rateLimitOrThrow } from "@/lib/rateLimit";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const body = adminLoginSchema.parse(await readJson(req));
  rateLimitOrThrow(`admin-login:${body.username}`, 15, 15 * 60 * 1000, "Too many login attempts");

  // Query database for admin user by username or email
  const admin = await prisma.adminUser.findFirst({
    where: {
      OR: [
        { username: { equals: body.username, mode: "insensitive" } },
        { email: { equals: body.username, mode: "insensitive" } },
      ],
      isActive: true,
    },
  });

  if (!admin) {
    throw unauthorized("Invalid credentials");
  }

  const okPass = await verifyPassword(body.password, admin.passwordHash);
  if (!okPass) {
    throw unauthorized("Invalid credentials");
  }

  // Fetch verified roles and permissions from database
  const permissions = await getAdminPermissions(admin.id);
  const adminRoles = await prisma.adminUserRole.findMany({
    where: { adminUserId: admin.id },
    include: { role: true },
  });
  const roles = adminRoles.map((r) => r.role.name);

  // Update last login timestamp
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const access = signAccess({
    kind: "ADMIN",
    adminId: admin.id,
    roles,
    permissions,
  });
  const refresh = signRefresh({ adminId: admin.id });

  try {
    await storeRefreshToken({ adminId: admin.id }, refresh);
  } catch {
    /* ignore refresh token storage error */
  }

  setSessionCookies(access, refresh);

  return ok({
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      roles,
      mustChangePassword: admin.mustChangePassword,
    },
  });
});
