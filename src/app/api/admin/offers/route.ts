import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const offerSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.number().int().min(0),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean().optional(),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
});

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "offers:write");
  const items = await prisma.offer.findMany({
    include: { products: true, categories: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(items);
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "offers:write");
  const body = offerSchema.parse(await readJson(req));
  const created = await prisma.offer.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      type: body.type,
      value: body.value,
      startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      isActive: body.isActive ?? true,
      products: { create: (body.productIds ?? []).map((productId) => ({ productId })) },
      categories: { create: (body.categoryIds ?? []).map((categoryId) => ({ categoryId })) },
    },
  });
  return ok(created, 201);
});
