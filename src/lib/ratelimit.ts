import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Upstash Redis-backed distributed rate limiter.
// Falls back to in-memory if env vars aren't set (local dev).
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch {}

// Cache limiters so we don't recreate on every request
const limiters = new Map<string, Ratelimit>();

function getLimiter(max: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${max}:${windowMs}`;
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(max, `${windowMs}ms`),
        analytics: false,
      })
    );
  }
  return limiters.get(key)!;
}

// In-memory fallback for local dev
const buckets = new Map<string, { count: number; reset: number }>();

function inMemoryLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const rec = buckets.get(key);
  if (!rec || now > rec.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  rec.count += 1;
  return rec.count > max;
}

/** Returns true if the request should be blocked. */
export async function rateLimitAsync(
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  const limiter = getLimiter(max, windowMs);
  if (!limiter) return inMemoryLimit(key, max, windowMs);
  const { success } = await limiter.limit(key);
  return !success;
}

/** Sync version kept for backwards compat — always uses in-memory fallback.
 *  Prefer rateLimitAsync in new route handlers. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  return inMemoryLimit(key, max, windowMs);
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
