/**
 * Master Central Mart Full End-to-End Test Orchestrator
 *
 * Runs all validation layers:
 * 1. Supabase & Database Full Sync
 * 2. 10-Domain Comprehensive Production Audit
 * 3. Hardest Battle Stress & Security Matrix
 * 4. Platform Smoke Test Suite
 */

import { execSync } from "child_process";

interface SuiteResult {
  name: string;
  command: string;
  passed: boolean;
  output: string;
  durationMs: number;
}

const suites = [
  { name: "Supabase & Database CDC Realtime Sync", command: "npx tsx tests/verify-supabase-full-sync.ts" },
  { name: "10-Domain Comprehensive Production E2E Audit", command: "npx tsx tests/e2e-production-audit.ts" },
  { name: "Hardest Battle & Stress Attack Matrix", command: "npx tsx tests/hardest-battle-test.ts" },
  { name: "Platform Core Smoke Test Suite", command: "npx tsx tests/smoke.ts" },
  { name: "Vitest Unit & POS Engine Suite", command: "npx vitest run" },
];

async function runAll() {
  console.log("================================================================================");
  console.log("🚀 EXECUTING COMPLETE END-TO-END SYSTEM TEST ACROSS ALL TIERS");
  console.log("================================================================================");

  const results: SuiteResult[] = [];

  for (const suite of suites) {
    console.log(`\n▶ RUNNING: ${suite.name}...`);
    const start = Date.now();
    try {
      const output = execSync(suite.command, { stdio: "pipe", encoding: "utf8" });
      const durationMs = Date.now() - start;
      console.log(output);
      results.push({ name: suite.name, command: suite.command, passed: true, output, durationMs });
      console.log(`✓ ${suite.name} PASSED (${(durationMs / 1000).toFixed(1)}s)`);
    } catch (err: any) {
      const durationMs = Date.now() - start;
      const errorOutput = err.stdout || err.stderr || err.message;
      console.error(errorOutput);
      results.push({ name: suite.name, command: suite.command, passed: false, output: errorOutput, durationMs });
      console.error(`✗ ${suite.name} FAILED (${(durationMs / 1000).toFixed(1)}s)`);
    }
  }

  console.log("\n================================================================================");
  console.log("📊 MASTER END-TO-END TEST SUITE SUMMARY");
  console.log("================================================================================");

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? "✓ PASS" : "✗ FAIL";
    console.log(`${icon} | ${(r.durationMs / 1000).toFixed(1).padStart(5)}s | ${r.name}`);
    if (!r.passed) allPassed = false;
  }

  console.log("================================================================================");
  if (allPassed) {
    console.log("🎉 ALL END-TO-END SUITES PASSED WITH 100% SUCCESS!");
  } else {
    console.error("❌ SOME SUITES FAILED.");
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error("Runner crash:", err);
  process.exit(1);
});
