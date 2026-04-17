import { describe, it, expect, afterEach } from 'vitest';
import { createForgeServer } from '../src/server/index.js';
import { initDatabase, createApp, closeDatabase } from '../src/server/db.js';

afterEach(() => {
  closeDatabase();
});

const badIds = [
  '../etc-passwd',
  'ABC',
  '-leading-dash',
  'has space',
  'a'.repeat(129),
  '!@#$',
  'has/slash',
  'has\\backslash',
];

const goodId = 'ok-app-1';

describe('VALID_APP_ID gate on all 6 endpoints', () => {
  function makeApp() {
    initDatabase(':memory:');
    createApp({
      id: goodId,
      meta: { title: 'OK' },
      ui: { kind: 'standalone', children: [] },
    } as any);
    return createForgeServer({ baseUrl: 'http://localhost' });
  }

  it.each(badIds)('GET /apps/:id rejects bad id %s', async (id) => {
    const { app } = makeApp();
    const res = await app.request(`/apps/${encodeURIComponent(id)}`);
    expect([400, 404]).toContain(res.status);
  });

  it.each(badIds)('GET /api/apps/:id rejects bad id %s', async (id) => {
    const { app } = makeApp();
    const res = await app.request(`/api/apps/${encodeURIComponent(id)}`);
    expect([400, 404]).toContain(res.status);
  });

  it.each(badIds)('PUT /api/apps/:id rejects bad id %s', async (id) => {
    const { app } = makeApp();
    const res = await app.request(`/api/apps/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: goodId, meta: { title: 't' }, ui: { kind: 'standalone', children: [] } }),
    });
    expect([400, 404]).toContain(res.status);
  });

  it.each(badIds)('PATCH /api/apps/:id rejects bad id %s', async (id) => {
    const { app } = makeApp();
    const res = await app.request(`/api/apps/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ meta: { title: 'x' } }),
    });
    expect([400, 404]).toContain(res.status);
  });

  it.each(badIds)('DELETE /api/apps/:id rejects bad id %s', async (id) => {
    const { app } = makeApp();
    const res = await app.request(`/api/apps/${encodeURIComponent(id)}`, { method: 'DELETE' });
    expect([400, 404]).toContain(res.status);
  });

  it('POST /api/apps rejects body with bad id', async () => {
    const { app } = makeApp();
    for (const id of badIds) {
      const res = await app.request('/api/apps', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, meta: { title: 't' }, ui: { kind: 'standalone', children: [] } }),
      });
      expect([400, 422]).toContain(res.status);
    }
  });

  it('accepts the valid id across all endpoints', async () => {
    const { app } = makeApp();
    const getRes = await app.request(`/api/apps/${goodId}`);
    expect(getRes.status).toBe(200);
  });
});
