const assert = require("assert");

const BASE = "http://localhost:3000";

async function runSeoTests() {
  console.log("================================================================================");
  console.log("🌟 WORLD-CLASS LOCAL & TECHNICAL SEO VERIFICATION (KOTA / 80 FEET ROAD)");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;
  function check(cond, name, detail = "") {
    if (cond) {
      passed++;
      console.log(`  ✅ PASS: ${name} ${detail ? `(${detail})` : ""}`);
    } else {
      failed++;
      console.error(`  ❌ FAIL: ${name} ${detail ? `(${detail})` : ""}`);
    }
  }

  // 1. HOMEPAGE SEO AUDIT
  console.log("▶ [CHECK 1/5] Homepage SEO, Metadata & Schema.org");
  const homeRes = await fetch(`${BASE}/`);
  check(homeRes.status === 200, "Homepage returns HTTP 200");
  const homeHtml = await homeRes.text();

  check(homeHtml.includes("80 Feet Road"), "Homepage HTML contains '80 Feet Road'");
  check(homeHtml.includes("Kota"), "Homepage HTML contains 'Kota'");
  check(homeHtml.includes("Central Mart"), "Homepage HTML contains 'Central Mart'");

  // Title & Description
  check(homeHtml.includes("<title>Central Mart — Kota&#x27;s Online FMCG Supermarket | 80 Feet Road</title>") ||
        homeHtml.includes("Central Mart — Kota") && homeHtml.includes("80 Feet Road"), "SEO Title includes 80 Feet Road Kota");

  check(homeHtml.includes('name="description" content="Order 100% genuine packaged groceries, dairy, staples, snacks, cold drinks, cleaning &amp; personal care essentials online in Kota, Rajasthan. Located at 80 Feet Road with reliable Same-Day Doorstep Delivery."') ||
        homeHtml.includes("80 Feet Road with reliable Same-Day Doorstep Delivery"), "Meta Description includes 80 Feet Road Kota");

  // OpenGraph & Twitter
  check(homeHtml.includes('property="og:title"'), "OpenGraph og:title tag present");
  check(homeHtml.includes('property="og:site_name" content="Central Mart Kota"'), "OpenGraph site_name is 'Central Mart Kota'");
  check(homeHtml.includes('name="twitter:card" content="summary_large_image"'), "Twitter card summary_large_image present");

  // Schema.org JSON-LD
  check(homeHtml.includes('"@type":["GroceryStore","Supermarket","Store"]') || homeHtml.includes('"GroceryStore"'), "Schema.org GroceryStore/Supermarket present");
  check(homeHtml.includes('"streetAddress":"80 Feet Road"'), "Schema.org streetAddress is '80 Feet Road'");
  check(homeHtml.includes('"addressLocality":"Kota"'), "Schema.org addressLocality is 'Kota'");
  check(homeHtml.includes('"addressRegion":"Rajasthan"'), "Schema.org addressRegion is 'Rajasthan'");
  check(homeHtml.includes('"postalCode":"324005"'), "Schema.org postalCode is '324005'");
  check(homeHtml.includes('"latitude":25.1388'), "Schema.org GeoCoordinates latitude present");
  check(homeHtml.includes('"longitude":75.845'), "Schema.org GeoCoordinates longitude present");
  check(homeHtml.includes('"SearchAction"'), "Schema.org Sitelinks SearchAction present");

  // 2. CATEGORY SEO AUDIT
  console.log("\n▶ [CHECK 2/5] Category Page Dynamic SEO & Schema");
  const catRes = await fetch(`${BASE}/category/dairy-eggs`);
  check(catRes.status === 200, "Category page returns HTTP 200");
  const catHtml = await catRes.text();

  check(catHtml.includes("Dairy, Bread &amp; Eggs") || catHtml.includes("Dairy"), "Category title has category name");
  check(catHtml.includes("Kota") && catHtml.includes("80 Feet Road"), "Category page targets Kota & 80 Feet Road");
  check(catHtml.includes('"@type":"CollectionPage"'), "Category CollectionPage schema present");
  check(catHtml.includes('"@type":"BreadcrumbList"'), "Category BreadcrumbList schema present");

  // 3. PRODUCT SEO AUDIT
  console.log("\n▶ [CHECK 3/5] Product Page Dynamic SEO & Schema");
  const prodRes = await fetch(`${BASE}/product/parle-g-glucose-biscuits`);
  check(prodRes.status === 200, "Product page returns HTTP 200");
  const prodHtml = await prodRes.text();

  check(prodHtml.includes("Parle-G"), "Product page includes product name");
  check(prodHtml.includes("80 Feet Road"), "Product page mentions 80 Feet Road fulfillment");
  check(prodHtml.includes('"@type":"Product"'), "Product Schema.org Product present");
  check(prodHtml.includes('"@type":"Offer"'), "Product Schema.org Offer present");
  check(prodHtml.includes('"streetAddress":"80 Feet Road"'), "Product Offer seller address is 80 Feet Road");

  // 4. SITEMAP.XML AUDIT
  console.log("\n▶ [CHECK 4/5] Dynamic XML Sitemap");
  const sitemapRes = await fetch(`${BASE}/sitemap.xml`);
  check(sitemapRes.status === 200, "Sitemap returns HTTP 200");
  const sitemapXml = await sitemapRes.text();
  check(sitemapXml.includes("<urlset"), "Sitemap is valid XML urlset");
  check(sitemapXml.includes("<priority>1"), "Homepage priority 1.0 set in sitemap");
  check(sitemapXml.includes("/category/"), "Category URLs listed in sitemap");
  check(sitemapXml.includes("/product/"), "Product URLs listed in sitemap");

  // 5. ROBOTS.TXT AUDIT
  console.log("\n▶ [CHECK 5/5] Robots.txt Crawlability");
  const robotsRes = await fetch(`${BASE}/robots.txt`);
  check(robotsRes.status === 200, "Robots.txt returns HTTP 200");
  const robotsTxt = await robotsRes.text();
  check(robotsTxt.includes("Allow: /"), "Robots allows storefront crawling");
  check(robotsTxt.includes("Disallow: /admin/"), "Robots protects /admin/ from crawling");
  check(robotsTxt.includes("sitemap.xml"), "Robots references sitemap.xml");

  console.log("\n================================================================================");
  console.log(`📊 SEO AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) process.exit(1);
}

runSeoTests().catch((err) => {
  console.error("SEO Audit Error:", err);
  process.exit(1);
});

