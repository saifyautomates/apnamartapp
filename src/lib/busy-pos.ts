import { prisma } from "./prisma";
import { cachedJson, cache } from "./cache";

export interface BusyPosCounter {
  id: string;
  name: string;
  status: "ONLINE" | "OFFLINE" | "SYNCING";
  cashier: string;
  todaySalesPaise: number;
  billsCount: number;
  terminalIp?: string;
  lastHeartbeat?: string;
}

export interface BusyPosVoucher {
  id: string;
  voucherNo: string;
  counterId: string;
  counterName: string;
  cashierName: string;
  customerName: string;
  customerPhone?: string;
  paymentMode: "CASH" | "UPI" | "CARD" | "SPLIT";
  itemsCount: number;
  itemsSummary: string;
  totalPaise: number;
  gstPaise: number;
  timestamp: string;
  status: "SETTLED" | "SYNCED" | "PENDING";
}

export interface BusyPosConfig {
  enabled: boolean;
  bridgeUrl: string;
  companyCode: string;
  financialYear: string;
  apiKey: string;
  autoSync: boolean;
  syncIntervalSeconds: number;
  lastSyncAt: string | null;
  postingTrigger: "ORDER_CONFIRMED" | "PACKED" | "OUT_FOR_DELIVERY" | "DELIVERED";
}

export const DEFAULT_BUSY_CONFIG: BusyPosConfig = {
  enabled: false,
  bridgeUrl: "http://127.0.0.1:8085",
  companyCode: "CENTRAL_MART_2026",
  financialYear: "2026-2027",
  apiKey: "",
  autoSync: true,
  syncIntervalSeconds: 30,
  lastSyncAt: null,
  postingTrigger: "OUT_FOR_DELIVERY",
};

export const MOCK_COUNTERS: BusyPosCounter[] = [
  {
    id: "POS-01",
    name: "Counter 01 (Front Checkout)",
    status: "ONLINE",
    cashier: "Ramesh Sharma",
    todaySalesPaise: 9482000, // ₹94,820
    billsCount: 114,
    terminalIp: "192.168.1.101",
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: "POS-02",
    name: "Counter 02 (Express FMCG)",
    status: "ONLINE",
    cashier: "Sunita Verma",
    todaySalesPaise: 4851000, // ₹48,510
    billsCount: 68,
    terminalIp: "192.168.1.102",
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: "POS-03",
    name: "Counter 03 (Dairy & Beverages)",
    status: "ONLINE",
    cashier: "Amit Kumar",
    todaySalesPaise: 1835000, // ₹18,350
    billsCount: 32,
    terminalIp: "192.168.1.103",
    lastHeartbeat: new Date().toISOString(),
  },
];

export const MOCK_RECENT_VOUCHERS: BusyPosVoucher[] = [
  {
    id: "vch-482",
    voucherNo: "CM-POS-2026/0482",
    counterId: "POS-01",
    counterName: "Counter 01 (Front Checkout)",
    cashierName: "Ramesh Sharma",
    customerName: "Priya Sharma",
    customerPhone: "+91 98765 43210",
    paymentMode: "UPI",
    itemsCount: 5,
    itemsSummary: "Amul Butter 500g, Fortune Oil 1L, Tata Salt 1kg, Maggi 12pk",
    totalPaise: 145000, // ₹1,450
    gstPaise: 7250,
    timestamp: "2 mins ago",
    status: "SETTLED",
  },
  {
    id: "vch-481",
    voucherNo: "CM-POS-2026/0481",
    counterId: "POS-02",
    counterName: "Counter 02 (Express FMCG)",
    cashierName: "Sunita Verma",
    customerName: "Rohit Verma",
    customerPhone: "+91 98234 56789",
    paymentMode: "CASH",
    itemsCount: 4,
    itemsSummary: "Aashirvaad Atta 5kg, Surf Excel 1kg, Dettol Soap 3pk",
    totalPaise: 74800, // ₹748
    gstPaise: 3740,
    timestamp: "6 mins ago",
    status: "SETTLED",
  },
  {
    id: "vch-480",
    voucherNo: "CM-POS-2026/0480",
    counterId: "POS-01",
    counterName: "Counter 01 (Front Checkout)",
    cashierName: "Ramesh Sharma",
    customerName: "Ananya Das",
    customerPhone: "+91 97123 45678",
    paymentMode: "CARD",
    itemsCount: 12,
    itemsSummary: "Haldiram Bhujia, Oreo 3pk, Nescafe Classic, Catch Masala",
    totalPaise: 189200, // ₹1,892
    gstPaise: 9460,
    timestamp: "9 mins ago",
    status: "SETTLED",
  },
  {
    id: "vch-479",
    voucherNo: "CM-POS-2026/0479",
    counterId: "POS-03",
    counterName: "Counter 03 (Dairy & Beverages)",
    cashierName: "Amit Kumar",
    customerName: "Sameer Khan",
    customerPhone: "+91 96543 21098",
    paymentMode: "CASH",
    itemsCount: 6,
    itemsSummary: "Amul Taaza 1L x 4, Britannia Brown Bread, Epigamia Yogurt",
    totalPaise: 99600, // ₹996
    gstPaise: 4980,
    timestamp: "14 mins ago",
    status: "SETTLED",
  },
  {
    id: "vch-478",
    voucherNo: "CM-POS-2026/0478",
    counterId: "POS-02",
    counterName: "Counter 02 (Express FMCG)",
    cashierName: "Sunita Verma",
    customerName: "Vikram Malhotra",
    customerPhone: "+91 98111 22334",
    paymentMode: "UPI",
    itemsCount: 7,
    itemsSummary: "Red Label Tea 500g, Parle-G 12pk, Lizol 1L, Colin 500ml",
    totalPaise: 124500, // ₹1,245
    gstPaise: 6225,
    timestamp: "21 mins ago",
    status: "SETTLED",
  },
];

export async function getBusyPosConfig(): Promise<BusyPosConfig> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: "busy_pos" } });
    if (row?.value && typeof row.value === "object") {
      return { ...DEFAULT_BUSY_CONFIG, ...(row.value as Record<string, unknown>) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_BUSY_CONFIG;
}

export async function saveBusyPosConfig(patch: Partial<BusyPosConfig>): Promise<BusyPosConfig> {
  const current = await getBusyPosConfig();
  const updated: BusyPosConfig = {
    ...current,
    ...patch,
    lastSyncAt: new Date().toISOString(),
  };

  await prisma.setting.upsert({
    where: { key: "busy_pos" },
    update: { value: updated as unknown as object },
    create: { key: "busy_pos", value: updated as unknown as object },
  });

  // Invalidate cache
  await cache.del("admin:dashboard:metrics:v2");
  await cache.del("admin:busy:pos:metrics");

  return updated;
}

export interface BusyPosMetrics {
  connected: boolean;
  bridgeUrl: string;
  companyCode: string;
  financialYear: string;
  lastSyncAt: string;
  latencyMs: number;
  todaySalesPaise: number;
  todayBillsCount: number;
  cashPaise: number;
  upiPaise: number;
  cardPaise: number;
  counters: BusyPosCounter[];
  recentVouchers: BusyPosVoucher[];
}

export async function getBusyPosMetrics(): Promise<BusyPosMetrics> {
  return cachedJson("admin:busy:pos:metrics", 20, async () => {
    const config = await getBusyPosConfig();
    const isExplicitlyConnected = config.enabled;

    // Aggregate counters
    const todaySalesPaise = MOCK_COUNTERS.reduce((acc, c) => acc + c.todaySalesPaise, 0); // 16168000 (₹1,61,680)
    const todayBillsCount = MOCK_COUNTERS.reduce((acc, c) => acc + c.billsCount, 0); // 214 bills

    return {
      connected: isExplicitlyConnected,
      bridgeUrl: config.bridgeUrl,
      companyCode: config.companyCode,
      financialYear: config.financialYear,
      lastSyncAt: config.lastSyncAt ?? new Date().toISOString(),
      latencyMs: 14,
      todaySalesPaise,
      todayBillsCount,
      cashPaise: 8420000, // ₹84,200
      upiPaise: 6848000,  // ₹68,480
      cardPaise: 900000,  // ₹9,000
      counters: MOCK_COUNTERS,
      recentVouchers: MOCK_RECENT_VOUCHERS,
    };
  });
}
