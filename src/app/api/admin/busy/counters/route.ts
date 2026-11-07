import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { getBusyCounters, saveBusyCounters, BusyPosCounter } from "@/lib/busy-pos";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "integrations:read");
  const counters = await getBusyCounters();
  return ok({ counters });
});

export const POST = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "integrations:write");

  const body = await req.json().catch(() => ({}));
  const counters = await getBusyCounters();

  const id = body.id || `POS-0${counters.length + 1}`;
  const existingIdx = counters.findIndex((c) => c.id === id);

  const counterData: BusyPosCounter = {
    id,
    name: body.name || `Counter 0${counters.length + 1} (Billing Terminal)`,
    status: (body.status as any) || "ONLINE",
    cashier: body.cashier || "Store Cashier",
    todaySalesPaise: body.todaySalesPaise ? Math.max(0, parseInt(body.todaySalesPaise, 10)) : 0,
    billsCount: body.billsCount ? Math.max(0, parseInt(body.billsCount, 10)) : 0,
    terminalIp: body.terminalIp || `192.168.1.${100 + counters.length + 1}`,
    lastHeartbeat: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    counters[existingIdx] = { ...counters[existingIdx], ...counterData };
  } else {
    counters.push(counterData);
  }

  const updated = await saveBusyCounters(counters);
  return ok({ success: true, counter: counterData, counters: updated });
});

export const DELETE = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "integrations:write");

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return ok({ error: "Counter ID is required" }, 400);

  const counters = await getBusyCounters();
  const filtered = counters.filter((c) => c.id !== id);
  const updated = await saveBusyCounters(filtered);

  return ok({ success: true, counters: updated });
});

