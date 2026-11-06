import { adminPageDenied } from "@/lib/admin-page";
import { prisma } from "@/lib/prisma";
import { CouponForm } from "@/components/admin-ui";
import { AdminCard, AdminPageHeader } from "@/components/admin-display";

export default async function AdminCouponsPage() {
  const denied = await adminPageDenied("coupons:write");
  if (denied) return denied;
  const coupons = await prisma.coupon.findMany({ include: { _count: { select: { usage: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <AdminPageHeader title="Coupons" subtitle="Usage counts come from the coupon ledger." />
      <AdminCard title={`${coupons.length} coupons`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-2">Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min order</th>
                <th>Used</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-adminline">
                  <td className="py-2.5 font-bold">{c.code}</td>
                  <td>{c.type}</td>
                  <td>{c.type === "PERCENT" ? `${c.discountPercent}%` : `₹${((c.discountPaise ?? 0) / 100).toFixed(2)}`}</td>
                  <td>₹{(c.minOrderPaise / 100).toFixed(2)}</td>
                  <td>
                    {c._count.usage}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td>{c.isActive ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 ? <p className="py-4 text-muted">No coupons yet.</p> : null}
        </div>
      </AdminCard>
      <AdminCard className="mt-6" title="Create coupon">
        <CouponForm />
      </AdminCard>
    </div>
  );
}
