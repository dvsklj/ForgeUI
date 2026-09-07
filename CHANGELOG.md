# Changelog

All notable changes to ForgeUI are documented here. Versions follow
[PEP 440](https://peps.python.org/pep-0440/).

## 0.1.0a5 — 2026-09-07

### Added

- Typed responsive grids support numeric presets, container-aware `auto` wrapping with bounded
  minimum item widths, and small/medium/large column counts. `grid-item` adds bounded column and
  row spans; equal, first-main 2:1, and second-main 2:1 ratios are renderer-owned tokens.
- Layout spacing and alignment now expose separate horizontal/vertical gaps, padding, density,
  vertical alignment, and equal-height rows without model-authored CSS.
- Cards support ordered `card-header`, `card-body`, and `card-footer` slots. `content-group`
  associates a description or caption with one child through semantic figure markup.
- Passive `disclosure` uses native `<details>/<summary>` keyboard semantics with optional summary,
  nested children, and an initial expanded state.
- Layout validation reports actionable parent, slot, span, and provably empty-wrapper diagnostics.
  Empty layout warnings preserve valid rendering; structural errors remain blocking.
- Added `examples/manifests/layout-controls.json` and a separately cacheable
  `forgeui-layout.css` asset. Hosted documents and portable renderers expose the same layout
  behavior in dashboard, standalone, embedded, and static-export contexts.

### Changed

- Component catalog, generated JSON Schema, prompt documentation, and API catalog now contain 54
  synchronized entries.
- Portable render results preserve validation warning severity and render when no blocking error is
  present. Core CSS remains within its existing footprint budget.

## 0.1.0a4 — 2026-09-06

### Fixed

- Preserve manifest state defaults when a portable render supplies host data, and normalize typed
  host rows before filtering or aggregation.
- Keep static exports accessible while disabling state, action and navigation controls.
- Give portable exports the responsive layout container and selected design profile.
- Label percentage comparisons in percentage points. Keep large finite chart geometry in range,
  and isolate rejected component data from the rest of the dashboard.
- Restore donut slice legends, per-category summaries and keyboard/pointer inspection metadata.
- Synchronize the component reference and local wheel examples with 0.1.0a4.
- Action, state, and data routes for an unknown app now return 404 instead of a logged 500; an
  app-level handler maps every escaped service error to its client status.
- Very long `Content-Length` headers are compared against the body limit before integer
  conversion, avoiding server errors while accepting valid zero-padded lengths.
- The in-memory rate limiter sweeps buckets for clients idle for a full window, so memory no
  longer grows with every client address ever seen.
- `/api/health/dependencies` checks SQLite instead of always reporting it ready.
- The strict login and generation rate-limit budgets apply only to unsafe methods. Reading the
  login page or polling `/api/generation/{job_id}` is an ordinary read and no longer consumes the
  twelve-per-minute generation budget, which previously starved status polling.

### Changed

- `RequestLimitMiddleware` is a pure ASGI middleware instead of patching a private Starlette
  request attribute: it rejects an oversized `Content-Length` up front and turns an over-limit
  streamed body into the same 413 unless the response has already started.
- The in-process job worker backs off its idle poll from 0.1 s to a 2 s cap while the queue is
  empty, resetting when a job is claimed, instead of running a claim query ten times a second.
- The Docker image installs the project non-editable, so the runtime stage no longer needs a
  `PYTHONPATH` override or a second copy of the source tree. Build and runtime environments use
  the same `/opt/venv` path so installed launchers keep a valid interpreter path.
- Added unit tests for the increment, append, update-collection and delete-collection state
  actions, toast, navigate, refresh, modal and capability results, transient-mode guards, and the
  version-conflict path.
- The publish workflow also accepts manual `workflow_dispatch` runs on a pushed tag, skipping
  distribution files already published to PyPI when retried.

## 0.1.0a3 — 2026-09-05

- Add a persistence-free HTML renderer adapter with capability negotiation, structured issues,
  asset metadata and inert/events modes while preserving the existing renderer API.
- Add shared typed filters, filtered sample KPI aggregation, metric formatting and absolute
  comparisons. Correct negative chart geometry and donut proportions; donut charts use one series.
- Add structured Mermaid-compatible flowcharts with safe bounded import/export, explicit syntax
  corrections, deterministic offline SVG, accessible connections, group filtering and node selection.
- Add generic sales analytics examples with authorized host providers and agent references
  covering data freshness and full versus sample totals.
- Fix nested JSON Schema references, accessible select names and narrow grid overflow.
- Include the upstream fix deleting app-owned device snapshots securely.
- Keep runtime dependencies unchanged; raise the wheel budget from 128 to 144 KiB for new modules.

## 0.1.0a2 — 2026-09-01

First published public alpha.

### Fixed

- Raised light-theme timeline timestamp contrast above the WCAG AA text threshold.
- Made the shell wordmark a 44-pixel touch target at mobile widths.
- Added a small self-hosted favicon so standalone pages do not generate a missing-asset request.
- Replaced the segmented theme selector with one compact system-default light/dark toggle.
- Added trusted axis titles, tick labels, scales, and formatted summaries to operational charts.
- Added hover/focus chart inspection with bounded keyboard stops and an accessible data summary.
- Added explicit dashboard drill-down affordances and host-allowlisted navigation destination IDs.

## 0.1.0a1 — 2026-09-01

Initial release candidate.

### Added

- Strict `forgeui/1` manifests with a server-owned catalog, Pydantic models, JSON Schema,
  semantic validation, graph limits, and a pure bounded expression AST.
- Safe server rendering through Jinja2 with 46 catalog components, four complete design profiles,
  accessible light/dark/system themes, and trusted SVG charts.
- Stateful and stateless dashboard, standalone, desktop, mobile, embedded-card, and chat-artifact
  surfaces using FastAPI and HTMX.
- Immutable SQLite manifest revisions, server-owned state, optimistic concurrency, audit events,
  device snapshots, and bounded in-process generation jobs.
- Qwen/Ollama structured generation with strict parsing, dry rendering, duplicate detection, and
  at most two repair attempts after the initial candidate.
- Frozen data-contract, data-source, and capability registries for explicit host integrations.
- A bounded Google A2UI v0.9.1 JSONL importer.
- Three device-health example manifests, an AI-search host example, Docker/Compose support, and
  package extras for base, web, HTTP sources, Ollama, serving, and the complete app.
- Secretless PyPI Trusted Publishing workflow with release-version and wheel-size gates.

### Security boundaries

- Manifests cannot contain HTML, Jinja, JavaScript, CSS, Tailwind classes, URLs, SQL, file paths,
  SVG paths, callbacks, or arbitrary executable expressions.
- Invalid generated candidates are rejected before persistence and rendering.
- Host code owns credentials, endpoints, authorization, data access, and side-effect handlers.

### Known alpha limitations

- SQLite persistence and the in-process job worker support one ForgeUI process/replica per database.
- The live Ollama gauntlet requires an explicitly configured Ollama service and is not part of the
  ordinary offline test suite.
- Google A2UI support is an allowlisted v0.9.1 snapshot importer, not a general A2UI client.
- APIs and the `forgeui/1` contract may change incompatibly before the first stable release.
