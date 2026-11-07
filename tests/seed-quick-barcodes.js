const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding and verifying barcodes in Supabase...");

  // 1. Maggi
  const maggi = await prisma.product.findFirst({
    where: { name: { contains: "Maggi", mode: "insensitive" } },
    include: { variants: true },
  });
  if (maggi && maggi.variants[0]) {
    await prisma.productVariant.update({
      where: { id: maggi.variants[0].id },
      data: { barcode: "8901058852441" },
    });
    console.log("✓ Maggi barcode updated to 8901058852441 on variant:", maggi.variants[0].id);
  }

  // 2. Amul Butter
  const amul = await prisma.product.findFirst({
    where: { name: { contains: "Amul Butter", mode: "insensitive" } },
    include: { variants: true },
  });
  if (amul && amul.variants[0]) {
    await prisma.productVariant.update({
      where: { id: amul.variants[0].id },
      data: { barcode: "8901262010046" },
    });
    console.log("✓ Amul Butter barcode updated to 8901262010046 on variant:", amul.variants[0].id);
  }

  // 3. Surf Excel
  let surf = await prisma.product.findFirst({
    where: { name: { contains: "Surf Excel", mode: "insensitive" } },
    include: { variants: true },
  });
  if (!surf) {
    // Check if category exists
    const cat = await prisma.category.findFirst({ where: { slug: "cleaning-essentials" } }) || await prisma.category.findFirst();
    surf = await prisma.product.create({
      data: {
        internalId: `PRD-${Date.now()}-SURF`,
        name: "Surf Excel Easy Wash Detergent Powder 1kg",
        slug: "surf-excel-easy-wash-1kg",
        categoryId: cat.id,
        variants: {
          create: {
            internalId: `VAR-${Date.now()}-SURF`,
            name: "1 kg",
            packSize: "1 kg",
            barcode: "8901030383451",
            sku: "SKU-SURF-1KG",
            mrpPaise: 14900,
            sellingPaise: 13900,
            inventory: { create: { availableQty: 50, reservedQty: 0 } },
          },
        },
      },
      include: { variants: true },
    });
    console.log("✓ Created Surf Excel product with barcode 8901030383451");
  } else if (surf.variants[0]) {
    await prisma.productVariant.update({
      where: { id: surf.variants[0].id },
      data: { barcode: "8901030383451" },
    });
    console.log("✓ Updated Surf Excel variant barcode to 8901030383451");
  }

  // 4. Aashirvaad Atta
  let atta = await prisma.product.findFirst({
    where: { name: { contains: "Aashirvaad", mode: "insensitive" } },
    include: { variants: true },
  });
  if (!atta) {
    const cat = await prisma.category.findFirst({ where: { slug: "staples" } }) || await prisma.category.findFirst();
    atta = await prisma.product.create({
      data: {
        internalId: `PRD-${Date.now()}-ATTA`,
        name: "Aashirvaad Shudh Chakki Atta 5kg",
        slug: "aashirvaad-atta-5kg",
        categoryId: cat.id,
        variants: {
          create: {
            internalId: `VAR-${Date.now()}-ATTA`,
            name: "5 kg",
            packSize: "5 kg",
            barcode: "8901725181222",
            sku: "SKU-AASHIRVAAD-5KG",
            mrpPaise: 27500,
            sellingPaise: 23900,
            inventory: { create: { availableQty: 40, reservedQty: 0 } },
          },
        },
      },
      include: { variants: true },
    });
    console.log("✓ Created Aashirvaad Atta product with barcode 8901725181222");
  } else if (atta.variants[0]) {
    await prisma.productVariant.update({
      where: { id: atta.variants[0].id },
      data: { barcode: "8901725181222" },
    });
    console.log("✓ Updated Aashirvaad Atta variant barcode to 8901725181222");
  }

  console.log("ALL QUICK BARCODES SUCCESSFULLY SYNCED IN SUPABASE!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
