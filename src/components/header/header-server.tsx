import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
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
          const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, phone: true } });
          customerName = user?.name ?? user?.phone ?? "Account";
          cart = await prisma.cart.findFirst({
            where: { userId: session.userId, status: "ACTIVE" },
            include: { items: { include: { variant: { include: { product: true } } } } },
          });
        }
      } catch {
        /* fall through to guest cart */
      }
    }

    if (!cart && guest) {
      cart = await prisma.cart.findFirst({
        where: { sessionToken: guest, status: "ACTIVE" },
        include: { items: { include: { variant: { include: { product: true } } } } },
      });
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

export default async function Header({ storeName }: { storeName: string }) {
  const { count, total, isLoggedIn, customerName } = await getCartStats();
  return (
    <BlinkitHeader
      storeName={storeName}
      initialCount={count}
      initialTotal={total}
      isLoggedIn={isLoggedIn}
      customerName={customerName}
    />
  );
}

export { Header };

