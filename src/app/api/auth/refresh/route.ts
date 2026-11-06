import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { signAccess, signRefresh, setSessionCookies, storeRefreshToken, revokeRefreshToken } from "@/lib/auth";
import { getAdminPermissions } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { unauthorized } from "@/lib/errors";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest) => {
  const token = req.cookies.get("gcp_refresh")?.value;
  if (!token) throw unauthorized("No refresh token");
  let decoded: { userId?: string; adminId?: string; jti?: string; exp?: number };
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as typeof decoded;
  } catch {
    throw unauthorized("Invalid refresh token");
  }
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const stored = await prisma.refreshToken.findFirst({ where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } } });
  if (!stored) throw unauthorized("Refresh token revoked or expired");
  // Rotate: revoke old, issue new.
  await revokeRefreshToken(token);
  if (decoded.userId) {
    const access = signAccess({ kind: "CUSTOMER", userId: decoded.userId });
    const refresh = signRefresh({ userId: decoded.userId });
    await storeRefreshToken({ userId: decoded.userId }, refresh);
    setSessionCookies(access, refresh);
    return ok({ rotated: true });
  }
  if (decoded.adminId) {
    const roles = (await prisma.adminUserRole.findMany({ where: { adminUserId: decoded.adminId }, include: { role: true } })).map((r) => r.role.name);
    const permissions = await getAdminPermissions(decoded.adminId);
    const access = signAccess({ kind: "ADMIN", adminId: decoded.adminId, roles, permissions });
    const refresh = signRefresh({ adminId: decoded.adminId });
    await storeRefreshToken({ adminId: decoded.adminId }, refresh);
    setSessionCookies(access, refresh);
    return ok({ rotated: true });
  }
  throw unauthorized("Invalid refresh token");
});
