import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getAllSettings, setSetting } from "@/lib/settings";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";
import { settingsSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "settings:write");
  return ok(await getAllSettings());
});

export const PUT = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "settings:write");
  const body = settingsSchema.parse(await readJson(req));
  for (const [key, value] of Object.entries(body)) {
    await setSetting(key, value);
  }
  await auditLog(prisma, { actorType: "ADMIN", actorId: session.adminId, action: "SETTINGS_UPDATE", entityType: "Setting", after: body, ip: getClientIp(req) });
  return ok(await getAllSettings());
});
