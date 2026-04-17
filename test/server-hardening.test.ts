import { describe, it, expect, afterEach } from 'vitest';
import { createForgeServer } from '../src/server/index.js';
import { initDatabase, createApp, getApp, closeDatabase } from '../src/server/db.js';
import type { ForgeManifest } from '../src/types/index.js';

const savedEnv = { ...process.env };

afterEach(() => {
  process.env = { ...savedEnv };
  closeDatabase();
});

// ─── helpers ─────────────────────────────────────────────────

function seedApp(overrides?: Partial<ForgeManifest>) {
  initDatabase(':memory:');
  return createApp({
    id: 'harden-test',
    manifest: '0.1.0',
    root: 'main',
    elements: {
      main: { type: 'Text', props: { content: 'Hello' } },
    },
    meta: { title: 'Original' },
    ...overrides,
  } as any);
}

// ─── (a) Transactional patch ────────────────────────────────

describe('Transactional patch', () => {
  it('PATCH producing schema-invalid merge returns 400 and DB row is unchanged', async () => {
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const before = getApp('harden-test')!;
    const beforeManifest = JSON.stringify(before.manifest);

    // Removing root makes the merged manifest invalid (root is required by schema)
    const res = await app.request('/api/apps/harden-test', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ root: null }),
    });

    expect(res.status).toBe(400);
    const after = getApp('harden-test')!;
    expect(JSON.stringify(after.manifest)).toBe(beforeManifest);
  });

  it('PATCH with valid merge succeeds and DB row is the merged state', async () => {
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps/harden-test', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ meta: { title: 'Patched' } }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.manifest.meta.title).toBe('Patched');

    const stored = getApp('harden-test')!;
    expect(stored.manifest.meta?.title).toBe('Patched');
  });
});

// ─── (b) CORS allowlist ─────────────────────────────────────

describe('CORS allowlist', () => {
  it('default: OPTIONS from http://localhost:5173 reflects origin', async () => {
    delete process.env.FORGEUI_CORS_ORIGINS;
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps', {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'POST',
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
  });

  it('default: OPTIONS from http://evil.example.com has no ACAO header', async () => {
    delete process.env.FORGEUI_CORS_ORIGINS;
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps', {
      method: 'OPTIONS',
      headers: {
        origin: 'http://evil.example.com',
        'access-control-request-method': 'POST',
      },
    });

    // Hono still returns 204 but without ACAO — browser rejects.
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('explicit allowlist: custom origin allowed, localhost rejected', async () => {
    process.env.FORGEUI_CORS_ORIGINS = 'https://forge.example.com';
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const allowed = await app.request('/api/apps', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://forge.example.com',
        'access-control-request-method': 'POST',
      },
    });
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get('access-control-allow-origin')).toBe('https://forge.example.com');

    const blocked = await app.request('/api/apps', {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'POST',
      },
    });
    expect(blocked.status).toBe(204);
    expect(blocked.headers.get('access-control-allow-origin')).toBeNull();
  });
});

// ─── (c) Body size limit ────────────────────────────────────

describe('Body size limit', () => {
  it('POST with Content-Length > default 1 MB returns 413', async () => {
    delete process.env.FORGEUI_MAX_BODY_BYTES;
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '2097152', // 2 MB
      },
      body: '{}',
    });

    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toMatch(/too large/i);
  });

  it('custom limit: FORGEUI_MAX_BODY_BYTES=2048 rejects 4 KB body', async () => {
    process.env.FORGEUI_MAX_BODY_BYTES = '2048';
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '4096',
      },
      body: '{}',
    });

    expect(res.status).toBe(413);
  });
});

// ─── (d) Query param clamping ───────────────────────────────

describe('Query param clamping', () => {
  it('limit=999999 returns at most 100 rows without error', async () => {
    seedApp();
    createApp({
      id: 'harden-second',
      manifest: '0.1.0',
      root: 'main',
      elements: { main: { type: 'Text', props: { content: 'Hi' } } },
      meta: { title: 'Second' },
    } as any);
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps?limit=999999');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apps.length).toBeLessThanOrEqual(100);
  });

  it('limit=-5&offset=-5 does not error; limit clamps to 1, offset to 0', async () => {
    seedApp();
    createApp({
      id: 'harden-second',
      manifest: '0.1.0',
      root: 'main',
      elements: { main: { type: 'Text', props: { content: 'Hi' } } },
      meta: { title: 'Second' },
    } as any);
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps?limit=-5&offset=-5');
    expect(res.status).toBe(200);
    const body = await res.json();
    // limit should clamp to 1, offset to 0
    expect(body.apps.length).toBeLessThanOrEqual(1);
  });
});

// ─── (e) API token auth ─────────────────────────────────────

describe('API token auth', () => {
  it('unset: POST /api/apps without Authorization succeeds', async () => {
    delete process.env.FORGEUI_API_TOKEN;
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'new-app',
        manifest: '0.1.0',
        root: 'main',
        elements: { main: { type: 'Text', props: { content: 'Hi' } } },
      }),
    });

    expect(res.status).toBe(201);
  });

  it('token set: POST without Authorization returns 401', async () => {
    process.env.FORGEUI_API_TOKEN = 'abc123';
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'new-app',
        manifest: '0.1.0',
        root: 'main',
        elements: { main: { type: 'Text', props: { content: 'Hi' } } },
      }),
    });

    expect(res.status).toBe(401);
  });

  it('token set: POST with Bearer token succeeds', async () => {
    process.env.FORGEUI_API_TOKEN = 'abc123';
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer abc123',
      },
      body: JSON.stringify({
        id: 'new-app',
        manifest: '0.1.0',
        root: 'main',
        elements: { main: { type: 'Text', props: { content: 'Hi' } } },
      }),
    });

    expect(res.status).toBe(201);
  });

  it('token set: GET /api/apps (read) is allowed without auth', async () => {
    process.env.FORGEUI_API_TOKEN = 'abc123';
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps');
    expect(res.status).toBe(200);
  });
});

// ─── (f) Security headers ───────────────────────────────────

describe('Security headers', () => {
  it('GET /api/apps has X-Content-Type-Options and X-Frame-Options', async () => {
    seedApp();
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });

    const res = await app.request('/api/apps');
    expect(res.status).toBe(200);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('referrer-policy')).toBe('no-referrer');
  });
});
