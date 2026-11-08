import { NextRequest, NextResponse } from "next/server";
import { KOTA_LOCALITIES, type KotaLocality } from "@/lib/kota-localities";

export const dynamic = "force-dynamic";

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");

    const lat = parseFloat(latStr || "25.1485");
    const lng = parseFloat(lngStr || "75.8458");

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    // 1. Find closest known Kota locality
    let closestLocality: KotaLocality = KOTA_LOCALITIES[0];
    let minDistance = Infinity;

    for (const loc of KOTA_LOCALITIES) {
      const dist = calculateDistanceKm(lat, lng, loc.lat, loc.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestLocality = loc;
      }
    }

    // 2. Query OpenStreetMap Nominatim for hyper-specific road / house details
    let osmAddress: any = null;
    let displayName = "";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);

      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "CentralMart-Kota/1.0 (contact@centralmart.in)",
            "Accept-Language": "en-IN,en;q=0.9",
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (osmRes.ok) {
        const osmJson = await osmRes.json();
        osmAddress = osmJson.address;
        displayName = osmJson.display_name || "";
      }
    } catch {
      // Nominatim failed or timed out — graceful fallback to Kota locality
    }

    // 3. Assemble clean normalized address
    const road =
      osmAddress?.road ||
      osmAddress?.neighbourhood ||
      osmAddress?.suburb ||
      (minDistance < 0.4 ? closestLocality.name : "Near " + closestLocality.name);

    const localityName =
      osmAddress?.suburb ||
      osmAddress?.neighbourhood ||
      closestLocality.name;

    const pincode =
      minDistance < 4 && closestLocality?.pincode
        ? closestLocality.pincode
        : osmAddress?.postcode && osmAddress.postcode.startsWith("324")
        ? osmAddress.postcode
        : closestLocality.pincode;

    const isServiceable = minDistance <= 25; // within 25km of Kota center

    const fullAddress = `${road}, ${localityName}, Kota, Rajasthan - ${pincode}`;

    return NextResponse.json({
      success: true,
      data: {
        lat,
        lng,
        road,
        locality: localityName,
        city: "Kota",
        state: "Rajasthan",
        pincode,
        zone: closestLocality.zone,
        eta: closestLocality.eta,
        fullAddress,
        distanceKm: Math.round(minDistance * 10) / 10,
        isServiceable,
        rawDisplayName: displayName,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Reverse geocoding failed" },
      { status: 500 }
    );
  }
}
