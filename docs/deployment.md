# Deployment Guide

## Local Development

```bash
npm install @forge/server
npx forge serve --port 3000 --db ./apps.db
```

App at `http://localhost:3000/apps/<id>`, API at `http://localhost:3000/api/apps`.

## Docker

```dockerfile
FROM node:20-slim
WORKDIR /app
RUN npm install -g @forge/server
EXPOSE 3000
CMD ["forge-server", "--port", "3000", "--db", "/data/apps.db"]
```

```bash
docker build -t forge-server .
docker run -p 3000:3000 -v forge-data:/data forge-server
```

## Systemd Service

```ini
# /etc/systemd/system/forge-server.service
[Unit]
Description=Forge App Server
After=network.target

[Service]
Type=simple
User=forge
WorkingDirectory=/opt/forge
ExecStart=/usr/bin/npx forge-server --port 3000 --db /opt/forge/apps.db
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now forge-server
```

## Cloudflare Workers (Edge)

The server can run on Cloudflare Workers with a D1 database:

```javascript
import { createForgeServer } from '@forge/server';

export default {
  async fetch(request, env) {
    const server = createForgeServer({ dbPath: env.D1_BINDING });
    return server.app.fetch(request);
  }
};
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

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `DB_PATH` | `./forge.db` | SQLite database path |
| `BASE_URL` | auto | Base URL for generated links |

## Scaling Considerations

**Single-instance** (SQLite): Good for < 1000 apps, single server. SQLite handles concurrent reads well; writes are serialized but fast.

**Multi-instance**: For horizontal scaling, swap SQLite for PostgreSQL and use the `@forge/server` with a custom `db` adapter. The API surface is small (6 CRUD operations) so the swap is straightforward.

**CDN for runtime**: Serve `forge.js` from a CDN (Cloudflare, Fastly). The runtime is static and cacheable:

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
<forge-app id="my-widget"></forge-app>
<script type="module" src="https://cdn.example.com/forge.js"></script>
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

No configuration needed — the `<forge-app>` custom element adapts automatically.

## Monitoring

Health endpoint: `GET /api/health`

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"2026-04-15T17:00:00.000Z"}
```

Prometheus-compatible metrics can be added via middleware or a `/metrics` endpoint.
