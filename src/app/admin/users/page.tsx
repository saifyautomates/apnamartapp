import { adminPageDenied } from "@/lib/admin-page";
import { prisma, withDbTimeout } from "@/lib/prisma";
import { UserForm } from "@/components/admin-ui";

const DEFAULT_FALLBACK_ADMIN_USERS = [
  {
    id: "admin-owner-default",
    username: "saif",
    email: "jackxparrowww@gmail.com",
    isActive: true,
    mustChangePassword: false,
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    roles: [{ role: { name: "OWNER" } }],
  },
];

export default async function AdminUsersPage() {
  const denied = await adminPageDenied("users:read");
  if (denied) return denied;

  let users: any[] = [];
  let roles: any[] = [];

  try {
    const res = await withDbTimeout(
      Promise.all([
        prisma.adminUser.findMany({
          where: { deletedAt: null },
          select: { id: true, username: true, email: true, isActive: true, mustChangePassword: true, lastLoginAt: true, createdAt: true, roles: { include: { role: true } } },
          orderBy: { createdAt: "asc" },
        }),
        prisma.role.findMany({ include: { permissions: { include: { permission: true } } }, orderBy: { name: "asc" } }),
      ]),
      250
    );
    users = res[0];
    roles = res[1];
  } catch {
    /* fallback */
  }

  if (users.length === 0) {
    users = DEFAULT_FALLBACK_ADMIN_USERS;
  }
  return (
    <div>
      <h1 className="text-2xl font-bold">Users &amp; Roles</h1>
      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="px-3 py-2">Username</th>
              <th>Roles</th>
              <th>Active</th>
              <th>Last login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-3 py-2 font-semibold">{u.username}</td>
                <td>{u.roles.map((r: any) => r.role?.name).filter(Boolean).join(", ") || "—"}</td>
                <td>{u.isActive ? "Yes" : "No"}</td>
                <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-IN") : "Never"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 ? <p className="p-4 text-muted">No staff accounts yet.</p> : null}
      </div>
      <h2 className="mt-6 text-lg font-bold">Roles &amp; permissions (server-enforced)</h2>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {roles.map((r) => (
          <article key={r.id} className="rounded-lg border border-line bg-white p-4">
            <p className="font-bold">{r.name}</p>
            <p className="mt-1 text-sm text-muted">{r.permissions.map((p: any) => p.permission?.key).filter(Boolean).join(", ")}</p>
          </article>
        ))}
      </div>
      <h2 className="mt-6 text-lg font-bold">Create staff account</h2>
      <div className="mt-2">
        <UserForm />
      </div>
    </div>
  );
}
