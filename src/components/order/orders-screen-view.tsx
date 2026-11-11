"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Package, Clock } from "lucide-react";
import { formatPaise } from "@/lib/money";

export interface OrderItemSummary {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: "DELIVERED" | "OUT_FOR_DELIVERY" | "PREPARING" | "PLACED" | "CANCELLED";
  grandTotalPaise: number;
  items: Array<{
    name: string;
    imageUrl?: string | null;
    qty?: number;
  }>;
}

const DEMO_ORDERS: OrderItemSummary[] = [
  {
    id: "ord-cm12345",
    orderNumber: "CM12345",
    createdAt: new Date().toISOString(),
    status: "DELIVERED",
    grandTotalPaise: 8500,
    items: [
      {
        name: "Lay's Classic Salted Potato Chips 52g",
        imageUrl: "/images/products/lays-classic-salted-potato-chips.jpg",
        qty: 1,
      },
    ],
  },
  {
    id: "ord-cm12344",
    orderNumber: "CM12344",
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: "DELIVERED",
    grandTotalPaise: 22000,
    items: [
      {
        name: "Coca-Cola Original Soft Drink 750ml",
        imageUrl: "/images/products/coca-cola-original-soft-drink.jpg",
        qty: 2,
      },
    ],
  },
  {
    id: "ord-cm12343",
    orderNumber: "CM12343",
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    status: "CANCELLED",
    grandTotalPaise: 14500,
    items: [
      {
        name: "Bingo! Mad Angles Masala 65g",
        imageUrl: "/images/products/lays-classic-salted-potato-chips.jpg",
        qty: 1,
      },
    ],
  },
];

export function OrdersScreenView({
  orders = [],
  isLoggedIn = false,
}: {
  orders?: OrderItemSummary[];
  isLoggedIn?: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"All" | "Delivered" | "Cancelled">("All");

  const displayOrders = orders.length > 0 ? orders : DEMO_ORDERS;

  const filteredOrders = useMemo(() => {
    if (activeTab === "All") return displayOrders;
    if (activeTab === "Delivered") {
      return displayOrders.filter(
        (o) => o.status === "DELIVERED" || o.status === "OUT_FOR_DELIVERY"
      );
    }
    if (activeTab === "Cancelled") {
      return displayOrders.filter((o) => o.status === "CANCELLED");
    }
    return displayOrders;
  }, [activeTab, displayOrders]);

  function formatOrderTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 3600);
    const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return `Today, ${timeStr}`;
    }
    if (diffHours < 48) {
      return `Yesterday, ${timeStr}`;
    }
    return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${timeStr}`;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* Top Header matching Mockup Screen 8: "← My Orders" */}
      <div className="flex items-center justify-between py-2 border-b border-neutral-100">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-base font-black text-[#1c1c1c] hover:text-[#0c831f] transition cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
          <span>My Orders</span>
        </button>
      </div>

      {/* Filter Tabs matching Screen 8: All | Delivered | Cancelled */}
      <div className="flex items-center gap-2 pt-1">
        {(["All", "Delivered", "Cancelled"] as const).map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? "bg-[#063b1e] text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Orders List matching Screen 8 Card Style */}
      <div className="space-y-3 pt-2">
        {filteredOrders.map((o) => {
          const isDelivered = o.status === "DELIVERED" || o.status === "OUT_FOR_DELIVERY";
          const isCancelled = o.status === "CANCELLED";
          const firstItem = o.items[0];
          const imgUrl = firstItem?.imageUrl || "/images/products/lays-classic-salted-potato-chips.jpg";

          return (
            <article
              key={o.id}
              className="group rounded-2xl border border-neutral-100 bg-white p-3.5 sm:p-4 shadow-xs hover:border-emerald-300 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: Product Thumbnail */}
                <div className="relative h-16 w-16 shrink-0 rounded-xl bg-neutral-50 border border-neutral-100 p-1 flex items-center justify-center overflow-hidden">
                  <Image
                    src={imgUrl}
                    alt={firstItem?.name || "Order item"}
                    fill
                    className="object-contain p-1"
                    unoptimized
                  />
                </div>

                {/* Middle: Order Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-[#1c1c1c] leading-tight">
                    Order #{o.orderNumber}
                  </h4>
                  <p className="text-xs font-medium text-neutral-400 mt-0.5">
                    {formatOrderTime(o.createdAt)}
                  </p>
                  <p className="text-xs font-bold mt-1">
                    <span className="text-[#1c1c1c] font-black">{formatPaise(o.grandTotalPaise)}</span>
                    <span className="mx-1 text-neutral-300">•</span>
                    <span
                      className={
                        isCancelled
                          ? "text-red-500 font-bold"
                          : "text-[#0c831f] font-bold"
                      }
                    >
                      {isCancelled ? "Cancelled" : "Delivered"}
                    </span>
                  </p>
                </div>

                {/* Right: View Details link */}
                <Link
                  href={`/orders/${o.id}`}
                  className="flex items-center gap-0.5 text-xs font-black text-[#0c831f] hover:text-[#0a701a] group-hover:translate-x-0.5 transition-transform shrink-0"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center space-y-2">
            <Package className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-700">No {activeTab.toLowerCase()} orders found</h3>
            <p className="text-xs text-neutral-400">Your order history for this tab is clear.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersScreenView;

