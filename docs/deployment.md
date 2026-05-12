# Deployment Guide

## Local development

```bash
npm install @nedast/forgeui-server
npx forgeui-server --port 3000 --db ./apps.db
```

Or, if `@nedast/forgeui-server` is installed globally:

```bash
forgeui-server --port 3000 --db ./apps.db
```

You can also use the broader CLI wrapper:

```bash
forgeui serve --port 3000 --db ./apps.db
```

Apps are served at `http://localhost:3000/apps/<id>`. The REST API is served under `http://localhost:3000/api/*`.

CLI flags: `--port` (default `3000`), `--host` (default `0.0.0.0`), `--db` (default `./forgeui.db`).

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

For public deployments, set `FORGEUI_API_TOKEN` and pass it to write requests as `Authorization: Bearer <token>`.

## Systemd service

```ini
# /etc/systemd/system/forgeui-server.service
[Unit]
Description=Forge App Server
After=network.target

[Service]
Type=simple
User=forgeui
WorkingDirectory=/opt/forgeui
Environment=NODE_ENV=production
Environment=FORGEUI_API_TOKEN=replace-with-a-long-random-token
Environment=FORGEUI_TRUST_PROXY=1
ExecStart=/usr/bin/npx forgeui-server --port 3000 --db /opt/forge/apps.db
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now forgeui-server
```

## Reverse proxy with nginx

```nginx
server {
    listen 80;
    server_name forge.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Set `FORGEUI_TRUST_PROXY=1` so the server honors `X-Forwarded-For` / `X-Real-IP` headers from nginx for rate limiting.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FORGEUI_CORS_ORIGINS` | `http://localhost,http://127.0.0.1` | Comma-separated CORS origin allowlist. Set to `*` to reflect any request origin. Localhost and 127.0.0.1 allow any port by default. |
| `FORGEUI_MAX_BODY_BYTES` | `1048576` | Max request body size in bytes. Enforced through a `Content-Length` precheck and bounded JSON reader. |
| `FORGEUI_TRUST_PROXY` | unset | Set to `1`, `true`, or `yes` to honor `X-Forwarded-For` / `X-Real-IP` headers. Use this behind a trusted reverse proxy. |
| `FORGEUI_RATE_LIMIT_RPM` | `60` | Per-IP request refill rate for `/api/*`. |
| `FORGEUI_RATE_LIMIT_BURST` | `RPM × 2` | Token-bucket burst size for `/api/*`. |
| `FORGEUI_RATE_LIMIT_DISABLE` | unset | Set to `1` to disable rate limiting. |
| `FORGEUI_API_TOKEN` | unset | Optional Bearer token for write requests on `/api/*` (`POST`, `PUT`, `PATCH`, `DELETE`). When unset, writes are allowed. If `NODE_ENV=production` and this is unset, the server logs a warning but does not reject writes. |
| `FORGEUI_RUNTIME_PATH` | auto | Override path for `/runtime/forgeui.js`. By default the server resolves from its own location or walks up to `dist/forgeui.js`. |
| `FORGEUI_STANDALONE_PATH` | auto | Override path for `/runtime/forgeui-standalone.js`. |
| `NODE_ENV` | unset | Only affects warnings today; production mode warns when `FORGEUI_API_TOKEN` is missing. |

Port, host, and database path are set via CLI flags (`--port`, `--host`, `--db`), not environment variables.

## Authenticated write requests

When `FORGEUI_API_TOKEN` is set, all write methods under `/api/*` require:

```http
Authorization: Bearer <token>
```

Example:

```bash
curl -X POST http://localhost:3000/api/apps \
  -H "Authorization: Bearer $FORGEUI_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @my-app.json
```

Read requests (`GET`, `HEAD`, `OPTIONS`) remain public.

## Runtime assets

The server exposes built runtime bundles at:

```txt
/runtime/forgeui.js
/runtime/forgeui-standalone.js
```

Both use:

```txt
Cache-Control: public, max-age=3600
```

You can override the resolved bundle paths with `FORGEUI_RUNTIME_PATH` and `FORGEUI_STANDALONE_PATH`.

## Scaling considerations

**Single-instance SQLite:** Good for personal and small-team deployments. SQLite handles concurrent reads well; writes are serialized.

**Multiple instances:** The current server package is built around a module-level `better-sqlite3` connection. For horizontal scaling, run a single writer instance or replace the database layer with a shared store before deploying multiple write-capable instances.

**CDN for runtime:** The runtime bundles are static and cacheable. For high-traffic app pages, consider serving the runtime from a CDN and keeping manifests/app pages on the Forge server.

## Embedding in existing apps

### Inline, no server required

```html
<forgeui-app id="my-widget" surface="embed"></forgeui-app>
<script type="module" src="https://cdn.example.com/forgeui.js"></script>
<script>
  document.getElementById('my-widget').manifest = { /* your manifest */ };
</script>
```

### iframe

```html
<iframe src="https://forge.example.com/apps/abc12345"
        width="100%"
        height="600"
        style="border: none; border-radius: 8px;">
</iframe>
```

### Surface modes

`<forgeui-app>` accepts:

- `surface="standalone"`
- `surface="embed"`
- `surface="chat"`

Persistence defaults depend on the surface: `standalone` and `embed` use IndexedDB unless disabled; `chat` is in-memory unless `persistState: true` is set in the manifest.

## Monitoring

Health endpoint:

```http
GET /api/health
```

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"2026-04-15T17:00:00.000Z"}
```

Prometheus-compatible metrics are not built in yet; add them through Hono middleware or a separate reverse-proxy/exporter layer.