# Forge — Architecture v3

**A framework for LLM-generated interactive applications**
*Revised April 2026 — MIT licensed*

This document is the living architecture spec. For current build state and test
results see [STATUS.md](../STATUS.md). For decisions and their history see
[docs/adr/](./adr/).

---

## 1. The thesis: one manifest, a persistence spectrum

A Forge app lives on a persistence spectrum. The same manifest can render as:

- an ephemeral chat artifact (no storage, vanishes on reload)
- a persistent single-user app backed by IndexedDB
- a multi-device app synced through a server
- a real-time collaborative app backed by CRDTs

Nothing about the manifest's component vocabulary or data model changes as you
move along the spectrum. You add a persister, not a rewrite. **That is Forge's
core product thesis.** Everything else in this document — the component
catalog, the A2UI compatibility, the "no build step" constraint, the Three
Rings — is machinery in service of it.

This matters because most LLM-UI projects pick one point on this spectrum and
stay there. Claude Artifacts and A2UI target ephemeral. Streamlit targets
session-scoped. Retool targets server-backed. None let the LLM generate a
manifest that can live anywhere on the spectrum depending on how the user
wants to use it. Forge does.

### How the manifest produces an app

```html
<forge-app manifest='{"root":"shell","elements":{...}}'></forge-app>
```

The LLM never generates code. It generates structured data describing *what*
the UI should be. A deterministic, pre-built renderer — shipped, tested, and
owned by us — handles *how*. This is the invariant underneath every security,
reliability, and portability claim in this document.

### A2UI: ingest, not conformance

Forge ingests A2UI v0.8+ payloads through an adapter. Forge does **not** claim
conformance to A2UI semantics on the rendering side, because Forge extends the
state, action, and persistence model beyond anything A2UI specifies. Practical
effect: any A2UI payload will render in Forge, but a Forge manifest is generally
richer than what a pure A2UI renderer can express. The adapter is the
compatibility surface; the core renderer is free to evolve without A2UI
constraining it.

### What Forge is not

Not a general-purpose app builder. Not a game engine, not a 3D tool, not a
video editor. The component vocabulary is finite and the declarative-actions
model is deliberately non-Turing-complete. The constraint is the feature.

---

## 2. Architecture: three rings

Forge is three concentric layers. Each is independently useful. You adopt
only the ones you need.

```
┌─────────────────────────────────────────────────────────────────┐
│   RING 3 — FORGE CLOUD (optional, commercial managed service)   │
│   Cloudflare Workers, Durable Objects, Data Localization.       │
│   Edge deployment, capability-based V8 sandboxing, SLA.         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │   RING 2 — FORGE SERVER (self-hostable, open source)      │  │
│  │   Hono + SQLite. REST API, shareable URLs, MCP tools,     │  │
│  │   optional WebSocket sync. Docker, npm, or bare binary.   │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │   RING 1 — FORGE CORE (browser-only, MIT licensed)  │  │  │
│  │  │   Lit + TinyBase + Ajv + component catalog +        │  │  │
│  │  │   A2UI adapter. Browser-only, no dependencies       │  │  │
│  │  │   beyond the DOM.                                   │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

Ring 3 is an *adapter implementation* of Ring 2's interfaces. It adds no
capability the self-hosted tier cannot provide; see **ADR-0001** for the
commitment that locks this in.

---

## 3. Rendering engine

### Why Lit

Runtime manifest generation without a build step rules out Svelte, SolidJS,
and Stencil (all compiler-required). Lit wraps the Web Components standard
at ~5KB minified+gzipped. Shadow DOM provides style encapsulation. Tagged
template literals escape interpolated values by default — XSS is prevented
at the template layer, not added on as a filter.

### The core component: `<forge-app>`

The entry point is a single web component. It accepts a manifest (as a JSON
string attribute or a JS object property), validates it, creates a TinyBase
store from the manifest's schema, and recursively renders elements from the
catalog. It never calls `document.createElement` with an LLM-supplied tag
name — component `type` values are looked up against a registered allowlist.

### Multi-surface rendering

The same manifest renders across surfaces through CSS, not code branching:

- **Container queries** — components adapt to their container, not the viewport.
- **CSS Cascade Layers** — `@layer tokens, base, components, surfaces` gives
  clean override precedence.
- **Design tokens** — `--forge-space-md`, `--forge-color-primary`, etc.
  The LLM writes `colorScheme: "primary"`, never `color: "#3B82F6"`.

### Accessibility is a first-class concern

Every component in the catalog must ship with:

1. A correct ARIA role or native semantic element.
2. Full keyboard operability (tab order, Enter/Space activation, Escape for
   dismissible surfaces, arrow-key navigation where conventional).
3. Visible focus indicators that survive Shadow DOM boundaries.
4. Programmatic labels (`aria-label`, `aria-labelledby`, or associated
   `<label>` elements for inputs).
5. Respect for `prefers-reduced-motion` on all transitions.
6. Color contrast meeting WCAG 2.2 AA for text and focus indicators at the
   default token values.

Accessibility is a **gate on component completion**, not a "Phase 2" item.
Merging a component without keyboard support is a regression. The
design:accessibility-review checklist (WCAG 2.1 AA audit) runs against every
demo app before a release is tagged.

---

## 4. Component system

### Manifest format

Flat, ID-based JSON. Not a nested tree. LLMs handle flat structures more
reliably and the shape enables clean JSON Merge Patch (RFC 7396) for
incremental updates.

```json
{
  "manifest": "0.1.0",
  "id": "nutrition-tracker",
  "root": "shell",
  "schema": { ... },
  "state": { ... },
  "elements": { ... },
  "actions": { ... }
}
```

The `manifest` version is semver (`0.x.y`). Starting at `0.x` signals the
format is evolving; breaking changes between minor versions are expected
until we graduate to `1.0.0`. See **§5 — Manifest-format migration** for what
happens to existing manifests when the format changes.

### Catalog: core vs extended

The catalog today is **39 components** (19 core + 20 extended). For LLM
reliability and testing discipline, we split it into two tiers:

- **Core (19):** the components the LLM is told about by default in
  `catalog.prompt('core')`, and the components every release must pass full
  a11y, LLM-reliability, and visual regression tests on. Shipped in the
  base runtime.
- **Extended (20):** components lazy-loaded or opted-in via
  `catalog.prompt('full')`. These must pass the same tests to stay in
  extended, but the prompt budget and reliability bar for the LLM is
  measured on the core set.

| Tier | Category | Components |
|------|----------|-----------|
| Core | Layout | Stack, Grid, Card, Tabs |
| Core | Content | Text, Badge |
| Core | Input | TextInput, NumberInput, Select, Toggle, Checkbox |
| Core | Action | Button |
| Core | Data | Table, Chart, Metric |
| Core | Feedback | Alert, Dialog, Progress, Error |
| Extended | Layout | Container, Accordion, ButtonGroup, Divider, Spacer |
| Extended | Content | Image, Icon, Avatar, EmptyState |
| Extended | Input | MultiSelect, DatePicker, Slider, FileUpload |
| Extended | Action | Link |
| Extended | Data | List |
| Extended | Feedback | Toast |
| Extended | Drawing | Drawing |
| Extended | Navigation | Breadcrumb, Stepper |

Component promotions and demotions are ADR-worthy decisions. A component
only enters core after two consecutive releases of ≥99% LLM validity on
real traffic.

### Declarative actions (no code, ever)

Actions are data: `{"type": "mutateState", "path": "meals", "operation": "append"}`.
Conditional rendering uses `$when` expressions. Loops use the `Repeater`
component. No JavaScript callbacks. No event handler strings. No `eval`.
Where behavior cannot be expressed declaratively, the right answer is
either a new action type (audited, documented, shipped in the renderer)
or a new component — never a code-escape hatch.

### Incremental updates

When the LLM modifies an existing app it emits a JSON Merge Patch (RFC 7396).
The runtime deep-merges the patch into the current manifest, re-validates,
and re-renders. Partial patches are how conversational iteration works
without regenerating entire manifests.

---

## 5. Data layer

### Progressive persistence

The same TinyBase API works at every persistence level. You move along the
spectrum by adding a persister, not by rewriting data access code.

| Phase | Storage | Bundle cost | Use case |
|-------|---------|-------------|----------|
| 1 — In-memory | TinyBase store | 0 KB | Chat artifacts, ephemeral apps |
| 2 — Browser | TinyBase + IndexedDB persister | ~1 KB | Persistent single-user apps |
| 3 — Server sync | TinyBase + WebSocket persister | ~2 KB | Multi-device, shareable apps |
| 4 — Collaborative | TinyBase MergeableStore + Yjs | ~15 KB | Real-time multi-user editing |

### Who decides where on the spectrum an app lives

Persistence is a deliberate choice, not an emergent one. The decision rule
the LLM is prompted with:

1. **Default ephemeral.** No `schema` block → no persistence, period.
2. **IndexedDB (Phase 2)** requires a declared `schema` with at least one
   user-data table. If the user says "track" or "log" or "save," the LLM
   should add a schema and IndexedDB. If the user says "show me a chart
   of...," the LLM should not.
3. **Server sync (Phase 3)** requires an explicit `persistence: "server"`
   field and a Ring 2+ host. Never inferred.
4. **Collaborative (Phase 4)** requires explicit `persistence: "sync"` and
   MergeableStore + Yjs loaded.

The goal is that a user can predict whether their data will survive a
reload. Ambiguity here kills the "same manifest, anywhere on the spectrum"
claim because users don't know which point they're on.

### Schema management — additive by default

Schema changes follow an additive-only policy by default: new columns and
tables permitted, dropping columns requires explicit user confirmation.
Additive changes handle ~90% of real-world evolution without migration
code.

### Schema-breaking changes — declarative migrations

When a column is renamed, retyped, or removed, the manifest declares a
migration chain:

```json
{
  "schema": {
    "version": 3,
    "migrations": [
      { "from": 2, "to": 3, "operations": [
        { "op": "rename_column", "table": "meals", "from": "cals", "to": "calories" },
        { "op": "add_column", "table": "meals", "column": "protein", "default": 0 },
        { "op": "drop_column", "table": "meals", "column": "notes" }
      ]}
    ]
  }
}
```

Operations are declarative (not code), ordered, and generate a backup on
destructive steps. If a device comes online with data at v1 and the
manifest is now at v5 with migrations v1→v2→v3→v4→v5, the runtime applies
each in order. If a chain step is missing, the runtime prompts the user:
"this app has been updated — start fresh or export your data?"

### Manifest-format migrations

Schema migrations handle the user's data shape. Manifest-format migrations
handle the manifest shape itself — the structural keys Forge reads.

- The runtime reads `manifest.manifest` (the version field) first.
- Every minor version (0.1 → 0.2 → 0.3) ships a manifest-format migration
  in the renderer. Old manifests are transformed in memory before
  validation runs against the current JSON Schema.
- The migration chain is versioned alongside the renderer; no user action
  required.
- **Commitment:** for the duration of 0.x, every minor release ships a
  migration from the previous minor. We do not break old manifests without
  a migration path.

When we move to 1.0.0, the format-migration policy becomes: every release
must ship a migration from the previous **major**. Minor and patch
releases are backward compatible by definition.

### File handling in browser-only mode

`FileUpload` stores files as raw `Blob` objects in IndexedDB, linked by
UUID from the TinyBase store. Never Base64 as strings — that's a 33% size
penalty and destroys memory performance. A **5 MB per-file limit in
Ring 1** prevents storage-quota accidents; Ring 2+ handles larger files
server-side.

---

## 6. Expression language — `$expr`, `$computed`, `$when`

This is the escape valve. Stateful apps accumulate requirements for
derived values, conditional rendering, and validation. The declarative
actions model handles simple mutations; everything beyond that funnels
through a formal expression language that is **deliberately not
Turing-complete** and generates **no code at runtime**.

### Grammar (minimal surface, strict allowlist)

Primary expressions:

- `state.<path>` — read a value from the TinyBase store.
- `item.<field>` — read a field from the current Repeater row.
- `number`, `string`, `true`, `false`, `null` literals.
- Function calls, whitelist only: `count`, `sum`, `avg`, `min`, `max`,
  `len`, `round`, `floor`, `ceil`, `abs`, `concat`, `lower`, `upper`,
  `date`, `now`, `before`, `after`, `between`, `contains`,
  `startsWith`, `endsWith`.

Operators:

- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `==`, `!=`, `<`, `<=`, `>`, `>=`
- Logical: `and`, `or`, `not`
- Pipe: `|` applies a whitelisted function to the left-hand value:
  `state.meals | count`, `state.weight * state.activity | round`.

Explicitly **not** in the grammar: arbitrary function calls, regular
expressions, property access on arbitrary JS objects, iteration, variable
assignment, `eval`, `Function`. The parser is a hand-rolled recursive
descent; unknown identifiers reject at parse time, not runtime.

### Usage surfaces

- `$expr` in any prop value: `"value": "$expr: state.weight * 0.8"`
- `$computed` as a shorthand when the expression reads only from state:
  `"value": "$computed: meals | count"`
- `$when` in conditional props:
  `"visible": {"$when": "state.user.role == 'admin'"}`
- Action parameters may reference `$expr` values:
  `{"type": "mutateState", "path": "meals", "value": "$expr: item"}`

### Hallucination resistance

Every release runs a hallucination fuzz test: generate 200+ expressions
from multiple LLMs across real user prompts, parse them, and fail CI if
any expression slips through as a string containing arbitrary JS, regex,
or property access outside the allowlist. Expression language is the
#1 attack surface in a "no code" system; we treat it that way.

---

## 7. Security

### Core insight: manifests are data, not code

Four validation layers, every time:

1. **Structured LLM output.** Use provider-level schema constraints
   (Anthropic tool use, OpenAI Structured Outputs) to bind generation to
   the manifest schema at the source.
2. **JSON Schema validation.** Ajv with `additionalProperties: false`,
   component type enums, `maxLength` / `maxItems` constraints, URL
   pattern validation. Reject invalid manifests — never silently repair.
3. **URL and value sanitization.** Allowlist schemes (`https:`, `mailto:`,
   app-internal `forge:`). Reject `javascript:`, `data:text/html`, and
   anything with on-handler name patterns.
4. **Component catalog enforcement.** Map `type` values to pre-registered
   Lit classes. Unknown types render as error placeholders. Never
   `document.createElement()` with LLM-provided tag names.

### Threat model (selected rows)

| Threat | Severity | Mitigation |
|--------|----------|------------|
| Manifest injection via prompt injection | CRITICAL | Structured output + Ajv + catalog allowlist |
| Expression-language injection | CRITICAL | Grammar has no arbitrary JS hooks; fuzz-tested |
| Agent-to-agent prompt injection via manifest content | HIGH | Manifest content visible to reader LLMs is treated as untrusted input; `forge_read_app_data` strips component-rendered text before returning to caller LLMs; audit-log suspicious payloads |
| Sandbox escape (iframe or V8) | HIGH | Defense in depth: iframe sandbox + CSP (Ring 1), V8 isolate + MPK (Ring 3) |
| Cross-tenant data access | CRITICAL | Per-app IndexedDB databases (browser); Durable Object Facets (Ring 3) |
| Phishing via spoofed login UI | HIGH | No password input in catalog; CSP `form-action 'none'` in sandbox mode |
| Data exfiltration via image/fetch URLs | HIGH | CSP `default-src 'none'` in sandbox mode; URL allowlist |
| Storage quota exhaustion | MEDIUM | Per-app storage limits; `maxItems` schema constraints |

The agent-to-agent row is new and worth underlining. In a world where
agent A writes a manifest, agent B reads user-contributed content from
that manifest's data (via Phase 3 read tools), agent B's context can be
poisoned by strings the user *or another agent* injected. Treat every
manifest field and every cell returned by `forge_read_app_data` as
untrusted input to whatever agent consumes it next.

### Shadow DOM is not a security boundary

Shadow DOM provides style encapsulation only. Security boundaries come
from iframe sandbox + CSP (client-side) or V8 isolates (server-side),
never from Shadow DOM.

---

## 8. Integration surfaces

### MCP tools — write and read

Write-side (already shipped):

- `forge_create_app(manifest) → { url }`
- `forge_update_app(app_id, patch)`
- `forge_get_app(app_id) → { manifest }`
- `forge_list_apps() → [{ app_id, ... }]`
- `forge_delete_app(app_id)`

Read-side (Phase 3, specified below):

- `forge_read_app_data(app_id, tables, limit, since) → { data }`
- `forge_query_app_data(app_id, queries) → { results }`

The read tools exist so agents can reason about the data *inside* a
Forge app without dumping the entire store into a context window. They
are gated by an explicit `dataAccess` manifest field; default is sealed.

### A2UI ingest

The A2UI adapter accepts v0.8+ payloads and translates them into Forge
manifests. Forge-specific extensions (schema, state, actions, persistence)
are absent from the A2UI side, so a Forge-authored manifest with those
extensions round-trips lossy through A2UI export. This is expected and
documented — Forge is a superset at the feature level, a compatible
ingester at the spec level.

### Surfaces

- **Chat inline** — iframe-sandboxed for untrusted contexts; direct for
  trusted. Surface mode `"chat"` for compact spacing.
- **Standalone PWA** — service worker, dynamic `manifest.json`.
- **Enterprise embed** — standard web component; drops into Salesforce
  Lightning, SAP UI5, or plain HTML without modification.
- **Agent-deployed** — MCP `forge_create_app` returns a URL; optional TTL
  for ephemeral apps.

---

## 9. Phase 3 — closing the LLM/data loop

Today's write-only flow:

```
LLM → manifest → Forge → user interacts → data accumulates in TinyBase
```

Phase 3 closes the loop:

```
LLM → manifest → Forge → user interacts → data accumulates in TinyBase
 ↑                                                                    │
 └────────────── LLM reads data, reasons, updates app ←──────────────┘
```

This shifts Forge from "LLM builds app for user" to **"LLM builds app with
user."**

### Three additions; nothing else changes

**1. Manifest-level permission declaration.**

```json
{
  "dataAccess": {
    "enabled": true,
    "readable": ["workouts", "exercises"],
    "restricted": ["user_profile"],
    "summaries": true
  }
}
```

- `enabled: false` (default) — LLM cannot read any app data. Sealed box.
- `enabled: true` — LLM reads tables in `readable`. Tables in `restricted`
  are never returned, even by aggregate queries.
- `summaries: true` — Forge Server returns aggregates instead of raw rows
  for token-efficient reasoning.

The user sees a consent prompt before this takes effect: *"This app
allows the AI to read your workout and exercise data to provide
personalized updates."*

**2. Two MCP tools.**

`forge_read_app_data` — raw rows, bounded:
```
Input: { app_id, tables: ["workouts"], limit: 20, since: "2026-04-01" }
Output: { schema, data: { workouts: [...] }, rowCounts: { workouts: 147 } }
```

`forge_query_app_data` — aggregates, token-efficient:
```
Input: { app_id, queries: [{ table: "workouts", aggregate: "max", column: "weight", groupBy: "exercise" }] }
Output: { results: [{ data: { "Bench Press": 85, "Squat": 110 } }] }
```

Supported aggregates: `count`, `max`, `min`, `avg`, `sum`, `trend`,
`distinct`. Aggregates run server-side against TinyBase; raw rows come
through the same permission gate.

**3. The loop in practice.**

- Week 1: LLM generates a manifest with a workout plan, exercise table,
  logging form. Declares `dataAccess.enabled: true` with user consent.
  Deploys via `forge_create_app`.
- Week 3: user asks "how am I doing?" LLM calls `forge_query_app_data` —
  gets trends per exercise, consistency, volume progression. Reasons:
  squat plateauing, bench progressing, leg day skipped twice.
- LLM calls `forge_update_app` with a manifest patch: adjusts squat
  scheme 5×5 → 3×8 deload, adds reminder Alert for leg day, updates the
  bench Metric goal. User sees the updated plan — no manual editing.

**Invariant:** The LLM never writes user data. It reads data (with
permission), reasons about it, and modifies the manifest (app structure
and plan). Logged data stays untouched in TinyBase. The LLM modifies
the app *around* the data.

### Token cost

| Approach | Tokens per interaction |
|----------|------------------------|
| Dump entire TinyBase store | 2,000–10,000 (scales with data) |
| `forge_read_app_data` with limit + since | 200–500 (bounded) |
| `forge_query_app_data` with aggregates | 50–150 (minimal) |
| Event-driven push (single row) | 30–80 (tiny) |

### Future: event-driven data push

Post-Phase 3, the app notifies the LLM when something interesting
happens — workout logged, streak broken, goal hit — via
`dataAccess.events` declarations with `$when` triggers and minimal
payloads. This flips the loop from LLM-polls-app to app-pushes-LLM.

---

## 10. Bundle budget and tree-shaking

### Current state (see STATUS.md for live numbers)

| Bundle                | Raw    | Gzip    | Use case                      |
|-----------------------|--------|---------|-------------------------------|
| IIFE (CDN)            | 163 KB | 46 KB   | `<script>`-tag, zero build    |
| ESM standalone        | 119 KB | 28 KB   | Modern bundler, whole runtime |
| ESM per-component     | 70 KB  | 16 KB   | Tree-shaking consumers        |

The IIFE now ships Lit, TinyBase, components, the precompiled Ajv
standalone validator function, and small Ajv runtime helpers — no Zod, no
Ajv compiler. The 50 KB gzip budget is enforced in CI via
`scripts/check-size.mjs`.

This is the *Core* runtime only — server and connector are separate
packages.

### Per-component code splitting

The single IIFE bundle is the convenient default. For consumers that care
about payload, the runtime also ships with per-component ESM entry
points:

```js
import { ForgeApp } from '@forgeui/runtime/core';       // ~20 KB gz
import '@forgeui/runtime/components/chart';             // +~3 KB gz
import '@forgeui/runtime/components/table';             // +~2 KB gz
```

`sideEffects` is narrowly scoped to component registration files so
tree-shakers keep everything else. Goal: a consumer importing only core
components pays ≤25 KB gzipped; a consumer importing everything pays
the full ~28 KB ESM bundle (or ~46 KB IIFE on CDN). This is what makes growing the catalog cheap for us
and for them.

### Size discipline

`size-limit` CI check fails the build if any entry point exceeds its
budget by >5%. Every new component ships with its own budget row.

### Size honesty

The IIFE shipped at 95 KB gzip before the Ajv precompilation and Zod
extraction work (2026-04-17). Zod was removed from the runtime bundle
entirely — catalog schemas now validate at build time and the IIFE imports
pre-generated data. Ajv's compiler was replaced with a precompiled
standalone validator function, saving ~34 KB gzip. The IIFE is now ~46 KB
gzip with a 50 KB ceiling enforced in CI. The aspirational ~40 KB target
from early development is within reach but not worth chasing — the remaining
budget is better spent on components and features than on shaving the last
few KB of third-party dep wiring. See
`docs/performance/2026-04-bundle-audit.md` for the detailed breakdown.

---

## 11. Roadmap (indicative, revised)

Original plan quoted "Phase 1 in 12 weeks" and "~200 lines for Ring 2."
Both under-counted reality. The numbers below are honest.

### Phase 1 — MVP (shipped)

Core runtime, Ring 2 server, MCP connector, 39 components, validation
pipeline, design tokens, benchmarks, A2UI ingest. See STATUS.md for
current test results. Remaining cleanup: chart z-index bug, open CORS,
auth middleware, body size limits.

### Phase 2 — sandbox, encryption, a11y depth (next)

- iframe sandbox mode with CSP meta injection
- `postMessage` protocol for sandboxed rendering
- `RichText` component with DOMPurify allowlist
- Field-level AES-256-GCM for PII (Web Crypto API)
- JSON Merge Patch for incremental updates
- WebSocket sync for multi-device persistence
- Declarative schema migration execution
- Component a11y deep audit (WCAG 2.2 AA on all 39)
- Expression-language formal parser + fuzz harness

### Phase 3 — data read channel (specced, see §9)

- `dataAccess` manifest field + consent UI
- `forge_read_app_data` and `forge_query_app_data`
- LLM prompt updates documenting the read-reason-update cycle
- Event-driven push (stretch)

### Phase 4 — enterprise, cloud, collaborative

- Ring 3 Cloudflare Workers adapter (per ADR-0001, this ships no new
  interfaces not available in Ring 2 first)
- Durable Object Facets for per-app storage
- Data Localization Suite (EU/CH residency)
- CRDT sync via MergeableStore + Yjs
- OAuth 2.1/PKCE, passkeys
- Crypto-shredding for right-to-erasure

---

## 12. Decision records

Architecture decisions live in `docs/adr/` as numbered, append-only
records. Never edit a merged ADR — supersede it with a new one.

Initial ADRs:

- **ADR-0001** — Ring 2 interfaces land in open source first
  (commitment that Ring 3 cannot hold back protocol or capability from
  self-hosters; commercial differentiation is operational only)

Future decisions that belong as ADRs, not inline edits to this doc:

- Changes to the core component set
- Changes to the expression language grammar
- Changes to the manifest versioning contract
- Any adoption of a new runtime dependency
- Any deviation from the "no code, ever" principle

When this doc contradicts an ADR, the newer ADR wins and this doc should
be updated to match.

---

*Previous revision (v2, April 2026) is preserved in git history. Diffs
against v2 are review-worthy — in particular the new §1 thesis framing,
§5 manifest-format migrations and persistence decision rules, the new
§6 expression language, and the new agent-to-agent row in §7.*
