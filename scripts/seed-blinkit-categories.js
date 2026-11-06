const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "paan-corner", name: "Paan Corner", sortOrder: 1 },
  { slug: "dairy-eggs", name: "Dairy, Bread & Eggs", sortOrder: 2 },
  { slug: "fruits-vegetables", name: "Fruits & Vegetables", sortOrder: 3 },
  { slug: "cold-drinks", name: "Cold Drinks & Juices", sortOrder: 4 },
  { slug: "snacks", name: "Snacks & Munchies", sortOrder: 5 },
  { slug: "breakfast", name: "Breakfast & Instant Food", sortOrder: 6 },
  { slug: "sweet-tooth", name: "Sweet Tooth", sortOrder: 7 },
  { slug: "bakery-biscuits", name: "Bakery & Biscuits", sortOrder: 8 },
  { slug: "tea-coffee", name: "Tea, Coffee & Milk Drinks", sortOrder: 9 },
  { slug: "staples", name: "Atta, Rice & Dal", sortOrder: 10 },
  { slug: "masala-oil", name: "Masala, Oil & More", sortOrder: 11 },
  { slug: "sauces-spreads", name: "Sauces & Spreads", sortOrder: 12 },
  { slug: "chicken-meat", name: "Chicken, Meat & Fish", sortOrder: 13 },
  { slug: "organic-healthy", name: "Organic & Healthy Living", sortOrder: 14 },
  { slug: "baby-care", name: "Baby Care", sortOrder: 15 },
  { slug: "pharma-wellness", name: "Pharma & Wellness", sortOrder: 16 },
  { slug: "cleaning-essentials", name: "Cleaning Essentials", sortOrder: 17 },
  { slug: "home-office", name: "Home & Office", sortOrder: 18 },
  { slug: "personal-care", name: "Personal Care", sortOrder: 19 },
  { slug: "pet-care", name: "Pet Care", sortOrder: 20 },
];

async function seed() {
  console.log("Seeding all 20 Blinkit categories...");
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder, isVisible: true },
      create: { slug: cat.slug, name: cat.name, sortOrder: cat.sortOrder, isVisible: true },
    });
  }

  // Map beverages to cold-drinks and tea-coffee
  const beverages = await prisma.category.findUnique({ where: { slug: "beverages" } });
  const coldDrinks = await prisma.category.findUnique({ where: { slug: "cold-drinks" } });
  const teaCoffee = await prisma.category.findUnique({ where: { slug: "tea-coffee" } });

  if (beverages && coldDrinks) {
    await prisma.product.updateMany({
      where: { categoryId: beverages.id, name: { contains: "Tea" } },
      data: { categoryId: teaCoffee.id },
    });
    await prisma.product.updateMany({
      where: { categoryId: beverages.id },
      data: { categoryId: coldDrinks.id },
    });
  }

  // Map household to cleaning-essentials and home-office
  const household = await prisma.category.findUnique({ where: { slug: "household" } });
  const cleaning = await prisma.category.findUnique({ where: { slug: "cleaning-essentials" } });
  if (household && cleaning) {
    await prisma.product.updateMany({
      where: { categoryId: household.id },
      data: { categoryId: cleaning.id },
    });
  }

  console.log("Done seeding categories!");
}

seed()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

