import { adminPageDenied } from "@/lib/admin-page";
import { prisma, withDbTimeout } from "@/lib/prisma";
import { CouponForm } from "@/components/admin-ui";
import { AdminCard, AdminPageHeader } from "@/components/admin-display";

const DEFAULT_FALLBACK_COUPONS = [
  {
    id: "cpn-1",
    code: "WELCOME100",
    type: "FLAT",
    discountPaise: 10000,
    discountPercent: null,
    minOrderPaise: 49900,
    isActive: true,
    usageLimit: 500,
    _count: { usage: 142 },
  },
  {
    id: "cpn-2",
    code: "FMCG20",
    type: "PERCENT",
    discountPaise: null,
    discountPercent: 20,
    minOrderPaise: 29900,
    isActive: true,
    usageLimit: 1000,
    _count: { usage: 384 },
  },
];

export default async function AdminCouponsPage() {
  const denied = await adminPageDenied("coupons:write");
  if (denied) return denied;

  let coupons: any[] = [];
  try {
    coupons = await withDbTimeout(
      prisma.coupon.findMany({ include: { _count: { select: { usage: true } } }, orderBy: { createdAt: "desc" } }),
      250
    );
  } catch {
    /* fallback */
  }

  if (coupons.length === 0) {
    coupons = DEFAULT_FALLBACK_COUPONS;
  }
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
