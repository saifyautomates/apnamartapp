import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { signAccess, signRefresh, setSessionCookies, storeRefreshToken } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { badRequest, unauthorized } from "@/lib/errors";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest) => {
  const supabase = await createClient();
  const body = (await readJson(req)) as { accessToken?: string };

  let sbUser = null;
  if (body?.accessToken) {
    const { data, error } = await supabase.auth.getUser(body.accessToken);
    if (error || !data?.user) throw unauthorized("Invalid Supabase token");
    sbUser = data.user;
  } else {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) throw unauthorized("No active Supabase session");
    sbUser = data.user;
  }

  const phone = sbUser.phone ? sbUser.phone.replace(/^\+91/, "").replace(/\s/g, "") : null;
  const email = sbUser.email ?? null;
  const fullName =
    (sbUser.user_metadata?.full_name as string) ||
    (sbUser.user_metadata?.name as string) ||
    (phone ? `Customer ${phone.slice(-4)}` : email ? email.split("@")[0] : "Customer");

  if (!phone && !email) {
    throw badRequest("User must have phone or email");
  }

  // Find user by supabaseId, phone, or email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { supabaseId: sbUser.id },
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (!user) {
    const finalPhone = phone || `sp_${sbUser.id.replace(/-/g, "").slice(0, 10)}`;
    user = await prisma.user.create({
      data: {
        supabaseId: sbUser.id,
        phone: finalPhone,
        email,
        name: fullName,
      },
    });
    await prisma.loyaltyAccount.create({ data: { userId: user.id } });
    await prisma.storeCreditAccount.create({ data: { userId: user.id } });
  } else if (!user.supabaseId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { supabaseId: sbUser.id, email: email || user.email },
    });
  }

  // Merge guest cart
  const guestToken = req.cookies.get("gcp_cart")?.value;
  if (guestToken) {
    await mergeGuestCart(guestToken, user.id);
  }

  // Issue session cookies
  const access = signAccess({ kind: "CUSTOMER", userId: user.id });
  const refresh = signRefresh({ userId: user.id });
  await storeRefreshToken({ userId: user.id }, refresh);
  setSessionCookies(access, refresh);

  let isAdmin = false;
  let adminRedirect: string | null = null;
  if (email) {
    const admin = await prisma.adminUser.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, isActive: true },
    });
    if (admin) {
      const { getAdminPermissions } = await import("@/lib/rbac");
      const permissions = await getAdminPermissions(admin.id);
      const roles = (
        await prisma.adminUserRole.findMany({
          where: { adminUserId: admin.id },
          include: { role: true },
        })
      ).map((r) => r.role.name);

      const adminAccess = signAccess({ kind: "ADMIN", adminId: admin.id, roles, permissions });
      const adminRefresh = signRefresh({ adminId: admin.id });
      await storeRefreshToken({ adminId: admin.id }, adminRefresh);
      setSessionCookies(adminAccess, adminRefresh);
      isAdmin = true;
      adminRedirect = "/admin";
    }
  }

  return ok({
    user: {
      id: user.id,
      supabaseId: user.supabaseId,
      phone: user.phone,
      email: user.email,
      name: user.name,
      isAdmin,
      redirect: adminRedirect,
    },
  });
});

