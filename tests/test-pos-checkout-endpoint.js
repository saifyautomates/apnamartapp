const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testCheckoutLogic() {
  console.log("Testing POS Checkout atomic transaction logic...");

  const customerPhone = "98765 43210";
  const customerName = "Walk-in Customer";
  const cleanPhone = (customerPhone || "9999999999").replace(/\D/g, "") || "9999999999";

  let user = await prisma.user.findFirst({
    where: { phone: cleanPhone },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone: cleanPhone,
        name: customerName,
      },
    }).catch(async () => {
      return await prisma.user.findFirst({ where: { phone: cleanPhone } });
    });
  }

  if (!user) {
    user = await prisma.user.findFirst();
  }

  console.log("User resolved:", user.id, user.phone);

  const fallbackVariant = await prisma.productVariant.findFirst({
    where: { product: { isActive: true } },
    select: { id: true },
  });

  const items = [
    {
      variantId: "master-8901058852441", // The exact synthetic ID that caused the error!
      barcode: "8901058852441",
      name: "Maggi 2-Minute Masala Instant Noodles 280g (Pack of 4)",
      packSize: "Standard",
      sellingPaise: 5400,
      qty: 1,
    },
  ];

  const voucherNumber = `CM-POS-2026/${Math.floor(1000 + Math.random() * 9000)}`;
  const orderNumber = `POS${Date.now().toString().slice(-6)}`;
  const subtotalPaise = 5400;
  const taxPaise = Math.round(subtotalPaise * 0.05);
  const grandTotalPaise = 5400;

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: user.id,
        deliveryMethod: "PICKUP",
        subtotalPaise,
        taxPaise,
        grandTotalPaise,
        paymentMethod: "COD",
        paymentStatus: "CAPTURED",
        status: "DELIVERED",
        busyVoucherId: voucherNumber,
        busyInvoiceId: `INV-${voucherNumber}`,
        busySyncStatus: "SYNCED",
        notes: `In-Store POS Sale from Counter POS-01 by Cashier Ramesh Sharma`,
      },
    });

    for (const it of items) {
      let realVariantId = null;

      if (it.variantId && !it.variantId.startsWith("master-") && !it.variantId.startsWith("v-")) {
        const check = await tx.productVariant.findUnique({
          where: { id: it.variantId },
          select: { id: true },
        });
        if (check) realVariantId = check.id;
      }

      if (!realVariantId && it.barcode) {
        const found = await tx.productVariant.findFirst({
          where: { barcode: it.barcode },
          select: { id: true },
        });
        if (found) realVariantId = found.id;
      }

      if (!realVariantId && fallbackVariant) {
        realVariantId = fallbackVariant.id;
      }

      console.log("Resolved realVariantId:", realVariantId);

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          variantId: realVariantId,
          productName: it.name,
          variantName: it.packSize,
          qty: 1,
          mrpPaise: 5400,
          unitPricePaise: 5400,
          taxPaise: 270,
          totalPaise: 5400,
        },
      });
    }

    await tx.payment.create({
      data: {
        orderId: order.id,
        method: "COD",
        status: "CAPTURED",
        amountPaise: grandTotalPaise,
      },
    });

    return order;
  });

  console.log("SUCCESS! Created order:", result.id, result.orderNumber);
}

testCheckoutLogic().catch(console.error).finally(() => prisma.$disconnect());
