import { NextRequest, NextResponse } from "next/server";
import { getBusyPosConfig, recordBusyVoucher, BusyPosVoucher } from "@/lib/busy-pos";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Universal BUSY POS Webhook & Real-Time Sync API.
 * Any store computer running BUSY POS (or Windows Sync Bridge Agent) can push
 * sales vouchers directly to this endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    const config = await getBusyPosConfig();
    const apiKey =
      req.headers.get("x-busy-api-key") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      new URL(req.url).searchParams.get("apiKey");

    // Verify key if configured
    if (config.apiKey && apiKey !== config.apiKey && apiKey !== config.webhookSecret) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid BUSY POS API Key or Webhook Secret" } },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let rawBody = "";

    try {
      rawBody = await req.text();
    } catch {
      return NextResponse.json({ ok: false, error: "Empty request body" }, { status: 400 });
    }

    const vouchersToRecord: BusyPosVoucher[] = [];

    // 1. Handle XML payload from BUSY WinApp
    if (contentType.includes("xml") || rawBody.trim().startsWith("<")) {
      const voucherMatches = rawBody.match(/<VOUCHER>[\s\S]*?<\/VOUCHER>/gi) || [];
      for (const vXml of voucherMatches) {
        const vchNoMatch = vXml.match(/<VCH_NO>(.*?)<\/VCH_NO>/i);
        const partyMatch = vXml.match(/<PARTY_NAME>(.*?)<\/PARTY_NAME>/i);
        const totalMatch = vXml.match(/<TOTAL_AMOUNT>(.*?)<\/TOTAL_AMOUNT>/i);
        const taxMatch = vXml.match(/<TAX_AMOUNT>(.*?)<\/TAX_AMOUNT>/i);
        const modeMatch = vXml.match(/<PAYMENT_MODE>(.*?)<\/PAYMENT_MODE>/i);
        const counterMatch = vXml.match(/<COUNTER_ID>(.*?)<\/COUNTER_ID>/i);
        const cashierMatch = vXml.match(/<CASHIER>(.*?)<\/CASHIER>/i);

        const totalNum = parseFloat(totalMatch?.[1] || "0");
        const taxNum = parseFloat(taxMatch?.[1] || "0");
        const totalPaise = Math.round(totalNum * 100);
        const gstPaise = Math.round(taxNum * 100);
        const voucherNo = vchNoMatch?.[1] || `CM-POS-2026/${Math.floor(1000 + Math.random() * 9000)}`;

        vouchersToRecord.push({
          id: `vch-bap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          voucherNo,
          counterId: counterMatch?.[1] || "POS-01",
          counterName: `Counter ${counterMatch?.[1] || "POS-01"}`,
          cashierName: cashierMatch?.[1] || "Store Cashier",
          customerName: partyMatch?.[1] || "Walk-in Customer",
          paymentMode: (modeMatch?.[1]?.toUpperCase() as any) || "UPI",
          itemsCount: 1,
          itemsSummary: "BUSY POS In-Store FMCG Items",
          totalPaise,
          gstPaise,
          timestamp: "Just now",
          status: "SYNCED",
        });
      }
    } else {
      // 2. Handle JSON payload
      const json = JSON.parse(rawBody);
      const list = Array.isArray(json) ? json : json.vouchers ? json.vouchers : [json];

      for (const item of list) {
        const totalPaise =
          item.totalPaise ??
          (item.totalAmount ? Math.round(parseFloat(item.totalAmount) * 100) : 0);
        const gstPaise =
          item.gstPaise ??
          (item.taxAmount ? Math.round(parseFloat(item.taxAmount) * 100) : Math.round(totalPaise * 0.05));

        const voucherNo = item.voucherNo || item.vchNo || `CM-POS-2026/${Math.floor(1000 + Math.random() * 9000)}`;

        vouchersToRecord.push({
          id: item.id || `vch-wh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          voucherNo,
          counterId: item.counterId || "POS-01",
          counterName: item.counterName || "Counter 01 (Front Checkout)",
          cashierName: item.cashierName || "Store Cashier",
          customerName: item.customerName || "Walk-in Customer",
          customerPhone: item.customerPhone || "+91 99999 99999",
          paymentMode: (item.paymentMode?.toUpperCase() as any) || "CASH",
          itemsCount: item.itemsCount || item.items?.length || 1,
          itemsSummary: item.itemsSummary || (item.items ? item.items.map((i: any) => i.name).join(", ") : "In-store Grocery Items"),
          totalPaise,
          gstPaise,
          timestamp: "Just now",
          status: "SYNCED",
          items: item.items,
        });
      }
    }

    if (vouchersToRecord.length === 0) {
      return NextResponse.json({ ok: false, error: "No valid vouchers found in payload" }, { status: 400 });
    }

    // Record all vouchers into system
    for (const v of vouchersToRecord) {
      await recordBusyVoucher(v);
    }

    return NextResponse.json({
      ok: true,
      synced: true,
      syncedCount: vouchersToRecord.length,
      vouchers: vouchersToRecord.map((v) => ({ voucherNo: v.voucherNo, totalPaise: v.totalPaise })),
      message: `Successfully received and synced ${vouchersToRecord.length} BUSY POS sales voucher(s).`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[BUSY Webhook Error]", err);
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: err instanceof Error ? err.message : "Internal error" } },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const config = await getBusyPosConfig();
  return NextResponse.json({
    ok: true,
    service: "Central Mart BUSY POS Omnichannel Webhook",
    status: config.enabled ? "ACTIVE" : "STANDBY",
    bridgeUrl: config.bridgeUrl,
    companyCode: config.companyCode,
    financialYear: config.financialYear,
    timestamp: new Date().toISOString(),
  });
}

