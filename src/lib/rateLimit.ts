// In-memory token-bucket rate limiter (single instance).
// For multi-instance deployments, back this with Redis via the cache layer.
import { ApiError } from "./errors";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (b.count >= limit) return { allowed: false, remaining: 0 };
  b.count += 1;
  return { allowed: true, remaining: limit - b.count };
}

export function rateLimitOrThrow(key: string, limit: number, windowMs: number, message = "Too many requests"): void {
  const r = checkRateLimit(key, limit, windowMs);
  if (!r.allowed) throw new ApiError(429, "RATE_LIMITED", message);
}
