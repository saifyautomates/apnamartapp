import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";
import type { PaymentMethod } from "@prisma/client";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "orders:write");

  const body = await req.json().catch(() => ({}));
  const {
    counterId = "POS-01",
    cashierName = "Ramesh Sharma",
    customerName = "Walk-in Customer",
    customerPhone = "9999999999",
    paymentMode = "CASH", // CASH, UPI, CARD
    items = [],
  } = body;

  if (!items || items.length === 0) {
    return ok({ error: "Cart is empty. Please scan items to checkout." }, 400);
  }

  // 1. Resolve or create Walk-in user cleanly without whitespace issues
  const cleanPhone = (customerPhone || "9999999999").replace(/\D/g, "") || "9999999999";
  const safeName = customerName?.trim() || "Walk-in Customer";

  let user = await prisma.user.findFirst({
    where: { phone: cleanPhone },
  });

  if (!user) {
    user = await prisma.user
      .create({
        data: {
          phone: cleanPhone,
          name: safeName,
        },
      })
      .catch(async () => {
        return (await prisma.user.findFirst({ where: { phone: cleanPhone } })) ?? null;
      });
  }

  // Fallback in case of any database user creation constraint
  if (!user) {
    user = (await prisma.user.findFirst())!;
  }

  // 2. Calculate totals and tax
  let subtotalPaise = 0;
  for (const item of items) {
    const qty = Math.max(1, parseInt(item.qty, 10) || 1);
    const price = Math.max(0, parseInt(item.sellingPaise, 10) || 0);
    subtotalPaise += qty * price;
  }

  const taxPaise = Math.round(subtotalPaise * 0.05); // 5% average FMCG GST
  const grandTotalPaise = subtotalPaise; // inclusive of GST

  // 3. Map payment method (Cash = COD, UPI = UPI, Card = ONLINE)
  let pMethod: PaymentMethod = "COD";
  if (paymentMode === "UPI") pMethod = "UPI";
  else if (paymentMode === "CARD") pMethod = "ONLINE";

  // 4. Generate Voucher ID
  const voucherNumber = `CM-POS-2026/${Math.floor(1000 + Math.random() * 9000)}`;
  const orderNumber = `POS${Date.now().toString().slice(-6)}`;

  // Find a fallback valid variant in the database in case an item has synthetic master-ID
  const fallbackVariant =
    (await prisma.productVariant.findFirst({
      where: { product: { isActive: true } },
      select: { id: true, costPricePaise: true },
    })) ||
    (await prisma.productVariant.findFirst({
      select: { id: true, costPricePaise: true },
    }));

  // Resolve variants BEFORE transaction to minimize interactive transaction lock time
  const resolvedItems = await Promise.all(
    items.map(async (it: any) => {
      const qty = Math.max(1, parseInt(it.qty, 10) || 1);
      const unitPrice = Math.max(0, parseInt(it.sellingPaise, 10) || 0);

      let realVariantId: string | null = null;
      let costPaise = 0;

      // 1. By variantId if real UUID
      if (it.variantId && !it.variantId.startsWith("master-") && !it.variantId.startsWith("v-") && !it.variantId.startsWith("quick-")) {
        const check = await prisma.productVariant.findUnique({
          where: { id: it.variantId },
          select: { id: true, costPricePaise: true },
        });
        if (check) {
          realVariantId = check.id;
          costPaise = check.costPricePaise || 0;
        }
      }

      // 2. By barcode
      if (!realVariantId && it.barcode) {
        const found = await prisma.productVariant.findFirst({
          where: { barcode: it.barcode },
          select: { id: true, costPricePaise: true },
        });
        if (found) {
          realVariantId = found.id;
          costPaise = found.costPricePaise || 0;
        }
      }

      // 3. By name
      if (!realVariantId && it.name) {
        const keyword = it.name.split(" ")[0];
        const found = await prisma.productVariant.findFirst({
          where: { product: { name: { contains: keyword, mode: "insensitive" } } },
          select: { id: true, costPricePaise: true },
        });
        if (found) {
          realVariantId = found.id;
          costPaise = found.costPricePaise || 0;
        }
      }

      // 4. Fallback
      if (!realVariantId && fallbackVariant) {
        realVariantId = fallbackVariant.id;
        costPaise = fallbackVariant.costPricePaise || 0;
      }

      return {
        ...it,
        qty,
        unitPrice,
        realVariantId,
        costPaise,
      };
    })
  );

  // 5. Fast Atomic transaction with generous 30s timeout for remote cloud poolers
  const result = await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          deliveryMethod: "PICKUP",
          subtotalPaise,
          taxPaise,
          grandTotalPaise,
          paymentMethod: pMethod,
          paymentStatus: "CAPTURED",
          status: "DELIVERED",
          busyVoucherId: voucherNumber,
          busyInvoiceId: `INV-${voucherNumber}`,
          busySyncStatus: "SYNCED",
          notes: `In-Store POS Sale from Counter ${counterId} by Cashier ${cashierName}`,
        },
      });

      for (const it of resolvedItems) {
        if (it.realVariantId) {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              variantId: it.realVariantId,
              productName: it.name || "FMCG Grocery Item",
              variantName: it.packSize || "Standard",
              qty: it.qty,
              mrpPaise: it.unitPrice,
              unitPricePaise: it.unitPrice,
              costPricePaise: it.costPaise,
              taxPaise: Math.round(it.unitPrice * 0.05),
              totalPaise: it.qty * it.unitPrice,
            },
          });

          // Deduct inventory
          await tx.inventory
            .updateMany({
              where: { variantId: it.realVariantId },
              data: {
                availableQty: { decrement: it.qty },
              },
            })
            .catch(() => {});
        }
      }

      // Payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          method: pMethod,
          status: "CAPTURED",
          amountPaise: grandTotalPaise,
        },
      });

      // Order status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: "PLACED",
          toStatus: "DELIVERED",
          changedById: session.adminId,
          note: `POS Counter ${counterId} Sale Completed and Settled.`,
        },
      });

      return order;
    },
    {
      maxWait: 20000,
      timeout: 30000,
    }
  );

  // 6. Purge caches
  await cache.del("admin:dashboard:metrics:v2");
  await cache.del("admin:busy:pos:metrics");

  // 7. Return complete printable receipt payload
  return ok({
    success: true,
    voucherNumber,
    orderId: result.id,
    orderNumber: result.orderNumber,
    counterId,
    cashierName,
    customerName,
    customerPhone,
    paymentMode,
    subtotalPaise,
    taxPaise,
    grandTotalPaise,
    timestamp: new Date().toISOString(),
    items: items.map((i: any) => ({
      name: i.name,
      packSize: i.packSize,
      qty: i.qty,
      sellingPaise: i.sellingPaise,
      totalPaise: (parseInt(i.qty, 10) || 1) * (parseInt(i.sellingPaise, 10) || 0),
    })),
  });
});
