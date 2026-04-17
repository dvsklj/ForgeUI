/**
 * Per-IP token-bucket rate limiter.
 *
 * In-memory, keyed by client IP. Not persisted — process restart
 * resets state, which is fine for Ring 2 self-hosted deployments.
 */

export interface Bucket {
  tokens: number;
  lastRefillMs: number;
}

export interface RateLimitConfig {
  capacity: number;   // max burst tokens
  refillPerSec: number; // tokens added per second
  ttlMs: number;      // evict idle buckets after this
  /** Injected clock for testing */
  now?: () => number;
}

export interface RateLimiter {
  take(key: string): { allowed: boolean; retryAfterMs: number };
  /** Check whether a bucket exists for the given key */
  has(key: string): boolean;
  /** Manually trigger a sweep of stale buckets */
  sweep(): void;
  stop(): void;
}

export function createRateLimiter(cfg: RateLimitConfig): RateLimiter {
  const buckets = new Map<string, Bucket>();
  const now = cfg.now ?? (() => Date.now());

  function sweep(): void {
    const cutoff = now() - cfg.ttlMs;
    for (const [k, b] of buckets) if (b.lastRefillMs < cutoff) buckets.delete(k);
  }

  const timer = setInterval(sweep, 60_000);
  if (typeof timer.unref === 'function') timer.unref();

  return {
    take(key: string) {
      const t = now();
      let b = buckets.get(key);
      if (!b) {
        b = { tokens: cfg.capacity, lastRefillMs: t };
        buckets.set(key, b);
      }
      const elapsed = (t - b.lastRefillMs) / 1000;
      b.tokens = Math.min(cfg.capacity, b.tokens + elapsed * cfg.refillPerSec);
      b.lastRefillMs = t;
      if (b.tokens >= 1) {
        b.tokens -= 1;
        return { allowed: true, retryAfterMs: 0 };
      }
      const retryAfterMs = Math.ceil((1 - b.tokens) / cfg.refillPerSec * 1000);
      return { allowed: false, retryAfterMs };
    },
    has(key: string) {
      return buckets.has(key);
    },
    sweep,
    stop() {
      clearInterval(timer);
    },
  };
}
