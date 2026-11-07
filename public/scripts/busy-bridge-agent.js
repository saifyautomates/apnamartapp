/**
 * Central Mart — BUSY POS Windows Sync Bridge Agent (v2.0)
 *
 * Runs on the store's Windows billing computer alongside BUSY Accounting Software.
 * Automatically synchronizes in-store sales vouchers, bills, and stock to Central Mart Cloud.
 *
 * Usage:
 *   node busy-bridge-agent.js
 *
 * Environment Variables (optional, defaults provided below):
 *   CENTRAL_MART_URL = "https://apnamartapp.vercel.app"
 *   BUSY_API_KEY     = "busy_live_sec_993821734_fmcg"
 *   COUNTER_ID       = "POS-01"
 *   CASHIER_NAME     = "Ramesh Sharma"
 *   BUSY_EXPORT_DIR  = "C:\\BUSYWIN\\EXPORT"
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const CONFIG = {
  cloudUrl: process.env.CENTRAL_MART_URL || "https://apnamartapp.vercel.app",
  apiKey: process.env.BUSY_API_KEY || "busy_live_sec_993821734_fmcg",
  counterId: process.env.COUNTER_ID || "POS-01",
  counterName: process.env.COUNTER_NAME || "Counter 01 (Front Checkout)",
  cashierName: process.env.CASHIER_NAME || "Store Cashier",
  watchDir: process.env.BUSY_EXPORT_DIR || path.join(process.cwd(), "busy_export"),
  syncIntervalMs: 10000, // Check every 10 seconds
};

console.log("==================================================================");
console.log(" 🛒 CENTRAL MART — BUSY POS OMNICHANNEL BRIDGE AGENT (v2.0)");
console.log("==================================================================");
console.log(` * Cloud Target  : ${CONFIG.cloudUrl}`);
console.log(` * Counter ID    : ${CONFIG.counterId} (${CONFIG.cashierName})`);
console.log(` * Watch Folder  : ${CONFIG.watchDir}`);
console.log(` * Poll Interval : ${CONFIG.syncIntervalMs / 1000}s`);
console.log("==================================================================\n");

// Ensure watch folder exists
if (!fs.existsSync(CONFIG.watchDir)) {
  try {
    fs.mkdirSync(CONFIG.watchDir, { recursive: true });
    console.log(`[INFO] Created local watch directory: ${CONFIG.watchDir}`);
  } catch (err) {
    console.warn(`[WARN] Could not create watch folder: ${err.message}`);
  }
}

/** Post payload to Central Mart Cloud Webhook */
function postToCloud(payload, isXml = false) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(`${CONFIG.cloudUrl}/api/pos/busy/webhook`);
    const isHttps = urlObj.protocol === "https:";
    const transport = isHttps ? https : http;

    const data = isXml ? payload : JSON.stringify(payload);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": isXml ? "application/xml" : "application/json",
        "Content-Length": Buffer.byteLength(data),
        "X-BUSY-API-KEY": CONFIG.apiKey,
      },
    };

    const req = transport.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(data);
    req.end();
  });
}

/** Check watch directory for new files exported from BUSY */
async function checkWatchDirectory() {
  if (!fs.existsSync(CONFIG.watchDir)) return;

  try {
    const files = fs.readdirSync(CONFIG.watchDir);
    const voucherFiles = files.filter((f) => f.endsWith(".xml") || f.endsWith(".json"));

    for (const file of voucherFiles) {
      const fullPath = path.join(CONFIG.watchDir, file);
      const content = fs.readFileSync(fullPath, "utf8");
      const isXml = file.endsWith(".xml");

      console.log(`[SYNC] Found BUSY bill export: ${file} (${content.length} bytes)`);

      try {
        const res = await postToCloud(isXml ? content : JSON.parse(content), isXml);
        if (res.status === 200 && res.body?.ok) {
          console.log(`[SUCCESS] ✓ Synced ${file} to Central Mart Cloud! Message: ${res.body.message}`);

          // Move to synced archive
          const archiveDir = path.join(CONFIG.watchDir, "synced");
          if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
          fs.renameSync(fullPath, path.join(archiveDir, `${Date.now()}_${file}`));
        } else {
          console.error(`[ERROR] Cloud rejected ${file}:`, res.body);
        }
      } catch (postErr) {
        console.error(`[ERROR] Network error syncing ${file}:`, postErr.message);
      }
    }
  } catch (readErr) {
    console.error("[ERROR] Failed reading watch dir:", readErr.message);
  }
}

/** Send periodic heartbeat to keep terminal 'ONLINE' status alive */
async function sendHeartbeat() {
  const dummyVoucher = {
    voucherNo: `HEARTBEAT-${CONFIG.counterId}`,
    counterId: CONFIG.counterId,
    counterName: CONFIG.counterName,
    cashierName: CONFIG.cashierName,
    customerName: "Heartbeat Check",
    paymentMode: "UPI",
    itemsCount: 0,
    itemsSummary: "Terminal Heartbeat Ping",
    totalPaise: 0,
    gstPaise: 0,
    status: "SYNCED",
  };

  try {
    const start = Date.now();
    await postToCloud(dummyVoucher, false);
    const latency = Date.now() - start;
    const timeStr = new Date().toLocaleTimeString();
    console.log(`[${timeStr}] [HEARTBEAT] ✓ Terminal ${CONFIG.counterId} ONLINE (Latency: ${latency}ms)`);
  } catch (err) {
    console.warn(`[WARN] Heartbeat failed (will retry): ${err.message}`);
  }
}

// Start watching loop
console.log("[AGENT RUNNING] Waiting for BUSY bills in " + CONFIG.watchDir + " ...");
sendHeartbeat();
setInterval(checkWatchDirectory, CONFIG.syncIntervalMs);
setInterval(sendHeartbeat, 30000); // Heartbeat every 30s

