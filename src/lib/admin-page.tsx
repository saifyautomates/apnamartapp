import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccess } from "@/lib/auth";
import { getAdminPermissions, type PermissionKey } from "@/lib/rbac";

/**
 * Server-side RBAC gate for admin pages. API routes enforce permissions too;
 * this gate stops a lower-privilege role from ever seeing a page's
 * server-rendered data (not just hiding its nav button).
 * Returns a denial element when the role lacks the permission, null when allowed.
 * Redirects to staff login when there is no valid admin session.
 */
export async function adminPageDenied(permission: PermissionKey): Promise<React.ReactNode | null> {
  const token = cookies().get("gcp_access")?.value;
  if (!token) redirect("/staff-login");
  let session;
  try {
    session = verifyAccess(token);
  } catch {
    redirect("/staff-login");
  }
  if (session.kind !== "ADMIN" || !session.adminId) redirect("/staff-login");
  const perms = await getAdminPermissions(session.adminId);
  if (!perms.includes(permission)) {
    return (
      <div className="py-10">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-muted">
          Your staff role does not include the <strong>{permission}</strong> permission. Ask the store owner for access.
        </p>
        <a href="/admin" className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white">
          Back to dashboard
        </a>
      </div>
    );
  }
  return null;
}
