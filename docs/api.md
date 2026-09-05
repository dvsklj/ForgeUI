# HTTP API

The application factory mounts its API under `/api`. Public apps are readable when
`FORGEUI_ALLOW_PUBLIC_READ=true`; administration and source mutation require an
`Authorization: Bearer <FORGEUI_ADMIN_TOKEN>` header or an administrator browser session. Browser
mutations additionally require their server-derived CSRF token.

Revision reads return an `ETag` containing the current revision ID. Send it in `If-Match` when
saving a manifest to avoid a stale write. A mismatch returns HTTP 409.

## Rendered app surfaces

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/apps/{app_id}` | Default stateful dashboard. |
| `GET` | `/apps/{app_id}/gallery` | Link and preview every supported runtime mode. |
| `GET` | `/apps/{app_id}/views/{surface}?persistence={mode}&element={optional}` | Render any trusted surface/state combination or one element subtree. |
| `GET` | `/apps/{app_id}/embed?element={optional}` | Direct ephemeral, frameable embed. |
| `GET` | `/apps/{app_id}/artifact?element={optional}` | Direct ephemeral, frameable chat artifact. |
| `GET` | `/fragments/apps/{app_id}?element={optional}` | Whole-dashboard or element fragment for same-site integration. |

Surfaces are `dashboard`, `standalone`, `desktop`, `mobile`, `embed`, and `chat`. Persistence is
`stateful` or `stateless`. Host applications should link to these document routes; the internal
stateless action/state render endpoints are runtime transport, not a general mutation API. See
[runtime surfaces](surfaces.md) and [embedding guide](embedding.md).

## Health and catalog

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health/live` | Process liveness. |
| `GET` | `/api/health/ready` | SQLite readiness. |
| `GET` | `/api/health/dependencies` | SQLite/Ollama dependency status; unavailable Ollama returns 503. |
| `GET` | `/api/metrics` | Per-process Prometheus HTTP and generation metrics. |
| `GET` | `/api/catalog` | Generated component schema/prompt catalog. |
| `POST` | `/api/validate` | Validate and dry-render `{ "manifest": {…} }` without saving it. |
| `POST` | `/api/a2ui/import` | Translate a bounded Google A2UI v0.9.1 JSONL snapshot without saving it. |

The A2UI endpoint requires administrator credentials and
`Content-Type: application/a2ui+json`. It returns a validated `forgeui/1` manifest plus an optional
validated `device-health/1` data model. Unsupported catalogs, components, actions, functions,
progressive updates, active content, and unpinned protocol versions return a stable 422 error.

```bash
curl --fail-with-body -X POST http://127.0.0.1:8000/api/a2ui/import \
  -H "Authorization: Bearer $FORGEUI_ADMIN_TOKEN" \
  -H "Content-Type: application/a2ui+json" \
  --data-binary @tests/contracts/a2ui/fixtures/device_health_dashboard_v0_9_1.jsonl
```

## Apps and revisions

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` / `POST` | `/api/apps` | List readable apps or create `{title, visibility}`. |
| `GET` / `PATCH` / `DELETE` | `/api/apps/{app_id}` | Read, update metadata, or delete an app. |
| `PUT` | `/api/apps/{app_id}/manifest` | Save `{manifest}` as a validated immutable revision. Accepts `If-Match`. |
| `GET` | `/api/apps/{app_id}/current` | Current revision and manifest. |
| `GET` | `/api/apps/{app_id}/revisions` | Immutable revision history. |
| `POST` | `/api/apps/{app_id}/revisions/{revision_id}/restore` | Append a copy of an older revision. |
| `GET` | `/api/apps/{app_id}/data` | Read the app-specific or global current snapshot. |

```bash
APP_ID=$(curl -sS -X POST http://127.0.0.1:8000/api/apps \
  -H "Authorization: Bearer $FORGEUI_ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"title":"Fleet Health","visibility":"private"}' | jq -r .id)

jq -n --slurpfile manifest examples/manifests/fleet-overview.json \
  '{manifest: $manifest[0]}' | curl -sS -X PUT \
  "http://127.0.0.1:8000/api/apps/$APP_ID/manifest" \
  -H "Authorization: Bearer $FORGEUI_ADMIN_TOKEN" \
  -H 'Content-Type: application/json' --data @-
```

## Generation

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/apps/{app_id}/generation` | Queue a generation request. |
| `GET` | `/api/generation/{job_id}` | Read status, progress, attempt, result revision, and error code. |
| `POST` | `/api/generation/{job_id}/cancel` | Cancel a queued or running job. |

The request shape is `{brief, profile, data_source, data_contract, sample_data}`. `profile` is
`choose` or one of the four profile IDs. `data_source` and `data_contract` must name a source and
contract registered in the instance's runtime registries; the built-in pair is `device-health`
and `device-health/1`. The Ollama URL, model tag, credentials, and time limits are server
configuration, never request properties.

## Device health

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/device-snapshots?app_id={optional}` | Validate, checksum, and persist a trusted snapshot. |
| `GET` | `/api/device-snapshots/latest?app_id={optional}` | Retrieve the latest snapshot. |
| `POST` | `/api/device-snapshots/query?app_id={optional}` | Bounded device filter/projection/page query. |

```json
{
  "contract": "device-health/1",
  "generated_at": "2026-07-24T10:00:00Z",
  "stale": false,
  "summary": {
    "total": 1, "healthy": 1, "warning": 0, "critical": 0, "offline": 0,
    "fleet_cpu": 0.24, "fleet_memory": 0.37, "fleet_disk": 0.51
  },
  "devices": [{
    "id": "edge-01", "name": "Edge 01", "platform": "linux", "status": "healthy",
    "cpu": 0.24, "memory": 0.37, "disk": 0.51, "temperature": 46.5,
    "latency": 12.0, "last_seen": "2026-07-24T10:00:00Z", "active_alert_count": 0
  }],
  "series": [], "incidents": []
}
```

Device query filters are exact `id`, `name`, `platform`, or `status` values. Projection is limited
to contract device fields; `offset` is at most 10,000 and `limit` is 1–100.

## HTML and HTMX surface

`GET /` lists readable dashboards. `/studio` and job pages are administrator-only. `GET
/apps/{app_id}` renders a document and `GET /fragments/apps/{app_id}` renders a dashboard fragment.
Trusted templates use the session-scoped `POST /apps/{app_id}/actions/{action_id}` and `POST
/apps/{app_id}/state/{key}` endpoints. They are browser routes, not a replacement for the
bearer-authenticated API.
