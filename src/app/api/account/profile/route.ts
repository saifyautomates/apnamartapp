import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireCustomer, assertCsrf } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const { userId } = await requireCustomer(req);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, name: true, email: true, createdAt: true },
  });
  return ok(user);
});

export const PATCH = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const { userId } = await requireCustomer(req);
  const body = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional().nullable(),
  }).parse(await readJson(req));
  const updated = await prisma.user.update({ where: { id: userId }, data: body });
  return ok({ id: updated.id, phone: updated.phone, name: updated.name, email: updated.email });
});
