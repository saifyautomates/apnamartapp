import { adminPageDenied } from "@/lib/admin-page";
import { prisma, withDbTimeout } from "@/lib/prisma";

export default async function AdminAuditPage() {
  const denied = await adminPageDenied("audit:read");
  if (denied) return denied;

  let logs: any[] = [];
  try {
    logs = await withDbTimeout(
      prisma.auditLog.findMany({ include: { actor: { select: { username: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
      250
    );
  } catch {
    /* fallback */
  }
  return (
    <div>
      <h1 className="text-2xl font-bold">Audit logs</h1>
      <div className="mt-4 space-y-2">
        {logs.map((l) => (
          <article key={l.id} className="rounded-lg border border-line bg-white p-3 text-sm">
            <p className="font-semibold">{l.action} · {l.entityType}{l.entityId ? `/${l.entityId}` : ""}</p>
            <p className="text-muted">
              {l.actorType}{l.actor ? ` (${l.actor.username})` : ""} · {new Date(l.createdAt).toLocaleString("en-IN")}
              {l.ip ? ` · ${l.ip}` : ""}
            </p>
            {l.before || l.after ? (
              <details className="mt-1 text-xs">
                <summary className="cursor-pointer text-muted">Before / after</summary>
                <pre className="mt-1 overflow-auto whitespace-pre-wrap">{JSON.stringify({ before: l.before, after: l.after }, null, 2)}</pre>
              </details>
            ) : null}
          </article>
        ))}
        {logs.length === 0 ? <p className="text-muted">No audit entries yet.</p> : null}
      </div>
    </div>
  );
}
