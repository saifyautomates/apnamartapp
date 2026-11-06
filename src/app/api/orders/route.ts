import { NextRequest } from "next/server";
import { handler, ok, getPagination } from "@/lib/http";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const { userId } = await requireCustomer(req);
  const { page, pageSize } = getPagination(req);
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where: { userId } }),
  ]);
  return ok({ items, total, page, pageSize });
});
