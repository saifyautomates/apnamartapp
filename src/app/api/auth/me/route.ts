import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await getSession(req);
  if (!session) return ok({ session: null });
  if (session.kind === "CUSTOMER") {
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, phone: true, name: true, email: true } });
    return ok({ session: { kind: "CUSTOMER", user } });
  }
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminId },
    select: { id: true, username: true, email: true, mustChangePassword: true },
  });
  return ok({ session: { kind: "ADMIN", admin, roles: session.roles, permissions: session.permissions } });
});
