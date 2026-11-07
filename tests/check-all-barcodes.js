const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const codes = [
    { name: "Maggi", code: "8901058852441" },
    { name: "Amul Butter", code: "8901262010046" },
    { name: "Surf Excel", code: "8901030383451" },
    { name: "Aashirvaad Atta", code: "8901725181222" },
  ];

  for (const c of codes) {
    const v = await prisma.productVariant.findFirst({
      where: {
        OR: [
          { barcode: c.code },
          { product: { name: { contains: c.name, mode: "insensitive" } } },
        ],
      },
      include: { product: true },
    });
    console.log(`${c.name} (${c.code}):`, v ? { id: v.id, barcode: v.barcode, productName: v.product.name } : "NOT FOUND");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

