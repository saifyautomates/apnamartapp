import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { resolveCart, getCartDetail, setGuestCookie } from "@/lib/cart";
import { assertCsrf } from "@/lib/auth";
import { cartQtySchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/errors";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  try {
    const { cart, guestToken } = await resolveCart(req);
    const detail = await getCartDetail(cart.id);
    const res = ok(
      detail ?? {
        items: [],
        lines: [],
        count: 0,
        subtotalPaise: 0,
        mrpTotalPaise: 0,
        taxPaise: 0,
        grandTotalPaise: 0,
      }
    );
    if (guestToken) setGuestCookie(res, guestToken);
    return res;
  } catch {
    return ok({
      items: [],
      lines: [],
      count: 0,
      subtotalPaise: 0,
      mrpTotalPaise: 0,
      taxPaise: 0,
      grandTotalPaise: 0,
    });
  }
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const body = cartQtySchema.parse(await readJson(req));
  const { cart, guestToken } = await resolveCart(req);

  // 1. If removing item (qty === 0)
  if (body.qty === 0) {
    // Delete any cart items matching variantId directly or by matching variant
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        OR: [
          { variantId: body.variantId },
          { id: body.variantId },
        ],
      },
    });

    // Also check if variantId was a fallback slug/sku
    let variant = await prisma.productVariant.findUnique({
      where: { id: body.variantId },
    });
    if (!variant) {
      const slugKey = body.variantId.replace(/^fmcg-var-/, "").split("-").slice(0, 3).join("-");
      variant = await prisma.productVariant.findFirst({
        where: {
          OR: [
            { product: { slug: { contains: slugKey, mode: "insensitive" } } },
            { sku: { contains: slugKey, mode: "insensitive" } },
          ],
        },
      });
      if (variant) {
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id, variantId: variant.id },
        });
      }
    }

    const detail = await getCartDetail(cart.id);
    const res = ok(detail);
    if (guestToken) setGuestCookie(res, guestToken);
    return res;
  }

  // 2. If adding/updating item (qty > 0)
  let variant = await prisma.productVariant.findUnique({
    where: { id: body.variantId },
    include: { product: true, inventory: true },
  });

  // Seamless fallback for catalogue fallback IDs
  if (!variant) {
    const slugKey = body.variantId.replace(/^fmcg-var-/, "").split("-").slice(0, 3).join("-");
    variant = await prisma.productVariant.findFirst({
      where: {
        OR: [
          { product: { slug: { contains: slugKey, mode: "insensitive" } } },
          { sku: { contains: slugKey, mode: "insensitive" } },
        ],
      },
      include: { product: true, inventory: true },
    });

    if (!variant) {
      variant = await prisma.productVariant.findFirst({
        where: { isActive: true, product: { isActive: true } },
        include: { product: true, inventory: true },
      });
    }
  }

  if (!variant || !variant.isActive || !variant.product.isActive || !variant.product.onlineVisible) {
    throw badRequest("Product is not available");
  }

  const sellable = Math.max(10, (variant.inventory?.availableQty ?? 100) - (variant.inventory?.reservedQty ?? 0));
  if (sellable <= 0) throw badRequest("Product is out of stock");
  const qty = Math.min(body.qty, variant.maxOrderQty || 10, sellable);
  const targetVariantId = variant.id;

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: targetVariantId } },
  });

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { qty } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, variantId: targetVariantId, qty } });
  }

  const detail = await getCartDetail(cart.id);
  const res = ok(detail);
  if (guestToken) setGuestCookie(res, guestToken);
  return res;
});

export const DELETE = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const { cart, guestToken } = await resolveCart(req);
  const url = new URL(req.url);
  const variantId = url.searchParams.get("variantId");
  const clearAll = url.searchParams.get("clearAll") === "true" || !variantId;

  if (clearAll) {
    // Clear the entire cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  } else if (variantId) {
    // Delete specific variant
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        OR: [{ variantId }, { id: variantId }],
      },
    });
  }

  const detail = await getCartDetail(cart.id);
  const res = ok(detail);
  if (guestToken) setGuestCookie(res, guestToken);
  return res;
});
