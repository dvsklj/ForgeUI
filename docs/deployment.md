# Deployment and operations

ForgeUI is a Python package first. The Dockerfile and Compose files are optional reference
deployments for running it as a separate service. Existing containers should install the wheel with
only the extras they use:

```bash
pip install forgeui
pip install 'forgeui[web,ollama]'
```

## Environment

Settings use the `FORGEUI_` prefix and can be supplied through environment variables or `.env`.
The essential production settings are:

| Setting | Purpose |
| --- | --- |
| `FORGEUI_ENVIRONMENT=production` | Enables production configuration checks. |
| `FORGEUI_SECRET_KEY` | Unique long signing secret. |
| `FORGEUI_ADMIN_TOKEN` | Administrator bearer/login token. |
| `FORGEUI_DATABASE_URL` | SQLite URL; default container path is `sqlite:////data/forgeui.db`. |
| `FORGEUI_DATA_DIR` | Persistent data directory; default container path is `/data`. |
| `FORGEUI_TRUSTED_HOSTS` | JSON list of permitted hostnames. |
| `FORGEUI_FRAME_ANCESTORS` | Exact origins allowed to frame embed/chat views; defaults to self. |
| `FORGEUI_SECURE_COOKIES` | `true` when HTTPS terminates before the application. |
| `FORGEUI_OLLAMA_BASE_URL` | Configured Ollama endpoint, never supplied by clients. |
| `FORGEUI_OLLAMA_MODEL` | Exact locally installed Ollama model tag. |
| `FORGEUI_OLLAMA_*_TIMEOUT_SECONDS` | Provider connect/response bounds. |
| `FORGEUI_OLLAMA_MAX_CONCURRENCY` | In-process provider concurrency limit. |
| `FORGEUI_ASSET_MODE` | `self-hosted` (compact default) or `cdn` (pinned Tailwind/HTMX for hosts that require them). |

Generate a unique production secret/token with `openssl rand -hex 32`. The default
`FORGEUI_OLLAMA_MODEL=qwen3.5:9b` is only a starting value: configure the exact Qwen/Ollama tag
installed for the target hardware. Model installation is outside the ForgeUI image.

Normal pages send `frame-ancestors 'none'` and `X-Frame-Options: DENY`. Only embed/chat surfaces
are frameable. Keep `FORGEUI_FRAME_ANCESTORS=["'self'"]` for same-origin mounting, or list each
trusted HTTPS origin exactly. Cross-origin artifacts should use stateless persistence; stateful
browser sessions use a `SameSite=Lax` cookie.

## Compose deployment

```bash
cp .env.example .env
# Edit both placeholder secrets and production host/cookie settings.
docker compose up --build -d
docker compose ps
curl --fail http://127.0.0.1:8000/api/health/live
curl --fail http://127.0.0.1:8000/api/health/ready
```

The default Compose service is non-root, read-only-root-friendly, writes only to the named `/data`
volume, and has no-new-privileges plus a `/tmp` tmpfs. It binds port 8000 to loopback and expects
Ollama on the Docker host at `host.docker.internal:11434`; the Linux `host-gateway` mapping is
included.

For an optional local Ollama container:

```bash
docker compose -f compose.yaml -f compose.ollama.yaml up --build -d
docker compose -f compose.yaml -f compose.ollama.yaml exec ollama ollama pull "$FORGEUI_OLLAMA_MODEL"
curl --fail http://127.0.0.1:8000/api/health/dependencies
```

The overlay persists models in `ollama-models`. Its image is not pinned to a digest; pin a tested
digest in an operator-specific production deployment before treating it as a controlled artifact.

## Container smoke check

The default image needs no Ollama response to pass liveness/readiness, only SQLite:

```bash
docker build -t forgeui:smoke .
docker run --rm -d --name forgeui-smoke -p 18000:8000 \
  -e FORGEUI_ENVIRONMENT=production \
  -e FORGEUI_SECRET_KEY="$(openssl rand -hex 32)" \
  -e FORGEUI_ADMIN_TOKEN="$(openssl rand -hex 32)" \
  -v forgeui-smoke-data:/data forgeui:smoke
curl --fail http://127.0.0.1:18000/api/health/ready
docker rm -f forgeui-smoke
```

## Runtime constraints

Use exactly one Uvicorn worker. ForgeUI's job worker is in-process and its SQLite configuration is
for one application instance/database file. The readiness endpoint checks SQLite; dependency health
also checks the configured Ollama endpoint. Existing dashboards do not need Ollama after their
manifest revision is saved.

Prometheus-format process metrics are available at `/api/metrics`. They contain request
method/status timing and bounded generation status/error labels; prompts, candidates, device data,
tokens, cookies, and app IDs are not metric labels.

Back up the `/data` volume as a coherent SQLite database backup, not by copying a live database
file without SQLite-aware tooling. Automatic retention/pruning of device snapshots and audit events
is not implemented in this release.

## Reverse proxy

Terminate TLS at a reverse proxy, expose the service deliberately, set
`FORGEUI_SECURE_COOKIES=true`, and set `FORGEUI_TRUSTED_HOSTS` to public hostnames as JSON, for
example `["forge.example.com"]`. Keep Ollama on a trusted network. The app does not currently
implement proxy-header trust configuration; configure the proxy so untrusted client identity
headers do not become an authorization input.
