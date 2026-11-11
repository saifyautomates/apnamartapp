import { cookies } from "next/headers";
import { prisma, withDbTimeout } from "@/lib/prisma";
import { verifyAccess } from "@/lib/auth";
import { OrdersScreenView, OrderItemSummary } from "@/components/order/orders-screen-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders | Central Mart Kota",
  description: "Track all your grocery orders with real-time GPS tracking and instant delivery partner updates.",
};

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

  let orders: any[] = [];
  if (userId) {
    try {
      orders = await withDbTimeout(
        prisma.order.findMany({
          where: { userId },
          include: { items: true },
          orderBy: { createdAt: "desc" },
        }),
        2500
      );
    } catch {
      /* database timeout fallback */
    }
  }

  const formattedOrders: OrderItemSummary[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt.toISOString(),
    status: o.status,
    grandTotalPaise: o.grandTotalPaise,
    items: o.items.map((i: any) => ({
      name: i.productName,
      imageUrl: "/images/products/lays-classic-salted-potato-chips.jpg",
      qty: i.qty,
    })),
  }));

  return <OrdersScreenView orders={formattedOrders} isLoggedIn={!!userId} />;
}
