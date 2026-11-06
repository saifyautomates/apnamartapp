"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface ActiveOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
}

export function ActiveOrderPill() {
  const pathname = usePathname();
  const [activeOrder, setActiveOrder] = useState<ActiveOrderSummary | null>(null);

  useEffect(() => {
    // If user is already on the order detail page, hide the pill
    if (pathname.startsWith("/orders/")) {
      setActiveOrder(null);
      return;
    }

    let mounted = true;
    async function checkActiveOrders() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const json = await res.json();
          const orders = (json?.data?.orders ?? []) as ActiveOrderSummary[];
          const inProgress = orders.find((o) =>
            ["PLACED", "CONFIRMED", "PREPARING", "PACKED", "OUT_FOR_DELIVERY"].includes(o.status)
          );
          if (mounted) {
            setActiveOrder(inProgress ?? null);
          }
        }
      } catch {
        /* guest or not logged in */
      }
    }

    checkActiveOrders();
    const interval = setInterval(checkActiveOrders, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [pathname]);

  if (!activeOrder) return null;

  const isRiderOut = activeOrder.status === "OUT_FOR_DELIVERY";

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 animate-bounce-subtle">
      <Link
        href={`/orders/${activeOrder.id}`}
        className="group flex items-center gap-3 rounded-2xl bg-[#1c1c1c] text-white pl-3.5 pr-4 py-2.5 shadow-2xl border-2 border-[#0c831f] hover:scale-105 transition-all duration-200 cursor-pointer"
        aria-label="Track live delivery"
      >
        <div className="relative flex items-center justify-center h-8 w-8 rounded-xl bg-[#0c831f] text-white text-base">
          <span>🛵</span>
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#f8cb46] animate-ping" />
        </div>

        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-[#f8cb46] uppercase tracking-wider">
              {isRiderOut ? "Rider on the way" : "Same-Day Dispatch"}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-bold text-neutral-200 group-hover:text-white transition">
            Order #{activeOrder.orderNumber} · Track Live →
          </span>
        </div>
      </Link>
    </div>
  );
}

export default ActiveOrderPill;

