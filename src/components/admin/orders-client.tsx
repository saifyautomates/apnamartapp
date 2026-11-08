"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatPaise } from "@/lib/money";

export interface OrderItem {
  id: string;
  productName: string;
  qty: number;
  unitPricePaise: number;
  totalPaise: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus?: string;
  grandTotalPaise: number;
  createdAt: string | Date;
  deliveryType?: string;
  deliverySlot?: string;
  notes?: string | null;
  user?: {
    name?: string | null;
    phone?: string | null;
  } | null;
  deliveryAddress?: {
    street?: string;
    city?: string;
    pincode?: string;
  } | null;
  items: OrderItem[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; nextStatus?: string; nextActionLabel?: string; nextBg?: string }
> = {
  PLACED: {
    label: "New Order",
    bg: "bg-blue-500/10 border-blue-500/30",
    text: "text-blue-600",
    nextStatus: "CONFIRMED",
    nextActionLabel: "Accept Order",
    nextBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-700",
    nextStatus: "PREPARING",
    nextActionLabel: "Start Packing",
    nextBg: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  PREPARING: {
    label: "Packing",
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-700",
    nextStatus: "PACKED",
    nextActionLabel: "Mark Packed",
    nextBg: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  PACKED: {
    label: "Packed & Ready",
    bg: "bg-purple-500/10 border-purple-500/30",
    text: "text-purple-700",
    nextStatus: "OUT_FOR_DELIVERY",
    nextActionLabel: "Dispatch 🚚",
    nextBg: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    bg: "bg-indigo-500/10 border-indigo-500/30",
    text: "text-indigo-700",
    nextStatus: "DELIVERED",
    nextActionLabel: "Mark Delivered ✅",
    nextBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  DELIVERED: {
    label: "Delivered",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    text: "text-emerald-700",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-500/10 border-red-500/30",
    text: "text-red-600",
  },
};

export function OrdersClient({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [filterTab, setFilterTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (filterTab !== "ALL") {
      if (filterTab === "ACTIVE") {
        result = result.filter((o) =>
          ["PLACED", "CONFIRMED", "PREPARING", "PACKED", "OUT_FOR_DELIVERY"].includes(o.status)
        );
      } else {
        result = result.filter((o) => o.status === filterTab);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          (o.user?.name && o.user.name.toLowerCase().includes(q)) ||
          (o.user?.phone && o.user.phone.includes(q))
      );
    }

    return result;
  }, [orders, filterTab, searchQuery]);

  // Status Counts
  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: orders.length, ACTIVE: 0 };
    orders.forEach((o) => {
      map[o.status] = (map[o.status] || 0) + 1;
      if (["PLACED", "CONFIRMED", "PREPARING", "PACKED", "OUT_FOR_DELIVERY"].includes(o.status)) {
        map.ACTIVE += 1;
      }
    });
    return map;
  }, [orders]);

  // One-Click Status Transition Handler
  const handleTransition = async (orderId: string, toStatus: string) => {
    setUpdatingId(orderId);

    // Optimistic Update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: toStatus } : o))
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: toStatus } : null));
    }

    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const csrfData = await csrfRes.json();
      const token = csrfData.data?.csrfToken || csrfData.data?.token || "";

      const res = await fetch(`/api/admin/orders/${orderId}/transition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({ to: toStatus }),
      });

      if (res.ok) {
        showToast(`Order updated to ${toStatus}`);
      } else {
        showToast("Error updating order status");
      }
    } catch {
      showToast("Network error transitioning order");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 rounded-2xl bg-neutral-900 text-white px-4 py-2.5 text-xs font-black shadow-xl animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Top Controls: Filter Pills & Instant Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition cursor-pointer shrink-0 ${
              filterTab === "ALL"
                ? "bg-[#0c831f] text-white shadow-xs"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            All ({counts.ALL || 0})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("ACTIVE")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition cursor-pointer shrink-0 ${
              filterTab === "ACTIVE"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Active Pipeline ({counts.ACTIVE || 0})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("PLACED")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition cursor-pointer shrink-0 ${
              filterTab === "PLACED"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            New ({counts.PLACED || 0})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("OUT_FOR_DELIVERY")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition cursor-pointer shrink-0 ${
              filterTab === "OUT_FOR_DELIVERY"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Dispatched ({counts.OUT_FOR_DELIVERY || 0})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("DELIVERED")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition cursor-pointer shrink-0 ${
              filterTab === "DELIVERED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Delivered ({counts.DELIVERED || 0})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order # or phone..."
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200/90 pl-8 pr-3 py-1.5 text-xs font-bold text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0c831f] transition"
          />
          <span className="absolute left-2.5 top-2 text-xs text-neutral-400">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1.5 text-xs text-neutral-400 hover:text-neutral-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Orders Table & Cards */}
      <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-2xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-3xl mb-2">📦</div>
            <h3 className="text-sm font-black text-neutral-800">No Orders Found</h3>
            <p className="text-xs text-neutral-400 mt-1">
              {searchQuery ? "Try searching with a different term." : "No orders matching this filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/70 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Order Details</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total &amp; Mode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || {
                    label: order.status,
                    bg: "bg-neutral-100 border-neutral-200",
                    text: "text-neutral-600",
                  };
                  const dateStr = new Date(order.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-neutral-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      {/* Order Details */}
                      <td className="py-3 px-4">
                        <div className="font-black text-neutral-900 flex items-center gap-1.5">
                          <span>{order.orderNumber}</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">{dateStr}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-800">
                          {order.user?.name || "Customer"}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          {order.user?.phone || "—"}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-700 max-w-[200px] truncate">
                          {order.items.map((i) => `${i.productName} × ${i.qty}`).join(", ") ||
                            "1 Item"}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {order.items.length} item{order.items.length > 1 ? "s" : ""}
                        </div>
                      </td>

                      {/* Total & Payment Mode */}
                      <td className="py-3 px-4">
                        <div className="font-black text-[#0c831f] text-sm">
                          {formatPaise(order.grandTotalPaise)}
                        </div>
                        <div className="inline-block mt-0.5 rounded-sm bg-neutral-100 text-neutral-600 px-1.5 py-0.5 text-[9px] font-black uppercase">
                          {order.paymentMethod}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black ${cfg.bg} ${cfg.text}`}
                        >
                          {cfg.label}
                        </span>
                      </td>

                      {/* Quick Action Button */}
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {cfg.nextStatus && cfg.nextActionLabel ? (
                            <button
                              type="button"
                              onClick={() => handleTransition(order.id, cfg.nextStatus!)}
                              disabled={updatingId === order.id}
                              className={`rounded-xl px-3 py-1.5 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer ${cfg.nextBg}`}
                            >
                              {updatingId === order.id ? "Updating..." : cfg.nextActionLabel}
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-neutral-400">Completed</span>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 px-2.5 py-1.5 text-xs font-bold text-neutral-600 transition"
                            title="View Full Details"
                          >
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="relative z-10 h-full w-full max-w-md bg-white p-6 shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">
                  Order Details
                </span>
                <h2 className="text-lg font-black text-neutral-900">
                  {selectedOrder.orderNumber}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="h-8 w-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer & Delivery Details */}
            <div className="py-4 border-b border-neutral-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-bold">Customer:</span>
                <span className="text-xs font-black text-neutral-800">
                  {selectedOrder.user?.name || "Walk-in Customer"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-bold">Phone:</span>
                <span className="text-xs font-mono font-bold text-neutral-800">
                  {selectedOrder.user?.phone || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-bold">Payment:</span>
                <span className="text-xs font-black text-[#0c831f]">
                  {selectedOrder.paymentMethod} · {formatPaise(selectedOrder.grandTotalPaise)}
                </span>
              </div>
              {selectedOrder.deliveryAddress && (
                <div className="mt-2 rounded-xl bg-neutral-50 p-2.5 text-xs text-neutral-700">
                  <span className="font-bold block text-neutral-500 text-[10px] uppercase">
                    Delivery Address:
                  </span>
                  {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city} -{" "}
                  {selectedOrder.deliveryAddress.pincode}
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="flex-1 py-4 space-y-2.5 overflow-y-auto">
              <span className="text-xs font-black text-neutral-400 uppercase tracking-wider block">
                Ordered Items ({selectedOrder.items.length})
              </span>
              {selectedOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 text-xs"
                >
                  <div>
                    <h4 className="font-black text-neutral-800">{item.productName}</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {formatPaise(item.unitPricePaise)} × {item.qty}
                    </p>
                  </div>
                  <div className="font-black text-neutral-900">
                    {formatPaise(item.totalPaise)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Footer & Actions */}
            <div className="pt-4 border-t border-neutral-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-neutral-600">Grand Total:</span>
                <span className="font-black text-base text-[#0c831f]">
                  {formatPaise(selectedOrder.grandTotalPaise)}
                </span>
              </div>

              {STATUS_CONFIG[selectedOrder.status]?.nextStatus && (
                <button
                  type="button"
                  onClick={() =>
                    handleTransition(
                      selectedOrder.id,
                      STATUS_CONFIG[selectedOrder.status].nextStatus!
                    )
                  }
                  disabled={updatingId === selectedOrder.id}
                  className={`w-full rounded-2xl py-3 text-sm font-black transition active:scale-98 cursor-pointer shadow-md ${
                    STATUS_CONFIG[selectedOrder.status].nextBg
                  }`}
                >
                  {updatingId === selectedOrder.id
                    ? "Updating..."
                    : STATUS_CONFIG[selectedOrder.status].nextActionLabel}
                </button>
              )}

              <Link
                href={`/admin/orders/${selectedOrder.id}`}
                className="block text-center rounded-2xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 py-2.5 text-xs font-black text-neutral-700 transition"
              >
                Open Full Order Management Page →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

