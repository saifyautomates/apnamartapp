import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireCustomer, assertCsrf } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const { userId } = await requireCustomer(req);
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: { variant: { include: { product: { include: { images: { take: 1 } } }, inventory: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(items);
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const { userId } = await requireCustomer(req);
  const body = z.object({ variantId: z.string().min(1) }).parse(await readJson(req));
  const item = await prisma.wishlistItem.upsert({
    where: { userId_variantId: { userId, variantId: body.variantId } },
    create: { userId, variantId: body.variantId },
    update: {},
  });
  return ok(item, 201);
});

export const DELETE = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const { userId } = await requireCustomer(req);
  const variantId = new URL(req.url).searchParams.get("variantId");
  if (!variantId) return ok({ deleted: false });
  await prisma.wishlistItem.deleteMany({ where: { userId, variantId } });
  return ok({ deleted: true });
});
