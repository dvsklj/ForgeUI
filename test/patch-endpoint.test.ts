import { describe, it, expect, afterEach } from 'vitest';
import { createForgeServer } from '../src/server/index.js';
import { initDatabase, createApp, closeDatabase } from '../src/server/db.js';

afterEach(() => {
  closeDatabase();
});

describe('PATCH /api/apps/:id — integration', () => {
  function makeApp() {
    initDatabase(':memory:');
    createApp({
      id: 'patch-target',
      manifest: '0.1.0',
      root: 'main',
      elements: {
        main: { type: 'Text', props: { content: 'Hello' } },
      },
      meta: { title: 'Original' },
    } as any);
    return createForgeServer({ baseUrl: 'http://localhost' });
  }

  it('applies a clean patch successfully', async () => {
    const { app } = makeApp();
    const res = await app.request('/api/apps/patch-target', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ meta: { title: 'Updated' } }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.manifest.meta.title).toBe('Updated');
  });

  it('rejects __proto__ patch with 400 before any merge happens', async () => {
    const { app } = makeApp();
    const res = await app.request('/api/apps/patch-target', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: '{"__proto__":{"polluted":true}}',
    });
    expect(res.status).toBe(400);
    expect(({} as any).polluted).toBeUndefined();
  });

  it('rejects oversized patch with 400', async () => {
    const { app } = makeApp();
    const res = await app.request('/api/apps/patch-target', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ blob: 'x'.repeat(150_000) }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown id (after VALID_APP_ID passes)', async () => {
    const { app } = makeApp();
    const res = await app.request('/api/apps/does-not-exist', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ meta: { title: 'x' } }),
    });
    expect(res.status).toBe(404);
  });
});
