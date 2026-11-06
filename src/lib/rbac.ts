import { prisma } from "./prisma";
import { forbidden } from "./errors";
import type { Session } from "./auth";

/**
 * Server-enforced RBAC. Frontend hiding is never sufficient — every admin route
 * must call requirePermission. Permission keys: "<area>:<action>", e.g. "orders:write".
 */
export const PERMISSIONS = [
  "dashboard:read",
  "orders:read",
  "orders:write",
  "products:read",
  "products:write",
  "categories:write",
  "inventory:read",
  "inventory:write",
  "customers:read",
  "customers:write",
  "offers:write",
  "coupons:write",
  "delivery:write",
  "payments:read",
  "payments:write",
  "loyalty:write",
  "credit:write",
  "reports:read",
  "integrations:read",
  "integrations:write",
  "users:read",
  "users:write",
  "settings:write",
  "audit:read",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

// Default role → permission mapping (seeded; editable via admin users page only by OWNER).
export const ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  OWNER: [...PERMISSIONS],
  MANAGER: [
    "dashboard:read", "orders:read", "orders:write", "products:read", "products:write",
    "categories:write", "inventory:read", "inventory:write", "customers:read", "customers:write",
    "offers:write", "coupons:write", "delivery:write", "payments:read", "payments:write",
    "loyalty:write", "credit:write", "reports:read", "integrations:read", "audit:read",
  ],
  ORDER_STAFF: ["dashboard:read", "orders:read", "orders:write", "customers:read", "payments:read"],
  INVENTORY_STAFF: ["dashboard:read", "products:read", "inventory:read", "inventory:write", "orders:read"],
  DELIVERY_STAFF: ["dashboard:read", "orders:read", "orders:write"],
};

export async function getAdminPermissions(adminId: string): Promise<string[]> {
  const rows = await prisma.adminUserRole.findMany({
    where: { adminUserId: adminId },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  const set = new Set<string>();
  for (const r of rows) {
    for (const p of r.role.permissions) set.add(p.permission.key);
  }
  return [...set];
}

export function requirePermission(session: Session, key: PermissionKey): void {
  if (session.kind !== "ADMIN") throw forbidden("Admin session required");
  if (!session.permissions.includes(key)) throw forbidden(`Missing permission: ${key}`);
}
