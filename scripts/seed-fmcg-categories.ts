import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Ensuring full FMCG categories in Central Mart database...");

  const FMCG_CATEGORIES = [
    {
      name: "Staples",
      slug: "staples",
      sortOrder: 1,
      description: "Atta, Rice, Dal, Grains & Flours",
      imageUrl: "/images/categories/staples.png",
    },
    {
      name: "Dairy & Eggs",
      slug: "dairy-eggs",
      sortOrder: 2,
      description: "Fresh Milk, Butter, Ghee, Paneer, Curd & Eggs",
      imageUrl: "/images/categories/dairy.png",
    },
    {
      name: "Snacks",
      slug: "snacks",
      sortOrder: 3,
      description: "Biscuits, Namkeen, Chips & Packaged Snacks",
      imageUrl: "/images/categories/snacks.png",
    },
    {
      name: "Beverages",
      slug: "beverages",
      sortOrder: 4,
      description: "Tea, Coffee, Soft Drinks, Juices & Syrups",
      imageUrl: "/images/categories/beverages.png",
    },
    {
      name: "Household",
      slug: "household",
      sortOrder: 5,
      description: "Detergents, Surface Cleaners, Dishwash & Tissues",
      imageUrl: "/images/categories/household.png",
    },
    {
      name: "Personal Care",
      slug: "personal-care",
      sortOrder: 6,
      description: "Soaps, Shampoos, Toothpaste, Skincare & Grooming",
      imageUrl: "/images/categories/personal-care.png",
    },
    {
      name: "Breakfast",
      slug: "breakfast",
      sortOrder: 7,
      description: "Oats, Cereals, Muesli, Honey & Spreads",
      imageUrl: "/images/categories/breakfast.png",
    },
    {
      name: "Baby Care",
      slug: "baby-care",
      sortOrder: 8,
      description: "Baby Diapers, Wipes, Infant Formula & Baby Shampoo",
      imageUrl: "/images/categories/baby-care.png",
    },
    {
      name: "Cooking Essentials & Spices",
      slug: "cooking-essentials",
      sortOrder: 9,
      description: "Pure Mustard Oil, Spices, Salt, Sugar & Masalas",
      imageUrl: "/images/categories/cooking.png",
    },
    {
      name: "Packaged & Instant Foods",
      slug: "packaged-instant-foods",
      sortOrder: 10,
      description: "Noodles, Pasta, Ready-to-Eat Soups & Instant Mixes",
      imageUrl: "/images/categories/instant-foods.png",
    },
  ];

  for (const cat of FMCG_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ slug: cat.slug }, { name: cat.name }],
      },
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          sortOrder: cat.sortOrder,
          description: cat.description,
          isVisible: true,
          deletedAt: null,
        },
      });
      console.log(`✓ Updated category: ${cat.name}`);
    } else {
      await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          sortOrder: cat.sortOrder,
          description: cat.description,
          imageUrl: cat.imageUrl,
          isVisible: true,
        },
      });
      console.log(`+ Created category: ${cat.name}`);
    }
  }

  const all = await prisma.category.findMany({
    where: { isVisible: true, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  });
  console.log(`Total active categories now: ${all.length}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Failed to seed categories:", err);
  process.exit(1);
});

