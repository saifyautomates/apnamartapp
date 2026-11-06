import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { hashPassword, signAccess, signRefresh, setSessionCookies, storeRefreshToken, assertCsrf } from "@/lib/auth";
import { getAdminPermissions } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { badRequest, conflict } from "@/lib/errors";
import { z } from "zod";

export const runtime = "nodejs";

const setupSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
});

/**
 * First-run setup: works ONLY when zero admin users exist. Creates the OWNER
 * account. In production, prefer seeding ADMIN_PASSWORD via env (see seed.ts);
 * this endpoint exists for installs where no env password was provided.
 */
export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const existing = await prisma.adminUser.count();
  if (existing > 0) throw conflict("Setup already completed");
  const body = setupSchema.parse(await readJson(req));
  const hash = await hashPassword(body.password);
  const admin = await prisma.adminUser.create({
    data: { username: body.username, email: `${body.username}@local.store`, passwordHash: hash, mustChangePassword: false },
  });
  const ownerRole = await prisma.role.findUnique({ where: { name: "OWNER" } });
  if (ownerRole) {
    await prisma.adminUserRole.create({ data: { adminUserId: admin.id, roleId: ownerRole.id } });
  }
  const permissions = await getAdminPermissions(admin.id);
  const access = signAccess({ kind: "ADMIN", adminId: admin.id, roles: ["OWNER"], permissions });
  const refresh = signRefresh({ adminId: admin.id });
  await storeRefreshToken({ adminId: admin.id }, refresh);
  setSessionCookies(access, refresh);
  return ok({ admin: { id: admin.id, username: admin.username } });
});
