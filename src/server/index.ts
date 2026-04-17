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
import { readFileSync } from 'fs';
import { randomBytes } from 'node:crypto';
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
import { validateManifest, validateManifestPatch } from '../validation/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VALID_APP_ID = /^[a-z0-9][a-z0-9\-_]{0,127}$/;

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

  // ─── CORS allowlist ────────────────────────────────────────
  const corsOriginsEnv = process.env.FORGE_CORS_ORIGINS?.trim();
  const corsOrigins: string[] = corsOriginsEnv
    ? corsOriginsEnv === '*'
      ? ['*']
      : corsOriginsEnv.split(',').map((s) => s.trim()).filter(Boolean)
    : ['http://localhost', 'http://127.0.0.1'];

  app.use('*', cors({
    origin: (origin) => {
      if (!origin) return null;
      if (corsOrigins.includes('*')) return origin;
      for (const allowed of corsOrigins) {
        if (origin === allowed) return origin;
        if (allowed === 'http://localhost' && /^http:\/\/localhost(:\d+)?$/.test(origin)) return origin;
        if (allowed === 'http://127.0.0.1' && /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return origin;
      }
      return null;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }));

  // ─── Body size limit ───────────────────────────────────────
  const maxBodyBytes = parseInt(process.env.FORGE_MAX_BODY_BYTES ?? '1048576', 10);

  app.use('*', async (c, next) => {
    const method = c.req.method;
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
    const lenHeader = c.req.header('content-length');
    if (lenHeader !== undefined) {
      const len = parseInt(lenHeader, 10);
      if (!Number.isFinite(len) || len < 0) {
        return c.json({ error: 'Invalid Content-Length' }, 400);
      }
      if (len > maxBodyBytes) {
        return c.json({ error: 'Request body too large', limit: maxBodyBytes }, 413);
      }
    }
    return next();
  });

  // ─── Optional API token auth ───────────────────────────────
  const apiToken = process.env.FORGE_API_TOKEN?.trim() || undefined;

  if (apiToken) {
    app.use('/api/*', async (c, next) => {
      const method = c.req.method;
      if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
      const auth = c.req.header('authorization') ?? '';
      const expected = `Bearer ${apiToken}`;
      if (auth.length !== expected.length) return c.json({ error: 'unauthorized' }, 401);
      let diff = 0;
      for (let i = 0; i < auth.length; i++) diff |= auth.charCodeAt(i) ^ expected.charCodeAt(i);
      if (diff !== 0) return c.json({ error: 'unauthorized' }, 401);
      return next();
    });
  }

  if (!apiToken && process.env.NODE_ENV === 'production') {
    console.warn('[forge-server] FORGE_API_TOKEN is not set; /api/apps/* writes are unauthenticated.');
  }

  // ─── Security response headers ─────────────────────────────
  app.use('/api/*', async (c, next) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Referrer-Policy', 'no-referrer');
  });

  // ─── Static Files ──────────────────────────────────────────

  // Serve the Forge runtime bundle
  const runtimePath = join(__dirname, 'forge.js');
  const standalonePath = join(__dirname, 'forge-standalone.js');

  app.get('/runtime/forge.js', (c) => {
    try {
      const js = readFileSync(runtimePath, 'utf8');
      return c.text(js, 200, {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600',
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
    if (!VALID_APP_ID.test(id)) {
      return c.html(renderErrorPage('Invalid app ID', 'The requested app ID contains invalid characters'), 400);
    }
    const stored = getApp(id);

    if (!stored) {
      return c.html(renderErrorPage('App not found', `No app with ID "${id}"`), 404);
    }

    const manifestJson = JSON.stringify(stored.manifest).replace(/</g, '\\u003c');
    const base = baseUrl || `${c.req.header('x-forwarded-proto') || 'http'}://${c.req.header('host')}`;

    const nonce = randomBytes(16).toString('base64');
    const csp = [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}'`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src * data: blob:`,
      `connect-src 'self'`,
      `object-src 'none'`,
      `base-uri 'self'`,
    ].join('; ');
    c.header('Content-Security-Policy', csp);

    return c.html(renderAppPage(manifestJson, stored.title, base, nonce));
  });

  // Landing page
  app.get('/', (c) => {
    const { apps, total } = listApps(20);

    const csp = [
      `default-src 'self'`,
      `script-src 'self'`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src * data: blob:`,
      `connect-src 'self'`,
      `object-src 'none'`,
      `base-uri 'self'`,
    ].join('; ');
    c.header('Content-Security-Policy', csp);

    return c.html(renderLandingPage(apps, total));
  });

  // ─── API Routes ────────────────────────────────────────────

  // Health check
  app.get('/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // List apps
  app.get('/api/apps', (c) => {
    const rawLimit = parseInt(c.req.query('limit') ?? '20', 10);
    const rawOffset = parseInt(c.req.query('offset') ?? '0', 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;
    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
    const result = listApps(limit, offset);
    return c.json(result);
  });

  // Get app manifest
  app.get('/api/apps/:id', (c) => {
    const id = c.req.param('id');
    if (!VALID_APP_ID.test(id)) {
      return c.json({ error: 'invalid id' }, 400);
    }
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
      } else if (!VALID_APP_ID.test(manifest.id)) {
        return c.json({ error: 'invalid id' }, 400);
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
    if (!VALID_APP_ID.test(id)) {
      return c.json({ error: 'invalid id' }, 400);
    }
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
    if (!VALID_APP_ID.test(id)) {
      return c.json({ error: 'invalid id' }, 400);
    }
    try {
      const patch = await c.req.json();

      const patchValidation = validateManifestPatch(patch);
      if (!patchValidation.valid) {
        return c.json({ error: 'Invalid patch', details: patchValidation.errors }, 400);
      }

      const result = patchApp(id, patch, (m) => {
        const v = validateManifest(m);
        return { valid: v.valid, errors: v.errors.map((e) => e.message) };
      });
      if (result.status === 'not-found') return c.json({ error: 'App not found' }, 404);
      if (result.status === 'invalid') {
        return c.json({ error: 'Validation failed after patch', details: result.errors }, 400);
      }

      const base = baseUrl || `${c.req.header('x-forwarded-proto') || 'http'}://${c.req.header('host')}`;
      return c.json({ ...result.app, url: `${base}/apps/${result.app.id}` });
    } catch (err: any) {
      return c.json({ error: `Invalid patch: ${err.message}` }, 400);
    }
  });

  // Delete app
  app.delete('/api/apps/:id', (c) => {
    const id = c.req.param('id');
    if (!VALID_APP_ID.test(id)) {
      return c.json({ error: 'invalid id' }, 400);
    }
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

function renderAppPage(manifestJson: string, title: string, baseUrl: string, nonce: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — Forge</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: system-ui, -apple-system, sans-serif; }
    body { display: flex; flex-direction: column; }
    forge-app { flex: 1; display: block; }
  </style>
</head>
<body>
  <script type="application/json" id="forge-manifest-data">${manifestJson}</script>
  <forge-app id="forge-app" surface="standalone"></forge-app>
  <script nonce="${nonce}">
    (function () {
      try {
        var raw = document.getElementById('forge-manifest-data').textContent;
        var parsed = JSON.parse(raw);
        document.getElementById('forge-app').manifest = parsed;
      } catch (err) {
        var app = document.getElementById('forge-app');
        app.style.display = 'flex';
        app.style.alignItems = 'center';
        app.style.justifyContent = 'center';
        app.style.minHeight = '100vh';
        app.style.color = '#e0e0e0';
        app.style.background = '#0a0a0a';
        app.style.fontFamily = 'system-ui, sans-serif';
        app.textContent = 'Manifest could not be loaded. Check the server logs.';
        if (window.console) console.error('[forge] Manifest parse failed:', err);
      }
    })();
  </script>
  <script type="module" src="${baseUrl}/runtime/forge.js"></script>
</body>
</html>`;
}

function renderLandingPage(apps: any[], total: number): string {
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
  return str
    .replace(/\x00/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
