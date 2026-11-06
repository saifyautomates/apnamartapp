import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { categoryUpsertSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "products:read");
  const items = await prisma.category.findMany({
    where: { deletedAt: null },
    include: { subcategories: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } }, _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return ok(items);
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "categories:write");
  const body = categoryUpsertSchema.parse(await readJson(req));
  const created = await prisma.category.create({ data: body });
  return ok(created, 201);
});
