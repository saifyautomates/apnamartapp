import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { zoneUpsertSchema, slotUpsertSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "delivery:write");
  const kind = new URL(req.url).searchParams.get("kind") ?? "zones";
  if (kind === "slots") {
    const slots = await prisma.deliverySlot.findMany({ include: { zone: true }, orderBy: { label: "asc" } });
    return ok(slots);
  }
  const zones = await prisma.deliveryZone.findMany({ include: { slots: true }, orderBy: { name: "asc" } });
  return ok(zones);
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "delivery:write");
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "zones";
  if (kind === "slots") {
    const body = slotUpsertSchema.parse(await readJson(req));
    const created = await prisma.deliverySlot.create({ data: body });
    return ok(created, 201);
  }
  const body = zoneUpsertSchema.parse(await readJson(req));
  const created = await prisma.deliveryZone.create({ data: body });
  return ok(created, 201);
});
