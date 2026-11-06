import { seedFmcgDatabase } from "../src/lib/fmcg-catalog";

const count = parseInt(process.env.FMCG_COUNT ?? "500", 10) || 500;

async function run() {
  console.log(`Starting FMCG catalogue seed for ${count} products...`);
  const start = Date.now();
  const result = await seedFmcgDatabase(count);
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`✅ FMCG Seed Finished in ${elapsed}s:`, result);
}

run()
  .catch((err) => {
    console.error("❌ FMCG Seed Failed:", err);
    process.exit(1);
  });
