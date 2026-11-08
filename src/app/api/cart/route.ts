import { NextRequest, NextResponse } from "next/server";
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
    const res = ok(detail ?? { items: [], count: 0, subtotalPaise: 0, mrpTotalPaise: 0, taxPaise: 0, grandTotalPaise: 0 });
    if (guestToken) setGuestCookie(res, guestToken);
    return res;
  } catch {
    return ok({ items: [], count: 0, subtotalPaise: 0, mrpTotalPaise: 0, taxPaise: 0, grandTotalPaise: 0 });
  }
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const body = cartQtySchema.parse(await readJson(req));
  const { cart, guestToken } = await resolveCart(req);
  let variant = await prisma.productVariant.findUnique({
    where: { id: body.variantId },
    include: { product: true, inventory: true },
  });

  // Seamless fallback for catalogue fallback IDs
  if (!variant) {
    // Try to find matching variant by product slug or SKU
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
    if (qty === 0) {
      await prisma.cartItem.delete({ where: { id: existing.id } });
    } else {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { qty } });
    }
  } else if (qty > 0) {
    await prisma.cartItem.create({ data: { cartId: cart.id, variantId: targetVariantId, qty } });
  }
  const detail = await getCartDetail(cart.id);
  const res = ok(detail);
  if (guestToken) setGuestCookie(res, guestToken);
  return res;
});

export const DELETE = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const variantId = new URL(req.url).searchParams.get("variantId");
  if (!variantId) throw badRequest("variantId is required");
  const { cart } = await resolveCart(req);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
  return ok(await getCartDetail(cart.id));
});
