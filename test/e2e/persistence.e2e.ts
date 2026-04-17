import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import http from 'http';

const counterManifest = {
  manifest: '0.1.0',
  id: 'e2e-persist-test',
  root: 'root',
  state: { count: 0 },
  elements: {
    root: {
      type: 'Stack',
      props: { gap: '16', padding: '24' },
      children: ['counter', 'btn'],
    },
    counter: {
      type: 'Text',
      props: { content: '$state:count', variant: 'heading1' },
    },
    btn: {
      type: 'Button',
      props: { label: 'Increment', action: 'inc', variant: 'primary' },
    },
  },
  actions: {
    inc: { type: 'setState', path: 'count', value: 1 },
  },
};

// ─── Ring 0: Ephemeral (chat surface) ─────────────────────────

test.describe('Ring 0 — ephemeral', () => {
  test('state resets on reload', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto('/test/e2e/harness-chat.html');
    await page.waitForFunction(() => !!document.getElementById('app'));

    await page.evaluate((m) => { (window as any).loadManifest(m); }, counterManifest);
    await page.waitForFunction(() => {
      const app = document.getElementById('app');
      return app?.shadowRoot?.querySelector('forge-text') || app?.querySelector('forge-text');
    }, { timeout: 10000 });

    // Set state to 42 via store directly
    await page.evaluate(() => {
      const app = document.getElementById('app') as any;
      const textEl = app?.shadowRoot?.querySelector('forge-text');
      const store = textEl?.store;
      if (store) store.setValue('count', 42);
    });
    await page.waitForTimeout(500);

    // Verify it was set
    const beforeReload = await page.evaluate(() => {
      const app = document.getElementById('app') as any;
      const textEl = app?.shadowRoot?.querySelector('forge-text');
      return textEl?.store?.getValue?.('count');
    });
    expect(beforeReload).toBe(42);

    // Reload the page
    await page.reload();
    await page.waitForFunction(() => !!document.getElementById('app'));
    await page.evaluate((m) => { (window as any).loadManifest(m); }, counterManifest);
    await page.waitForFunction(() => {
      const app = document.getElementById('app');
      return app?.shadowRoot?.querySelector('forge-text') || app?.querySelector('forge-text');
    }, { timeout: 10000 });

    // State should be back to initial value (0) — ephemeral, no persistence
    const afterReload = await page.evaluate(() => {
      const app = document.getElementById('app') as any;
      const textEl = app?.shadowRoot?.querySelector('forge-text');
      return textEl?.store?.getValue?.('count');
    });
    expect(afterReload).toBe(0);

    expect(consoleErrors).toEqual([]);
  });
});

// ─── Ring 1: IndexedDB (standalone surface) ────────────────────

test.describe('Ring 1 — IndexedDB', () => {
  const dbName = 'forge_e2e-persist-test';

  test('state persists across reload', async ({ page }) => {
    // Clean up any leftover IndexedDB from prior runs
    await page.goto('/test/e2e/harness-indexeddb.html');
    await page.evaluate((name) => {
      return new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(name);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    }, dbName);

    const consoleErrors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto('/test/e2e/harness-indexeddb.html');
    await page.waitForFunction(() => !!document.getElementById('app'));

    // Load manifest — standalone surface auto-persists to IndexedDB
    await page.evaluate((m) => { (window as any).loadManifest(m); }, counterManifest);
    await page.waitForFunction(() => {
      const app = document.getElementById('app');
      return app?.shadowRoot?.querySelector('forge-text') || app?.querySelector('forge-text');
    }, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Verify persister is active
    const persistStatus = await page.evaluate(() => {
      const app = document.getElementById('app') as any;
      return app?.getPersistenceStatus?.();
    });
    expect(persistStatus?.mode).toBe('indexeddb');
    expect(persistStatus?.isPersisting).toBe(true);

    // Set state to 77 via store
    await page.evaluate(() => {
      const app = document.getElementById('app') as any;
      const textEl = app?.shadowRoot?.querySelector('forge-text');
      const store = textEl?.store;
      if (store) store.setValue('count', 77);
    });
    // Wait for IndexedDB write (persister auto-saves on changes)
    await page.waitForTimeout(2000);

    // Reload
    await page.reload();
    await page.waitForFunction(() => !!document.getElementById('app'));
    await page.evaluate((m) => { (window as any).loadManifest(m); }, counterManifest);
    await page.waitForFunction(() => {
      const app = document.getElementById('app');
      return app?.shadowRoot?.querySelector('forge-text') || app?.querySelector('forge-text');
    }, { timeout: 10000 });

    // Wait for IndexedDB load + store hydration + re-render
    await page.waitForTimeout(3000);

    // Rendered text should reflect persisted value (77), not initial (0)
    const renderedText = await page.evaluate(() => {
      const app = document.getElementById('app');
      const textEl = app?.shadowRoot?.querySelector('forge-text');
      return textEl?.shadowRoot?.textContent?.trim() || textEl?.textContent?.trim() || '';
    });
    expect(renderedText).toContain('77');

    // Cleanup IndexedDB
    await page.evaluate((name) => {
      return new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(name);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    }, dbName);

    expect(consoleErrors).toEqual([]);
  });
});

// ─── Ring 2: Server ────────────────────────────────────────────

test.describe('Ring 2 — server', () => {
  function httpFetch(url: string, options: any = {}): Promise<{ status: number; json: () => Promise<any> }> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const req = http.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      }, (res: any) => {
        let body = '';
        res.on('data', (chunk: any) => body += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              json: () => Promise.resolve(JSON.parse(body)),
            });
          } catch {
            resolve({
              status: res.statusCode,
              json: () => Promise.resolve(body),
            });
          }
        });
      });
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  test('API round-trip: create, read, patch, reload', async () => {
    const dbPath = `/tmp/forge-e2e-ring2-${Date.now()}.db`;
    const scriptPath = `/tmp/forge-e2e-server-${Date.now()}.mts`;
    let serverProc: any;

    try {
      const port = 18000 + Math.floor(Math.random() * 1000);

      // Write a small server script to a temp file (avoids tsx -e issues)
      writeFileSync(scriptPath, `
import { createForgeServer } from '${process.cwd()}/src/server/index.ts';
const server = createForgeServer({ port: ${port}, dbPath: '${dbPath}' });
await server.start();
console.log('SERVER_READY');
`);

      serverProc = spawn('npx', ['tsx', scriptPath], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, FORGEUI_RATE_LIMIT_DISABLE: '1' },
      });

      // Wait for server to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Server start timeout')), 20000);
        serverProc.stdout.on('data', (data: any) => {
          if (data.toString().includes('SERVER_READY')) {
            clearTimeout(timeout);
            resolve();
          }
        });
        serverProc.stderr.on('data', (data: any) => {
          const msg = data.toString();
          if (msg.includes('SERVER_READY')) {
            clearTimeout(timeout);
            resolve();
          }
        });
      });

      const base = `http://localhost:${port}`;

      // Create app
      const createRes = await httpFetch(`${base}/api/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(counterManifest),
      });
      expect(createRes.status).toBe(201);
      const created = await createRes.json();
      expect(created.id).toBeTruthy();

      // Read app back
      const getRes = await httpFetch(`${base}/api/apps/${created.id}`);
      expect(getRes.status).toBe(200);
      const fetched = await getRes.json();
      expect(fetched.manifest.state.count).toBe(0);

      // Patch: update state
      const patchRes = await httpFetch(`${base}/api/apps/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify({ state: { count: 42 } }),
      });
      expect(patchRes.status).toBe(200);

      // Read again — state should be updated
      const getRes2 = await httpFetch(`${base}/api/apps/${created.id}`);
      expect(getRes2.status).toBe(200);
      const fetched2 = await getRes2.json();
      expect(fetched2.manifest.state.count).toBe(42);

      // Verify runtime endpoint serves forge.js (dev-mode path resolution)
      const runtimeRes = await httpFetch(`${base}/runtime/forge.js`);
      expect(runtimeRes.status).toBe(200);
      const runtimeBody = await new Promise<string>((resolve) => {
        const parsedUrl = new URL(`${base}/runtime/forge.js`);
        const req = http.request({ hostname: parsedUrl.hostname, port: parsedUrl.port, path: parsedUrl.pathname }, (res) => {
          let body = '';
          res.on('data', (chunk: any) => body += chunk);
          res.on('end', () => resolve(body));
        });
        req.end();
      });
      expect(runtimeBody.length).toBeGreaterThan(1000);
    } finally {
      if (serverProc) {
        serverProc.kill('SIGTERM');
        await new Promise(r => setTimeout(r, 1000));
      }
      if (existsSync(scriptPath)) unlinkSync(scriptPath);
      if (existsSync(dbPath)) unlinkSync(dbPath);
    }
  });
});
