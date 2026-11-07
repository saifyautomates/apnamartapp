const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const barcode = "8901058852441";
  const existingVariant = await prisma.productVariant.findFirst({
    where: { barcode },
    include: {
      product: {
        include: { brand: true, category: true },
      },
      inventory: true,
    },
  });

  console.log("Existing variant result:", existingVariant ? {
    exists: true,
    variantId: existingVariant.id,
    productId: existingVariant.productId,
    name: `${existingVariant.product.name} (${existingVariant.packSize || existingVariant.name})`,
    sellingPaise: existingVariant.sellingPaise,
  } : "NOT FOUND");
}

main().catch(console.error).finally(() => prisma.$disconnect());

