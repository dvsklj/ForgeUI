# Changelog

All notable changes to ForgeUI are documented here. Versions follow
[PEP 440](https://peps.python.org/pep-0440/).

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
