import { describe, it, expect, afterEach } from 'vitest';
import { createForgeServer } from '../src/server/index.js';
import { initDatabase, createApp, closeDatabase } from '../src/server/db.js';

afterEach(() => closeDatabase());

describe('CSP on rendered app page', () => {
  function seed() {
    initDatabase(':memory:');
    createApp({
      id: 'csp-test',
      manifest: '0.1.0',
      root: 'main',
      elements: { main: { type: 'Text', props: { content: 'hi' } } },
      meta: { title: 'CSP' },
    } as any);
    return createForgeServer({ baseUrl: 'http://localhost' });
  }

  it('sets a Content-Security-Policy header on /apps/:id', async () => {
    const { app } = seed();
    const res = await app.request('/apps/csp-test');
    expect(res.status).toBe(200);
    const csp = res.headers.get('Content-Security-Policy');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/);
    expect(csp).toContain("object-src 'none'");
  });

  it('embeds the same nonce in the bootstrap script tag', async () => {
    const { app } = seed();
    const res = await app.request('/apps/csp-test');
    const html = await res.text();
    const csp = res.headers.get('Content-Security-Policy')!;
    const nonceMatch = csp.match(/nonce-([A-Za-z0-9+/=]+)/);
    expect(nonceMatch).toBeTruthy();
    const nonce = nonceMatch![1];
    expect(html).toMatch(new RegExp(`<script nonce="${nonce.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  });

  it('uses a fresh nonce per request', async () => {
    const { app } = seed();
    const r1 = await app.request('/apps/csp-test');
    const r2 = await app.request('/apps/csp-test');
    expect(r1.headers.get('Content-Security-Policy'))
      .not.toEqual(r2.headers.get('Content-Security-Policy'));
  });

  it('bootstrap script wraps JSON.parse in try/catch', async () => {
    const { app } = seed();
    const res = await app.request('/apps/csp-test');
    const html = await res.text();
    expect(html).toMatch(/try\s*\{[\s\S]*JSON\.parse/);
    expect(html).toMatch(/catch[\s\S]*Manifest could not be loaded/);
  });
});
