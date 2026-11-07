import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { prisma, withDbTimeout } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KOTA_FALLBACK_ZONES = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Kota Central & North (Nayapura, Station, Gumanpura, Borkhera)",
    pincodes: ["324001", "324002", "324003", "324009", "324010"],
    minOrderPaise: 14900,
    deliveryChargePaise: 2500,
    freeThresholdPaise: 49900,
    isActive: true,
    slots: [
      { id: "slot-1", label: "Morning: 8:00 AM – 11:30 AM", startTime: "08:00", endTime: "11:30", maxOrdersPerDay: 100, isActive: true },
      { id: "slot-2", label: "Afternoon: 12:00 PM – 3:30 PM", startTime: "12:00", endTime: "15:30", maxOrdersPerDay: 100, isActive: true },
      { id: "slot-3", label: "Evening: 4:30 PM – 8:30 PM", startTime: "16:30", endTime: "20:30", maxOrdersPerDay: 150, isActive: true },
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Kota South & Coaching Hub (Talwandi, Vigyan Nagar, Dadabari, Mahaveer Nagar)",
    pincodes: ["324004", "324005", "324006"],
    minOrderPaise: 14900,
    deliveryChargePaise: 2500,
    freeThresholdPaise: 49900,
    isActive: true,
    slots: [
      { id: "slot-4", label: "Morning: 8:00 AM – 11:30 AM", startTime: "08:00", endTime: "11:30", maxOrdersPerDay: 100, isActive: true },
      { id: "slot-5", label: "Afternoon: 12:00 PM – 3:30 PM", startTime: "12:00", endTime: "15:30", maxOrdersPerDay: 100, isActive: true },
      { id: "slot-6", label: "Evening: 4:30 PM – 8:30 PM", startTime: "16:30", endTime: "20:30", maxOrdersPerDay: 150, isActive: true },
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Kota Kunhari & Outer (Kunhari, Landmark City, Sakatpura, Anantpura)",
    pincodes: ["324007", "324008"],
    minOrderPaise: 19900,
    deliveryChargePaise: 3500,
    freeThresholdPaise: 59900,
    isActive: true,
    slots: [
      { id: "slot-7", label: "Morning: 8:00 AM – 11:30 AM", startTime: "08:00", endTime: "11:30", maxOrdersPerDay: 80, isActive: true },
      { id: "slot-8", label: "Afternoon: 12:00 PM – 3:30 PM", startTime: "12:00", endTime: "15:30", maxOrdersPerDay: 80, isActive: true },
      { id: "slot-9", label: "Evening: 4:30 PM – 8:30 PM", startTime: "16:30", endTime: "20:30", maxOrdersPerDay: 100, isActive: true },
    ],
  },
];

export const GET = handler(async (req: NextRequest) => {
  let zones: any[] = [];
  try {
    zones = await withDbTimeout(
      prisma.deliveryZone.findMany({
        where: { isActive: true },
        include: { slots: { where: { isActive: true }, orderBy: { label: "asc" } } },
        orderBy: { name: "asc" },
      }),
      2500
    );
  } catch {
    /* fallback to Kota default zones */
  }

  if (zones.length === 0) {
    zones = KOTA_FALLBACK_ZONES;
  }

  const url = new URL(req.url);
  const pincode = url.searchParams.get("pincode")?.trim();
  if (pincode) {
    zones = zones.filter((z) => Array.isArray(z.pincodes) && z.pincodes.includes(pincode));
  }

  return ok(zones);
});
