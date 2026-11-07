const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const v = await prisma.productVariant.findFirst({
    where: { barcode: "8901058852441" },
    include: { product: true },
  });
  console.log("Variant with 8901058852441:", v ? { id: v.id, barcode: v.barcode, productName: v.product.name } : "NONE");

  // Also check product.barcode
  const p = await prisma.product.findFirst({
    where: { barcode: "8901058852441" },
  });
  console.log("Product with 8901058852441:", p ? { id: p.id, name: p.name } : "NONE");
}

main().catch(console.error).finally(() => prisma.$disconnect());

