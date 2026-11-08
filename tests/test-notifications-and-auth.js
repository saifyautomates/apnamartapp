const { sendEmail, renderOrderConfirmationEmail } = require("../src/lib/resend");
const { sendMsg91Otp, sendMsg91WhatsApp, sendMsg91Sms } = require("../src/lib/msg91");

let passed = 0;
let failed = 0;

function assert(cond, name, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✅ PASS: ${name} ${detail ? `(${detail})` : ""}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${name} ${detail ? `(${detail})` : ""}`);
  }
}

async function runTests() {
  console.log("================================================================================");
  console.log("🚀 TESTING RESEND (EMAIL) & MSG91 (OTP + WHATSAPP + SMS) ARCHITECTURE");
  console.log("================================================================================\n");

  // TEST 1: Resend Email HTML Template
  console.log("▶ [CHECK 1/4] Resend HTML Template Generation");
  const html = renderOrderConfirmationEmail({
    orderNumber: "CM-2026-9999",
    customerName: "Saif Quazi",
    totalPaise: 49900,
    deliveryAddress: "Flat 302, Allen Sankalp, Kota, Rajasthan - 324001",
    deliveryMinutes: 15,
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", qty: 1, lineTotalPaise: 42500 },
      { name: "Amul Taaza Milk 500ml", qty: 2, lineTotalPaise: 5600 },
    ],
  });

  assert(html.includes("CM-2026-9999"), "Order number rendered in HTML email");
  assert(html.includes("₹499.00"), "Formatted total rupees rendered in HTML email");
  assert(html.includes("Aashirvaad"), "Item list rendered in HTML email");
  assert(html.includes("CENTRAL MART"), "Central Mart branding in HTML email");

  // TEST 2: Resend Client Execution
  console.log("\n▶ [CHECK 2/4] Resend Email Client Dispatch");
  const emailRes = await sendEmail({
    to: "customer@example.com",
    subject: "Your Central Mart Order #CM-2026-9999 is Confirmed",
    html,
  });
  assert(emailRes.ok, "Resend email client dispatched cleanly (ready for live key)");

  // TEST 3: MSG91 OTP Dispatch Module
  console.log("\n▶ [CHECK 3/4] MSG91 OTP Module");
  const otpRes = await sendMsg91Otp("9829012345", "654321");
  assert(otpRes.ok, "MSG91 OTP module executed cleanly (ready for live key)");

  // TEST 4: MSG91 WhatsApp & SMS Modules
  console.log("\n▶ [CHECK 4/4] MSG91 WhatsApp & SMS Dispatch Modules");
  const waRes = await sendMsg91WhatsApp({
    phone: "9829012345",
    templateName: "centralmart_order_update",
    bodyValues: {
      orderId: "CM-2026-9999",
      status: "Out for delivery",
    },
  });
  assert(waRes.ok, "MSG91 WhatsApp module executed cleanly (ready for live number)");

  const smsRes = await sendMsg91Sms({
    phone: "9829012345",
    message: "Central Mart: Your order CM-2026-9999 is out for delivery in Kota.",
  });
  assert(smsRes.ok, "MSG91 SMS module executed cleanly (ready for live flow ID)");

  console.log("\n================================================================================");
  console.log(`🎉 NOTIFICATION INTEGRATION AUDIT: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");
}

runTests();
