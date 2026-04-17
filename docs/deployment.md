# Deployment Guide

## Local Development

```bash
npm install @nedast/forgeui-server
npx forgeui-server --port 3000 --db ./apps.db
```

Or if `@nedast/forgeui-server` is installed globally:

```bash
forgeui-server --port 3000 --db ./apps.db
```

App at `http://localhost:3000/apps/<id>`, API at `http://localhost:3000/api/apps`.

CLI flags: `--port` (default 3000), `--host` (default 0.0.0.0), `--db` (default ./forgeui.db).

## Docker

```dockerfile
FROM node:20-slim
WORKDIR /app
RUN npm install -g @nedast/forgeui-server
EXPOSE 3000
CMD ["forgeui-server", "--port", "3000", "--db", "/data/apps.db"]
```

```bash
docker build -t forgeui-server .
docker run -p 3000:3000 -v forgeui-data:/data forgeui-server
```

## Systemd Service

```ini
# /etc/systemd/system/forgeui-server.service
[Unit]
Description=Forge App Server
After=network.target

[Service]
Type=simple
User=forgeui
WorkingDirectory=/opt/forgeui
ExecStart=/usr/bin/npx forgeui-server --port 3000 --db /opt/forge/apps.db
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now forgeui-server
```

## Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name forge.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Set `FORGEUI_TRUST_PROXY=1` so the server honors `X-Forwarded-For` / `X-Real-IP` headers from nginx.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FORGEUI_CORS_ORIGINS` | `http://localhost, http://127.0.0.1` | Comma-separated CORS origin allowlist. Set to `*` to allow all origins. |
| `FORGEUI_MAX_BODY_BYTES` | `1048576` (1 MB) | Max request body size in bytes. Enforced at Content-Length precheck and streaming. |
| `FORGEUI_TRUST_PROXY` | *(unset)* | Set to `1`, `true`, or `yes` to honor `X-Forwarded-For` / `X-Real-IP` headers. Required when behind a reverse proxy. |
| `FORGEUI_RATE_LIMIT_RPM` | `60` | Per-IP requests per minute on `/api/*`. |
| `FORGEUI_RATE_LIMIT_BURST` | `RPM × 2` | Token-bucket burst size. |
| `FORGEUI_RATE_LIMIT_DISABLE` | *(unset)* | Set to `1` to disable rate limiting entirely. |
| `FORGEUI_API_TOKEN` | *(unset)* | Bearer token for `/api/apps/*` write operations (POST, PUT, PATCH, DELETE). **Required in production** — if `NODE_ENV=production` and this is unset, the server logs a warning and rejects all writes with 401. |
| `FORGEUI_RUNTIME_PATH` | *(auto)* | Override path for `/runtime/forgeui.js`. By default the server resolves from its own location or walks up to `dist/forgeui.js`. |
| `FORGEUI_STANDALONE_PATH` | *(auto)* | Override path for `/runtime/forgeui-standalone.js`. |
| `NODE_ENV` | *(unset)* | When set to `production`, enforces `FORGEUI_API_TOKEN`. |

Port, host, and database path are set via CLI flags (`--port`, `--host`, `--db`), not environment variables.

## Scaling Considerations

**Single-instance** (SQLite): Good for < 1000 apps, single server. SQLite handles concurrent reads well; writes are serialized but fast.

**Multi-instance**: For horizontal scaling, swap SQLite for PostgreSQL and use the `@nedast/forgeui-server` with a custom `db` adapter. The API surface is small (6 CRUD operations) so the swap is straightforward.

**CDN for runtime**: Serve `forgeui.js` from a CDN (Cloudflare, Fastly). The runtime is static and cacheable:

```
Cache-Control: public, max-age=3600
```

**App serving**: Each app page is `~315KB` (runtime) + `~5KB` (manifest). For high-traffic apps, consider:
- Pre-rendering to static HTML + JSON
- Lazy-loading the runtime bundle
- Service worker caching for offline support

## Embedding in Existing Apps

### Inline (no server needed)

```html
<!-- Drop this anywhere -->
<forgeui-app id="my-widget"></forgeui-app>
<script type="module" src="https://cdn.example.com/forgeui.js"></script>
<script>
  document.getElementById('my-widget').manifest = { /* your manifest */ };
</script>
```

### iframe

```html
<iframe src="https://forge.example.com/apps/abc12345" 
        width="100%" height="600" 
        style="border: none; border-radius: 8px;">
</iframe>
```

### LLM Chat Artifact

The runtime detects its embedding context:
- **Standalone page** → full viewport layout
- **iframe** → constrained to iframe dimensions
- **Chat artifact** → compact, responsive layout

No configuration needed — the `<forgeui-app>` custom element adapts automatically.

## Monitoring

Health endpoint: `GET /api/health`

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"2026-04-15T17:00:00.000Z"}
```

Prometheus-compatible metrics can be added via middleware or a `/metrics` endpoint.
