# ForgeUI

ForgeUI is a safe, server-rendered dashboard framework for small LLMs. A model can choose from a
strict component catalog and four complete design profiles; it cannot supply HTML, JavaScript,
CSS, URLs, SQL, file paths, or executable expressions. Device health is the built-in reference
contract; hosts can register their own strict data contracts, sources, and capabilities.

The project is currently an alpha. Pin exact or compatible pre-release versions while the public
API and `forgeui/1` contract are being exercised by early adopters.

The default presentation uses compact system typography, deep-teal accents, cool neutral surfaces,
restrained 6 px radii, dense data tables, and a charcoal application shell. Light, dark, and system
themes are built in, and model-selected profiles may change composition and density only through
trusted combinations.

It runs on FastAPI, Jinja2, HTMX, trusted self-hosted CSS with an optional Tailwind CDN mode,
SQLite, and a separately configured Ollama model (default: `qwen3.5:9b`). A bounded Google A2UI
v0.9.1 snapshot importer is the only external UI protocol boundary. Invalid candidates are parsed,
validated, dry-rendered, and repaired at most twice. Only a valid result becomes an immutable
manifest revision.

## Install as a package

ForgeUI is distributed as a Python wheel. The default package contains the strict manifest,
validation, Google A2UI, and Jinja rendering boundaries with only Pydantic and Jinja2 as
dependencies:

```bash
pip install forgeui
```

Choose only the integration layer the target container needs:

```bash
pip install 'forgeui[web]'          # Mount into FastAPI with a host-supplied model provider
pip install 'forgeui[web,ollama]'   # Mounted FastAPI app using external Ollama
pip install 'forgeui[web,http]'     # Add the fixed-endpoint JSON source adapter
pip install 'forgeui[app]'          # Complete standalone service and CLI
```

Pip reuses compatible FastAPI, Pydantic, Jinja2, HTTPX, and SQLAlchemy installations already
present in the image. Installing the base wheel into a compatible existing application therefore
adds essentially ForgeUI's own package files rather than another framework copy.

For a locally built wheel:

```dockerfile
COPY dist/forgeui-0.1.0a3-py3-none-any.whl /tmp/
RUN pip install --no-cache-dir '/tmp/forgeui-0.1.0a3-py3-none-any.whl[web,ollama]'
```

Published releases use the same extras syntax from PyPI. Private company integrations should live
in a separate package that depends on a compatible ForgeUI minor series, for example
`forgeui[web]>=0.1,<0.2`, and explicitly supplies its trusted runtime registries to
`mount_forgeui`. See [distribution and private packages](docs/distribution.md).

## Standalone development quick start

Requires Python 3.11+ and [uv](https://docs.astral.sh/uv/).

```bash
uv sync --all-extras
cp .env.example .env
uv run uvicorn forgeui.app:create_app --factory --reload
```

Open `http://127.0.0.1:8000`. Development defaults are intentionally convenient; before exposing
the service, set a unique `FORGEUI_SECRET_KEY`, an administrator token, trusted hosts, and HTTPS
cookie policy. See [deployment](docs/deployment.md).

## API examples

Use a bearer token for API mutations. Browser/HTMX mutations use the signed session and CSRF token
instead.

```bash
export FORGEUI_ADMIN_TOKEN='replace-me'
TOKEN="$FORGEUI_ADMIN_TOKEN"

APP_ID=$(curl --fail-with-body -sS http://127.0.0.1:8000/api/apps \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"title":"Fleet Health","visibility":"private"}' | jq -r .id)

jq -n --slurpfile manifest examples/manifests/fleet-overview.json \
  '{manifest: $manifest[0]}' | curl --fail-with-body -sS -X PUT \
  "http://127.0.0.1:8000/api/apps/$APP_ID/manifest" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' --data @-
```

Queue a model-generated revision (the configured in-process worker performs the bounded repair):

```bash
curl --fail-with-body -X POST "http://127.0.0.1:8000/api/apps/$APP_ID/generation" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  --data '{"brief":"Create a concise fleet-health overview with an alert table.","profile":"ops-compact"}'
```

Push trusted device data from the system that owns it. The payload must conform to
`device-health/1`; a complete shape is in the [API reference](docs/api.md#device-health).

```bash
curl --fail-with-body -X POST "http://127.0.0.1:8000/api/device-snapshots?app_id=$APP_ID" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  --data @snapshot.json
```

## Embed or use as a library

Mount a self-contained ForgeUI app:

```python
from fastapi import FastAPI
from forgeui.app import mount_forgeui
from forgeui.config import Settings

host = FastAPI()
mount_forgeui(host, "/forgeui", settings=Settings())
```

The same saved manifest can run as a stateful or ephemeral dashboard, standalone/desktop/mobile
web app, embed, compact chat artifact, or one selected card inside an existing device page. For
example:

```text
/forgeui/apps/{app_id}/views/mobile?persistence=stateless
/forgeui/apps/{app_id}/views/desktop?persistence=stateful
/forgeui/apps/{app_id}/artifact
/forgeui/apps/{app_id}/embed?element=pressure-chart
```

See [runtime surfaces and state modes](docs/surfaces.md) for the complete matrix, iframe example,
and framing policy. See [embedding ForgeUI](docs/embedding.md) for mounted FastAPI, auto-sized
iframe card, HTMX fragment, and direct Python composition examples.

To connect an existing typed service, AI-search feed, or fixed remote JSON endpoint, build frozen
host-owned registries and pass them as `runtime=`. See
[data contracts, sources, and capabilities](docs/data-sources.md) and the runnable
[AI-search host](examples/ai_search_host.py).

For non-HTTP integrations, validate and render only through the public boundaries:

```python
from forgeui.renderer import Renderer
from forgeui.validation import validate_manifest

report = validate_manifest(candidate)
if report.valid and report.manifest:
    html = Renderer().render(report.manifest)
```

Google A2UI JSONL can be translated through the pinned, allowlisted snapshot importer:

```python
from forgeui.a2ui import adapt_a2ui_jsonl

adaptation = adapt_a2ui_jsonl(a2ui_jsonl)
manifest = adaptation.manifest
device_snapshot = adaptation.data_model
```

This is a safe import boundary, not Google's Lit renderer or a general A2UI client. ForgeUI accepts
only its documented A2UI catalog subset and revalidates every translation as `forgeui/1`.
Mounted applications also expose the same non-persisting boundary at `POST /api/a2ui/import` using
the standard `application/a2ui+json` media type and administrator authentication.

## Optional standalone Docker Compose

```bash
cp .env.example .env
# Replace both placeholder secrets; production mode refuses the default secret or no admin token.
docker compose up --build
curl --fail http://127.0.0.1:8000/api/health/ready
```

The default Compose file reaches an Ollama host at `host.docker.internal:11434` and adds Linux's
`host-gateway` mapping. To run a bundled optional Ollama container instead:

```bash
docker compose -f compose.yaml -f compose.ollama.yaml up --build
docker compose -f compose.yaml -f compose.ollama.yaml exec ollama ollama pull qwen3.5:9b
```

The optional Ollama image is deliberately separate from the ForgeUI application image; select the
exact Ollama model tag suitable for your hardware via `FORGEUI_OLLAMA_MODEL`.

## Documentation

- [Architecture](docs/architecture.md)
- [Implementation plan and acceptance gates](docs/implementation-plan.md)
- [Manifest contract](docs/manifest.md)
- [Component catalog and profiles](docs/components.md)
- [Runtime surfaces and state modes](docs/surfaces.md)
- [Embedding into an existing application](docs/embedding.md)
- [Custom data contracts, sources, and capabilities](docs/data-sources.md)
- [Package footprint and enforced size budgets](docs/footprint.md)
- [Distribution, PyPI releases, and private integration packages](docs/distribution.md)
- [HTTP API](docs/api.md)
- [Security controls and boundaries](docs/security.md)
- [Deployment and operations](docs/deployment.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Current operational boundaries

SQLite and the in-process job worker are intentionally single-instance: run one Uvicorn worker and
one ForgeUI replica per database. Existing dashboards remain usable when Ollama is unavailable;
generation does not. Browser, container, and live-Ollama tests are marked separately from the
ordinary CI suite.

## Analytics and host integration

See [analytics and diagram authoring](docs/analytics.md) and the [portable integration review](docs/portable-integration-plan.md).
