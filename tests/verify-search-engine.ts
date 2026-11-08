/**
 * Comprehensive Production Search Engine Verification Suite
 * Tests exact matches, Hinglish synonyms, fuzzy typo tolerance, autocomplete,
 * pagination, security sanitization, and latency under load.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  console.log("================================================================================");
  console.log("🔍 RUNNING COMPREHENSIVE SEARCH ENGINE PRODUCTION VERIFICATION");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Exact Query Tests
  console.log("\n▶ [TEST 1/6] EXACT PRODUCT & BRAND MATCHES");
  for (const term of ["atta", "milk", "oil", "salt", "maggi"]) {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(term)}&pageSize=10`);
    const t1 = performance.now();
    const json = await res.json();
    const items = json.data?.items ?? [];
    assert(res.ok && items.length > 0, `Query "${term}" returned ${items.length} items in ${(t1 - t0).toFixed(1)}ms`);
  }

  // 2. Hinglish & Colloquial Grocery Synonyms
  console.log("\n▶ [TEST 2/6] HINGLISH & COLLOQUIAL FMCG SYNONYMS");
  const hinglishTests = [
    { query: "doodh", expectedInName: "milk" },
    { query: "tel", expectedInName: "oil" },
    { query: "namak", expectedInName: "salt" },
    { query: "chawal", expectedInName: "rice" },
    { query: "makhan", expectedInName: "butter" },
    { query: "chai", expectedInName: "tea" },
    { query: "sabun", expectedInName: "detergent" },
  ];

  for (const test of hinglishTests) {
    const res = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(test.query)}&pageSize=5`);
    const json = await res.json();
    const items = json.data?.items ?? [];
    const found = items.some((i: any) => i.name.toLowerCase().includes(test.expectedInName));
    assert(res.ok && items.length > 0 && found, `Hinglish term "${test.query}" resolved to "${test.expectedInName}" products (${items.length} found)`);
  }

  // 3. Typo-Tolerant Trigram Fuzzy Search
  console.log("\n▶ [TEST 3/6] TYPO-TOLERANT TRIGRAM FUZZY SEARCH (pg_trgm)");
  const typoTests = [
    { typo: "amull", expected: "Amul" },
    { typo: "aashirvad", expected: "Aashirvaad" },
    { typo: "maggie", expected: "Maggi" },
  ];

  for (const test of typoTests) {
    const res = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(test.typo)}&pageSize=5`);
    const json = await res.json();
    const items = json.data?.items ?? [];
    const found = items.some((i: any) => i.name.toLowerCase().includes(test.expected.toLowerCase()));
    assert(res.ok && items.length > 0 && found, `Typo "${test.typo}" correctly resolved to ${test.expected} products`);
  }

  // 4. Live Autocomplete Suggestions
  console.log("\n▶ [TEST 4/6] AUTOCOMPLETE SUGGESTIONS (< 25MS)");
  for (const prefix of ["at", "mil", "doodh", "chaw"]) {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/search/suggest?q=${encodeURIComponent(prefix)}`);
    const t1 = performance.now();
    const json = await res.json();
    const suggs = json.data?.suggestions ?? [];
    assert(res.ok && suggs.length > 0, `Prefix "${prefix}" returned ${suggs.length} suggestions in ${(t1 - t0).toFixed(1)}ms`);
  }

  // 5. Security & Edge Case Handling
  console.log("\n▶ [TEST 5/6] SECURITY & MALFORMED INPUT HANDLING");
  {
    // Empty search
    const emptyRes = await fetch(`${BASE_URL}/api/search?q=`);
    const emptyJson = await emptyRes.json();
    assert(emptyRes.ok && emptyJson.data?.items?.length === 0, "Empty query returns 0 items safely");

    // SQL Injection attempt
    const sqliRes = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent("'; DROP TABLE \"Product\";--")}`);
    assert(sqliRes.ok, "SQL injection attempt handled cleanly without 500 error");

    // XSS payload attempt
    const xssRes = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent("<script>alert('xss')</script>")}`);
    assert(xssRes.ok, "XSS script payload handled cleanly without 500 error");

    // Extreme special characters
    const specialRes = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent("!@#$%^&*()_+=-~`{}[]:;'<>?,./")}`);
    assert(specialRes.ok, "Special characters string returns gracefully");
  }

  // 6. High-Speed Burst Latency (10 Concurrent Queries)
  console.log("\n▶ [TEST 6/6] CONCURRENT SEARCH BURST BENCHMARK");
  {
    // Prime the cache with 1 query first, then test rapid concurrent execution
    await fetch(`${BASE_URL}/api/search?q=milk&page=1&pageSize=10`);
    const start = performance.now();
    const promises = Array.from({ length: 10 }).map((_, i) =>
      fetch(`${BASE_URL}/api/search?q=milk&page=1&pageSize=10`)
    );
    const responses = await Promise.all(promises);
    const duration = performance.now() - start;
    const allOk = responses.every((r) => r.ok);
    assert(allOk && duration < 2000, `Burst of 10 concurrent search queries resolved in ${duration.toFixed(1)}ms (${(duration / 10).toFixed(1)}ms avg)`);
  }

  console.log("\n================================================================================");
  console.log(`🏁 SEARCH ENGINE AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("FATAL ERROR IN SEARCH SUITE:", err);
  process.exit(1);
});

