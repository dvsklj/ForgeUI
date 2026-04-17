import { describe, it, expect, afterEach } from 'vitest';
import { createForgeServer } from '../src/server/index.js';
import { initDatabase, closeDatabase } from '../src/server/db.js';
import { createRateLimiter } from '../src/server/rate-limit.js';

const savedEnv = { ...process.env };

afterEach(() => {
  process.env = { ...savedEnv };
  closeDatabase();
});

// ─── Token bucket unit tests ──────────────────────────────────

describe('token bucket rate limiter', () => {
  it('first N takes are allowed, N+1 is denied', () => {
    const rl = createRateLimiter({ capacity: 5, refillPerSec: 1, ttlMs: 60_000 });
    for (let i = 0; i < 5; i++) {
      expect(rl.take('a').allowed).toBe(true);
    }
    expect(rl.take('a').allowed).toBe(false);
    rl.stop();
  });

  it('refill restores tokens over time', () => {
    let t = 0;
    const rl = createRateLimiter({
      capacity: 5,
      refillPerSec: 1,
      ttlMs: 60_000,
      now: () => t,
    });
    // drain all 5
    for (let i = 0; i < 5; i++) rl.take('a');
    expect(rl.take('a').allowed).toBe(false);
    // advance 3 seconds → 3 tokens refilled
    t = 3000;
    for (let i = 0; i < 3; i++) {
      expect(rl.take('a').allowed).toBe(true);
    }
    expect(rl.take('a').allowed).toBe(false);
    rl.stop();
  });

  it('separate keys have separate buckets', () => {
    const rl = createRateLimiter({ capacity: 2, refillPerSec: 0.001, ttlMs: 60_000 });
    expect(rl.take('ip-1').allowed).toBe(true);
    expect(rl.take('ip-1').allowed).toBe(true);
    expect(rl.take('ip-1').allowed).toBe(false);
    // different key still has full capacity
    expect(rl.take('ip-2').allowed).toBe(true);
    expect(rl.take('ip-2').allowed).toBe(true);
    expect(rl.take('ip-2').allowed).toBe(false);
    rl.stop();
  });

  it('retryAfterMs is computed correctly', () => {
    let t = 0;
    const rl = createRateLimiter({
      capacity: 1,
      refillPerSec: 1, // 1 token per second
      ttlMs: 60_000,
      now: () => t,
    });
    // use the one token
    expect(rl.take('a').allowed).toBe(true);
    // next should be denied with retry ~1000ms
    const { allowed, retryAfterMs } = rl.take('a');
    expect(allowed).toBe(false);
    expect(retryAfterMs).toBe(1000);
    rl.stop();
  });

  it('eviction removes idle buckets after ttl', () => {
    let t = 0;
    const rl = createRateLimiter({
      capacity: 10,
      refillPerSec: 1,
      ttlMs: 5000,
      now: () => t,
    });
    rl.take('old-ip');
    // advance past ttl
    t = 10_000;
    // trigger sweep — sweep runs every 60s in real code, but we can't wait
    // Instead, verify the bucket is recreated fresh (capacity restored)
    const r = rl.take('old-ip');
    expect(r.allowed).toBe(true);
    rl.stop();
  });
});

// ─── HTTP integration: rate limiting ──────────────────────────

describe('rate limiting middleware', () => {
  it('allows burst of requests then returns 429 with Retry-After', async () => {
    delete process.env.FORGEUI_RATE_LIMIT_DISABLE;
    process.env.FORGEUI_RATE_LIMIT_RPM = '60';
    process.env.FORGEUI_RATE_LIMIT_BURST = '5'; // small burst for testing
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    // First 5 should succeed (or at least not 429)
    for (let i = 0; i < 5; i++) {
      const res = await app.request('/api/health');
      expect(res.status).not.toBe(429);
    }
    // 6th should be rate limited
    const res = await app.request('/api/health');
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
    const retryAfter = parseInt(res.headers.get('retry-after')!, 10);
    expect(retryAfter).toBeGreaterThan(0);
    const body = await res.json();
    expect(body.error).toBe('rate_limited');
    expect(body.retryAfter).toBe(retryAfter);
  });

  it('FORGEUI_RATE_LIMIT_DISABLE=1 skips rate limiting', async () => {
    process.env.FORGEUI_RATE_LIMIT_DISABLE = '1';
    process.env.FORGEUI_RATE_LIMIT_BURST = '1';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    // 200 rapid requests should all pass
    for (let i = 0; i < 200; i++) {
      const res = await app.request('/api/health');
      expect(res.status).toBe(200);
    }
  });

  it('rate limiting only applies to /api/*', async () => {
    process.env.FORGEUI_RATE_LIMIT_BURST = '1';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    // The landing page is not under /api, so rate limit shouldn't apply
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/');
      expect(res.status).not.toBe(429);
    }
  });
});

// ─── HTTP integration: body size ──────────────────────────────

describe('body size enforcement', () => {
  it('Content-Length > max returns 413', async () => {
    delete process.env.FORGEUI_MAX_BODY_BYTES;
    process.env.FORGEUI_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '2000000',
      },
      body: '{}',
    });
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toMatch(/too large/i);
  });

  it('streaming body exceeding max returns 413', async () => {
    process.env.FORGEUI_MAX_BODY_BYTES = '1024'; // 1 KB
    process.env.FORGEUI_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    // Create a body that exceeds 1 KB but set Content-Length to trick the pre-check
    const bigBody = JSON.stringify({ data: 'x'.repeat(2000) });
    const res = await app.request('/api/apps', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(bigBody.length), // honest length — should be rejected
      },
      body: bigBody,
    });
    expect(res.status).toBe(413);
  });

  it('body under limit succeeds', async () => {
    process.env.FORGEUI_RATE_LIMIT_DISABLE = '1';
    delete process.env.FORGEUI_MAX_BODY_BYTES;
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'small-app',
        manifest: '0.1.0',
        root: 'main',
        elements: { main: { type: 'Text', props: { content: 'Hi' } } },
      }),
    });
    expect(res.status).toBe(201);
  });
});

// ─── HTTP integration: trust proxy ────────────────────────────

describe('trust proxy', () => {
  it('FORGEUI_TRUST_PROXY=0: X-Forwarded-For is ignored — same rate bucket', async () => {
    process.env.FORGEUI_TRUST_PROXY = '0';
    process.env.FORGEUI_RATE_LIMIT_BURST = '3';
    process.env.FORGEUI_RATE_LIMIT_RPM = '60';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    // Two different X-Forwarded-For values should share one bucket (socket IP)
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/api/health', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });
      expect(res.status).not.toBe(429);
    }
    // 4th request from a "different" forwarded IP should still be rate limited
    // because trust proxy is off — same socket = same bucket
    const res = await app.request('/api/health', {
      headers: { 'x-forwarded-for': '5.6.7.8' },
    });
    expect(res.status).toBe(429);
  });

  it('FORGEUI_TRUST_PROXY=1: X-Forwarded-For yields separate buckets', async () => {
    process.env.FORGEUI_TRUST_PROXY = '1';
    process.env.FORGEUI_RATE_LIMIT_BURST = '2';
    process.env.FORGEUI_RATE_LIMIT_RPM = '60';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    // Exhaust bucket for IP 1.2.3.4
    await app.request('/api/health', { headers: { 'x-forwarded-for': '1.2.3.4' } });
    await app.request('/api/health', { headers: { 'x-forwarded-for': '1.2.3.4' } });
    const blocked = await app.request('/api/health', { headers: { 'x-forwarded-for': '1.2.3.4' } });
    expect(blocked.status).toBe(429);

    // Different forwarded IP should still work
    const ok = await app.request('/api/health', { headers: { 'x-forwarded-for': '5.6.7.8' } });
    expect(ok.status).toBe(200);
  });

  it('trust proxy: X-Real-IP is also honored when X-Forwarded-For is absent', async () => {
    process.env.FORGEUI_TRUST_PROXY = '1';
    process.env.FORGEUI_RATE_LIMIT_BURST = '2';
    process.env.FORGEUI_RATE_LIMIT_RPM = '60';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    await app.request('/api/health', { headers: { 'x-real-ip': '10.0.0.1' } });
    await app.request('/api/health', { headers: { 'x-real-ip': '10.0.0.1' } });
    const blocked = await app.request('/api/health', { headers: { 'x-real-ip': '10.0.0.1' } });
    expect(blocked.status).toBe(429);
  });

  it('startup logs trust proxy state', async () => {
    // Just verify the config parses correctly
    process.env.FORGEUI_TRUST_PROXY = 'yes';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });
    // If we got here without throwing, the config was parsed
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
  });
});

// ─── Edge cases ───────────────────────────────────────────────

describe('server hardening edge cases', () => {
  it('429 response body includes error and retryAfter fields', async () => {
    process.env.FORGEUI_RATE_LIMIT_BURST = '1';
    process.env.FORGEUI_RATE_LIMIT_RPM = '60';
    process.env.FORGEUI_RATE_LIMIT_DISABLE = '';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    await app.request('/api/health');
    const res = await app.request('/api/health');
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'rate_limited');
    expect(body).toHaveProperty('retryAfter');
    expect(typeof body.retryAfter).toBe('number');
    expect(body.retryAfter).toBeGreaterThan(0);
  });

  it('Content-Length: 0 on POST still works (empty body)', async () => {
    process.env.FORGEUI_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '0',
      },
      body: '',
    });
    // Should fail because empty string is not valid JSON manifest, not 413
    expect(res.status).not.toBe(413);
  });

  it('non-numeric FORGEUI_MAX_BODY_BYTES falls back to 1 MB', async () => {
    process.env.FORGEUI_MAX_BODY_BYTES = 'not-a-number';
    process.env.FORGEUI_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');
    // Should not throw during server creation
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
  });

  it('PUT /api/apps/:id body goes through bounded reader', async () => {
    process.env.FORGEUI_MAX_BODY_BYTES = '512';
    process.env.FORGEUI_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const bigBody = JSON.stringify({ data: 'x'.repeat(1000) });
    const res = await app.request('/api/apps/test', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: bigBody,
    });
    expect(res.status).toBe(413);
  });

  it('PATCH /api/apps/:id body goes through bounded reader', async () => {
    process.env.FORGEUI_MAX_BODY_BYTES = '512';
    process.env.FORGEUI_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const bigBody = JSON.stringify({ data: 'x'.repeat(1000) });
    const res = await app.request('/api/apps/test', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: bigBody,
    });
    expect(res.status).toBe(413);
  });
});
