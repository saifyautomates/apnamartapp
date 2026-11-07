import { prisma } from "../src/lib/prisma";

async function enableRealtimeTables() {
  console.log("Enabling Supabase Realtime CDC for critical retail tables...");
  const tables = ["Order", "Inventory", "ProductVariant", "OrderStatusHistory", "Payment"];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "${table}";`);
      console.log(`✓ Added "${table}" to supabase_realtime publication`);
    } catch (err: any) {
      if (err.message?.includes("already in publication") || err.message?.includes("duplicate")) {
        console.log(`✓ "${table}" is already in supabase_realtime publication`);
      } else {
        console.warn(`Could not add "${table}":`, err.message);
      }
    }
  }

  const pubTables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  `;
  console.log("\nActive tables in Supabase Realtime Replication:", pubTables.map(t => t.tablename));
  await prisma.$disconnect();
}

enableRealtimeTables();
