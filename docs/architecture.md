# Forge UI Architecture

This document describes the architecture that exists in the repository today and separates it from planned work. For historical design decisions, see [`docs/adr/`](./adr/). For public API details, see [`api-reference.md`](api-reference.md).

---

## 1. Thesis

Forge UI renders interactive web apps from declarative JSON manifests.

The LLM, CMS, low-code editor, or server generates structured data. A deterministic runtime validates that data, creates a TinyBase store, resolves state bindings, and renders a fixed catalog of Lit Web Components.

The core invariant is:

```txt
manifest data → validation + state setup → static renderer dispatch → Lit components
```

Forge does **not** ask manifest authors to generate JavaScript, HTML templates, or custom DOM tags.

---

## 2. Packages and entry points

The repository builds several outputs from the same source tree.

| Area | Source | Output / package | Purpose |
|---|---|---|---|
| Browser runtime | `src/index.ts`, `src/runtime/`, `src/components/`, `src/renderer/` | `@nedast/forgeui-runtime` | `<forgeui-app>`, validation helpers, catalog helpers, A2UI ingest. |
| Server | `src/server/` | `@nedast/forgeui-server` | Hono HTTP API, SQLite manifest storage, hosted app pages. |
| MCP connector | `src/connect/` | `@nedast/forgeui-connect` | Stdio MCP tools for agents to create/update/validate/read/delete apps. |
| CLI | `src/cli.ts`, `src/server/cli.ts` | `forgeui`, `forgeui-server` binaries | Local serving, deploy, validation, catalog output, MCP startup. |
| Catalog | `src/catalog/` | runtime exports and CLI output | Component registry and LLM prompt/schema generation. |

The build script emits IIFE, standalone ESM, component-only ESM, catalog, server, server CLI, connector, CLI, and type declarations.

---

## 3. Manifest shape

Forge manifests are flat, ID-indexed JSON records.

```json
{
  "manifest": "0.1.0",
  "id": "example",
  "root": "root",
  "state": { "count": 0 },
  "elements": {
    "root": {
      "type": "Stack",
      "props": { "gap": "md" },
      "children": ["title", "button"]
    },
    "title": {
      "type": "Text",
      "props": { "content": "Count: {{state.count}}" }
    },
    "button": {
      "type": "Button",
      "props": { "label": "+1", "action": "inc" }
    }
  },
  "actions": {
    "inc": { "type": "mutateState", "path": "count", "operation": "increment", "value": 1 }
  }
}
```

Required top-level fields are:

```txt
manifest, id, root, elements
```

Allowed top-level fields are:

```txt
manifest, id, root, schema, state, elements, actions, meta, persistState, skipPersistState, dataAccess
```

Element envelopes allow only:

```txt
type, props, children, visible
```

`props`, `state`, `actions`, and table definitions stay open enough for component-specific behavior and user-defined app data.

---

## 4. Rendering runtime

The browser runtime centers on one custom element:

```html
<forgeui-app surface="standalone"></forgeui-app>
```

`ForgeUIApp` accepts a manifest from:

1. the `manifest` JavaScript property,
2. the `src` string property, or
3. an inline `<script type="application/json">` child.

Initialization flow:

1. Read manifest input.
2. Convert A2UI payloads through `ingestPayload()` when detected.
3. Validate the manifest with `validateManifest()`.
4. Create a TinyBase store from `schema` and `state`.
5. Configure persistence based on `surface`, `persistState`, and `skipPersistState`.
6. Render the root element with `renderManifest()`.
7. Route user actions through `_handleAction()`.

The renderer uses an explicit switch over known component types. It does not call `document.createElement()` with a manifest-provided tag name.

---

## 5. Component catalog

The manifest catalog currently contains **38 component types**:

| Category | Components |
|---|---|
| Layout | Stack, Grid, Card, Container, Tabs, Accordion, Divider, Spacer, Repeater |
| Content | Text, Image, Icon, Badge, Avatar, EmptyState |
| Input | TextInput, NumberInput, Select, MultiSelect, Checkbox, Toggle, DatePicker, Slider, FileUpload |
| Action | Button, ButtonGroup, Link |
| Data | Table, List, Chart, Metric |
| Feedback | Alert, Dialog, Progress, Toast |
| Navigation | Breadcrumb, Stepper |
| Drawing | Drawing |

There is also an internal `forgeui-error` component used as a fallback in rendering error paths. It is not a valid manifest `type`.

Component definitions currently live in `src/components/index.ts`. The registry in `src/catalog/registry.ts` is the source of truth for valid manifest component type strings.

---

## 6. State and expressions

Forge uses TinyBase for runtime state.

`createForgeUIStore()`:

- creates a TinyBase store,
- applies a TinyBase table schema when `manifest.schema` exists,
- loads primitive initial state values as TinyBase values,
- loads object initial state values as JSON values or table data depending on TinyBase schema behavior.

Props are resolved through `resolveRef()` before rendering. Supported reference forms include:

| Form | Meaning |
|---|---|
| `$state:path` | Read a TinyBase value, table row, or cell path. Slash paths are supported. |
| `$computed:count:table` | Count rows. |
| `$computed:sum:table/column` | Sum numeric column values. |
| `$computed:avg:table/column` | Average numeric column values. |
| `$item:field` | Read current `Repeater` item field. Dot paths are supported. |
| `$expr:state.todos \| values` | Evaluate a constrained expression. |
| `{{state.name}}` | Interpolate expression output into a string. |

The current expression engine supports simple state/item reads, literals, pipe filters (`values`, `keys`, `count`, `length`, `sum`, `first`, `last`), and simple one-operator numeric/comparison expressions. It deliberately does not use `eval` or `Function`.

The broader formal expression grammar described in earlier design drafts is roadmap, not the current implementation.

---

## 7. Actions

Runtime-handled actions today:

| Action | Behavior |
|---|---|
| `mutateState` | Mutates TinyBase values/tables through `set`, `append`, `delete`, `update`, `increment`, `decrement`, or `toggle`. Also supports shorthand `set: { key: value }`. |
| `navigate` | Updates the runtime active view target. |
| bound input updates | Components with `bind: "$state:path"` update state before matching manifest actions are looked up. |
| `callApi` | Recognized, but currently logs that Ring 2+ support is required. |
| unknown/custom types | Surfaced as `forgeui-action` events for host applications. |

The TypeScript action type also lists `openDialog`, `closeDialog`, `toast`, and `custom`, but the runtime switch only directly implements the behavior above today.

---

## 8. Persistence spectrum

Forge supports a practical subset of the persistence spectrum today.

| Ring | Storage | Current status |
|---|---|---|
| 0 — Ephemeral | In-memory TinyBase store | Implemented. Used by `surface="chat"` or `skipPersistState: true`. |
| 1 — Browser | IndexedDB TinyBase persister | Implemented. Used by `surface="standalone"` / `surface="embed"` unless disabled, or forced with `persistState: true`. |
| 2 — Server | SQLite app manifest storage | Implemented for storing and serving manifests as shareable URLs. |
| 3 — Collaborative | CRDT / real-time sync | Planned. |

Important distinction: the server currently stores manifests and serves app pages. It does not yet sync live TinyBase user state between devices.

---

## 9. Server architecture

The server is a Hono app backed by `better-sqlite3`.

Main routes:

```txt
GET    /                         landing page
GET    /apps/:id                 rendered app page
GET    /runtime/forgeui.js        runtime bundle
GET    /runtime/forgeui-standalone.js
GET    /api/health
POST   /api/apps
GET    /api/apps
GET    /api/apps/:id
PUT    /api/apps/:id
PATCH  /api/apps/:id
DELETE /api/apps/:id
```

Implemented hardening knobs:

- CORS origin allowlist via `FORGEUI_CORS_ORIGINS`.
- Request body size limit via `FORGEUI_MAX_BODY_BYTES`.
- Per-IP token-bucket rate limiting on `/api/*`.
- Trusted-proxy client IP resolution via `FORGEUI_TRUST_PROXY`.
- Optional Bearer-token auth for write requests when `FORGEUI_API_TOKEN` is set.
- Basic security headers on API responses.
- CSP headers on hosted app pages and the landing page.

Current behavior to be aware of:

- `POST /api/apps` checks JSON, body size, and app ID format, but does not run full manifest validation before writing.
- `PUT /api/apps/:id` validates the full replacement manifest before writing.
- `PATCH /api/apps/:id` validates the patch envelope, merges it, validates the merged manifest, then writes.
- If `NODE_ENV=production` and `FORGEUI_API_TOKEN` is unset, the server logs a warning but does not reject writes.

---

## 10. MCP connector

The MCP connector starts over stdio and uses the same SQLite database layer as the server.

Current tools:

| Tool | Purpose |
|---|---|
| `forgeui_create_app` | Validate and create an app from a manifest. |
| `forgeui_update_app` | Patch or replace an existing app. Defaults to patch mode. |
| `forgeui_validate_manifest` | Validate a manifest without writing. |
| `forgeui_component_docs` | Return catalog prompt text and generated JSON schema. |
| `forgeui_list_apps` | List stored apps. |
| `forgeui_get_app` | Fetch a stored app. |
| `forgeui_delete_app` | Delete a stored app. |

Data read/query tools described in older architecture drafts are planned, not currently implemented.

---

## 11. Validation pipeline

`validateManifest()` currently performs:

1. Ajv validation against the generated manifest schema.
2. URL and dangerous-string checks over element string props and action data.
3. State reference checks for `$state:` and `$computed:` where schema/state information is available.
4. Component catalog enforcement.
5. Root/child reference validation and cycle detection.
6. Manifest size warning above 100 KB.

The generated Ajv validator comes from `src/validation/manifest-schema.ts` and is regenerated with:

```bash
npm run gen:validator
```

The generated file is checked in at `src/validation/manifest-validator.generated.ts`.

---

## 12. Security model

Forge treats manifests as data, not code.

Current safeguards:

- strict top-level and element-envelope schema validation,
- fixed component catalog and static renderer dispatch,
- Lit template escaping for interpolated content,
- URL scheme deny/allow checks,
- event-handler prop-name rejection,
- injection-pattern checks for obvious script/object/embed payloads,
- no `eval` or `Function` in expression handling,
- CSP on server-rendered app pages,
- optional Bearer-token auth and rate limiting for server API deployments.

Shadow DOM is style encapsulation, not a security boundary.

Known limitations:

- Component-specific props are not exhaustively validated server-side by the manifest JSON schema.
- `POST /api/apps` should not be treated as a full validation gate today.
- Manifest authors are assumed to be trusted; rendering untrusted manifests still requires defense in depth.
- Server-hosted app pages allow `img-src * data: blob:` for broad image compatibility.

---

## 13. Roadmap boundaries

These items are described in design discussions or older docs but should be treated as planned work unless code lands:

- live server-side TinyBase sync,
- CRDT/Yjs collaboration,
- Cloudflare Workers / Durable Objects managed service layer,
- data read/query MCP tools,
- consent UI for `dataAccess`,
- formal full expression grammar with parser/fuzzer,
- per-component ESM entry points such as `@nedast/forgeui-runtime/components/chart`,
- built-in Prometheus metrics,
- field-level encryption / rich PII handling.

When any roadmap item ships, update this document and the API reference in the same PR.

---

## 14. Architecture decisions

Architecture decisions live in [`docs/adr/`](./adr/) as append-only records. Do not edit merged ADRs to rewrite history; supersede them with a new ADR.

Changes that should usually get an ADR:

- manifest format changes,
- component catalog additions/removals,
- expression-language changes,
- new runtime dependencies,
- changes to the persistence model,
- changes to the security boundary or trust model.
