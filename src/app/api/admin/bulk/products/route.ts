import { NextRequest, NextResponse } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { changePrice } from "@/lib/pricing";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const importSchema = z.object({
  csv: z.string().min(1),
  preview: z.boolean().default(true),
});

type Row = Record<string, string>;

/** Minimal CSV parser (handles quoted fields). Malformed rows are reported, never silently ignored. */
function parseCsv(text: string): { headers: string[]; rows: Row[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: string[] = [];
  if (lines.length === 0) return { headers: [], rows: [], errors: ["Empty CSV"] };
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i += 1; } else inQuotes = false;
        } else cur += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ",") { out.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const vals = parseLine(lines[i]);
    if (vals.length !== headers.length) {
      errors.push(`Row ${i + 1}: expected ${headers.length} columns, got ${vals.length}`);
      continue;
    }
    const row: Row = {};
    headers.forEach((h, j) => { row[h] = vals[j]; });
    rows.push(row);
  }
  return { headers, rows, errors };
}

function paiseFromRupees(s: string): number | null {
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "products:write");
  const body = importSchema.parse(await readJson(req));
  const { rows, errors } = parseCsv(body.csv);
  const rowErrors: string[] = [...errors];
  const valid: Array<{ row: Row; line: number }> = [];
  rows.forEach((row, idx) => {
    const line = idx + 2;
    if (!row.sku || !row.name || !row.category) {
      rowErrors.push(`Row ${line}: sku, name and category are required`);
      return;
    }
    const mrp = paiseFromRupees(row.mrp ?? "");
    const selling = paiseFromRupees(row.selling_price ?? "");
    if (mrp == null || selling == null || selling > mrp) {
      rowErrors.push(`Row ${line}: invalid mrp/selling_price (selling must be <= mrp)`);
      return;
    }
    valid.push({ row, line });
  });
  if (body.preview) {
    return ok({ totalRows: rows.length, validRows: valid.length, errors: rowErrors, sample: valid.slice(0, 5).map((v) => v.row) });
  }
  // Apply: upsert products by SKU (category resolved by slug or name).
  let created = 0;
  let updated = 0;
  const applyErrors: string[] = [...rowErrors];
  for (const { row, line } of valid) {
    try {
      const category = await prisma.category.findFirst({
        where: { OR: [{ slug: row.category.toLowerCase() }, { name: { equals: row.category, mode: "insensitive" } }] },
      });
      if (!category) {
        applyErrors.push(`Row ${line}: category "${row.category}" not found`);
        continue;
      }
      const mrp = paiseFromRupees(row.mrp as string) as number;
      const selling = paiseFromRupees(row.selling_price as string) as number;
      const stock = row.stock ? parseInt(row.stock, 10) : 0;
      await prisma.$transaction(async (tx) => {
        let product = await tx.product.findUnique({ where: { sku: row.sku } });
        if (!product) {
          product = await tx.product.create({
            data: {
              internalId: `INT-${Date.now()}-${row.sku}`,
              sku: row.sku,
              barcode: row.barcode || null,
              name: row.name,
              slug: `${row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`,
              categoryId: category.id,
              gstBps: row.gst_percent ? Math.round(Number(row.gst_percent) * 100) : 0,
              description: row.description || null,
            },
          });
          created += 1;
        } else {
          await tx.product.update({ where: { id: product.id }, data: { name: row.name, categoryId: category.id } });
          updated += 1;
        }
        const variantSku = row.variant_sku || row.sku;
        const variant = await tx.productVariant.upsert({
          where: { sku: variantSku },
          create: {
            productId: product.id,
            name: row.variant || "Standard",
            sku: variantSku,
            mrpPaise: mrp,
            sellingPaise: selling,
            packSize: row.pack_size || null,
          },
          update: { name: row.variant || "Standard" },
        });
        await changePrice(tx, variant.id, { mrpPaise: mrp, sellingPaise: selling, priceSource: "SOURCE" }, session.adminId, "CSV import");
        if (Number.isFinite(stock) && stock > 0) {
          await tx.inventory.upsert({
            where: { variantId: variant.id },
            create: { variantId: variant.id, availableQty: stock, reservedQty: 0 },
            update: { availableQty: stock },
          });
        }
      });
    } catch (e) {
      applyErrors.push(`Row ${line}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  await auditLog(prisma, { actorType: "ADMIN", actorId: session.adminId, action: "BULK_IMPORT", entityType: "Product", after: { created, updated, errors: applyErrors.length }, ip: getClientIp(req) });
  return ok({ created, updated, errors: applyErrors });
});

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "products:read");
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: { category: true, brand: true, variants: { include: { inventory: true } } },
    orderBy: { name: "asc" },
    take: 5000,
  });
  const header = "sku,name,category,brand,mrp,selling_price,variant,variant_sku,pack_size,stock";
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [header];
  for (const p of products) {
    for (const v of p.variants) {
      lines.push([
        esc(p.sku), esc(p.name), esc(p.category.name), esc(p.brand?.name ?? ""),
        esc((v.mrpPaise / 100).toFixed(2)), esc((v.sellingPaise / 100).toFixed(2)),
        esc(v.name), esc(v.sku), esc(v.packSize ?? ""),
        esc(v.inventory ? v.inventory.availableQty - v.inventory.reservedQty : 0),
      ].join(","));
    }
  }
  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=products.csv" },
  });
});
