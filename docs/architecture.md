# Forge — Complete Architecture Proposal v2

**A framework for LLM-generated interactive applications**
*Revised April 2026 — MIT Licensed*

---

## 1. What Forge Is

Forge is a client-side JavaScript library that renders interactive applications from declarative JSON manifests. Any LLM generates the manifest. Forge renders it. Same manifest, same app — always.

The entire runtime is one web component:

```html
<forge-app manifest='{"root":"shell","elements":{...}}'></forge-app>
```

No build step. No server required. No framework lock-in. Import from a CDN or `npm install`, feed it JSON, get a working app.

Forge does not generate code. The LLM produces structured data describing *what* the UI should be. A deterministic, pre-built renderer handles *how*. This distinction is the foundation of every architectural decision in this document — it makes the system reliable, secure, and simple.

Forge manifests are an **A2UI-compatible superset**. Any pure A2UI payload (Google's Agent-to-User Interface protocol, v0.8+) renders in Forge as-is. Forge extends A2UI with persistent state, data schemas, declarative actions, and storage configuration — the pieces needed to turn ephemeral agent UI cards into full applications.

### What Forge is not

Forge is not a general-purpose app builder. It renders apps from a vocabulary of 36 components: trackers, dashboards, forms, data entry interfaces, micro-tools. If you need a 3D engine or video editor, Forge is the wrong tool. The constraint is the feature.

---

## 2. Architecture: Three Rings

Forge is structured as three concentric layers. Each is independently useful. You only adopt the layers you need.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   RING 3 — FORGE CLOUD (optional, commercial managed service)  │
│   Cloudflare Dynamic Workers, Durable Objects, Data             │
│   Localization Suite. Edge deployment, <1ms cold starts,        │
│   capability-based V8 sandboxing. Paid for convenience + SLA.   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │   RING 2 — FORGE SERVER (self-hostable, open source)      │  │
│  │   Stores manifests, serves the runtime, provides          │  │
│  │   shareable URLs and optional server-side persistence.    │  │
│  │   Runs as Docker container, npm package, or bare binary.  │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                                                     │  │  │
│  │  │   RING 1 — FORGE CORE (browser-only, MIT licensed)   │  │  │
│  │  │   The renderer. ~40KB total. Lit + TinyBase +        │  │  │
│  │  │   36-component catalog + validation. A2UI-compatible │  │  │
│  │  │   superset. No server, no network, no dependencies   │  │  │
│  │  │   beyond the browser.                                │  │  │
│  │  │                                                     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Ring 1 — Forge Core (~40KB, browser-only, MIT licensed)

This is the open-source library. It contains:

- **Manifest renderer** — Lit-based, interprets JSON manifests into web components
- **Component catalog** — 36 pre-built Lit components with Zod schemas (A2UI-compatible types)
- **A2UI adapter** — accepts pure A2UI payloads and renders them natively
- **Validation pipeline** — Ajv schema validation + URL allowlisting + state path checks
- **State manager** — TinyBase reactive store with schema enforcement
- **Persistence** — TinyBase IndexedDB persister for cross-session data (no WASM, no SQLite)
- **Surface adapter** — container queries + CSS cascade layers for chat/PWA/desktop/embed
- **Prompt generator** — `catalog.prompt()` exports the component schemas as an LLM system prompt

**Zero infrastructure required.** Someone running Qwen 27B on a Mac mini can import Forge Core into a webview, generate manifests locally, and have persistent apps with no network calls.

### Ring 2 — Forge Server (~200 lines, self-hostable, MIT licensed)

A lightweight HTTP server that adds:

- **Manifest storage** — save/load app manifests (filesystem or SQLite)
- **Shareable URLs** — each app gets `{host}/apps/{id}`
- **Static serving** — hosts the Forge runtime for browsers
- **Optional auth** — none (default), basic, or OAuth2/OIDC
- **Optional sync** — built-in WebSocket server for multi-device TinyBase sync
- **MCP tool** — `deploy_app(manifest)` returns a URL, for agent integration

### Ring 3 — Forge Cloud (commercial managed service)

For users who want edge performance, V8 sandboxing, and managed infrastructure:

- Cloudflare Dynamic Workers for <1ms cold start edge deployment
- Durable Object Facets for per-app isolated storage
- Capability-based security via Cap'n Proto RPC
- Data Localization Suite for EU/Swiss data residency
- Tail Workers for audit logging

Ring 3 is an *adapter implementation* of Ring 2's interfaces. You opt into it; it is never required.

---

## 3. Rendering Engine

### Why Lit

The requirement is runtime generation without a build step. This eliminates Svelte (compiler required), SolidJS (JSX compilation required), and Stencil (compiler). Lit wraps the Web Components standard at ~5KB minified/gzipped. Shadow DOM provides style encapsulation. Tagged template literals provide XSS protection by default.

### The core component: `<forge-app>`

The entire runtime entry point is one web component. It accepts a manifest (as a JSON string attribute or JavaScript object property), creates a TinyBase store from the manifest's schema, and recursively renders elements from the catalog.

### Multi-surface rendering

The same manifest renders on all surfaces through CSS, not code branching:

- **Container queries** — components adapt to their container width
- **CSS Cascade Layers** — `@layer tokens, base, components, surfaces`
- **Design tokens** — `--forge-space-md`, `--forge-color-primary`

---

## 4. Component System

### Manifest format

Flat, ID-based JSON. Not nested trees. LLMs handle flat structures more reliably.

### Component catalog (36 components)

| Category | Components | Count |
|----------|-----------|-------|
| Layout | `Stack`, `Grid`, `Card`, `Container`, `Tabs`, `Accordion`, `Divider`, `Spacer` | 8 |
| Content | `Text`, `Image`, `Icon`, `Badge`, `Avatar`, `EmptyState` | 6 |
| Input | `TextInput`, `NumberInput`, `Select`, `MultiSelect`, `Checkbox`, `Toggle`, `DatePicker`, `Slider`, `FileUpload` | 9 |
| Action | `Button`, `ButtonGroup`, `Link` | 3 |
| Data display | `Table`, `List`, `Chart`, `Metric` | 4 |
| Feedback | `Alert`, `Dialog`, `Progress`, `Toast` | 4 |
| Navigation | `Breadcrumb`, `Stepper` | 2 |

### Declarative actions (no code, ever)

Actions are data: `{"type": "mutateState", "path": "meals", "operation": "append"}`.

### Incremental updates

JSON Merge Patch (RFC 7396) for partial updates.

---

## 5. Data Layer

### Progressive persistence

| Phase | Storage | Bundle cost | Use case |
|-------|---------|-------------|----------|
| 1 — In-memory | TinyBase store | 0KB | Chat artifacts, ephemeral apps |
| 2 — Browser | TinyBase + IndexedDB persister | ~1KB | Persistent single-user apps |
| 3 — Server sync | TinyBase + WebSocket/file persister | ~2KB | Multi-device, shareable apps |
| 4 — Collaborative | TinyBase MergeableStore + Yjs | ~15KB | Real-time multi-user editing |

### Schema management

Additive-only by default. Breaking changes use declarative migrations.

---

## 6. Security

### The key insight: manifests are data, not code

Four validation layers:
1. Structured LLM output (provider-level schema constraints)
2. JSON Schema validation (Ajv)
3. URL and value sanitization
4. Component catalog enforcement

---

## 7. Technology Stack

| Layer | Technology | Size |
|-------|-----------|------|
| Rendering | Lit 3.x | ~5KB |
| State | TinyBase | ~6KB |
| Validation | Ajv | ~8KB |
| Schema definition | Zod | Build-time only |
| Browser persistence | TinyBase IndexedDB persister | ~1KB |
| A2UI compat | Forge A2UI adapter | ~3KB |

**Total Forge Core bundle: ~40KB minified/gzipped**

---

## 8. Development Roadmap

### Phase 1: MVP (Weeks 1-12)

- Weeks 1-4: Forge Core runtime
- Weeks 5-6: Validation + persistence
- Weeks 7-8: Forge Server
- Weeks 9-12: Demo, testing, release

### Phase 2: Sandbox + Encryption (Weeks 13-20)

- App-level sandboxing for user-generated manifests
- Encryption layer for sensitive data fields
- Enhanced validation pipeline

### Phase 3: Auth + CRDT + Data Read Channel (Weeks 21-28)

#### The Missing Loop: LLM Reads App Data

Right now data flows one direction:

```
LLM → manifest → Forge → user interacts → data accumulates in TinyBase
```

Phase 3 closes the loop:

```
LLM → manifest → Forge → user interacts → data accumulates in TinyBase
 ↑                                                                    │
 └────────────── LLM reads data, reasons, updates app ←──────────────┘
```

This turns Forge from "LLM builds app for user" into **"LLM builds app with user."**

#### Three additions, nothing else changes:

**1. Manifest-level permission declaration**

The user (or LLM at generation time, with consent) declares what the LLM can read:

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

- `enabled: false` (default) — LLM cannot read any app data. The app is a sealed box.
- `enabled: true` — LLM can read tables in `readable`. Tables in `restricted` are never sent.
- `summaries: true` — Forge Server can compute aggregates instead of sending raw rows.

User sees consent prompt: "This app allows the AI to read your workout and exercise data to provide personalized updates."

**2. Two MCP tools for reading**

`forge_read_app_data` — returns raw rows from permitted tables:
```
Input: { app_id, tables: ["workouts"], limit: 20, since: "2026-04-01" }
Output: { schema, data: { workouts: [...rows] }, rowCounts: { workouts: 147 } }
```

`forge_query_app_data` — returns aggregated summaries (token-efficient):
```
Input: { app_id, queries: [{ table: "workouts", aggregate: "max", column: "weight", groupBy: "exercise" }] }
Output: { results: [{ data: { "Bench Press": 85, "Squat": 110 } }] }
```

Supported aggregates: `count`, `max`, `min`, `avg`, `trend`, `sum`, `distinct`.

**3. The interaction loop in practice**

Example — workout tracker:
- **Week 1:** LLM generates manifest with workout plan, exercise table, logging form. Sets `dataAccess.enabled: true` with user consent. Deploys via `forge_create_app`.
- **Week 3:** User asks "how am I doing?" LLM calls `forge_query_app_data` — gets trends per exercise, consistency, volume progression. Reasons: squat plateauing, bench progressing well, leg day skipped twice.
- **LLM acts:** Calls `forge_update_app` with a manifest patch — adjusts squat scheme from 5×5 to 3×8 for deload, adds reminder Alert for leg day, updates bench press Metric goal. User sees updated plan, no manual editing.

Key invariant: **The LLM never touches the user's logged data.** It reads it (with permission), reasons about it, and updates the manifest (app structure/plan). Workout logs stay untouched in TinyBase. The LLM modifies the app *around* the data.

#### Token cost analysis

| Approach | Tokens per interaction |
|----------|----------------------|
| Dump entire TinyBase store | ~2,000–10,000 (scales with data) |
| `forge_read_app_data` with limit + since | ~200–500 (bounded) |
| `forge_query_app_data` with aggregates | ~50–150 (minimal) |
| Event-driven push (single row) | ~30–80 (tiny) |

#### Future: Event-driven data push (post-Phase 3)

For proactive updates — the app notifies the LLM when something interesting happens:

```json
{
  "dataAccess": {
    "enabled": true,
    "readable": ["workouts"],
    "events": {
      "workout_completed": {
        "trigger": { "$when": { "path": "workouts/_lastInsert", "exists": true } },
        "include": { "table": "workouts", "limit": 1, "order": "desc" }
      },
      "streak_broken": {
        "trigger": { "$when": { "path": "stats/daysSinceLastWorkout", "gt": 3 } },
        "include": { "query": { "table": "workouts", "aggregate": "count", "where": { "date": { "gte": "-7d" } } } }
      }
    }
  }
}
```

When the user logs a workout, the event fires with just that one row. When they miss 3 days, the event fires with their recent frequency. The LLM can proactively send encouragement or adjust the plan.

### Phase 4: Enterprise (Weeks 29-36)

- Multi-tenant isolation
- SSO/OIDC integration
- Audit logging
- Compliance (GDPR, SOC2)
- Advanced Cloud features
