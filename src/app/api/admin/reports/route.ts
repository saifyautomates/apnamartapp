import { NextRequest, NextResponse } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

function parseRange(req: NextRequest): { from: Date; to: Date } {
  const url = new URL(req.url);
  const preset = url.searchParams.get("range") ?? "7";
  let to = new Date();
  let from = new Date();
  if (preset === "today") from.setHours(0, 0, 0, 0);
  else if (preset === "yesterday") {
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    to.setDate(to.getDate() - 1);
    to.setHours(23, 59, 59, 999);
  } else if (preset === "custom") {
    from = new Date(url.searchParams.get("from") ?? Date.now() - 7 * 86400000);
    to = new Date(url.searchParams.get("to") ?? Date.now());
  } else {
    const days = preset === "30" ? 30 : 7;
    from = new Date(Date.now() - days * 86400000);
  }
  return { from, to };
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "reports:read");
  const { from, to } = parseRange(req);
  const format = new URL(req.url).searchParams.get("format");
  const valid: Prisma.OrderWhereInput = { createdAt: { gte: from, lte: to }, status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] } };
  const [sales, orders, discounts, taxes, cancelled, refunded, topProducts, payments] = await Promise.all([
    prisma.order.aggregate({ where: valid, _sum: { grandTotalPaise: true, discountPaise: true, taxPaise: true }, _count: true }),
    prisma.order.count({ where: valid }),
    prisma.order.aggregate({ where: valid, _sum: { discountPaise: true } }),
    prisma.order.aggregate({ where: valid, _sum: { taxPaise: true } }),
    prisma.order.count({ where: { createdAt: { gte: from, lte: to }, status: "CANCELLED" } }),
    prisma.refund.aggregate({ where: { createdAt: { gte: from, lte: to }, status: "COMPLETED" }, _sum: { amountPaise: true } }),
    prisma.orderItem.groupBy({ by: ["variantId"], _sum: { qty: true, totalPaise: true }, orderBy: { _sum: { totalPaise: "desc" } }, take: 20 }),
    prisma.payment.groupBy({ by: ["method", "status"], _sum: { amountPaise: true } }),
  ]);
  const variantIds = topProducts.map((t) => t.variantId);
  const variants = await prisma.productVariant.findMany({ where: { id: { in: variantIds } }, include: { product: true } });
  const report = {
    range: { from, to },
    salesPaise: sales._sum?.grandTotalPaise ?? 0,
    orderCount: orders,
    discountPaise: discounts._sum?.discountPaise ?? 0,
    taxPaise: taxes._sum?.taxPaise ?? 0,
    cancelledCount: cancelled,
    refundedPaise: refunded._sum?.amountPaise ?? 0,
    averageOrderValuePaise: orders > 0 ? Math.round((sales._sum?.grandTotalPaise ?? 0) / orders) : 0,
    topProducts: topProducts.map((t) => ({
      variant: variants.find((v) => v.id === t.variantId),
      qty: t._sum.qty ?? 0,
      totalPaise: t._sum.totalPaise ?? 0,
    })),
    payments,
  };
  if (format === "csv") {
    const csv = toCsv([
      { metric: "salesPaise", value: report.salesPaise },
      { metric: "orderCount", value: report.orderCount },
      { metric: "discountPaise", value: report.discountPaise },
      { metric: "taxPaise", value: report.taxPaise },
      { metric: "cancelledCount", value: report.cancelledCount },
      { metric: "refundedPaise", value: report.refundedPaise },
    ]);
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=report.csv" },
    });
  }
  return ok(report);
});
