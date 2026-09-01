# ForgeUI implementation plan

This plan defines ForgeUI's product boundaries, architecture, delivery phases, and acceptance
gates as a standalone Python project.

## Product objective

ForgeUI lets a small language model generate useful dashboards from a bounded component and data
contract. The first supported contract is device health. Operators can render and interact with
existing dashboards even when the model provider is offline.

The model returns data and structure only. It cannot emit HTML, Jinja, CSS, Tailwind classes,
JavaScript, SVG paths, URLs, SQL, file paths, or arbitrary expressions.

## Architecture

```text
device snapshot / UI state
            |
            v
   typed data contract
            |
            v
Qwen on Ollama -> parse -> structural validation -> semantic validation
                       ^                                  |
                       |----- bounded repair (max 2) -----|
                                                          v
                                                dry Jinja render
                                                          |
                                                          v
                                             immutable SQLite revision
                                                          |
                                                          v
                                      FastAPI + Jinja + HTMX partials
```

The package exposes an application factory and a mountable router. The web app, JSON API, model
jobs, and bounded Google A2UI importer call the same validation and rendering boundaries.

## Decisions

### Core guarantees

- Flat ID-indexed manifests, graph validation, a finite component registry, declarative state,
  conditions, repeaters, actions, app CRUD, server-side revisions, SQLite, design tokens,
  light/dark themes, accessible error states, server-rendered charts, and a pinned Google A2UI
  snapshot importer.
- A component registry is the single source for Pydantic props, renderer dispatch, JSON Schema,
  prompt documentation, and catalog tests.
- Model JSON repair is a real bounded pipeline. Invalid candidates are never saved or rendered.

### Design choices

- Expressions use a typed JSON AST with allowlisted operations and bounded complexity.
- State is server-owned and uses optimistic concurrency.
- Styling is limited to four complete, tested profiles: `ops-compact`, `signal-cards`,
  `executive-summary`, and `calm-neutral`.
- Charts use trusted server-generated SVG with an accessible table summary.
- External operations use operator-registered data sources and capabilities.

### Exclude

- Raw HTML/SVG/CSS, arbitrary JavaScript or callbacks, generic HTTP actions, SQL actions, custom
  component escape hatches, model-chosen URLs, and CRDT/cloud/PWA claims without implementations.

## `forgeui/1` manifest

The top-level manifest contains a spec marker, metadata, one design profile, one typed data
contract, bounded initial UI state, a flat element map, strict action definitions, and a root ID.
Every object rejects extra keys. Every component has a discriminated strict props model.

Global limits include 256 KiB encoded size, 80 elements, 12 children per element, graph depth 12,
40 actions, 100 rendered rows, 120 chart points per series, six chart series, expression depth
eight, and 64 expression nodes.

Expression namespaces are read-only `data.*`, writable-declared `state.*`, bounded repeater
`item.*`, and action-only projected `event.*`. Evaluation is pure and synchronous.

## Safe generation and repair

1. Build JSON Schema from runtime Pydantic and catalog definitions.
2. Call an `LLMProvider` using structured output.
3. Enforce response byte and time limits.
4. Parse strict JSON, permitting only exact fence or balanced-object envelope extraction.
5. Validate structure, graph, expressions, paths, actions, profile compatibility, limits, and
   accessibility requirements.
6. Dry-render with representative bounded data.
7. Return compact machine-readable validation errors to Qwen.
8. Allow at most two repair calls after the initial call.
9. Detect repeated candidates by hash.
10. Atomically persist only a valid candidate; otherwise keep the last-known-good revision active.

The Ollama base URL and model are configuration, never request or manifest fields. Ordinary CI
uses a fake provider; a fixed Qwen device-health gauntlet is optional and separately marked.

## Security boundaries

- Jinja autoescape is mandatory. No model value selects a template or reaches `safe`.
- Manifest actions post only to same-origin trusted routes and require CSRF protection.
- Data sources and capabilities are server-registered identifiers.
- Browser and API request sizes, render breadth, query rows, action rates, and generation
  concurrency are bounded.
- Production requires a non-default session secret and administrator token unless explicitly
  overridden.
- CSP, restrictive browser headers, scheme validation, cookie flags, and trusted-host checks are
  applied centrally.
- Existing dashboards degrade independently of Ollama health.

## Delivery phases

1. Contracts and scaffold: package, configuration, ADRs, lint/type/test tooling.
2. Domain and validation: manifest models, expressions, registry, schema, graph and semantic
   validation, property tests.
3. Renderer: Jinja component library, server SVG charts, themes, design profiles, snapshots,
   XSS and accessibility tests.
4. Persistence and services: apps, immutable revisions, state, snapshots, jobs, transactions,
   rollback and optimistic concurrency.
5. Web integration: application factory, JSON API, HTML pages, HTMX actions and fragments,
   sessions, authentication, CSRF, CSP, request limits, health endpoints.
6. Generation: Ollama adapter, prompting, bounded repair, job lifecycle and fake-provider tests.
7. Device-health vertical slice: normalized contract, three dashboards, data fixtures, generation
   briefs, filter/refresh/detail flows, empty/stale/provider-down states.
8. Delivery: Docker and Compose, documentation, browser/security/Docker tests, full quality gates.

Concurrent agents receive disjoint directory ownership. Schema contracts are frozen before
renderer and LLM integrations consume them.

## Acceptance gates

- Fresh installation passes formatting, linting, strict typing, unit, integration, security, and
  browser tests.
- Compose starts a non-root app with persistent SQLite storage and external Ollama configuration.
- Device dashboards support healthy, warning, critical, offline, stale, empty, and unavailable
  data states, with filtering, refresh, selection, pagination, and theme persistence.
- Light and dark modes pass automated accessibility and contrast checks at mobile and desktop
  widths.
- Invalid model output is attempted no more than three times total and is never persisted or
  rendered.
- XSS strings render as inert text; manifest/network escape attempts trigger validation errors and
  no outbound request.
- Saved updates use revision preconditions and immutable rollback revisions.
