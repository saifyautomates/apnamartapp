import { cookies } from "next/headers";
import { prisma, withDbTimeout } from "@/lib/prisma";
import { verifyAccess } from "@/lib/auth";
import { getEffectivePricePaise } from "@/lib/pricing";
import { BlinkitHeader } from "./blinkit-header";

async function getCartStats(): Promise<{ count: number; total: number; isLoggedIn: boolean; customerName: string | null }> {
  try {
    const jar = cookies();
    const token = jar.get("gcp_access")?.value;
    const guest = jar.get("gcp_cart")?.value;
    let cart = null;
    let isLoggedIn = false;
    let customerName: string | null = null;

    if (token) {
      try {
        const session = verifyAccess(token);
        if (session.kind === "CUSTOMER" && session.userId) {
          isLoggedIn = true;
          const user = await withDbTimeout(prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, phone: true } }), 200);
          customerName = user?.name ?? user?.phone ?? "Account";
          cart = await withDbTimeout(prisma.cart.findFirst({
            where: { userId: session.userId, status: "ACTIVE" },
            include: { items: { include: { variant: { include: { product: true } } } } },
          }), 200);
        }
      } catch {
        /* fall through to guest cart */
      }
    }

    if (!cart && guest) {
      cart = await withDbTimeout(prisma.cart.findFirst({
        where: { sessionToken: guest, status: "ACTIVE" },
        include: { items: { include: { variant: { include: { product: true } } } } },
      }), 200).catch(() => null);
    }

    if (!cart) return { count: 0, total: 0, isLoggedIn, customerName };

    let count = 0;
    let total = 0;
    for (const item of cart.items) {
      count += item.qty;
      const unit = getEffectivePricePaise(item.variant);
      total += unit * item.qty;
    }

    return { count, total, isLoggedIn, customerName };
  } catch {
    return { count: 0, total: 0, isLoggedIn: false, customerName: null };
  }
}

export default async function Header({ storeName, logoUrl }: { storeName: string; logoUrl?: string }) {
  const { count, total, isLoggedIn, customerName } = await getCartStats();
  return (
    <BlinkitHeader
      storeName={storeName}
      logoUrl={logoUrl}
      initialCount={count}
      initialTotal={total}
      isLoggedIn={isLoggedIn}
      customerName={customerName}
    />
  );
}

export { Header };

