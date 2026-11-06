import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "./prisma";
import { unauthorized, forbidden, badRequest } from "./errors";

export type Session =
  | { kind: "CUSTOMER"; userId: string }
  | { kind: "ADMIN"; adminId: string; roles: string[]; permissions: string[] };

const ACCESS_COOKIE = "gcp_access";
const REFRESH_COOKIE = "gcp_refresh";
const CSRF_COOKIE = "gcp_csrf";

function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}
function refreshSecret(): string {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error("JWT_REFRESH_SECRET is not set");
  return s;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccess(session: Session): string {
  return jwt.sign(session, jwtSecret(), { expiresIn: "15m" });
}
export function signRefresh(subject: { userId?: string; adminId?: string }): string {
  const jti = crypto.randomUUID();
  return jwt.sign({ ...subject, jti }, refreshSecret(), { expiresIn: "7d" });
}

export function verifyAccess(token: string): Session {
  try {
    const decoded = jwt.verify(token, jwtSecret()) as unknown as Session;
    if (decoded.kind !== "CUSTOMER" && decoded.kind !== "ADMIN") throw new Error("bad kind");
    return decoded;
  } catch {
    throw unauthorized("Invalid or expired session");
  }
}

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function setSessionCookies(access: string, refresh: string): void {
  const jar = cookies();
  jar.set(ACCESS_COOKIE, access, cookieOpts(60 * 15));
  jar.set(REFRESH_COOKIE, refresh, { ...cookieOpts(60 * 60 * 24 * 7), path: "/api/auth/refresh" });
}

export function clearSessionCookies(): void {
  const jar = cookies();
  jar.set(ACCESS_COOKIE, "", { ...cookieOpts(0) });
  jar.set(REFRESH_COOKIE, "", { ...cookieOpts(0), path: "/api/auth/refresh" });
}

export function newCsrfToken(): string {
  const token = crypto.randomBytes(24).toString("hex");
  cookies().set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return token;
}

/** Double-submit CSRF check for state-changing requests with a session cookie. */
export function assertCsrf(req: NextRequest): void {
  const header = req.headers.get("x-csrf-token");
  const cookie = req.cookies.get(CSRF_COOKIE)?.value;
  if (!header || !cookie || header !== cookie) {
    throw forbidden("CSRF token missing or invalid");
  }
}

export async function getSession(req: NextRequest): Promise<Session | null> {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    return verifyAccess(token);
  } catch {
    return null;
  }
}

/** Server-component session reader (reads cookies via next/headers and supports Supabase Auth). */
export async function getServerSession(): Promise<Session | null> {
  try {
    const token = cookies().get(ACCESS_COOKIE)?.value;
    if (token) {
      try {
        return verifyAccess(token);
      } catch {
        /* token invalid, continue to fallback */
      }
    }

    // Supabase Auth session fallback
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { createClient } = await import("./supabase/server");
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { supabaseId: data.user.id },
                ...(data.user.email ? [{ email: data.user.email }] : []),
                ...(data.user.phone ? [{ phone: data.user.phone.replace(/^\+91/, "").replace(/\s/g, "") }] : []),
              ],
            },
          });
          if (user && user.isActive) {
            return { kind: "CUSTOMER", userId: user.id };
          }
        }
      } catch {
        /* ignore supabase error */
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function requireCustomer(req: NextRequest): Promise<{ userId: string }> {
  const s = await getSession(req);
  if (!s || s.kind !== "CUSTOMER") throw unauthorized();
  return { userId: s.userId };
}

export async function requireAdmin(req: NextRequest): Promise<Session & { kind: "ADMIN" }> {
  const s = await getSession(req);
  if (!s || s.kind !== "ADMIN") throw unauthorized("Admin session required");
  return s;
}

export async function storeRefreshToken(subject: { userId?: string; adminId?: string }, token: string) {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const expiresAt = new Date((decoded?.exp ?? 0) * 1000);
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.refreshToken.create({
    data: { userId: subject.userId, adminId: subject.adminId, tokenHash, expiresAt },
  });
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revokedAt: new Date() } });
}

// ---------------- OTP ----------------

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * OTP provider abstraction. v1 ships a console provider (dev only) that logs the
 * code server-side. Plug a real SMS provider by implementing OtpProvider and
 * wiring it here — never expose codes to the frontend in production.
 */
export interface OtpProvider {
  send(phone: string, code: string): Promise<void>;
}
export const consoleOtpProvider: OtpProvider = {
  async send(phone: string, code: string) {
    console.log(`[otp] code for ${phone}: ${code} (console provider — dev only)`);
  },
};

export async function requestOtp(phone: string, provider: OtpProvider = consoleOtpProvider) {
  const normalized = phone.replace(/\s/g, "");
  if (!/^[6-9]\d{9}$/.test(normalized) && !/^\+91[6-9]\d{9}$/.test(normalized)) {
    throw badRequest("Enter a valid 10-digit Indian mobile number");
  }
  const digits = normalized.replace(/^\+91/, "");
  // Rate limit: max 5 OTPs per hour per phone.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.otpCode.count({ where: { phone: digits, createdAt: { gte: oneHourAgo } } });
  if (recent >= 5) throw new ApiErrorRateLimit();
  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.otpCode.create({
    data: { phone: digits, codeHash, purpose: "LOGIN", expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  await provider.send(digits, code);
  // Dev-only test hook: NEVER enabled in production.
  const devOtp = process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_OTP === "true" ? code : undefined;
  return { phone: digits, devOtp };
}

class ApiErrorRateLimit extends Error {
  status = 429;
  code = "RATE_LIMITED";
  constructor() {
    super("Too many OTP requests. Try again later.");
  }
}

export async function verifyOtp(phone: string, code: string) {
  const digits = phone.replace(/^\+91/, "").replace(/\s/g, "");
  const record = await prisma.otpCode.findFirst({
    where: { phone: digits, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record) throw badRequest("OTP expired or not found. Request a new one.");
  if (record.attempts >= OTP_MAX_ATTEMPTS) throw badRequest("Too many attempts. Request a new OTP.");
  const ok = await bcrypt.compare(code, record.codeHash);
  if (!ok) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    throw badRequest("Incorrect OTP");
  }
  await prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  return { phone: digits };
}
