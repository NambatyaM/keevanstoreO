// ============================================================
// Rate Limiting — Simple in-memory rate limiter for API routes
// ============================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof globalThis !== "undefined") {
  setInterval(() => {
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
 * Uses a sliding window algorithm with in-memory storage.
 *
 * @param key - Unique identifier for the client (e.g., IP address)
 * @param limit - Maximum number of requests in the window
 * @param windowMs - Window duration in milliseconds
 * @returns Whether the request is allowed and remaining quota
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
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
 * Get a client identifier from a request.
 * Uses IP address from headers, falling back to "unknown".
 */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return ip;
}
