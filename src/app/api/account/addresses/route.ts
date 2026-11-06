import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireCustomer, assertCsrf } from "@/lib/auth";
import { addressSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const { userId } = await requireCustomer(req);
  const items = await prisma.customerAddress.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return ok(items);
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const { userId } = await requireCustomer(req);
  const body = addressSchema.parse(await readJson(req));
  const created = await prisma.$transaction(async (tx) => {
    if (body.isDefault) {
      await tx.customerAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.customerAddress.create({ data: { ...body, userId } });
  });
  return ok(created, 201);
});
