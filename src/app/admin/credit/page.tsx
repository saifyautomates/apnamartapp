import { adminPageDenied } from "@/lib/admin-page";
import { prisma, withDbTimeout } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { CreditAdjustForm } from "@/components/admin-ui";

export default async function AdminCreditPage() {
  const denied = await adminPageDenied("credit:write");
  if (denied) return denied;

  let accounts: any[] = [];
  try {
    accounts = await withDbTimeout(
      prisma.storeCreditAccount.findMany({ include: { user: { select: { phone: true, name: true } } }, orderBy: { balancePaise: "desc" }, take: 100 }),
      250
    );
  } catch {
    /* fallback */
  }
  return (
    <div>
      <h1 className="text-2xl font-bold">Store credit</h1>
      <div className="mt-4">
        <CreditAdjustForm />
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="px-3 py-2">Customer</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-t border-line">
                <td className="px-3 py-2">{a.user.name ?? a.user.phone} ({a.user.phone})</td>
                <td>{formatPaise(a.balancePaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {accounts.length === 0 ? <p className="p-4 text-muted">No store credit accounts yet.</p> : null}
      </div>
    </div>
  );
}
