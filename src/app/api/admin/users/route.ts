import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { adminUserCreateSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "users:read");
  const items = await prisma.adminUser.findMany({
    where: { deletedAt: null },
    select: { id: true, username: true, email: true, isActive: true, mustChangePassword: true, lastLoginAt: true, createdAt: true, roles: { include: { role: true } } },
    orderBy: { createdAt: "asc" },
  });
  return ok(items);
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "users:write");
  const body = adminUserCreateSchema.parse(await readJson(req));
  const passwordHash = await hashPassword(body.password);
  const created = await prisma.$transaction(async (tx) => {
    const admin = await tx.adminUser.create({
      data: { username: body.username, email: body.email ?? `${body.username}@local.store`, passwordHash, mustChangePassword: true },
    });
    for (const roleName of body.roles) {
      const role = await tx.role.findUnique({ where: { name: roleName } });
      if (role) await tx.adminUserRole.create({ data: { adminUserId: admin.id, roleId: role.id } });
    }
    return admin;
  });
  await auditLog(prisma, { actorType: "ADMIN", actorId: session.adminId, action: "ADMIN_USER_CREATE", entityType: "AdminUser", entityId: created.id, after: { username: body.username, roles: body.roles }, ip: getClientIp(req) });
  return ok({ id: created.id, username: created.username }, 201);
});
