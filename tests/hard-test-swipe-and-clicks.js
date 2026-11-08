const puppeteer = require("puppeteer-core");
const path = require("path");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_DIR = "C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc";

async function runAudit() {
  console.log("=== HARD TESTING: SWIPE & CLICK BEHAVIORS (NO SUGARCOATING) ===");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const logs = [];
  page.on("console", (msg) => logs.push(`[Console ${msg.type()}]: ${msg.text()}`));
  page.on("pageerror", (err) => logs.push(`[PageError]: ${err.toString()}`));

  try {
    // -------------------------------------------------------------
    // TEST 1: DESKTOP VIEWPORT - CAROUSEL & DEALS SWIPE VS CLICK
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: DESKTOP CAROUSEL (1366x850) ---");
    await page.setViewport({ width: 1366, height: 850 });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await sleep(800);

    // Scroll to deals section
    await page.evaluate(() => {
      document.getElementById("deals")?.scrollIntoView({ behavior: "instant", block: "center" });
    });
    await sleep(400);

    const initialDealsScroll = await page.evaluate(() => {
      const el = document.querySelector("#deals .overflow-x-auto");
      return el ? el.scrollLeft : -1;
    });
    console.log("Initial Deals scrollLeft:", initialDealsScroll);

    // Step 1A: Test pure click on product card opens ProductDetailModal
    console.log("Testing pure click on deal card to open modal...");
    const firstDealTitle = await page.$("#deals .overflow-x-auto h4");
    if (!firstDealTitle) {
      throw new Error("No deal card title found!");
    }
    await firstDealTitle.click();
    await sleep(600);

    const isModalOpen = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]') || document.querySelector(".fixed.inset-0");
      return !!modal;
    });
    console.log("Did pure click open Product Modal?", isModalOpen ? "PASS: YES" : "FAIL: NO");

    if (isModalOpen) {
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_desktop_modal_opened.png") });
      // Close the modal
      await page.keyboard.press("Escape");
      await sleep(400);
      // Fallback click on backdrop or close button if still open
      await page.evaluate(() => {
        const closeBtn = document.querySelector('[aria-label="Close"]') || document.querySelector('button svg path[d*="6 18L18 6"]')?.closest('button');
        if (closeBtn) closeBtn.click();
      });
      await sleep(300);
    }

    // Step 1B: Test click on ADD button
    console.log("Testing click on ADD button in deals card...");
    const addBtn = await page.$("#deals .overflow-x-auto button");
    if (addBtn) {
      await addBtn.click();
      await sleep(300);
      const isStepperVisible = await page.evaluate(() => {
        const stepper = document.querySelector("#deals .overflow-x-auto button[aria-label='Increase quantity']");
        return !!stepper;
      });
      console.log("Did ADD button turn into stepper?", isStepperVisible ? "PASS: YES" : "FAIL: NO");
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_desktop_add_stepper.png") });
    }

    // Step 1C: Test horizontal mouse drag (swipe)
    console.log("Testing horizontal mouse drag on Deals rail...");
    const trackBounds = await page.evaluate(() => {
      const el = document.querySelector("#deals .overflow-x-auto");
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });

    if (trackBounds) {
      await page.mouse.move(trackBounds.x, trackBounds.y);
      await page.mouse.down();
      // Drag left 250px
      for (let i = 0; i <= 25; i++) {
        await page.mouse.move(trackBounds.x - i * 10, trackBounds.y);
        await sleep(10);
      }
      await page.mouse.up();
      await sleep(300);

      const afterDragScroll = await page.evaluate(() => {
        const el = document.querySelector("#deals .overflow-x-auto");
        return el ? el.scrollLeft : -1;
      });
      console.log(`Deals scrollLeft after 250px mouse drag: ${afterDragScroll} (was ${initialDealsScroll})`);
      const dragSuccess = afterDragScroll > initialDealsScroll + 30;
      console.log("Did mouse drag scroll the rail?", dragSuccess ? "PASS: YES" : "FAIL: NO");

      // Verify that mouse up did NOT accidentally trigger a card modal
      const modalAfterDrag = await page.evaluate(() => {
        return !!document.querySelector('[role="dialog"]');
      });
      console.log("Did drag release accidentally trigger modal?", modalAfterDrag ? "FAIL: ACCIDENTAL CLICK!" : "PASS: CLEAN DRAG");
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_desktop_dragged_deals.png") });
    }

    // -------------------------------------------------------------
    // TEST 2: MOBILE VIEWPORT - TOUCH SWIPE & MOMENTUM (375x812)
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: MOBILE VIEWPORT (375x812 iPhone) ---");
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await sleep(800);

    await page.evaluate(() => {
      document.getElementById("deals")?.scrollIntoView({ behavior: "instant", block: "center" });
    });
    await sleep(400);

    const mobileInitialScroll = await page.evaluate(() => {
      const el = document.querySelector("#deals .overflow-x-auto");
      return el ? el.scrollLeft : -1;
    });
    console.log("Mobile Deals initial scrollLeft:", mobileInitialScroll);

    // Simulate touch swipe left
    console.log("Simulating touch swipe left on mobile deals track...");
    const client = await page.target().createCDPSession();
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 300, y: 400 }],
    });
    for (let i = 1; i <= 20; i++) {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 300 - i * 10, y: 400 }],
      });
      await sleep(15);
    }
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await sleep(500);

    const mobileAfterSwipeScroll = await page.evaluate(() => {
      const el = document.querySelector("#deals .overflow-x-auto");
      return el ? el.scrollLeft : -1;
    });
    console.log(`Mobile Deals scrollLeft after touch swipe: ${mobileAfterSwipeScroll} (was ${mobileInitialScroll})`);
    const mobileSwipeSuccess = mobileAfterSwipeScroll > mobileInitialScroll + 30;
    console.log("Did mobile touch swipe scroll the rail?", mobileSwipeSuccess ? "PASS: YES" : "FAIL: NO");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_mobile_swiped_deals.png") });

    // Step 2B: Pure tap on mobile product card
    console.log("Simulating pure tap on mobile deal card to test modal...");
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 100, y: 400 }],
    });
    await sleep(50);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await sleep(600);

    const mobileModalOpen = await page.evaluate(() => {
      return !!document.querySelector('[role="dialog"]') || !!document.querySelector(".fixed.inset-0");
    });
    console.log("Did mobile tap open Product Modal?", mobileModalOpen ? "PASS: YES" : "FAIL: NO");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_mobile_modal_test.png") });

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    if (logs.length > 0) {
      console.log("\nPage Logs Sample:", logs.slice(-8));
    }
    await browser.close();
    console.log("\nAudit run finished.");
  }
}

runAudit();
