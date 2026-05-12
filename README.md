# Forge UI

**Render interactive web apps from JSON.**

Forge UI takes a declarative JSON manifest and turns it into a live web app — validated, styled, reactive, accessible. No framework code, no build step, no HTML templates. A manifest goes in, a working UI comes out.

It's built for systems that describe interfaces without writing code: LLM outputs, server-rendered templates, low-code editors, or anywhere the generator is more reliable producing JSON than producing JavaScript.

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  JSON manifest   │ ──▶ │  Forge runtime   │ ──▶ │  Live web app    │
│  (from LLM,      │     │  validate +      │     │  reactive state, │
│   CMS, editor…)  │     │  render          │     │  accessible UI   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## Quick start (zero build)

Drop one script tag, assign a manifest, done.

```html
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8"><title>Hello Forge</title></head>
  <body>
    <forgeui-app id="app"></forgeui-app>

    <script src="https://unpkg.com/@nedast/forgeui-runtime/forgeui.js"></script>
    <script>
      document.getElementById('app').manifest = {
        manifest: "0.1.0",
        id: "hello",
        meta: { title: "Hello World" },
        elements: {
          root: {
            type: "Stack",
            props: { gap: "md", padding: "lg" },
            children: ["title", "btn"]
          },
          title: { type: "Text", props: { content: "Hello from Forge", variant: "heading1" } },
          btn:   { type: "Button", props: { label: "Click me", variant: "primary" } }
        },
        root: "root"
      };
    </script>
  </body>
</html>
```

Serve the file over HTTP:

```bash
npx serve .
# or: python3 -m http.server
```

Open the URL and you'll see a rendered heading and button.

---

## What a manifest looks like

A manifest is flat, ID-indexed JSON. Elements reference each other by ID in a `children` array, not by nesting. State is declarative, and values can bind to state via `$state:`, `$computed:`, `$item:`, `$expr:`, object-form references, or `{{...}}` interpolation.

```json
{
  "manifest": "0.1.0",
  "id": "counter",
  "root": "root",
  "state": { "count": 0 },
  "elements": {
    "root": { "type": "Stack", "children": ["label", "plus"], "props": { "gap": "sm" } },
    "label": { "type": "Text", "props": { "content": "Count: {{state.count}}" } },
    "plus":  { "type": "Button", "props": { "label": "+1", "action": "inc" } }
  },
  "actions": {
    "inc": { "type": "mutateState", "path": "count", "operation": "increment", "value": 1 }
  }
}
```

Richer, runnable examples live in [`examples/`](examples/) — a nutrition tracker, analytics dashboard, feedback form, onboarding wizard, and settings panel.

---

## Install

Pick the mode that matches how you want to run Forge.

### Artifact mode — one script tag

For chat embeds, iframes, demos, or prototyping. Zero dependencies, nothing to install.

```html
<script src="https://unpkg.com/@nedast/forgeui-runtime/forgeui.js"></script>
```

The IIFE bundle inlines the browser runtime, validator, state layer, and components.

### Bundler mode — npm + ESM

For projects that already have a build pipeline.

```bash
npm install @nedast/forgeui-runtime
```

```js
import {
  ForgeUIApp,
  validateManifest,
  extractManifest,
  catalogPrompt,
  catalogToJsonSchema
} from '@nedast/forgeui-runtime';

// Components-only entry:
import '@nedast/forgeui-runtime/components';
```

### Server mode — persistent apps with shareable URLs

For hosting LLM-generated apps as real URLs, backed by SQLite.

```bash
npm install @nedast/forgeui-server
npx forgeui-server --port 3000 --db ./apps.db
# or:
npx forgeui serve --port 3000 --db ./apps.db
```

The server exposes REST CRUD routes under `/api/apps`, hosts the runtime at `/runtime/forgeui.js`, and serves each stored app at `/apps/:id`. See [`docs/api-reference.md`](docs/api-reference.md) for the full surface and [`docs/deployment.md`](docs/deployment.md) for deploy recipes.

### Agent mode — MCP connector

For LLM agents and MCP-aware clients to create, update, validate, and query Forge apps directly.

```bash
npm install @nedast/forgeui-connect
```

The connector exposes these tools over stdio:

- `forgeui_create_app`
- `forgeui_update_app`
- `forgeui_validate_manifest`
- `forgeui_component_docs`
- `forgeui_list_apps`
- `forgeui_get_app`
- `forgeui_delete_app`

See [`docs/api-reference.md`](docs/api-reference.md) for schemas and examples.

---

## Using Forge from an LLM

LLMs often wrap their output in Markdown code fences. Strip them with `extractManifest` before parsing:

```js
import { extractManifest, validateManifest } from '@nedast/forgeui-runtime';

const manifest = JSON.parse(extractManifest(llmOutput));
const { valid, errors } = validateManifest(manifest);

if (valid) {
  document.querySelector('forgeui-app').manifest = manifest;
}
```

The validator is strict by design: unknown top-level keys, unknown element keys, unknown component types, malformed references, dangerous URL schemes, and obvious injection patterns are rejected before normal rendering. Invalid manifests produce validation/error states rather than blank pages or uncaught crashes.

A ready-to-use LLM prompt describing the component catalog is available via `catalogPrompt()` from `@nedast/forgeui-runtime` or `ForgeUIApp.catalogPrompt()`. Use [`docs/components.md`](docs/components.md) for the human-readable component reference.

---

## The persistence spectrum

The same manifest can run as a throwaway chat artifact, persist locally in the user's browser, or sync through a self-hosted server — without changing the manifest format.

| Ring | Where state lives | Current status | Use case |
|---|---|---|---|
| 0 — Ephemeral | In-memory | Implemented (`surface="chat"` or `skipPersistState`) | Chat artifacts, previews, embeds |
| 1 — Browser | IndexedDB | Implemented (`surface="standalone"`/`embed` or `persistState`) | Single-user apps that persist across reloads |
| 2 — Server | SQLite app storage | Implemented for stored manifests/shareable URLs | Multi-device access to hosted app manifests |
| 3 — Collaborative | CRDT | Planned | Real-time multi-user editing |

See [`docs/architecture.md`](docs/architecture.md) for how the rings work and how Forge selects a persister.

---

## Safety model

Forge assumes manifest *authors* are trusted (you, your server, or an LLM running under your supervision) and that the runtime's job is to render that manifest safely. In practice:

- **Layered validation** — JSON Schema, URL/string safety checks, state-reference checks, component catalog enforcement, and element reference/cycle checks.
- **XSS defense at the template layer** — rendering is Lit tagged templates, so interpolated values are escaped by the engine itself, not by an added filter.
- **No arbitrary code execution** — `$expr:` and `$computed:` are deliberately narrow. There is no `eval`, `Function`, dynamic import, or user-supplied JavaScript callback execution.
- **Server hardening knobs** — CORS allowlist, body size cap, per-IP rate limiting, trusted-proxy mode, and optional Bearer-token auth are configurable via env vars.

See [`SECURITY.md`](SECURITY.md) for the reporting process and [`docs/architecture.md`](docs/architecture.md) for the full validation and threat model.

---

## Documentation

- [**Getting started**](docs/getting-started.md) — step-by-step tutorial, build a small app end to end
- [**Component catalog**](docs/components.md) — component reference and manifest patterns
- [**LLM SVG icon guide**](docs/llm-svg-icon-guide.md) — rules for generating clean icon drawings with Forge shapes
- [**API reference**](docs/api-reference.md) — runtime exports, server REST API, MCP tools, manifest schema
- [**Architecture**](docs/architecture.md) — the persistence spectrum, validation pipeline, expression engine
- [**Deployment**](docs/deployment.md) — Docker, systemd, nginx, runtime hosting
- [**Architecture Decisions**](docs/adr/) — the why behind the design choices

---

## Contributing

Bug reports, feature ideas, and pull requests are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for dev setup, project layout, and how to add a component. By participating, you agree to the [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Security

Please report vulnerabilities privately via [GitHub's Private Vulnerability Reporting](https://github.com/dvsklj/ForgeUI/security/advisories/new). See [`SECURITY.md`](SECURITY.md) for supported versions and response targets.

## License

MIT — see [`LICENSE`](LICENSE).
