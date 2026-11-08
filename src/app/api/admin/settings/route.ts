import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getAllSettings, setSetting } from "@/lib/settings";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";
import { settingsSchema } from "@/lib/validation";
import { buildManifest } from "@/lib/manifest";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "settings:write");
  return ok(await getAllSettings(true));
});

export const PUT = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "settings:write");
  const body = settingsSchema.parse(await readJson(req));
  for (const [key, value] of Object.entries(body)) {
    await setSetting(key, value);
  }

  // If store branding was updated, sync the static manifest files as well
  if (body.store && typeof body.store === "object") {
    try {
      const manifest = buildManifest(body.store as Record<string, string>);
      const pubDir = path.join(process.cwd(), "public");
      await fs.writeFile(
        path.join(pubDir, "manifest.json"),
        JSON.stringify(manifest, null, 2),
        "utf-8"
      );
      await fs.writeFile(
        path.join(pubDir, "manifest.webmanifest"),
        JSON.stringify(manifest, null, 2),
        "utf-8"
      );
    } catch (err) {
      console.error("[settings:manifest-sync-failed]", err);
    }
  }

  // Invalidate Next.js cache so layout and all SSR pages pick up new settings immediately
  try {
    revalidatePath("/", "layout");
  } catch {
    /* ignore in tests/offline */
  }

  await auditLog(prisma, {
    actorType: "ADMIN",
    actorId: session.adminId,
    action: "SETTINGS_UPDATE",
    entityType: "Setting",
    after: body,
    ip: getClientIp(req),
  });

  return ok(await getAllSettings(true));
});
