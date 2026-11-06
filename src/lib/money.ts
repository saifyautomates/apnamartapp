// Money is ALWAYS integer paise. Never use floats for money.

export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    // Whole rupees render clean (₹199); fractional amounts always show 2 digits (₹199.50, never ₹199.5).
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(rupees);
}

export function formatPaiseExact(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(rupees);
}

/** GST component embedded in a TAX-INCLUSIVE amount (Indian MRP), rounded half-up.
 *  Matches the extraction used in the checkout flow (orders.ts):
 *  amount − round(amount / (1 + rate)). gstBps: basis points, e.g. 1800 = 18%. */
export function calcTaxPaise(amountPaise: number, gstBps: number): number {
  if (gstBps <= 0 || amountPaise <= 0) return 0;
  return amountPaise - Math.round(amountPaise / (1 + gstBps / 10000));
}

/** Discount percent, rounded to nearest whole percent. */
export function discountPercent(mrpPaise: number, sellingPaise: number): number {
  if (mrpPaise <= 0 || sellingPaise >= mrpPaise) return 0;
  return Math.round(((mrpPaise - sellingPaise) / mrpPaise) * 100);
}

export function assertNonNegativePaise(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer (paise), got ${value}`);
  }
}
