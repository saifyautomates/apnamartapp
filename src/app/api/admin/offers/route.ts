import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import {
  getAllStoreOffers,
  saveStoreOffer,
  toggleStoreOffer,
  deleteStoreOffer,
  StoreOffer,
} from "@/lib/offers";
import { badRequest } from "@/lib/errors";
import { z } from "zod";

export const runtime = "nodejs";

const offerSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2).max(250),
  subtitle: z.string().max(500).optional(),
  badgeText: z.string().max(50).optional(),
  code: z.string().min(2).max(30),
  type: z.enum(["FLAT", "PERCENT", "FREE_DELIVERY"]),
  discountValue: z.number().min(1),
  minOrderValue: z.number().min(0),
  maxDiscountValue: z.number().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string(), // Required for live countdown timer
  isActive: z.boolean().optional(),
  autoApply: z.boolean().optional(),
  bgGradient: z.string().optional(),
});

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "offers:write");
  const items = await getAllStoreOffers();
  return ok(items);
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "offers:write");
  const body = offerSchema.parse(await readJson(req));

  const offer: StoreOffer = {
    id: body.id || `offer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: body.title,
    subtitle: body.subtitle || "",
    badgeText: body.badgeText || "⚡ FLASH OFFER",
    code: body.code.trim().toUpperCase(),
    type: body.type,
    discountValue: body.discountValue,
    minOrderValue: body.minOrderValue,
    maxDiscountValue: body.maxDiscountValue,
    startsAt: body.startsAt || new Date().toISOString(),
    endsAt: body.endsAt,
    isActive: body.isActive ?? true,
    autoApply: body.autoApply ?? false,
    bgGradient: body.bgGradient || "from-[#b91c1c] via-[#c2410c] to-[#d97706]",
    createdAt: new Date().toISOString(),
  };

  const list = await saveStoreOffer(offer);
  return ok({ success: true, offer, offers: list }, 201);
});

export const PATCH = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "offers:write");
  const body = (await readJson(req)) as { id?: string; isActive?: boolean };
  if (!body.id || typeof body.isActive !== "boolean") {
    throw badRequest("id and isActive (boolean) are required");
  }
  const updated = await toggleStoreOffer(body.id, body.isActive);
  if (!updated) throw badRequest("Offer not found");
  return ok({ success: true, offer: updated });
});

export const DELETE = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "offers:write");
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) throw badRequest("id parameter is required");
  await deleteStoreOffer(id);
  const remaining = await getAllStoreOffers();
  return ok({ success: true, offers: remaining });
});
