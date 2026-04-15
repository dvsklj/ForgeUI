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
