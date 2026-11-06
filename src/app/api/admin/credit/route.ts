import { NextRequest } from "next/server";
import { handler, ok, readJson, getPagination } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { creditAdjustSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { issueCredit, adjustCredit } from "@/lib/credit";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "credit:write");
  const { page, pageSize } = getPagination(req);
  const [items, total] = await Promise.all([
    prisma.storeCreditAccount.findMany({
      include: { user: { select: { phone: true, name: true } }, transactions: { orderBy: { createdAt: "desc" }, take: 5 } },
      orderBy: { balancePaise: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.storeCreditAccount.count(),
  ]);
  return ok({ items, total, page, pageSize });
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "credit:write");
  const body = creditAdjustSchema.parse(await readJson(req));
  const balance = await prisma.$transaction(async (tx) => {
    if (body.amountPaise > 0) return issueCredit(tx, body.userId, body.amountPaise, body.reason, session.adminId);
    return adjustCredit(tx, body.userId, body.amountPaise, body.reason, session.adminId);
  });
  await auditLog(prisma, { actorType: "ADMIN", actorId: session.adminId, action: "CREDIT_ADJUST", entityType: "StoreCreditAccount", entityId: body.userId, after: { amountPaise: body.amountPaise, reason: body.reason, balancePaise: balance }, ip: getClientIp(req) });
  return ok({ balancePaise: balance });
});
