import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAccess } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { LiveDeliveryTracker, LiveOrder } from "@/components/order";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const token = cookies().get("gcp_access")?.value;
  let userId: string | null = null;
  if (token) {
    try {
      const s = verifyAccess(token);
      if (s.kind === "CUSTOMER") userId = s.userId ?? null;
    } catch {
      /* ignore */
    }
  }
  if (!userId) redirect("/login?next=/orders");

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      delivery: true,
    },
  });
  if (!order || order.userId !== userId) notFound();

  const formattedOrder: LiveOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    deliveryMethod: order.deliveryMethod,
    deliveryAddress: (order.delivery?.addressSnapshot as LiveOrder["deliveryAddress"]) ?? null,
    items: order.items.map((it) => ({
      id: it.id,
      productName: it.productName,
      variantName: it.variantName,
      qty: it.qty,
      totalPaise: it.totalPaise,
    })),
    subtotalPaise: order.subtotalPaise,
    discountPaise: order.discountPaise,
    loyaltyDiscountPaise: order.loyaltyDiscountPaise,
    storeCreditUsedPaise: order.storeCreditUsedPaise,
    deliveryChargePaise: order.deliveryChargePaise,
    taxPaise: order.taxPaise,
    grandTotalPaise: order.grandTotalPaise,
    savingsPaise: order.savingsPaise,
    delivery: order.delivery
      ? {
          assignedTo: order.delivery.assignedTo,
          status: order.delivery.status,
        }
      : null,
  };

  return <LiveDeliveryTracker initialOrder={formattedOrder} />;
}
