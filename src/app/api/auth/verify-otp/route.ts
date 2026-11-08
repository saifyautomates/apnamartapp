import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { verifyOtp, signAccess, signRefresh, setSessionCookies, storeRefreshToken, assertCsrf } from "@/lib/auth";
import { otpVerifySchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { forbidden } from "@/lib/errors";
import { mergeGuestCart } from "@/lib/cart";
import { rateLimitOrThrow } from "@/lib/rateLimit";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const body = otpVerifySchema.parse(await readJson(req));
  rateLimitOrThrow(`verify-otp:${body.phone}`, 15, 5 * 60 * 1000, "Too many OTP verification attempts. Please wait 5 minutes.");
  const { phone } = await verifyOtp(body.phone, body.code);
  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    user = await prisma.user.create({ data: { phone, name: `Customer ${phone.slice(-4)}` } });
    await prisma.loyaltyAccount.create({ data: { userId: user.id } });
    await prisma.storeCreditAccount.create({ data: { userId: user.id } });
  }
  if (!user.isActive) {
    throw forbidden("Account is disabled");
  }
  // Merge any guest cart into the user cart.
  const guestToken = req.cookies.get("gcp_cart")?.value;
  await mergeGuestCart(guestToken, user.id);
  const access = signAccess({ kind: "CUSTOMER", userId: user.id });
  const refresh = signRefresh({ userId: user.id });
  await storeRefreshToken({ userId: user.id }, refresh);
  setSessionCookies(access, refresh);
  return ok({ user: { id: user.id, phone: user.phone, name: user.name } });
});
