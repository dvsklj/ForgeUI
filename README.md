# Forge UI

Render web UI from JSON manifests. No build step, no framework code, no HTML output — a manifest goes in, a validated interactive page comes out.

Forge UI is aimed at systems that describe interfaces without writing code: LLMs producing structured output, server-side templates, low-code editors, or any context where the generator is more reliable producing JSON than producing JavaScript. A manifest is flat, ID-indexed JSON describing components, state, data schema, and layout.

The runtime validates the manifest, checks it against a component catalog, and renders it as live Lit web components backed by TinyBase reactive state.

What sets Forge UI apart is the persistence spectrum. The same manifest can run as a one-shot chat artifact, persist across sessions in the user's browser, or sync through a self-hosted server — without changing the manifest format.

## Status

Version 0.1.0, pre-1.0. The manifest schema may change between minor versions; 0.x minor releases ship format migrations so older manifests continue to load. No known production users. Until 1.0, only the latest minor receives security fixes. The 39-component catalog (19 core, 20 extended) and the core runtime are the parts most deliberately stable.

## Minimal example

After cloning the repo, running `npm install`, and `npm run build`, drop this file alongside `dist/forge.js` and serve the directory with any static HTTP server (`python3 -m http.server`, `npx serve`, etc.). Opening it from `file://` won't work — browsers require HTTP for module scripts.

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Forge UI — Hello</title>
</head>
<body>
  <forge-app id="app" surface="standalone"></forge-app>
  <script src="./dist/forge.js"></script>
  <script>
    document.getElementById('app').manifest = {
      manifest: "0.1.0",
      id: "hello",
      meta: { title: "Hello World" },
      elements: {
        root: {
          type: "Stack",
          props: { gap: "16", padding: "24" },
          children: ["title", "btn"]
        },
        title: { type: "Text", props: { content: "Hello from Forge", variant: "heading1" } },
        btn:   { type: "Button", props: { label: "Click Me", variant: "primary" } }
      },
      root: "root"
    };
  </script>
</body>
</html>
```

For a richer example that exercises data binding, a table, and action handlers, see [`examples/03-feedback-form.json`](examples/03-feedback-form.json). The manifest can also be fetched from a server, passed as a JSON string via the `manifest` attribute, or set as an object on the `.manifest` property.

## Install

Three ways to use the runtime, depending on the context.

**Artifact mode** — chat embeds, iframes, quick prototypes. Load the IIFE bundle with a script tag. The IIFE inlines Lit, TinyBase, the Ajv-compiled validator, and all 39 components. No npm install required; serve the file from a static host or from the Forge server's `/runtime/forge.js` endpoint.

```html
<script src="./dist/forge.js"></script>
```

**Bundler mode** — existing project, wants ESM. Install the runtime package. The main entry and `/standalone` alias point to the same ESM bundle with external deps (Lit, TinyBase, Ajv) resolved by your bundler for deduplication. `/components` registers individual web components without the runtime.

```bash
npm install @forgeui/runtime
```

```js
import { ForgeApp, validateManifest, createForgeStore } from '@forgeui/runtime';
// Or, components only (no validation, no state runtime):
import '@forgeui/runtime/components';
// Standalone is an alias for the same main entry (ESM, deps external):
import { ForgeApp } from '@forgeui/runtime/standalone';
```

**Server mode** — persistent shareable apps with SQLite storage. The server exposes REST CRUD at `/api/apps/:id` and hosts the runtime at `/runtime/forge.js`. Apps get shareable URLs at `/apps/:id`.

```bash
npm install @forgeui/server
npx forge-server --port 3000 --db ./apps.db
```

MCP tools for agent-driven app management ship as a separate package, [`@forgeui/connect`](packages/connect/README.md), so agents can create, update, and query apps over stdio.

## How it works

A manifest is JSON. The `<forge-app>` web component accepts it as a string attribute or object property, then runs it through four validation layers:

1. **JSON Schema** — Ajv strict mode with `additionalProperties: false`, component-type enums, and length/size caps. Invalid manifests are rejected before any rendering happens.
2. **URL sanitization** — scheme allowlist (`https:`, `mailto:`, app-internal `forge:`). `javascript:`, `data:text/html`, `vbscript:`, and on-handler patterns are blocked.
3. **State path resolution** — `$computed:` references are checked against the declared state schema at validation time. `$state:` references resolve at render.
4. **Component catalog** — `type` values are looked up against pre-registered Lit component classes. Unknown types render as `<forge-error>` fallbacks; the renderer never calls `createElement` with an LLM-supplied tag.

The manifest itself is flat and ID-indexed — elements reference each other by ID in a `children` array, not by DOM nesting. Flat structures are more reliable for LLMs to generate, and they make JSON Merge Patch (RFC 7396) straightforward for incremental updates.

### LLM integration

LLM outputs are often code-fenced. Consumers building on top of Forge should strip Markdown fences before parsing. The runtime exports `extractManifest(rawText)` for this — it returns the unfenced string if a fence is present, or the original input otherwise.

```js
import { extractManifest, validateManifest } from '@forgeui/runtime';
const result = validateManifest(JSON.parse(extractManifest(llmOutput)));
```

The renderer uses Lit tagged template literals, so interpolated values are escaped at the template layer — XSS defense is the rendering engine, not an added filter. State is a TinyBase reactive store. Expressions are evaluated by a deliberately narrow engine: path access plus a small set of named operations (`count:`, `sum:`, `avg:` in `$computed:`; `values`, `keys`, `count`, `sum`, `first`, `last` as pipe filters in `$expr:`). No `eval`, no `Function`, no regex. See [`docs/architecture.md`](docs/architecture.md) for the full pipeline, and [`docs/security/2026-04-expression-audit.md`](docs/security/2026-04-expression-audit.md) for the expression engine audit.

## The persistence spectrum

The same manifest loads at different persistence levels without modification. The difference is which TinyBase persister the runtime attaches, not the manifest format.

- **Ring 0 — Ephemeral.** In-memory store only. Used for chat artifacts and previews. State vanishes on reload. This is the default; nothing extra to include.
- **Ring 1 — Browser.** IndexedDB persistence via TinyBase's persister. State survives reloads and browser restarts. Single-user, single-device. The persister module is dynamically imported and tree-shaken out of artifact-only builds.
- **Ring 2 — Server.** `@forgeui/server` — a Hono HTTP server with SQLite storage. Apps get shareable URLs; the runtime is served from the same origin as the API. Ring 2 is a separate deployment, not a bundle addition.
- **Ring 3 — Collaborative.** Real-time multi-user editing via TinyBase MergeableStore and Yjs. Designed and documented, not built.

Rings 0 through 2 ship in 0.1.0. Most declarative-UI systems pick one point on this range and stay there; Forge UI is built to slide along it. See [`docs/architecture.md`](docs/architecture.md) §5 for the persister selection rules.

## What it does and doesn't do

**Does.** Resolve declarative manifests into running, interactive UI. Validate aggressively — malformed manifests produce error states, not blank pages or runtime exceptions. Survive bad input without crashing the page; every element render is wrapped in try/catch with a `<forge-error>` fallback. Provide a 39-component catalog (19 core, 20 extended) with JSON Schemas that LLMs can target for reliable output. Ingest A2UI v0.8+ payloads through an adapter. Support JSON Merge Patch for incremental manifest updates. Enforce a declarative-actions model — no code callbacks, no event handler strings in the manifest.

**Doesn't.** Render on the server — `<forge-app>` requires a DOM. Support IE or legacy browsers — it targets evergreen only. Tree-shake per component — all 39 live in one file by design, so bundler consumers import by category (`/components`) but not individual components. Expose a theme builder or runtime theme switcher — styling is design tokens, overridden via CSS custom properties. Evaluate arbitrary JavaScript expressions — the `$expr:` engine is intentionally narrow, with no `eval`, no `Function`, no regex, no dynamic code.

## Bundle sizes

Measured with `gzipSync` on the current build:

| Format | Raw | Gzip | What's included |
|---|---|---|---|
| IIFE (`dist/forge.js`) | 161 KB | 46 KB | Lit + TinyBase + Ajv validator + 39 components + expression engine |
| ESM standalone (`dist/forge-standalone.js`) | 119 KB | 29 KB | Same as IIFE, no wrapper |
| Components-only (`dist/forge-components.js`) | 70 KB | 16 KB | Component definitions + Lit, no validation, no state |

CI enforces a 50 KB gzip ceiling on the IIFE via `scripts/check-size.mjs`, ratcheted down as the bundle shrinks. In 0.1.0 the IIFE dropped from ~95 KB gzip to ~46 KB gzip after moving Zod out of the runtime path and replacing the Ajv compiler with a precompiled standalone validator.

## Accessibility

The 2026-04 WCAG 2.1 AA audit of the 19 core components identified 31 findings across 8 P0 (role/keyboard/state blockers), 19 P1 (label association, `prefers-reduced-motion`, ARIA detail), and 4 P2 (polish). All are resolved in 0.1.0. Details per component in [`docs/a11y/2026-04-core-audit.md`](docs/a11y/2026-04-core-audit.md). Extended components have not been audited yet; a second audit is planned before extending the catalog.

## Security

Vulnerability reports: [GitHub Private Vulnerability Reporting](https://github.com/dvsklj/ForgeUI/security/advisories/new) or email `davor.skulj@gmail.com` with subject `[forgeui-security]`. See [`SECURITY.md`](SECURITY.md) for supported versions and response targets.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Pull requests welcome; the test suite runs on every PR via GitHub Actions.

## License

MIT. See [`LICENSE`](LICENSE).
