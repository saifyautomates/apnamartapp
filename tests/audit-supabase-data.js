const { PrismaClient } = require('@prisma/client');

async function checkTables() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.ezwkjxhdkhgvyahypsjn:Hufsasaifquazi@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=3"
      }
    }
  });

  try {
    const zones = await prisma.deliveryZone.findMany({
      select: { name: true, pincodes: true, isActive: true, deliveryChargePaise: true, freeThresholdPaise: true }
    });
    console.log('=== KOTA DELIVERY ZONES IN SUPABASE ===');
    zones.forEach(z => {
      console.log(`• Zone: "${z.name}" | Pincodes: [${z.pincodes.join(', ')}] | Active: ${z.isActive} | Charge: Rs.${z.deliveryChargePaise/100} (Free above Rs.${z.freeThresholdPaise/100})`);
    });

    const products = await prisma.product.findMany({
      take: 5,
      select: { name: true, slug: true, brand: { select: { name: true } } }
    });
    console.log('\nSample Live Products:');
    products.forEach(p => console.log(`• ${p.name} (${p.brand?.name ?? 'No brand'}) - /product/${p.slug}`));

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
