import { describe, it, expect, afterEach } from 'vitest';
import { createForgeServer } from '../src/server/index.js';
import { initDatabase, createApp, closeDatabase } from '../src/server/db.js';
import type { ForgeManifest } from '../src/types/index.js';

afterEach(() => {
  closeDatabase();
});

describe('renderAppPage XSS defense', () => {
  it('embeds manifest inside a <script type="application/json"> tag, not an HTML attribute', async () => {
    initDatabase(':memory:');
    const manifest: ForgeManifest = {
      id: 'xss-structural-test',
      meta: { title: 'Safe Title' },
      ui: { kind: 'standalone', children: [] },
    } as any;
    createApp(manifest);
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });
    const res = await app.request('/apps/xss-structural-test');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toMatch(/<script[^>]*type="application\/json"[^>]*id="forge-manifest-data"/);
    expect(html).not.toMatch(/<forge-app[^>]*manifest=['"]/);
  });

  it('escapes </script> sequences inside the manifest JSON payload', async () => {
    initDatabase(':memory:');
    const manifest: ForgeManifest = {
      id: 'script-breakout-test',
      meta: { title: '</script><script>alert(1)</script>' },
      ui: { kind: 'standalone', children: [] },
    } as any;
    createApp(manifest);
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });
    const res = await app.request('/apps/script-breakout-test');
    const html = await res.text();
    expect(html).not.toMatch(/<\/script><script>alert\(1\)<\/script>/);
    expect(html).toContain('\\u003c/script>');
  });

  it('escapeHtml handles single quotes, ampersands, angle brackets, and NULs', async () => {
    initDatabase(':memory:');
    const manifest: ForgeManifest = {
      id: 'escape-title-test',
      meta: { title: "<'&>" + '\x00' + 'end' },
      ui: { kind: 'standalone', children: [] },
    } as any;
    createApp(manifest);
    const { app } = createForgeServer({ baseUrl: 'http://localhost' });
    const res = await app.request('/apps/escape-title-test');
    const html = await res.text();
    expect(html).toContain('&lt;');
    expect(html).toContain('&#39;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&gt;');
    expect(html).not.toContain('\x00');
  });
});
