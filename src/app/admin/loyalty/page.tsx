import { adminPageDenied } from "@/lib/admin-page";
import { prisma, withDbTimeout } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin-display";

export default async function AdminLoyaltyPage() {
  const denied = await adminPageDenied("loyalty:write");
  if (denied) return denied;

  let accounts: any[] = [];
  try {
    accounts = await withDbTimeout(
      prisma.loyaltyAccount.findMany({ include: { user: { select: { phone: true, name: true } } }, orderBy: { points: "desc" }, take: 100 }),
      250
    );
  } catch {
    /* fallback */
  }
  return (
    <div>
      <AdminPageHeader title="Loyalty" subtitle="Points are a ledger: the account total is a cached sum of loyalty transactions, never the source of truth." />
      <AdminCard title={`${accounts.length} loyalty accounts`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-2">Customer</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-t border-adminline">
                  <td className="py-2.5">
                    {a.user.name ?? a.user.phone} ({a.user.phone})
                  </td>
                  <td>{a.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {accounts.length === 0 ? <p className="py-4 text-muted">No loyalty accounts yet.</p> : null}
        </div>
      </AdminCard>
    </div>
  );
}
