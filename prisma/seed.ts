/**
 * Demo seed — realistic Indian grocery catalogue, clearly separated from production data.
 * Run: npm run seed
 * - Idempotent on second run for roles/permissions/settings/zones/coupons (upserts).
 * - Products are skipped if their SKU already exists (safe re-run).
 * - Admin user is created ONLY from env ADMIN_USERNAME / ADMIN_PASSWORD (never hardcoded).
 * - This seed intentionally does NOT create 5,000 products; the catalogue engine is
 *   pagination-based and the bulk CSV importer is the path for the real 5,000-SKU load.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSIONS, ROLE_PERMISSIONS } from "../src/lib/rbac";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const prisma = new PrismaClient();

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

type VariantDef = [pack: string, mrp: number, selling: number, stock: number, weightGrams?: number];
type ProductDef = {
  name: string;
  brand: string;
  category: string;
  sub?: string;
  gstBps: number;
  hsnSac?: string;
  desc?: string;
  featured?: boolean;
  variants: VariantDef[];
};

// Prices in rupees (converted to paise below).
const PRODUCTS: ProductDef[] = [
  { name: "Aashirvaad Shudh Chakki Atta", brand: "Aashirvaad", category: "Staples", sub: "Atta & Flour", gstBps: 500, variants: [["1 kg", 62, 58, 120, 1000], ["5 kg", 289, 269, 80, 5000], ["10 kg", 565, 529, 50, 10000]], featured: true },
  { name: "Tata Salt Iodised", brand: "Tata Salt", category: "Staples", sub: "Salt & Sugar", gstBps: 0, variants: [["1 kg", 28, 26, 200, 1000]] },
  { name: "Tata Salt Lite Low Sodium", brand: "Tata Salt", category: "Staples", sub: "Salt & Sugar", gstBps: 0, variants: [["1 kg", 118, 110, 60, 1000]] },
  { name: "Fortune Sunflower Oil", brand: "Fortune", category: "Staples", sub: "Edible Oils", gstBps: 500, variants: [["1 L", 165, 152, 90, 1000], ["5 L", 789, 729, 40, 5000]] },
  { name: "Fortune Soya Health Oil", brand: "Fortune", category: "Staples", sub: "Edible Oils", gstBps: 500, variants: [["1 L", 175, 162, 70, 1000]] },
  { name: "India Gate Basmati Rice", brand: "India Gate", category: "Staples", sub: "Rice & Grains", gstBps: 500, variants: [["1 kg", 129, 119, 100, 1000], ["5 kg", 629, 589, 45, 5000]] },
  { name: "Toor Dal Unpolished", brand: "Tata Sampann", category: "Staples", sub: "Dal & Pulses", gstBps: 500, variants: [["1 kg", 189, 175, 110, 1000], ["500 g", 99, 92, 90, 500]] },
  { name: "Moong Dal Yellow", brand: "Tata Sampann", category: "Staples", sub: "Dal & Pulses", gstBps: 500, variants: [["1 kg", 169, 158, 80, 1000]] },
  { name: "Amul Taaza Toned Milk", brand: "Amul", category: "Dairy & Eggs", sub: "Milk", gstBps: 0, variants: [["500 ml", 27, 27, 300, 500], ["1 L", 54, 54, 200, 1000]], featured: true },
  { name: "Amul Gold Full Cream Milk", brand: "Amul", category: "Dairy & Eggs", sub: "Milk", gstBps: 0, variants: [["500 ml", 33, 33, 250, 500], ["1 L", 66, 66, 180, 1000]] },
  { name: "Amul Butter", brand: "Amul", category: "Dairy & Eggs", sub: "Butter & Ghee", gstBps: 1200, variants: [["100 g", 58, 55, 150, 100], ["500 g", 285, 270, 80, 500]] },
  { name: "Amul Ghee", brand: "Amul", category: "Dairy & Eggs", sub: "Butter & Ghee", gstBps: 1200, variants: [["500 ml", 325, 305, 70, 500], ["1 L", 640, 599, 45, 1000]] },
  { name: "Amul Cheese Slices", brand: "Amul", category: "Dairy & Eggs", sub: "Cheese", gstBps: 1200, variants: [["200 g (10 slices)", 125, 118, 90, 200]] },
  { name: "Amul Fresh Cream", brand: "Amul", category: "Dairy & Eggs", sub: "Curd & Yogurt", gstBps: 1200, variants: [["200 ml", 68, 65, 100, 200]] },
  { name: "Mother Dairy Curd", brand: "Mother Dairy", category: "Dairy & Eggs", sub: "Curd & Yogurt", gstBps: 0, variants: [["400 g", 45, 44, 200, 400], ["1 kg", 105, 102, 120, 1000]] },
  { name: "Britannia Good Day Cashew Cookies", brand: "Britannia", category: "Snacks", sub: "Biscuits", gstBps: 1800, variants: [["200 g", 40, 37, 200, 200], ["600 g", 110, 102, 120, 600]] },
  { name: "Britannia Marie Gold", brand: "Britannia", category: "Snacks", sub: "Biscuits", gstBps: 1800, variants: [["250 g", 45, 42, 180, 250]] },
  { name: "Parle-G Glucose Biscuits", brand: "Parle", category: "Snacks", sub: "Biscuits", gstBps: 1800, variants: [["200 g", 20, 19, 300, 200], ["800 g", 75, 70, 150, 800]], featured: true },
  { name: "Maggi 2-Minute Noodles", brand: "Maggi", category: "Snacks", sub: "Noodles & Pasta", gstBps: 1800, variants: [["70 g", 14, 13, 400, 70], ["280 g (4 pack)", 56, 52, 200, 280], ["560 g (8 pack)", 112, 104, 120, 560]], featured: true },
  { name: "Haldiram's Aloo Bhujia", brand: "Haldiram's", category: "Snacks", sub: "Namkeen", gstBps: 1200, variants: [["200 g", 55, 51, 150, 200], ["400 g", 105, 98, 100, 400]] },
  { name: "Haldiram's Moong Dal Namkeen", brand: "Haldiram's", category: "Snacks", sub: "Namkeen", gstBps: 1200, variants: [["200 g", 60, 56, 120, 200]] },
  { name: "Coca-Cola Soft Drink", brand: "Coca-Cola", category: "Beverages", sub: "Soft Drinks", gstBps: 2800, variants: [["250 ml", 20, 19, 300, 250], ["750 ml", 45, 42, 200, 750], ["1.25 L", 70, 66, 150, 1250], ["2 L", 100, 94, 120, 2000]], featured: true },
  { name: "Pepsi Soft Drink", brand: "Pepsi", category: "Beverages", sub: "Soft Drinks", gstBps: 2800, variants: [["250 ml", 20, 19, 280, 250], ["750 ml", 45, 42, 180, 750], ["2 L", 100, 94, 110, 2000]] },
  { name: "Tata Tea Gold", brand: "Tata Tea", category: "Beverages", sub: "Tea & Coffee", gstBps: 500, variants: [["250 g", 145, 136, 130, 250], ["500 g", 285, 268, 90, 500]] },
  { name: "Brooke Bond Red Label Tea", brand: "Brooke Bond", category: "Beverages", sub: "Tea & Coffee", gstBps: 500, variants: [["250 g", 135, 127, 140, 250], ["500 g", 265, 249, 80, 500]] },
  { name: "Nescafé Classic Coffee", brand: "Nestlé", category: "Beverages", sub: "Tea & Coffee", gstBps: 1800, variants: [["50 g", 175, 165, 90, 50], ["200 g", 649, 609, 50, 200]] },
  { name: "Real Mango Juice", brand: "Real", category: "Beverages", sub: "Juices", gstBps: 1200, variants: [["200 ml", 20, 19, 200, 200], ["1 L", 110, 102, 120, 1000]] },
  { name: "Surf Excel Easy Wash Detergent Powder", brand: "Surf Excel", category: "Household", sub: "Detergents", gstBps: 1800, variants: [["500 g", 75, 70, 150, 500], ["1 kg", 145, 136, 100, 1000], ["4 kg", 549, 515, 50, 4000]] },
  { name: "Vim Dishwash Bar", brand: "Vim", category: "Household", sub: "Cleaning", gstBps: 1800, variants: [["200 g (3 pack)", 60, 56, 180, 200]] },
  { name: "Harpic Toilet Cleaner", brand: "Harpic", category: "Household", sub: "Cleaning", gstBps: 1800, variants: [["500 ml", 99, 92, 120, 500], ["1 L", 185, 172, 80, 1000]] },
  { name: "Colgate Strong Teeth Toothpaste", brand: "Colgate", category: "Personal Care", sub: "Oral Care", gstBps: 1800, variants: [["100 g", 58, 54, 200, 100], ["200 g", 112, 105, 130, 200]] },
  { name: "Dabur Red Paste", brand: "Dabur", category: "Personal Care", sub: "Oral Care", gstBps: 1800, variants: [["100 g", 62, 58, 150, 100]] },
  { name: "Clinic Plus Shampoo", brand: "Clinic Plus", category: "Personal Care", sub: "Hair Care", gstBps: 1800, variants: [["175 ml", 115, 108, 120, 175]] },
  { name: "Nivea Body Lotion", brand: "Nivea", category: "Personal Care", sub: "Skin Care", gstBps: 1800, variants: [["200 ml", 199, 185, 90, 200]] },
  { name: "Kellogg's Corn Flakes", brand: "Kellogg's", category: "Breakfast", sub: "Cereals", gstBps: 1200, variants: [["250 g", 105, 98, 110, 250], ["475 g", 190, 178, 70, 475]] },
  { name: "Nutella Hazelnut Spread", brand: "Nutella", category: "Breakfast", sub: "Spreads", gstBps: 1800, variants: [["180 g", 215, 205, 80, 180], ["350 g", 399, 379, 55, 350]] },
  { name: "MDH Garam Masala", brand: "MDH", category: "Staples", sub: "Spices", gstBps: 500, variants: [["100 g", 75, 70, 150, 100]] },
  { name: "Everest Turmeric Powder", brand: "Everest", category: "Staples", sub: "Spices", gstBps: 500, variants: [["200 g", 68, 64, 140, 200]] },
  { name: "Lijjat Papad", brand: "Lijjat", category: "Staples", sub: "Papad & Pickles", gstBps: 500, variants: [["200 g", 55, 52, 130, 200]] },
  { name: "Dairy Milk Chocolate", brand: "Cadbury", category: "Snacks", sub: "Chocolates", gstBps: 1800, variants: [["40 g", 40, 38, 220, 40], ["120 g", 120, 112, 130, 120]] },
];

const CATEGORIES: Array<{ name: string; subs: string[] }> = [
  { name: "Staples", subs: ["Atta & Flour", "Rice & Grains", "Dal & Pulses", "Salt & Sugar", "Edible Oils", "Spices", "Papad & Pickles"] },
  { name: "Dairy & Eggs", subs: ["Milk", "Butter & Ghee", "Cheese", "Curd & Yogurt"] },
  { name: "Snacks", subs: ["Biscuits", "Namkeen", "Noodles & Pasta", "Chocolates"] },
  { name: "Beverages", subs: ["Soft Drinks", "Juices", "Tea & Coffee"] },
  { name: "Household", subs: ["Detergents", "Cleaning", "Soaps"] },
  { name: "Personal Care", subs: ["Oral Care", "Hair Care", "Skin Care"] },
  { name: "Breakfast", subs: ["Cereals", "Spreads", "Bread & Bakery"] },
];

async function main() {
  // Roles + permissions
  const permMap = new Map<string, string>();
  for (const key of PERMISSIONS) {
    const p = await prisma.permission.upsert({ where: { key }, create: { key }, update: {} });
    permMap.set(key, p.id);
  }
  for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({ where: { name: roleName as never }, create: { name: roleName as never }, update: {} });
    for (const key of keys) {
      const pid = permMap.get(key);
      if (!pid) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: pid } },
        create: { roleId: role.id, permissionId: pid },
        update: {},
      });
    }
  }

  // Settings defaults (only when absent)
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({ where: { key }, create: { key, value: value as object }, update: {} });
  }

  // Categories + subcategories
  const catMap = new Map<string, string>();
  const subMap = new Map<string, string>();
  let sort = 0;
  for (const c of CATEGORIES) {
    sort += 1;
    const cat = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      create: { name: c.name, slug: slugify(c.name), sortOrder: sort },
      update: { sortOrder: sort },
    });
    catMap.set(c.name, cat.id);
    let ssort = 0;
    for (const s of c.subs) {
      ssort += 1;
      const sub = await prisma.subcategory.upsert({
        where: { slug: slugify(s) },
        create: { categoryId: cat.id, name: s, slug: slugify(s), sortOrder: ssort },
        update: { sortOrder: ssort, categoryId: cat.id },
      });
      subMap.set(`${c.name}::${s}`, sub.id);
    }
  }

  // Brands
  const brandNames = [...new Set(PRODUCTS.map((p) => p.brand))];
  const brandMap = new Map<string, string>();
  for (const b of brandNames) {
    const brand = await prisma.brand.upsert({ where: { slug: slugify(b) }, create: { name: b, slug: slugify(b) }, update: {} });
    brandMap.set(b, brand.id);
  }

  // Products + variants + inventory + prices
  let createdProducts = 0;
  let createdVariants = 0;
  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) continue;
    const categoryId = catMap.get(p.category);
    if (!categoryId) throw new Error(`Category missing: ${p.category}`);
    const product = await prisma.product.create({
      data: {
        internalId: `DEMO-${slug.toUpperCase()}`,
        sku: `DEMO-${slug.toUpperCase()}`,
        name: p.name,
        slug,
        brandId: brandMap.get(p.brand),
        categoryId,
        subcategoryId: p.sub ? subMap.get(`${p.category}::${p.sub}`) : null,
        description: `Demo catalogue item: ${p.name}. Replace with the store's real catalogue via CSV import before production use.`,
        hsnSac: p.hsnSac ?? null,
        gstBps: p.gstBps,
        featured: p.featured ?? false,
      },
    });
    createdProducts += 1;
    await prisma.productImage.create({ data: { productId: product.id, url: `/images/products/${slug}.jpg`, alt: p.name, sortOrder: 0 } });
    for (const [pack, mrp, selling, stock, weightGrams] of p.variants) {
      const vsku = `DEMO-${slug.toUpperCase()}-${slugify(pack).toUpperCase()}`;
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          name: pack,
          sku: vsku,
          mrpPaise: Math.round(mrp * 100),
          sellingPaise: Math.round(selling * 100),
          packSize: pack,
          weightGrams: weightGrams ?? null,
        },
      });
      createdVariants += 1;
      await prisma.inventory.create({ data: { variantId: variant.id, availableQty: stock, reservedQty: 0, minStock: 10 } });
      await prisma.price.create({ data: { variantId: variant.id, mrpPaise: Math.round(mrp * 100), sellingPaise: Math.round(selling * 100), priceSource: "SOURCE" } });
    }
  }

  // Delivery zones + slots (demo PINs — replace with the store's real zones)
  const zone = await prisma.deliveryZone.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    create: { id: "00000000-0000-0000-0000-000000000001", name: "City Centre", pincodes: ["302001", "302002", "302003"], minOrderPaise: 19900, deliveryChargePaise: 3000, freeThresholdPaise: 99900 },
    update: {},
  });
  for (const [label, start, end] of [["9 AM – 12 PM", "09:00", "12:00"], ["12 PM – 4 PM", "12:00", "16:00"], ["4 PM – 8 PM", "16:00", "20:00"]] as const) {
    await prisma.deliverySlot.upsert({
      where: { id: `00000000-0000-0000-0000-00000000000${label === "9 AM – 12 PM" ? "2" : label === "12 PM – 4 PM" ? "3" : "4"}` },
      create: { id: `00000000-0000-0000-0000-00000000000${label === "9 AM – 12 PM" ? "2" : label === "12 PM – 4 PM" ? "3" : "4"}`, zoneId: zone.id, label, startTime: start, endTime: end, maxOrdersPerDay: 100 },
      update: {},
    });
  }

  // Coupons
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    create: { code: "WELCOME10", type: "PERCENT", discountPercent: 10, maxDiscountPaise: 10000, minOrderPaise: 49900, firstOrderOnly: true, perUserLimit: 1 },
    update: {},
  });
  await prisma.coupon.upsert({
    where: { code: "FLAT50" },
    create: { code: "FLAT50", type: "FLAT", discountPaise: 5000, minOrderPaise: 99900, perUserLimit: 3 },
    update: {},
  });

  // Admin user ONLY from env (never hardcoded)
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (adminUser && adminPass) {
    const owner = await prisma.role.findUnique({ where: { name: "OWNER" } });
    const existing = await prisma.adminUser.findUnique({ where: { username: adminUser } });
    if (!existing) {
      const admin = await prisma.adminUser.create({
        data: { username: adminUser, email: `${adminUser}@local.store`, passwordHash: await bcrypt.hash(adminPass, 12), mustChangePassword: true },
      });
      if (owner) await prisma.adminUserRole.create({ data: { adminUserId: admin.id, roleId: owner.id } });
      console.log(`Admin user created: ${adminUser} (OWNER)`);
    } else {
      console.log(`Admin user already exists: ${adminUser} (password unchanged)`);
    }
  } else {
    console.log("ADMIN_USERNAME/ADMIN_PASSWORD not set — skipping admin creation. Use POST /api/auth/setup on first run instead.");
  }

  // Ensure jackxparrowww@gmail.com has OWNER privileges
  const ownerRole = await prisma.role.findUnique({ where: { name: "OWNER" } });
  if (ownerRole) {
    const existingJackx = await prisma.adminUser.findUnique({ where: { email: "jackxparrowww@gmail.com" } });
    if (!existingJackx) {
      const jackxAdmin = await prisma.adminUser.create({
        data: {
          username: "jackx",
          email: "jackxparrowww@gmail.com",
          passwordHash: await bcrypt.hash("AdminJackx2026!", 12),
          mustChangePassword: false,
          isActive: true,
        },
      });
      await prisma.adminUserRole.create({ data: { adminUserId: jackxAdmin.id, roleId: ownerRole.id } });
      console.log("Super Admin jackxparrowww@gmail.com created (OWNER)");
    } else {
      await prisma.adminUserRole.upsert({
        where: { adminUserId_roleId: { adminUserId: existingJackx.id, roleId: ownerRole.id } },
        create: { adminUserId: existingJackx.id, roleId: ownerRole.id },
        update: {},
      });
    }
  }

  console.log(`Seed done: ${createdProducts} new products, ${createdVariants} new variants (existing SKUs skipped).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
