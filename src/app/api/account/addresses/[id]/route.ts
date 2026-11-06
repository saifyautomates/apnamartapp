import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireCustomer, assertCsrf } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/errors";

export const runtime = "nodejs";

export const DELETE = handler(async (req: NextRequest, ctx: { params: Record<string, string> }) => {
  assertCsrf(req);
  const { userId } = await requireCustomer(req);
  const address = await prisma.customerAddress.findFirst({ where: { id: ctx.params.id, userId } });
  if (!address) throw notFound("Address not found");
  await prisma.customerAddress.update({ where: { id: address.id }, data: { deletedAt: new Date() } });
  return ok({ deleted: true });
});
