const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding remaining quick barcodes...");

  // Amul Butter
  const amul = await prisma.product.findFirst({
    where: { name: { contains: "Amul Butter", mode: "insensitive" } },
    include: { variants: true },
  });
  if (amul && amul.variants[0]) {
    await prisma.productVariant.update({
      where: { id: amul.variants[0].id },
      data: { barcode: "8901262010046" },
    }).catch(() => {});
    console.log("✓ Amul Butter barcode updated");
  }

  // Tata Salt
  const tata = await prisma.product.findFirst({
    where: { name: { contains: "Tata Salt", mode: "insensitive" } },
    include: { variants: true },
  });
  if (tata && tata.variants[0]) {
    await prisma.productVariant.update({
      where: { id: tata.variants[0].id },
      data: { barcode: "8901030383451" },
    }).catch(() => {});
    console.log("✓ Tata Salt barcode updated");
  }

  // Aashirvaad Atta
  const atta = await prisma.product.findFirst({
    where: { name: { contains: "Aashirvaad", mode: "insensitive" } },
    include: { variants: true },
  });
  if (atta && atta.variants[0]) {
    await prisma.productVariant.update({
      where: { id: atta.variants[0].id },
      data: { barcode: "8901725181222" },
    }).catch(() => {});
    console.log("✓ Aashirvaad Atta barcode updated");
  }

  console.log("Finished seeding barcodes!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

