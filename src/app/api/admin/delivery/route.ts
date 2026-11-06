import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { zoneUpsertSchema, slotUpsertSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { setSetting, getAllSettings } from "@/lib/settings";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "delivery:write");
  const kind = new URL(req.url).searchParams.get("kind") ?? "zones";
  if (kind === "slots") {
    const slots = await prisma.deliverySlot.findMany({ include: { zone: true }, orderBy: { label: "asc" } });
    return ok(slots);
  }
  if (kind === "config") {
    const settings = await getAllSettings();
    return ok({ delivery: settings.delivery, zoneDeliveryRules: settings.zoneDeliveryRules });
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

export const PUT = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "delivery:write");
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "zones";

  if (kind === "config") {
    const body = (await readJson(req)) as { delivery?: unknown; zoneDeliveryRules?: unknown };
    if (body.delivery) await setSetting("delivery", body.delivery);
    if (body.zoneDeliveryRules) await setSetting("zoneDeliveryRules", body.zoneDeliveryRules);
    return ok({ updated: true });
  }

  const id = url.searchParams.get("id");
  if (!id) throw new Error("ID is required for update");

  if (kind === "slots") {
    const body = slotUpsertSchema.parse(await readJson(req));
    const updated = await prisma.deliverySlot.update({
      where: { id },
      data: body,
    });
    return ok(updated);
  }

  const body = zoneUpsertSchema.parse(await readJson(req));
  const updated = await prisma.deliveryZone.update({
    where: { id },
    data: body,
  });
  return ok(updated);
});

export const DELETE = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "delivery:write");
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "zones";
  const id = url.searchParams.get("id");
  if (!id) throw new Error("ID is required for deletion");

  if (kind === "slots") {
    await prisma.deliverySlot.delete({ where: { id } });
    return ok({ deleted: true });
  }

  // Delete all associated slots first to prevent foreign key errors
  await prisma.deliverySlot.deleteMany({ where: { zoneId: id } });
  await prisma.deliveryZone.delete({ where: { id } });
  return ok({ deleted: true });
});
