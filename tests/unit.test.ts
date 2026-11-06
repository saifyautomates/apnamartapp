import { describe, it, expect } from "vitest";
import { formatPaise, calcTaxPaise, discountPercent, assertNonNegativePaise } from "../src/lib/money";
import { getEffectivePricePaise } from "../src/lib/pricing";
import { sellableQty } from "../src/lib/inventory";
import { ORDER_TRANSITIONS, CUSTOMER_TIMELINE, getOrderTimeline } from "../src/lib/orders";

describe("money (integer paise only)", () => {
  it("formats paise as rupees", () => {
    expect(formatPaise(19900)).toBe("₹199");
    expect(formatPaise(19950)).toBe("₹199.50");
    expect(formatPaise(0)).toBe("₹0");
  });
  it("computes the tax-inclusive GST component (never added to totals)", () => {
    // ₹1,000 tax-inclusive at 5%: 100000 − round(100000 / 1.05) = 4762 paise.
    // Same extraction as the checkout flow in orders.ts.
    expect(calcTaxPaise(100000, 500)).toBe(4762);
    expect(calcTaxPaise(100000, 0)).toBe(0);
  });
  it("computes discount percent", () => {
    expect(discountPercent(10000, 8000)).toBe(20);
    expect(discountPercent(10000, 10000)).toBe(0);
    expect(discountPercent(0, 0)).toBe(0);
  });
  it("rejects negative paise", () => {
    expect(() => assertNonNegativePaise(-1, "price")).toThrow();
    expect(() => assertNonNegativePaise(0, "price")).not.toThrow();
  });
});

describe("pricing engine", () => {
  it("uses the source (selling) price by default", () => {
    expect(getEffectivePricePaise({ id: "x", mrpPaise: 10000, sellingPaise: 9000, onlinePricePaise: 8000, priceSource: "SOURCE" })).toBe(9000);
  });
  it("uses the custom online price when the source is CUSTOM", () => {
    expect(getEffectivePricePaise({ id: "x", mrpPaise: 10000, sellingPaise: 9000, onlinePricePaise: 8000, priceSource: "CUSTOM" })).toBe(8000);
  });
  it("falls back to selling price when CUSTOM has no online price", () => {
    expect(getEffectivePricePaise({ id: "x", mrpPaise: 10000, sellingPaise: 9000, onlinePricePaise: null, priceSource: "CUSTOM" })).toBe(9000);
  });
});

describe("inventory math", () => {
  it("sellable = available − reserved", () => {
    expect(sellableQty({ availableQty: 10, reservedQty: 3 })).toBe(7);
    expect(sellableQty({ availableQty: 0, reservedQty: 0 })).toBe(0);
  });
});

describe("order state machine", () => {
  it("has no invalid transitions: every target is a known status", () => {
    const statuses = Object.keys(ORDER_TRANSITIONS);
    for (const [from, tos] of Object.entries(ORDER_TRANSITIONS)) {
      expect(statuses).toContain(from);
      for (const to of tos) expect(statuses).toContain(to);
      expect(tos).not.toContain(from);
    }
  });
  it("cannot jump from PLACED straight to DELIVERED", () => {
    expect(ORDER_TRANSITIONS.PLACED).not.toContain("DELIVERED");
    expect(ORDER_TRANSITIONS.PLACED).toContain("CONFIRMED");
  });
  it("terminal states have no outgoing transitions", () => {
    expect(ORDER_TRANSITIONS.CANCELLED).toEqual([]);
    expect(ORDER_TRANSITIONS.REFUNDED).toEqual([]);
  });
  it("delivered orders can go to refund-pending (post-delivery returns)", () => {
    expect(ORDER_TRANSITIONS.DELIVERED).toEqual(["REFUND_PENDING"]);
    expect(ORDER_TRANSITIONS.REFUND_PENDING).toEqual(["REFUNDED"]);
  });
  it("customer timeline covers the fulfilment path in order", () => {
    expect([...CUSTOMER_TIMELINE]).toEqual(["PLACED", "CONFIRMED", "PREPARING", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"]);
    const tl = getOrderTimeline("PACKED");
    // done = completed steps; the current step is flagged current, not done.
    expect(tl.filter((t) => t.done).map((t) => t.key)).toEqual(["PLACED", "CONFIRMED", "PREPARING"]);
    expect(tl.find((t) => t.current)?.key).toBe("PACKED");
  });
});
