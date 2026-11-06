import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true },
    include: { slots: { where: { isActive: true }, orderBy: { label: "asc" } } },
    orderBy: { name: "asc" },
  });
  return ok(zones);
});
