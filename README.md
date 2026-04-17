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

    <script src="https://unpkg.com/@forgeui/runtime/forge.js"></script>
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
          btn:   { type: "Button", props: { label: "Click me", variant: "primary" } }
        },
        root: "root"
      };
    </script>
  </body>
</html>
```

Serve the file over HTTP (browsers block module scripts from `file://`):

```bash
npx serve .
# or: python3 -m http.server
```

Open the URL, you'll see a rendered card with a heading and a button. That's the full loop.

---

## What a manifest looks like

A manifest is flat, ID-indexed JSON. Elements reference each other by ID in a `children` array, not by nesting. State is declarative, and values can bind to state via `$state:` / `$expr:` expressions.

```json
{
  "manifest": "0.1.0",
  "id": "counter",
  "root": "root",
  "state": { "count": 0 },
  "elements": {
    "root": { "type": "Stack", "children": ["label", "plus"], "props": { "gap": "12" } },
    "label": { "type": "Text", "props": { "content": { "$expr": "state.count" } } },
    "plus":  { "type": "Button", "props": { "label": "+1", "action": "inc" } }
  },
  "actions": {
    "inc": { "type": "mutateState", "set": { "count": { "$expr": "state.count + 1" } } }
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
<script src="https://unpkg.com/@forgeui/runtime/forge.js"></script>
```

The IIFE bundle inlines everything: Lit, TinyBase, the validator, and all components.

### Bundler mode — npm + ESM

For projects that already have a build pipeline.

```bash
npm install @forgeui/runtime
```

```js
import { ForgeApp, validateManifest, extractManifest } from '@forgeui/runtime';

// Components-only entry (no validation, no state runtime):
import '@forgeui/runtime/components';
```

### Server mode — persistent apps with shareable URLs

For hosting LLM-generated apps as real URLs, backed by SQLite.

```bash
npm install @forgeui/server
npx forgeui-server --port 3000 --db ./apps.db
```

The server exposes a REST CRUD API at `/api/apps/:id`, hosts the runtime at `/runtime/forge.js`, and serves each stored app at `/apps/:id`. See [`docs/api-reference.md`](docs/api-reference.md) for the full surface and [`docs/deployment.md`](docs/deployment.md) for deploy recipes (Docker, systemd, nginx, Cloudflare Workers).

### Agent mode — MCP connector

For LLM agents (Claude, any MCP-aware client) to create, update, and query Forge apps directly.

```bash
npm install @forgeui/connect
```

Exposes five tools over stdio: `create_app`, `update_app`, `get_app`, `list_apps`, `delete_app`. See [`docs/api-reference.md`](docs/api-reference.md) for the full tool schemas.

---

## Using Forge from an LLM

LLMs often wrap their output in Markdown code fences. Strip them with `extractManifest` before parsing:

```js
import { extractManifest, validateManifest } from '@forgeui/runtime';

const manifest = JSON.parse(extractManifest(llmOutput));
const { valid, errors } = validateManifest(manifest);

if (valid) {
  document.querySelector('forgeui-app').manifest = manifest;
}
```

The validator is strict by design: unknown keys, unknown component types, malformed URLs, and unsafe schemes (`javascript:`, `data:text/html`, …) are all rejected before any rendering happens. Bad manifests produce error states, never blank pages or runtime crashes.

A ready-to-use system prompt describing the full component catalog is available via `generatePrompt()` from `@forgeui/runtime`, or see [`docs/components.md`](docs/components.md) for the full component reference.

---

## The persistence spectrum

The same manifest can run as a throwaway chat artifact, persist locally in the user's browser, or sync through a self-hosted server — without changing the manifest format. You pick where on the spectrum an app lives; Forge handles the plumbing.

| Ring | Where state lives | Use case |
|---|---|---|
| 0 — Ephemeral | In-memory | Chat artifacts, previews, embeds |
| 1 — Browser | IndexedDB | Single-user apps that persist across reloads |
| 2 — Server | SQLite via `@forgeui/server` | Multi-device, shareable URLs |
| 3 — Collaborative | CRDT (planned) | Real-time multi-user editing |

See [`docs/architecture.md`](docs/architecture.md) for how the rings work and how Forge selects a persister.

---

## Safety model

Forge assumes manifest *authors* are trusted (you, your server, or an LLM running under your supervision) and that the runtime's job is to render that manifest safely. In practice:

- **Four-layer validation** — JSON Schema, URL scheme allowlist, state-path resolution, component catalog. Invalid manifests never reach the renderer.
- **XSS defense at the template layer** — rendering is Lit tagged templates, so interpolated values are escaped by the engine itself, not by an added filter.
- **No dynamic code** — the `$expr:` and `$computed:` engines are deliberately narrow. No `eval`, no `Function`, no regex, no dynamic imports.
- **Server hardening** — when running `@forgeui/server`, CORS allowlist, body size cap, per-IP rate limiting, and optional Bearer-token auth are configurable via env vars.

See [`SECURITY.md`](SECURITY.md) for the reporting process and [`docs/architecture.md`](docs/architecture.md) §4 for the full validation pipeline.

---

## Documentation

- [**Getting started**](docs/getting-started.md) — step-by-step tutorial, build a small app end to end
- [**Component catalog**](docs/components.md) — every component, every prop, every variant
- [**API reference**](docs/api-reference.md) — runtime exports, server REST API, MCP tools, manifest schema
- [**Architecture**](docs/architecture.md) — the persistence spectrum, validation pipeline, expression engine
- [**Deployment**](docs/deployment.md) — Docker, systemd, Cloudflare Workers, nginx
- [**Architecture Decisions**](docs/adr/) — the why behind the design choices

---

## Contributing

Bug reports, feature ideas, and pull requests are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for dev setup, project layout, and how to add a component. By participating, you agree to the [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Security

Please report vulnerabilities privately via [GitHub's Private Vulnerability Reporting](https://github.com/dvsklj/ForgeUI/security/advisories/new). See [`SECURITY.md`](SECURITY.md) for supported versions and response targets.

## License

MIT — see [`LICENSE`](LICENSE).
