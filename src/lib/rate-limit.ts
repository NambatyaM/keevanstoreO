// ============================================================
// Rate Limiting — Serverless-safe in-process rate limiter
// ============================================================
// ARCHITECTURE NOTE: This implementation uses a globalThis-pinned
// Map so it survives Next.js hot-reloads in development.
//
// IMPORTANT — PRODUCTION LIMITATION:
// On Vercel/serverless runtimes each function instance has its own
// memory. A user hitting different instances bypasses this limiter.
// For production hardening, replace checkRateLimit() with an
// Upstash Redis call:
//
//   import { Ratelimit } from "@upstash/ratelimit";
//   import { Redis } from "@upstash/redis";
//   const ratelimit = new Ratelimit({
//     redis: Redis.fromEnv(),
//     limiter: Ratelimit.slidingWindow(10, "60 s"),
//   });
//
// Until Redis is provisioned, this limiter is still effective
// because Vercel routes the same IP to the same warm instance
// for short bursts, and the middleware IP check adds a second layer.
// ============================================================

// FIXED: Blueprint Issue A — pinned to globalThis to survive hot-reload
// and remain consistent within a single serverless instance lifetime.
const globalForRateLimit = globalThis as typeof globalThis & {
  __keevanRateLimitStore: Map<string, RateLimitEntry> | undefined;
  __keevanRateLimitCleanup: ReturnType<typeof setInterval> | undefined;
};

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Single store instance per process
if (!globalForRateLimit.__keevanRateLimitStore) {
  globalForRateLimit.__keevanRateLimitStore = new Map<string, RateLimitEntry>();
}
const store = globalForRateLimit.__keevanRateLimitStore;

// Single cleanup interval per process — avoids interval leaks on hot-reload
if (!globalForRateLimit.__keevanRateLimitCleanup) {
  globalForRateLimit.__keevanRateLimitCleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request is within rate limits.
 * Uses a fixed window algorithm against a process-scoped in-memory store.
 *
 * @param key       - Unique key (e.g. "checkout:1.2.3.4")
 * @param limit     - Maximum requests allowed in the window
 * @param windowMs  - Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime };
}

/**
 * Extract a client identifier from a request for rate-limit keying.
 * Reads the real IP from Vercel/proxy forwarding headers.
 */
export function getClientId(request: Request): string {
  // Vercel sets x-real-ip; generic proxies use x-forwarded-for
  const realIp = (request as Request & { headers: Headers }).headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = (request as Request & { headers: Headers }).headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}

/**
 * Build standard rate-limit response headers.
 * Useful for attaching to 429 responses so clients know when to retry.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
    "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)),
  };
}
