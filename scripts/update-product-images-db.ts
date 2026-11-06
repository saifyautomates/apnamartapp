import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  console.log(`Updating images for ${products.length} products...`);

  for (const product of products) {
    const localImg = `/images/products/${product.slug}.jpg`;
    const fullPath = path.join(process.cwd(), "public", "images", "products", `${product.slug}.jpg`);

    if (fs.existsSync(fullPath)) {
      // Upsert or update product images
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: localImg,
          alt: product.name,
          sortOrder: 0,
        },
      });
      console.log(`Updated ${product.slug} -> ${localImg}`);
    } else {
      console.warn(`Image missing for ${product.slug}`);
    }
  }

  console.log("Product images update completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

