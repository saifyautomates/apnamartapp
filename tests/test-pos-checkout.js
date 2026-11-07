const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const barcode = "8901058852441";
  console.log("Searching for barcode:", barcode);

  const byBarcode = await prisma.productVariant.findFirst({
    where: { barcode },
  });
  console.log("By barcode:", byBarcode ? byBarcode.id : "NOT FOUND");

  const byName = await prisma.productVariant.findFirst({
    where: { product: { name: { contains: "Maggi", mode: "insensitive" } } },
    include: { product: true },
  });
  console.log("By name Maggi:", byName ? { id: byName.id, name: byName.product.name, barcode: byName.barcode } : "NOT FOUND");

  const anyVariant = await prisma.productVariant.findFirst();
  console.log("First variant in DB:", anyVariant ? anyVariant.id : "NO VARIANTS");
}

main().catch(console.error).finally(() => prisma.$disconnect());

