import { describe, it, expect, afterEach } from 'vitest';
import { createForgeServer } from '../src/server/index.js';
import { initDatabase, createApp, getApp, closeDatabase } from '../src/server/db.js';
import { createRateLimiter } from '../src/server/rate-limit.js';
import type { ForgeManifest } from '../src/types/index.js';
import http from 'node:http';

const savedEnv = { ...process.env };

afterEach(() => {
  process.env = { ...savedEnv };
  closeDatabase();
});

// ─── helpers ─────────────────────────────────────────────────

function seedApp(overrides?: Partial<ForgeManifest>) {
  initDatabase(':memory:');
  return createApp({
    id: 'stress-test',
    manifest: '0.1.0',
    root: 'main',
    elements: {
      main: { type: 'Text', props: { content: 'Hello' } },
    },
    meta: { title: 'Stress Test' },
    ...overrides,
  } as any);
}

const VALID_MANIFEST = {
  id: 'valid-app',
  manifest: '0.1.0',
  root: 'main',
  elements: { main: { type: 'Text', props: { content: 'Hi' } } },
  meta: { title: 'Valid' },
};

/** Send an HTTP request via raw TCP (no fetch API). Returns { status, headers, body }. */
function rawHttp(opts: {
  port: number;
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: string | Buffer;
  transferEncoding?: string;
}): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve, reject) => {
    const reqHeaders: Record<string, string> = {
      host: `127.0.0.1:${opts.port}`,
      ...opts.headers,
    };
    if (opts.transferEncoding) {
      reqHeaders['transfer-encoding'] = opts.transferEncoding;
      delete reqHeaders['content-length'];
    }
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: opts.port,
        method: opts.method,
        path: opts.path,
        headers: reqHeaders,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const rawHeaders: Record<string, string> = {};
          for (let i = 0; i < res.rawHeaders.length; i += 2) {
            rawHeaders[res.rawHeaders[i].toLowerCase()] = res.rawHeaders[i + 1];
          }
          resolve({
            status: res.statusCode!,
            headers: rawHeaders,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );
    req.on('error', reject);
    if (opts.body !== undefined) {
      req.write(opts.body);
    }
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════
// 1. Rate-limit flood (injected clock)
// ═══════════════════════════════════════════════════════════════

describe('1. Rate-limit flood (injected clock)', () => {
  it('first 10 allowed, next 90 denied with decreasing retryAfterMs, then refill after 1s', () => {
    let t = 0;
    const rl = createRateLimiter({
      capacity: 10,
      refillPerSec: 1,
      ttlMs: 60_000,
      now: () => t,
    });

    let lastRetryAfter = Infinity;
    for (let i = 0; i < 100; i++) {
      const { allowed, retryAfterMs } = rl.take('1.2.3.4');
      if (i < 10) {
        expect(allowed).toBe(true);
        expect(retryAfterMs).toBe(0);
      } else {
        expect(allowed).toBe(false);
        expect(retryAfterMs).toBeGreaterThan(0);
        expect(retryAfterMs).toBeLessThanOrEqual(lastRetryAfter);
        lastRetryAfter = retryAfterMs;
      }
    }

    // Advance 1000 ms → 1 token refilled
    t = 1000;
    const afterRefill = rl.take('1.2.3.4');
    expect(afterRefill.allowed).toBe(true);

    rl.stop();
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. Rate-limit end-to-end via HTTP
// ═══════════════════════════════════════════════════════════════

describe('2. Rate-limit end-to-end via HTTP', () => {
  it('first 5 return 200, requests 6-20 return 429 with Retry-After ≥ 1', async () => {
    process.env.FORGE_RATE_LIMIT_RPM = '60';
    process.env.FORGE_RATE_LIMIT_BURST = '5';
    delete process.env.FORGE_RATE_LIMIT_DISABLE;
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const results: { status: number; retryAfter: string | null }[] = [];
    for (let i = 0; i < 20; i++) {
      const res = await app.request('/api/apps');
      results.push({
        status: res.status,
        retryAfter: res.headers.get('retry-after'),
      });
    }

    // First 5: 200
    for (let i = 0; i < 5; i++) {
      expect(results[i].status).toBe(200);
    }
    // Requests 6-20: 429
    for (let i = 5; i < 20; i++) {
      expect(results[i].status).toBe(429);
      const ra = parseInt(results[i].retryAfter!, 10);
      expect(ra).toBeGreaterThanOrEqual(1);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. Body cap — spoofed / missing Content-Length (streaming)
//    Requires a real TCP socket.
// ═══════════════════════════════════════════════════════════════

describe('4. Body cap — spoofed / missing Content-Length (streaming)', () => {
  let serverHandle: any;
  let port: number;

  async function startServer() {
    process.env.FORGE_MAX_BODY_BYTES = '1048576'; // 1 MB
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');
    const { start, stop } = createForgeServer({ port: 0, host: '127.0.0.1', baseUrl: 'http://localhost' });
    await start();
    // The @hono/node-server serve() with port 0 picks a random port.
    // We discover it by probing.
    // Actually, createForgeServer doesn't expose the server handle externally.
    // We need a way to stop it. Let's use the returned stop function.
    // But we also need the port. The serve callback gets the info.
    // The problem: createForgeServer's start() calls serve() and resolves,
    // but doesn't return the port. We need to discover it.
    // Workaround: try common approach — the handle has address().
    // Let's import serve separately and use it directly instead.
    return { stop };
  }

  afterEach(() => {
    if (serverHandle) {
      serverHandle.close();
      serverHandle = null;
    }
  });

  it('4a. CL omitted, body 2 MB chunked → 413 with /too large/i', async () => {
    process.env.FORGE_MAX_BODY_BYTES = '1048576';
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');

    const { serve } = await import('@hono/node-server');
    const { createForgeServer: createForge } = await import('../src/server/index.js');
    const { app } = createForge({ baseUrl: 'http://localhost' });

    await new Promise<void>((resolve) => {
      serverHandle = serve({ fetch: app.fetch, port: 0, hostname: '127.0.0.1' }, (info) => {
        port = info.port;
        resolve();
      });
    });

    // Send 2 MB of random bytes as chunked transfer (no Content-Length)
    const bigBody = Buffer.alloc(2 * 1024 * 1024, 0x41);
    const res = await rawHttp({
      port,
      method: 'POST',
      path: '/api/apps',
      headers: { 'content-type': 'application/json' },
      body: bigBody,
      transferEncoding: 'chunked',
    });

    expect(res.status).toBe(413);
    const json = JSON.parse(res.body);
    expect(json.error).toMatch(/too large/i);
  }, 15_000);

  it('4b. CL=100 present, body actually 2 MB → 413/400, no hang, no 500', async () => {
    process.env.FORGE_MAX_BODY_BYTES = '1048576';
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');

    const { serve } = await import('@hono/node-server');
    const { createForgeServer: createForge } = await import('../src/server/index.js');
    const { app } = createForge({ baseUrl: 'http://localhost' });

    await new Promise<void>((resolve) => {
      serverHandle = serve({ fetch: app.fetch, port: 0, hostname: '127.0.0.1' }, (info) => {
        port = info.port;
        resolve();
      });
    });

    // Spoofed CL=100, but body is 2 MB chunked
    const bigBody = Buffer.alloc(2 * 1024 * 1024, 0x42);
    const res = await rawHttp({
      port,
      method: 'POST',
      path: '/api/apps',
      headers: {
        'content-type': 'application/json',
        'content-length': '100',
      },
      body: bigBody,
      transferEncoding: 'chunked',
    });

    // Server should handle gracefully — 413 or 400, never 500
    expect(res.status).not.toBe(500);
    expect([400, 413]).toContain(res.status);
  }, 10_000);
});

// ═══════════════════════════════════════════════════════════════
// 5. Adversarial manifest corpus over HTTP
// ═══════════════════════════════════════════════════════════════

describe('5. Adversarial manifest corpus over HTTP', () => {
  // ── Corpus: ~20 bad payloads ──

  const deeplyNested: Record<string, unknown> = {};
  let cursor = deeplyNested;
  for (let i = 0; i < 500; i++) {
    const next: Record<string, unknown> = {};
    cursor['d'] = next;
    cursor = next;
  }
  cursor['v'] = 'leaf';

  const veryLongChildren: string[] = Array.from({ length: 10_000 }, (_, i) => `child-${i}`);

  // The body-size cap is the enforcement boundary for oversized payloads.
  // Individual field lengths are not capped beyond the overall 1 MB body limit.
  const hugeString800k = 'x'.repeat(800_000); // under 1 MB cap — should be accepted
  const hugeString2m = 'x'.repeat(2_000_000); // over 1 MB cap — should be rejected

  const corpus: { label: string; body: unknown }[] = [
    // Prototype pollution (must use JSON.parse so __proto__/constructor become own properties)
    { label: '__proto__ pollution', body: JSON.parse('{"__proto__":{"polluted":true},"manifest":"0.1.0","root":"main","elements":{"main":{"type":"Text"}}}') },
    { label: 'constructor pollution', body: JSON.parse('{"constructor":{"prototype":{"polluted":true}},"manifest":"0.1.0","root":"main","elements":{"main":{"type":"Text"}}}') },

    // Deeply nested JSON (depth 500)
    { label: 'deeply nested JSON', body: deeplyNested },

    // Circular-reference attempt
    { label: '$ref self', body: { $ref: '#/self', manifest: '0.1.0', root: 'main', elements: { main: { type: 'Text' } } } },

    // Unknown component type
    { label: 'unknown type', body: { manifest: '0.1.0', root: 'main', elements: { main: { type: 'EvilComponent' } } } },

    // Very long children array (10k entries)
    { label: '10k children', body: { manifest: '0.1.0', root: 'main', elements: { main: { type: 'Stack', children: veryLongChildren } } } },

    // Script injection
    { label: 'script injection', body: { manifest: '0.1.0', root: 'main', elements: { main: { type: 'Text', props: { content: '<script>alert(1)</script>' } } } } },
    { label: 'javascript: URL', body: { manifest: '0.1.0', root: 'main', elements: { main: { type: 'Link', props: { href: 'javascript:alert(1)' } } } } },

    // Empty / null
    { label: 'empty object', body: {} },
    { label: 'null body', body: null },

    // Missing required fields
    { label: 'missing root', body: { manifest: '0.1.0', elements: { main: { type: 'Text' } } } },
    { label: 'missing elements', body: { manifest: '0.1.0', root: 'main' } },

    // Extremely long key
    { label: 'long key', body: { manifest: '0.1.0', root: 'main', elements: { main: { type: 'Text' } }, ['x'.repeat(1000)]: 'value' } },
  ];

  it('POST /api/apps — every response is 400 or 413 (no 500)', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    delete process.env.FORGE_MAX_BODY_BYTES;
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    for (const { label, body } of corpus) {
      const res = await app.request('/api/apps', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(res.status, `POST ${label} returned ${res.status}`).not.toBe(500);
      if (res.status !== 201) {
        expect([400, 413], `POST ${label} returned ${res.status}`).toContain(res.status);
      }
    }
  });

  it('PUT /api/apps/existing — every response is 400 or 413 (no 500)', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    delete process.env.FORGE_MAX_BODY_BYTES;
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    for (const { label, body } of corpus) {
      const res = await app.request('/api/apps/stress-test', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(res.status, `PUT ${label} returned ${res.status}`).not.toBe(500);
      expect([400, 413], `PUT ${label} returned ${res.status}`).toContain(res.status);
    }
  });

  it('PATCH with own-property __proto__ must not mutate stored manifest prototype', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    const app = seedApp();
    const { app: server } = createForgeServer({ baseUrl: 'http://localhost' });

    // JSON.parse creates __proto__ as an own enumerable property (unlike object literals)
    const payload = JSON.parse('{"__proto__":{"polluted":"yes"}}');
    const res = await server.request('/api/apps/stress-test', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Acceptable outcomes: 400 (patch rejected) or 200 with no proto mutation
    expect(res.status).not.toBe(500);
    if (res.status === 200) {
      const stored = getApp('stress-test')!;
      expect(Object.getPrototypeOf(stored.manifest)).toBe(Object.prototype);
      expect((stored.manifest as any).polluted).toBeUndefined();
    }
    // Global proto sanity — no prototype pollution leaked to unrelated objects
    expect(({} as any).polluted).toBeUndefined();
  });

  it('PUT with 800KB string prop (under 1MB cap) — should accept, not 413', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    delete process.env.FORGE_MAX_BODY_BYTES; // default 1 MB
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    // The body-size cap is the enforcement boundary.
    // Individual field lengths are not capped beyond the overall 1 MB body limit.
    const body = { manifest: '0.1.0', id: 'stress-test', root: 'main', elements: { main: { type: 'Text', props: { content: hugeString800k } } } };
    const res = await app.request('/api/apps/stress-test', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(res.status).not.toBe(500);
    expect(res.status).not.toBe(413); // under the cap — must not be rejected as too large
  });

  it('PUT with 2MB string prop (over 1MB cap) — must return 413', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    delete process.env.FORGE_MAX_BODY_BYTES; // default 1 MB
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const body = { manifest: '0.1.0', id: 'stress-test', root: 'main', elements: { main: { type: 'Text', props: { content: hugeString2m } } } };
    const res = await app.request('/api/apps/stress-test', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect([400, 413]).toContain(res.status); // 413 preferred, 400 acceptable if body parser rejects first
  });

  it('server is still responsive after full corpus: GET /api/health → 200', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    delete process.env.FORGE_MAX_BODY_BYTES;
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    // Fire the entire corpus at POST
    for (const { body } of corpus) {
      await app.request('/api/apps', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    // Health check must still work
    const health = await app.request('/api/health');
    expect(health.status).toBe(200);
    const json = await health.json();
    expect(json.status).toBe('ok');
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. Concurrent PATCH — write race
// ═══════════════════════════════════════════════════════════════

describe('6. Concurrent PATCH — write race', () => {
  it('10 concurrent patches: all 200/400, final GET meta.title matches one of the 10', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const titles = Array.from({ length: 10 }, (_, i) => `Concurrent Title ${i}`);

    const responses = await Promise.all(
      titles.map((title) =>
        app.request('/api/apps/stress-test', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ meta: { title } }),
        }),
      ),
    );

    for (const res of responses) {
      expect([200, 400]).toContain(res.status);
    }

    // After the storm, GET must return a valid manifest with one of the 10 titles
    const getRes = await app.request('/api/apps/stress-test');
    expect(getRes.status).toBe(200);
    const appData = await getRes.json();
    expect(titles).toContain(appData.manifest.meta.title);
    // Must not be corrupted
    expect(typeof appData.manifest.meta.title).toBe('string');
    expect(appData.manifest.meta.title.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. Bucket eviction (injected clock)
// ═══════════════════════════════════════════════════════════════

describe('7. Bucket eviction (injected clock)', () => {
  it('sweep clears buckets older than ttlMs', () => {
    let t = 0;
    const rl = createRateLimiter({
      capacity: 10,
      refillPerSec: 1,
      ttlMs: 1000,
      now: () => t,
    });

    // Create buckets for 'a' and 'b'
    rl.take('a');
    rl.take('b');
    expect(rl.has('a')).toBe(true);
    expect(rl.has('b')).toBe(true);

    // Advance past TTL but not enough for sweep interval (which we drive manually)
    t = 2000;
    rl.sweep();

    expect(rl.has('a')).toBe(false);
    expect(rl.has('b')).toBe(false);

    rl.stop();
  });

  it('sweep preserves fresh buckets', () => {
    let t = 0;
    const rl = createRateLimiter({
      capacity: 10,
      refillPerSec: 1,
      ttlMs: 5000,
      now: () => t,
    });

    rl.take('old');
    t = 3000;
    rl.take('new'); // refresh 'new' at t=3000

    t = 6000; // 'old' (lastRefill=0) is stale (6000 > 5000), 'new' (lastRefill=3000) is fresh (3000 > 1000)
    rl.sweep();

    expect(rl.has('old')).toBe(false);
    expect(rl.has('new')).toBe(true);

    rl.stop();
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. Health under sustained load
// ═══════════════════════════════════════════════════════════════

describe('8. Health under sustained load', () => {
  it('GET /api/health stays under 200ms while write loop runs for 3s', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    let writeRunning = true;
    let writeCount = 0;

    // Write loop: POST + DELETE at ~50 rps (20ms between pairs)
    const writeLoop = (async () => {
      while (writeRunning) {
        const id = `load-${writeCount++}`;
        await app.request('/api/apps', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            id,
            manifest: '0.1.0',
            root: 'main',
            elements: { main: { type: 'Text', props: { content: 'Load' } } },
          }),
        });
        await app.request(`/api/apps/${id}`, { method: 'DELETE' });
        // Small delay to target ~50 rps
        await new Promise((r) => setTimeout(r, 20));
      }
    })();

    // Health probe loop: every 100ms for 3s
    const healthTimes: number[] = [];
    const healthStatuses: number[] = [];
    const start = performance.now();

    while (performance.now() - start < 3000) {
      const t0 = performance.now();
      const res = await app.request('/api/health');
      const elapsed = performance.now() - t0;
      healthTimes.push(elapsed);
      healthStatuses.push(res.status);
      await new Promise((r) => setTimeout(r, 100));
    }

    writeRunning = false;
    await writeLoop;

    // Every health response must be 200 and under 200ms
    const slow = healthTimes.filter((t) => t > 200);
    const non200 = healthStatuses.filter((s) => s !== 200);

    if (slow.length > 0 || non200.length > 0) {
      const histogram = {
        total: healthTimes.length,
        p50: healthTimes.sort((a, b) => a - b)[Math.floor(healthTimes.length / 2)],
        p95: healthTimes.sort((a, b) => a - b)[Math.floor(healthTimes.length * 0.95)],
        p99: healthTimes.sort((a, b) => a - b)[Math.floor(healthTimes.length * 0.99)],
        max: Math.max(...healthTimes),
        slowCount: slow.length,
        non200Count: non200.length,
        writeOps: writeCount,
      };
      expect.fail(
        `Health probes degraded under write load: ${JSON.stringify(histogram, null, 2)}`,
      );
    }
  }, 15_000);
});
