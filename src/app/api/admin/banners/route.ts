import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { badRequest } from "@/lib/errors";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { getAllStoreBanners, saveStoreBanners, StoreBanner } from "@/lib/banners";
import crypto from "crypto";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "offers:write");

  const banners = await getAllStoreBanners();
  return ok({ banners });
});

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "offers:write");

  const body = await req.json();
  const { action } = body;
  const currentBanners = await getAllStoreBanners();

  if (action === "CREATE") {
    const { title, subtitle, badgeText, buttonText, href, imageUrl, bgGradient } = body;
    if (!title || !imageUrl) {
      throw badRequest("Title and image are required to create a banner");
    }

    const newBanner: StoreBanner = {
      id: `banner-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      title: title.trim(),
      subtitle: (subtitle || "").trim(),
      badgeText: (badgeText || "⚡ SPECIAL SALE").trim(),
      buttonText: (buttonText || "Shop Now").trim(),
      href: (href || "/category/dairy-eggs").trim(),
      imageUrl: imageUrl.trim(),
      bgGradient: bgGradient || "from-[#0c831f] via-[#107d22] to-[#146b2b]",
      isActive: true,
      displayOrder: currentBanners.length + 1,
      createdAt: new Date().toISOString(),
    };

    const updated = [...currentBanners, newBanner];
    await saveStoreBanners(updated);
    return ok({ banner: newBanner, count: updated.length });
  }

  if (action === "UPDATE") {
    const { id, title, subtitle, badgeText, buttonText, href, imageUrl, bgGradient, isActive } = body;
    if (!id) throw badRequest("Banner id is required for update");

    const index = currentBanners.findIndex((b) => b.id === id);
    if (index === -1) throw badRequest("Banner not found");

    currentBanners[index] = {
      ...currentBanners[index],
      title: title !== undefined ? title : currentBanners[index].title,
      subtitle: subtitle !== undefined ? subtitle : currentBanners[index].subtitle,
      badgeText: badgeText !== undefined ? badgeText : currentBanners[index].badgeText,
      buttonText: buttonText !== undefined ? buttonText : currentBanners[index].buttonText,
      href: href !== undefined ? href : currentBanners[index].href,
      imageUrl: imageUrl !== undefined ? imageUrl : currentBanners[index].imageUrl,
      bgGradient: bgGradient !== undefined ? bgGradient : currentBanners[index].bgGradient,
      isActive: isActive !== undefined ? Boolean(isActive) : currentBanners[index].isActive,
    };

    await saveStoreBanners(currentBanners);
    return ok({ banner: currentBanners[index] });
  }

  if (action === "TOGGLE") {
    const { id } = body;
    const banner = currentBanners.find((b) => b.id === id);
    if (!banner) throw badRequest("Banner not found");

    banner.isActive = !banner.isActive;
    await saveStoreBanners(currentBanners);
    return ok({ banner });
  }

  if (action === "DELETE") {
    const { id } = body;
    const filtered = currentBanners.filter((b) => b.id !== id);
    // re-index display orders
    filtered.forEach((b, idx) => {
      b.displayOrder = idx + 1;
    });

    await saveStoreBanners(filtered);
    return ok({ deleted: id, remaining: filtered.length });
  }

  if (action === "REORDER") {
    const { ids } = body;
    if (!Array.isArray(ids)) throw badRequest("ids must be an array");

    const reordered: StoreBanner[] = [];
    ids.forEach((id: string, idx: number) => {
      const b = currentBanners.find((item) => item.id === id);
      if (b) {
        b.displayOrder = idx + 1;
        reordered.push(b);
      }
    });

    await saveStoreBanners(reordered);
    return ok({ banners: reordered });
  }

  throw badRequest("Invalid action specified");
});
