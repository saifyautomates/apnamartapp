import { describe, it, expect } from "vitest";
import { generateBusyXml, DEFAULT_BUSY_CONFIG, DEFAULT_COUNTERS, recordBusyVoucher, getBusyCounters } from "../src/lib/busy-pos";

describe("BUSY POS Integration Engine", () => {
  it("has valid default configuration with API key and company code", () => {
    expect(DEFAULT_BUSY_CONFIG.companyCode).toBe("CENTRAL_MART_2026");
    expect(DEFAULT_BUSY_CONFIG.financialYear).toBe("2026-2027");
    expect(DEFAULT_BUSY_CONFIG.bridgeUrl).toBe("http://127.0.0.1:8085");
    expect(DEFAULT_BUSY_CONFIG.apiKey).toBeTruthy();
    expect(DEFAULT_BUSY_CONFIG.enabled).toBe(true);
  });

  it("provides active default billing counters", () => {
    expect(DEFAULT_COUNTERS.length).toBeGreaterThanOrEqual(3);
    const counterIds = DEFAULT_COUNTERS.map((c) => c.id);
    expect(counterIds).toContain("POS-01");
    expect(counterIds).toContain("POS-02");
    expect(counterIds).toContain("POS-03");
  });

  it("generates authentic BUSY 2.0 XML schema with sales vouchers and items", () => {
    const orders = [
      {
        orderNumber: "ORD-TEST-001",
        createdAt: new Date(),
        user: { name: "Rajesh Kumar", phone: "9876543210" },
        grandTotalPaise: 125000, // ₹1,250.00
        taxPaise: 5952,          // ₹59.52
        paymentMethod: "UPI",
        items: [
          {
            productName: "Aashirvaad Shudh Chakki Atta",
            variantName: "5 kg",
            qty: 2,
            unitPricePaise: 27500,
            totalPaise: 55000,
          },
          {
            productName: "Fortune Sunlite Refined Sunflower Oil",
            variantName: "1 L Pouch",
            qty: 5,
            unitPricePaise: 14000,
            totalPaise: 70000,
          },
        ],
      },
    ];

    const xml = generateBusyXml(orders);

    expect(xml).toContain(`<?xml version="1.0" encoding="UTF-8"?>`);
    expect(xml).toContain(`<BUSY_DATA Version="2.0">`);
    expect(xml).toContain(`<CODE>CENTRAL_MART_2026</CODE>`);
    expect(xml).toContain(`<VCH_NO>ORD-TEST-001</VCH_NO>`);
    expect(xml).toContain(`<PARTY_NAME>Rajesh Kumar</PARTY_NAME>`);
    expect(xml).toContain(`<PAYMENT_MODE>UPI</PAYMENT_MODE>`);
    expect(xml).toContain(`<TOTAL_AMOUNT>1250.00</TOTAL_AMOUNT>`);
    expect(xml).toContain(`<TAX_AMOUNT>59.52</TAX_AMOUNT>`);
    expect(xml).toContain(`<ITEM_NAME>Aashirvaad Shudh Chakki Atta (5 kg)</ITEM_NAME>`);
    expect(xml).toContain(`<QTY>2</QTY>`);
    expect(xml).toContain(`<RATE>275.00</RATE>`);
    expect(xml).toContain(`<AMOUNT>550.00</AMOUNT>`);
  });

  it("records in-store POS vouchers and correctly updates counter stats", async () => {
    const newVoucher = await recordBusyVoucher({
      voucherNo: "POS-TEST-8899",
      counterId: "POS-01",
      cashierName: "Ramesh Sharma",
      customerName: "Walk-in Guest",
      paymentMode: "CASH",
      totalPaise: 45000, // ₹450
      gstPaise: 2142,
      items: [
        { name: "Amul Taaza Milk 500ml", qty: 4, ratePaise: 2800, amountPaise: 11200 },
        { name: "Britannia Marie Gold 300g", qty: 2, ratePaise: 4500, amountPaise: 9000 },
      ],
    });

    expect(newVoucher.id).toBeTruthy();
    expect(newVoucher.voucherNo).toBe("POS-TEST-8899");
    expect(newVoucher.status).toBe("SYNCED");

    const counters = await getBusyCounters();
    const pos1 = counters.find((c) => c.id === "POS-01");
    expect(pos1).toBeDefined();
    expect(pos1?.todaySalesPaise).toBeGreaterThanOrEqual(45000);
  });
});

