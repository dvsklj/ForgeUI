/**
 * Forge Server — HTTP API + App Hosting
 *
 * Routes:
 *   GET  /                  → Landing page (list of apps or info)
 *   GET  /apps/:id          → Serve a specific app (shareable URL)
 *   GET  /runtime/forge.js  → Serve the Forge runtime bundle
 *
 *   POST /api/apps          → Create a new app
 *   GET  /api/apps          → List all apps
 *   GET  /api/apps/:id      → Get app manifest
 *   PUT  /api/apps/:id      → Update app manifest (full replacement)
 *   PATCH /api/apps/:id     → Apply JSON Merge Patch to manifest
 *   DELETE /api/apps/:id    → Delete an app
 *
 *   GET  /api/health        → Health check
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  initDatabase,
  closeDatabase,
  createApp,
  getApp,
  listApps,
  updateApp,
  patchApp,
  deleteApp,
  generateAppId,
} from './db.js';
import type { ForgeManifest } from '../types/index.js';
import { validateManifest } from '../validation/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ForgeServerOptions {
  /** Port to listen on (default: 3000) */
  port?: number;
  /** Host to bind to (default: '0.0.0.0') */
  host?: string;
  /** Path to the SQLite database file (default: './forge.db') */
  dbPath?: string;
  /** Base URL for shareable links (default: auto-detected) */
  baseUrl?: string;
}

export function createForgeServer(options: ForgeServerOptions = {}) {
  const {
    port = 3000,
    host = '0.0.0.0',
    dbPath = './forge.db',
    baseUrl,
  } = options;

  // Init database
  initDatabase(dbPath);

  const app = new Hono();

  // CORS for API routes
  app.use('/api/*', cors());

  // ─── Static Files ──────────────────────────────────────────

  // Serve the Forge runtime bundle
  // Search multiple possible locations (built dist, packages, or alongside source)
  const possibleRuntimePaths = [
    join(__dirname, 'forge.js'),
    join(__dirname, '..', '..', 'dist', 'forge.js'),
    join(__dirname, '..', '..', 'packages', 'runtime', 'forge.js'),
    join(process.cwd(), 'dist', 'forge.js'),
    join(process.cwd(), 'packages', 'runtime', 'forge.js'),
  ];
  const possibleStandalonePaths = [
    join(__dirname, 'forge-standalone.js'),
    join(__dirname, '..', '..', 'dist', 'forge-standalone.js'),
    join(__dirname, '..', '..', 'packages', 'runtime', 'forge-standalone.js'),
    join(process.cwd(), 'dist', 'forge-standalone.js'),
    join(process.cwd(), 'packages', 'runtime', 'forge-standalone.js'),
  ];

  function findExisting(paths: string[]): string | undefined {
    for (const p of paths) {
      try {
        if (statSync(p).isFile()) return p;
      } catch { /* ignore */ }
    }
    return undefined;
  }

  const runtimePath = findExisting(possibleRuntimePaths) || possibleRuntimePaths[0];
  const standalonePath = findExisting(possibleStandalonePaths) || possibleStandalonePaths[0];

  app.get('/runtime/forge.js', (c) => {
    try {
      const js = readFileSync(runtimePath, 'utf8');
      const stat = statSync(runtimePath);
      const bust = Math.floor(stat.mtimeMs / 1000);
      return c.text(js, 200, {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'ETag': `"${bust}"`,
      });
    } catch {
      return c.text('Runtime not found', 404);
    }
  });

  app.get('/runtime/forge-standalone.js', (c) => {
    try {
      const js = readFileSync(standalonePath, 'utf8');
      return c.text(js, 200, {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600',
      });
    } catch {
      return c.text('Standalone runtime not found', 404);
    }
  });

  // ─── App Pages (Shareable URLs) ────────────────────────────

  // Serve a specific app
  app.get('/apps/:id', (c) => {
    const id = c.req.param('id');
    const stored = getApp(id);

    if (!stored) {
      return c.html(renderErrorPage('App not found', `No app with ID "${id}"`), 404);
    }

    const manifestJson = JSON.stringify(stored.manifest).replace(/</g, '\\u003c').replace(/"/g, '&quot;');
    const base = baseUrl || `${c.req.header('x-forwarded-proto') || 'http'}://${c.req.header('host')}`;
    const bust = Math.floor(statSync(runtimePath).mtimeMs / 1000);

    return c.html(renderAppPage(manifestJson, stored.title, base, bust));
  });

  // Landing page
  app.get('/', (c) => {
    const { apps, total } = listApps(20);
    const base = baseUrl || `${c.req.header('x-forwarded-proto') || 'http'}://${c.req.header('host')}`;

    return c.html(renderLandingPage(apps, total, base));
  });

  // ─── API Routes ────────────────────────────────────────────

  // Health check
  app.get('/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // List apps
  app.get('/api/apps', (c) => {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const result = listApps(limit, offset);
    return c.json(result);
  });

  // Get app manifest
  app.get('/api/apps/:id', (c) => {
    const id = c.req.param('id');
    const app = getApp(id);
    if (!app) {
      return c.json({ error: 'App not found' }, 404);
    }
    return c.json(app);
  });

  // Create app
  app.post('/api/apps', async (c) => {
    try {
      const body = await c.req.json();
      const manifest = body as ForgeManifest;

      if (!manifest.id) {
        manifest.id = generateAppId();
      }

      const stored = createApp(manifest);
      const base = baseUrl || `${c.req.header('x-forwarded-proto') || 'http'}://${c.req.header('host')}`;

      return c.json({
        ...stored,
        url: `${base}/apps/${stored.id}`,
      }, 201);
    } catch (err: any) {
      return c.json({ error: `Invalid manifest: ${err.message}` }, 400);
    }
  });

  // Update app (full replacement)
  app.put('/api/apps/:id', async (c) => {
    const id = c.req.param('id');
    try {
      const body = await c.req.json();
      const manifest = body as ForgeManifest;
      manifest.id = id; // enforce path ID

      const validation = validateManifest(manifest);
      if (!validation.valid) {
        return c.json({ error: 'Validation failed', details: validation.errors }, 400);
      }

      const updated = updateApp(id, manifest);
      if (!updated) {
        return c.json({ error: 'App not found' }, 404);
      }

      const base = baseUrl || `${c.req.header('x-forwarded-proto') || 'http'}://${c.req.header('host')}`;
      return c.json({
        ...updated,
        url: `${base}/apps/${updated.id}`,
      });
    } catch (err: any) {
      return c.json({ error: `Invalid manifest: ${err.message}` }, 400);
    }
  });

  // Patch app (JSON Merge Patch)
  app.patch('/api/apps/:id', async (c) => {
    const id = c.req.param('id');
    try {
      const patch = await c.req.json();
      const updated = patchApp(id, patch);
      if (!updated) {
        return c.json({ error: 'App not found' }, 404);
      }

      const validation = validateManifest(updated);
      if (!validation.valid) {
        return c.json({ error: 'Validation failed after patch', details: validation.errors }, 400);
      }

      const base = baseUrl || `${c.req.header('x-forwarded-proto') || 'http'}://${c.req.header('host')}`;
      return c.json({
        ...updated,
        url: `${base}/apps/${updated.id}`,
      });
    } catch (err: any) {
      return c.json({ error: `Invalid patch: ${err.message}` }, 400);
    }
  });

  // Delete app
  app.delete('/api/apps/:id', (c) => {
    const id = c.req.param('id');
    const deleted = deleteApp(id);
    if (!deleted) {
      return c.json({ error: 'App not found' }, 404);
    }
    return c.json({ deleted: true });
  });

  // ─── Start Server ──────────────────────────────────────────

  let serverHandle: any = null;

  function start(): Promise<void> {
    return new Promise((resolve) => {
      serverHandle = serve({
        fetch: app.fetch,
        port,
        hostname: host,
      }, (info) => {
        console.log(`🔥 Forge Server running at http://${info.address}:${info.port}`);
        resolve();
      });
    });
  }

  function stop(): void {
    if (serverHandle) {
      serverHandle.close();
      closeDatabase();
      serverHandle = null;
    }
  }

  return { app, start, stop };
}

// ─── HTML Templates ──────────────────────────────────────────

function renderAppPage(manifestJson: string, title: string, baseUrl: string, bust = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${escapeHtml(title)} — Forge</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html { height: 100%; }
    html, body { margin: 0; padding: 0; }
    body {
      min-height: 100%;
      min-height: 100dvh;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      background: #f9fafb;
      display: flex;
      flex-direction: column;
      color: #1f2937;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    forge-app {
      flex: 1;
      display: block;
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <forge-app manifest="${manifestJson}" surface="standalone"></forge-app>
  <script type="module" src="${baseUrl}/runtime/forge.js?v=${bust}"></script>
</body>
</html>`;
}

function renderLandingPage(apps: any[], total: number, baseUrl: string): string {
  const appList = apps.map(a => `
    <a href="/apps/${escapeHtml(a.id)}" class="app-card">
      <h3>${escapeHtml(a.title)}</h3>
      <code>${escapeHtml(a.id)}</code>
      <span class="updated">${new Date(a.updated_at).toLocaleDateString()}</span>
    </a>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forge Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .subtitle { color: #888; margin-bottom: 2rem; }
    .apps { display: grid; gap: 1rem; }
    .app-card { display: block; padding: 1rem 1.25rem; background: #141414; border: 1px solid #222; border-radius: 8px; text-decoration: none; color: inherit; transition: border-color 0.15s; }
    .app-card:hover { border-color: #444; }
    .app-card h3 { font-size: 1rem; margin-bottom: 0.25rem; }
    .app-card code { font-size: 0.75rem; color: #666; }
    .app-card .updated { float: right; font-size: 0.75rem; color: #555; }
    .empty { color: #555; font-style: italic; padding: 2rem; text-align: center; }
  </style>
</head>
<body>
  <h1>🔥 Forge Server</h1>
  <p class="subtitle">${total} app${total === 1 ? '' : 's'} hosted</p>
  <div class="apps">
    ${apps.length === 0 ? '<div class="empty">No apps yet. Create one via the API.</div>' : appList}
  </div>
</body>
</html>`;
}

function renderErrorPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0a;color:#e0e0e0;text-align:center;padding:2rem}h1{font-size:1.5rem;margin-bottom:0.5rem}p{color:#888}</style>
</head><body><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></div></body></html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
