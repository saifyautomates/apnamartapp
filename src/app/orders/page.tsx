import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAccess } from "@/lib/auth";
import { Price, EmptyState, EtaBadge } from "@/components/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const token = cookies().get("gcp_access")?.value;
  let userId: string | null = null;
  if (token) {
    try {
      const s = verifyAccess(token);
      if (s.kind === "CUSTOMER") userId = s.userId ?? null;
    } catch {
      /* not logged in */
    }
  }
  if (!userId) redirect("/login?next=/orders");

  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const statusColors: Record<string, string> = {
    DELIVERED: "bg-emerald-50 text-emerald-800 border-emerald-200",
    OUT_FOR_DELIVERY: "bg-amber-50 text-amber-800 border-amber-200",
    PREPARING: "bg-blue-50 text-blue-800 border-blue-200",
    PACKED: "bg-indigo-50 text-indigo-800 border-indigo-200",
    PLACED: "bg-slate-100 text-slate-800 border-slate-200",
    CONFIRMED: "bg-emerald-50 text-emerald-800 border-emerald-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-100 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-ink">My Orders</h1>
          <p className="mt-0.5 text-xs text-muted font-medium">Track all your past & live grocery deliveries</p>
        </div>
        <EtaBadge minutes={10} className="px-3 py-1 text-xs" />
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders placed yet"
          body="Your orders will show up here. Start exploring our 10-minute grocery delivery store."
          action={
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-6 py-2.5 text-xs font-black text-white shadow-sm transition"
            >
              Start Shopping →
            </Link>
          }
        />
      ) : (
        <div className="space-y-3.5">
          {orders.map((o) => {
            const badgeClass = statusColors[o.status] ?? "bg-slate-100 text-slate-800 border-slate-200";
            return (
              <article
                key={o.id}
                className="group rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-xs hover:border-emerald-500 hover:shadow-md transition duration-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-ink">#{o.orderNumber}</span>
                    <span className="text-[11px] text-muted">
                      · {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider border ${badgeClass}`}>
                    {o.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium text-slate-600">
                      {o.items.length} {o.items.length === 1 ? "item" : "items"}:{" "}
                      <span className="text-ink font-bold">
                        {o.items.map((i) => i.productName).slice(0, 2).join(", ")}
                        {o.items.length > 2 ? ` +${o.items.length - 2} more` : ""}
                      </span>
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">
                      Total Paid: <Price paise={o.grandTotalPaise} className="font-black text-ink text-xs" />
                    </p>
                  </div>

                  <Link
                    href={`/orders/${o.id}`}
                    className="rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 hover:border-emerald-500 px-3.5 py-2 text-xs font-black text-slate-700 transition"
                  >
                    Track / View Details →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
