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

  // 1. Resolve or create Walk-in user
  let user = await prisma.user.findFirst({
    where: { phone: customerPhone },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone: customerPhone,
        name: customerName,
      },
    });
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

  // 5. Atomic transaction: Create Order, Items, deduct inventory, and record payment
  const result = await prisma.$transaction(async (tx) => {
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

    for (const it of items) {
      const qty = Math.max(1, parseInt(it.qty, 10) || 1);
      const unitPrice = Math.max(0, parseInt(it.sellingPaise, 10) || 0);

      // Verify variant exists or connect to real variant
      let variantId = it.variantId;
      if (!variantId && it.barcode) {
        const found = await tx.productVariant.findFirst({
          where: { barcode: it.barcode },
        });
        if (found) variantId = found.id;
      }

      if (variantId) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId,
            productName: it.name || "FMCG Grocery Item",
            variantName: it.packSize || "Standard",
            qty,
            mrpPaise: unitPrice,
            unitPricePaise: unitPrice,
            taxPaise: Math.round(unitPrice * 0.05),
            totalPaise: qty * unitPrice,
          },
        });

        // Deduct inventory
        await tx.inventory.updateMany({
          where: { variantId },
          data: {
            availableQty: { decrement: qty },
          },
        });
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
  });

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
