import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const { userId } = await requireCustomer(req);
  const account = await prisma.storeCreditAccount.findUnique({
    where: { userId },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  return ok(account ?? { userId, balancePaise: 0, transactions: [] });
});
