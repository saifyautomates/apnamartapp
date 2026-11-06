import { NextRequest } from "next/server";
import { handler, ok, readJson } from "@/lib/http";
import { requestOtp, assertCsrf } from "@/lib/auth";
import { otpRequestSchema } from "@/lib/validation";
import { rateLimitOrThrow } from "@/lib/rateLimit";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest) => {
  assertCsrf(req);
  const body = otpRequestSchema.parse(await readJson(req));
  rateLimitOrThrow(`otp:${body.phone}`, 5, 60 * 60 * 1000, "Too many OTP requests");
  const result = await requestOtp(body.phone);
  return ok({ phone: result.phone, devOtp: result.devOtp });
});
