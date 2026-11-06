import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "./prisma";
import { getEffectivePricePaise } from "./pricing";
import { sellableQty } from "./inventory";
import { getSession } from "./auth";

export const CART_COOKIE = "gcp_cart";

export function getGuestToken(req: NextRequest): string | null {
  return req.cookies.get(CART_COOKIE)?.value ?? null;
}

export function setGuestCookie(res: NextResponse, token: string): void {
  res.cookies.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Resolve the active cart: logged-in user's cart, else a guest cart keyed by cookie. */
export async function resolveCart(req: NextRequest) {
  const session = await getSession(req);
  if (session?.kind === "CUSTOMER") {
    let cart = await prisma.cart.findFirst({ where: { userId: session.userId, status: "ACTIVE" } });
    if (!cart) {
      try {
        cart = await prisma.cart.create({ data: { userId: session.userId, status: "ACTIVE" } });
      } catch {
        cart = await prisma.cart.findFirst({ where: { userId: session.userId, status: "ACTIVE" } });
        if (!cart) throw new Error("Failed to initialize customer cart");
      }
    }
    return { cart, userId: session.userId, guestToken: null as string | null };
  }
  let token = getGuestToken(req);
  if (!token) token = crypto.randomUUID();
  let cart = await prisma.cart.findFirst({ where: { sessionToken: token, status: "ACTIVE" } });
  if (!cart) {
    try {
      cart = await prisma.cart.create({ data: { sessionToken: token, status: "ACTIVE" } });
    } catch {
      cart = await prisma.cart.findFirst({ where: { sessionToken: token, status: "ACTIVE" } });
      if (!cart) throw new Error("Failed to initialize guest cart");
    }
  }
  return { cart, userId: null as string | null, guestToken: token };
}

/** Merge a guest cart into the user's cart on login (quantities capped, not duplicated). */
export async function mergeGuestCart(guestToken: string | null | undefined, userId: string): Promise<void> {
  if (!guestToken) return;
  const guest = await prisma.cart.findFirst({ where: { sessionToken: guestToken, status: "ACTIVE" }, include: { items: true } });
  if (!guest) return;
  let userCart = await prisma.cart.findFirst({ where: { userId, status: "ACTIVE" } });
  if (!userCart) userCart = await prisma.cart.create({ data: { userId, status: "ACTIVE" } });
  for (const item of guest.items) {
    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (!variant) continue;
    const existing = await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } } });
    const qty = Math.min((existing?.qty ?? 0) + item.qty, variant.maxOrderQty);
    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { qty } });
    } else {
      await prisma.cartItem.create({ data: { cartId: userCart.id, variantId: item.variantId, qty } });
    }
  }
  await prisma.cart.update({ where: { id: guest.id }, data: { status: "ABANDONED" } });
}

export async function getCartDetail(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { include: { brand: true, category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
              inventory: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!cart) return null;
  let subtotalPaise = 0;
  let mrpTotalPaise = 0;
  let taxPaise = 0;
  const lines = cart.items.map((item) => {
    const v = item.variant;
    const unit = getEffectivePricePaise(v);
    const lineTotal = unit * item.qty;
    const lineMrp = v.mrpPaise * item.qty;
    const lineTax = lineTotal - Math.round(lineTotal / (1 + v.product.gstBps / 10000));
    subtotalPaise += lineTotal;
    mrpTotalPaise += lineMrp;
    taxPaise += lineTax;
    const sellable = v.inventory ? sellableQty(v.inventory) : 0;
    return {
      variantId: v.id,
      productId: v.product.id,
      name: v.product.name,
      variantName: v.name,
      brand: v.product.brand?.name ?? null,
      imageUrl: v.product.images[0]?.url ?? null,
      slug: v.product.slug,
      qty: item.qty,
      unitPricePaise: unit,
      mrpPaise: v.mrpPaise,
      lineTotalPaise: lineTotal,
      maxOrderQty: v.maxOrderQty,
      sellable,
      inStock: sellable > 0,
      overRequested: item.qty > sellable,
    };
  });
  return {
    cartId: cart.id,
    lines,
    subtotalPaise,
    mrpTotalPaise,
    savingsPaise: Math.max(0, mrpTotalPaise - subtotalPaise),
    taxPaise,
    count: lines.reduce((s, l) => s + l.qty, 0),
  };
}
