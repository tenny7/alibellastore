import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory sliding-window rate limiter.
 * For production with multiple instances, swap for Redis-based (e.g. @upstash/ratelimit).
 */
const stores = new Map<string, Map<string, RateLimitEntry>>();

interface RateLimitConfig {
  /** Unique key for this limiter (e.g. "checkout", "momo-initiate") */
  key: string;
  /** Max requests allowed within the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check rate limit for a request. Returns null if allowed, or a 429 response if exceeded.
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const { key, limit, windowSeconds } = config;
  const ip = getClientIp(request);
  const identifier = `${ip}`;

  if (!stores.has(key)) {
    stores.set(key, new Map());
  }
  const store = stores.get(key)!;

  const now = Date.now();
  const entry = store.get(identifier);

  // Clean expired entries periodically (every 100th check)
  if (Math.random() < 0.01) {
    for (const [k, v] of store.entries()) {
      if (v.resetAt < now) store.delete(k);
    }
  }

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(identifier, { count: 1, resetAt: now + windowSeconds * 1000 });
    return null;
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  entry.count++;
  return null;
}
