# Architecture

ForgeUI turns a bounded JSON manifest into server-rendered dashboard HTML. It is designed around
an intentionally strict division of responsibility:

```text
trusted registered source / server state
                 │
                 ▼
  configured Ollama provider → parser → validation → dry render
                 │                              │
                 │                         max. two repairs
                 ▼                              ▼
        SQLite generation job       immutable manifest revision
                                                   │
                                                   ▼
                   FastAPI → Jinja renderer → HTMX dashboard
```

The model owns only content and declarative structure. The server owns templates, component
implementation, theme tokens, frozen contract/source/capability/destination registries, persisted state,
database access, and the Ollama endpoint.

## Supported integration boundary

ForgeUI targets one implementation stack: FastAPI, HTML/Jinja2, HTMX, trusted Tailwind delivery,
SQLite, and a separately hosted Ollama model. Its supported public boundaries are the `forgeui/1`
manifest, Python package APIs, documented HTTP endpoints, and the Google A2UI importer described
below.

Google A2UI is supported through a pinned v0.9.1 JSONL snapshot importer. The importer translates a
small allowlist of A2UI Basic Catalog components into `forgeui/1`, rejects active content and
unsupported protocol features, and then runs the normal ForgeUI validator. It does not execute
Google renderers, accept arbitrary catalogs, or claim general A2UI conformance.

## Runtime pieces

- `forgeui.domain` defines the strict `forgeui/1` manifest, action union, expression AST, and the
  built-in `device-health/1` reference contract.
- `forgeui.sources` defines typed output contracts, authorized source handlers, immutable data
  envelopes, and the optional hardened fixed-HTTP adapter.
- `forgeui.runtime` freezes contract/source/capability authority and derives the one manifest
  policy consumed by prompts, JSON Schema, validation, persistence, rendering, and actions.
- `forgeui.catalog` is the component source of truth. It supplies prop parsing, JSON Schema,
  prompt documentation, profile compatibility, and renderer template names.
- `forgeui.validation` parses exact JSON envelopes, checks size/graph/path/action/profile limits,
  and accepts an optional side-effect-free dry renderer.
- `forgeui.renderer` maps catalog entries to fixed Jinja templates. It renders trusted SVG charts
  and uses an explicit immutable render context. Trusted hosts may render a complete manifest or
  one existing element subtree; neither path changes template selection or validation.
- `forgeui.data` and `forgeui.services` provide injected SQLAlchemy/SQLite repositories,
  immutable revisions, server-owned state, snapshots, job state, action handling, and audit data.
- `forgeui.llm` supplies the configured Ollama client and a bounded generation loop. A provider
  cannot be selected by a request or manifest.
- `forgeui.a2ui` is the narrow Google A2UI snapshot-import boundary. It cannot bypass the catalog,
  design-profile, device-data, graph, or active-content checks applied to native manifests.
- `forgeui.app` is the FastAPI factory. It initializes the schema, starts one in-process job
  worker, applies request limits/security middleware, mounts static assets, and includes the
  mountable router.

## Persistence model

Apps point to an immutable current manifest revision and last-known-good revision. Saving or
restoring creates a new revision; restoring never mutates an old row. Pointer updates use a
revision precondition, so stale writers receive a conflict instead of overwriting a newer change.

Session/global state has a version number. State mutation requires the expected version and the
value must retain the manifest's declared state keys and scalar/list types. Device snapshots are
validated as `device-health/1`, canonically JSON-encoded, checksummed, and normalized into bounded
collection rows for projection/filtering.

## Operational scaling boundary

The default deployment intentionally uses SQLite plus an in-process job worker. Run a single
Uvicorn worker and a single application replica for each database file. SQLite WAL and a busy
timeout reduce local writer contention; they do not turn the service into a horizontally scaled
queue. Move to a shared database and external job runner only with corresponding implementation
and migration work.

## Failure behavior

Rendering an existing revision does not contact Ollama. If Ollama is unavailable, the dependency
health endpoint reports it and queued generation fails safely; already saved dashboards remain
available. Invalid generated output is never persisted. A repeated invalid candidate stops repair
early; otherwise generation has one initial attempt plus at most two repair attempts.
