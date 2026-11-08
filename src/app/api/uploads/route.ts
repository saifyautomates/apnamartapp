import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { getStorage, validateUpload } from "@/lib/storage";
import crypto from "crypto";

export const runtime = "nodejs";

/** Image upload (admin). Files go to S3 when configured, else local ./public/uploads. */
export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  const isOwner = session.roles?.includes("OWNER") || session.adminId === "admin-owner-default";
  if (!isOwner) {
    // Allow either products:write or settings:write
    try {
      requirePermission(session, "settings:write");
    } catch {
      requirePermission(session, "products:write");
    }
  }
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const folder = (form.get("folder") as string) || "products";
  if (!file) throw new Error("No file uploaded");
  validateUpload(file.type, file.size);
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
  const key = `${safeFolder || "uploads"}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const url = await getStorage().upload(key, buffer, file.type);
  return ok({ url, key });
});
