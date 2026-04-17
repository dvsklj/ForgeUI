import { describe, it, expect, afterEach } from 'vitest';
import { createForgeServer } from '../src/server/index.js';
import { initDatabase, createApp, closeDatabase } from '../src/server/db.js';

const savedEnv = { ...process.env };

afterEach(() => {
  process.env = { ...savedEnv };
  closeDatabase();
});

describe('Server API — Full CRUD', () => {
  function setup() {
    initDatabase(':memory:');
    return createForgeServer({ baseUrl: 'http://localhost' });
  }

  it('GET /api/health returns ok', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    const { app } = setup();
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  it('POST /api/apps creates a new app', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    const { app } = setup();
    const res = await app.request('/api/apps', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'new-app',
        manifest: '0.1.0',
        root: 'main',
        elements: { main: { type: 'Text', props: { content: 'Hello' } } },
        meta: { title: 'New App' },
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('new-app');
    expect(body.url).toContain('/apps/new-app');
  });

  it('POST /api/apps generates ID when omitted', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    const { app } = setup();
    const res = await app.request('/api/apps', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        manifest: '0.1.0',
        root: 'main',
        elements: { main: { type: 'Text' } },
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();
  });

  it('GET /api/apps lists apps', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    const { app } = setup();
    createApp({ id: 'list-1', manifest: '0.1.0', root: 'm', elements: { m: { type: 'Text' } } } as any);
    const res = await app.request('/api/apps');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apps.length).toBeGreaterThanOrEqual(1);
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/apps/:id retrieves a specific app', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    const { app } = setup();
    createApp({ id: 'get-app', manifest: '0.1.0', root: 'm', elements: { m: { type: 'Text' } } } as any);
    const res = await app.request('/api/apps/get-app');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('get-app');
  });

  it('GET /api/apps/:id returns 404 for unknown app', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    const { app } = setup();
    const res = await app.request('/api/apps/nonexistent');
    expect(res.status).toBe(404);
  });

  it('PUT /api/apps/:id updates an app', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    const { app } = setup();
    createApp({ id: 'put-app', manifest: '0.1.0', root: 'm', elements: { m: { type: 'Text' } }, meta: { title: 'Old' } } as any);
    const res = await app.request('/api/apps/put-app', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'put-app',
        manifest: '0.1.0',
        root: 'm',
        elements: { m: { type: 'Text' } },
        meta: { title: 'New Title' },
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.manifest.meta.title).toBe('New Title');
  });

  it('PUT /api/apps/:id validates manifest', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    const { app } = setup();
    createApp({ id: 'put-invalid', manifest: '0.1.0', root: 'm', elements: { m: { type: 'Text' } } } as any);
    const res = await app.request('/api/apps/put-invalid', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'put-invalid',
        manifest: '99.0.0',
        root: 'm',
        elements: { m: { type: 'FakeComponent' } },
      }),
    });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/apps/:id deletes an app', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    const { app } = setup();
    createApp({ id: 'del-app', manifest: '0.1.0', root: 'm', elements: { m: { type: 'Text' } } } as any);
    const res = await app.request('/api/apps/del-app', { method: 'DELETE' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it('DELETE /api/apps/:id returns 404 for unknown app', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    const { app } = setup();
    const res = await app.request('/api/apps/nonexistent', { method: 'DELETE' });
    expect(res.status).toBe(404);
  });
});

describe('Server API — App pages', () => {
  it('GET /apps/:id returns HTML for valid app', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');
    createApp({ id: 'page-app', manifest: '0.1.0', root: 'm', elements: { m: { type: 'Text' } }, meta: { title: 'My Page' } } as any);
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });
    const res = await app.request('/apps/page-app');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('My Page');
    expect(html).toContain('forge-app');
    expect(html).toContain('Content-Security-Policy');
  });

  it('GET /apps/:id returns 404 for unknown app', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });
    const res = await app.request('/apps/nonexistent');
    expect(res.status).toBe(404);
  });

  it('GET / returns landing page', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Forge Server');
  });
});

describe('Server API — Invalid input handling', () => {
  it('POST /api/apps with invalid JSON returns 400', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });
    const res = await app.request('/api/apps', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/apps with empty body returns 400', async () => {
    process.env.FORGE_RATE_LIMIT_DISABLE = '1';
    initDatabase(':memory:');
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });
    const res = await app.request('/api/apps', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '',
    });
    expect(res.status).toBe(400);
  });
});