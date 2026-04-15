# ForgeUI

> Dynamic web app platform for LLM-generated apps — from manifest to working app in milliseconds.

ForgeUI renders fully interactive web applications from flat, declarative JSON manifests. Any LLM generates the manifest; Forge renders it. Same manifest, same app, every time — no build step, no server required, no framework lock-in.

```html
<script type="module" src="dist/forge.js"></script>
<forge-app src='{"manifest":"0.1.0","id":"hello","root":"greeting","elements":{"greeting":{"type":"Text","props":{"content":"Hello, Forge!","variant":"heading"}}}}'></forge-app>
```

---

## Feature Highlights

- **LLM-native** — Flat JSON manifests designed for reliable AI generation
- **36 built-in components** — Layout, content, input, action, data display, feedback, and navigation
- **~40 KB gzipped** — Lit 3 + TinyBase + Ajv bundled together, zero external runtime deps
- **A2UI compatible** — Superset of Google's Agent-to-User Interface protocol
- **Reactive state** — TinyBase-powered store with `$state:`, `$computed:`, and `$item:` bindings
- **4-layer validation** — JSON Schema, URL sanitization, path verification, and cycle detection
- **Design tokens** — 40+ CSS custom properties with automatic dark-mode support
- **Three-ring architecture** — Browser-only core → self-hosted server → managed cloud edge

---

## Tech Stack

| Layer | Library | Purpose |
|-------|---------|---------|
| Rendering | [Lit 3](https://lit.dev/) (~5 KB) | Web Components |
| State | [TinyBase](https://tinybase.org/) (~6 KB) | Reactive store with persistence |
| Validation | [Ajv](https://ajv.js.org/) (~8 KB) | JSON Schema validation at runtime |
| Schemas | [Zod](https://zod.dev/) | Component prop schemas (build-time) |
| Build | [esbuild](https://esbuild.github.io/) | Bundling & minification |
| Language | TypeScript 5 | Full type safety |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (ships with Node)

### Install

```bash
git clone https://github.com/dvsklj/ForgeUI.git
cd ForgeUI
npm install
```

### Build

```bash
npm run build
```

This produces four bundles under `dist/`:

| File | Description |
|------|-------------|
| `forge.js` | **Artifact bundle** — all dependencies inlined, zero network needed |
| `forge-standalone.js` | External deps (Lit, TinyBase, Ajv) expected from CDN |
| `forge-components.js` | Components only (requires Lit + TinyBase externally) |
| `forge-catalog.js` | Zod schemas only (requires Zod externally) |

### Run in HTML

Create an `index.html` and open it in a browser — no dev server required:

```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>ForgeUI Demo</title></head>
<body>
  <script type="module" src="dist/forge.js"></script>
  <forge-app
    surface="standalone"
    src='{"manifest":"0.1.0","id":"demo","root":"greeting","elements":{"greeting":{"type":"Text","props":{"content":"Hello from Forge!","variant":"heading"}}}}'
  ></forge-app>
</body>
</html>
```

---

## Architecture

ForgeUI follows a **three-ring** design. Only Ring 1 is implemented in this repository.

### Ring 1 — Forge Core (~40 KB, browser-only, MIT)

The renderer. Ships as a single `<forge-app>` web component.

- Lit-based rendering of 36 UI components
- TinyBase reactive state with `$state:` / `$computed:` bindings
- Ajv validation pipeline (JSON Schema + URL sanitization + cycle detection)
- Zod-powered component catalog with JSON Schema export for LLM structured output
- Design tokens with automatic light / dark mode
- A2UI-compatible manifest format

### Ring 2 — Forge Server *(planned, not yet implemented)*

Self-hostable manifest storage, shareable URLs, WebSocket sync, and MCP tool integration.

### Ring 3 — Forge Cloud *(planned, commercial)*

Cloudflare edge deployment with V8 sandboxing and data residency options.

> See [docs/architecture.md](docs/architecture.md) for the full technical specification and [docs/implementation-plan.md](docs/implementation-plan.md) for the roadmap.

---

## 36 Components

| Category | Components |
|----------|-----------|
| **Layout** (8) | Stack, Grid, Card, Container, Tabs, Accordion, Divider, Spacer |
| **Content** (6) | Text, Image, Icon, Badge, Avatar, EmptyState |
| **Input** (9) | TextInput, NumberInput, Select, MultiSelect, Checkbox, Toggle, DatePicker, Slider, FileUpload |
| **Action** (3) | Button, ButtonGroup, Link |
| **Data Display** (4) | Table, List, Chart, Metric |
| **Feedback** (4) | Alert, Dialog, Progress, Toast |
| **Navigation** (2) | Breadcrumb, Stepper |

Each component is a Lit web component registered as `<forge-{name}>` (e.g., `<forge-stack>`, `<forge-text>`). All extend the shared `ForgeElement` base class which provides store access, prop resolution, and action dispatch.

---

## Manifest Format

Manifests use a **flat, ID-based** structure. LLMs handle flat maps more reliably than deeply nested trees.

```json
{
  "manifest": "0.1.0",
  "id": "my-app",
  "root": "shell",
  "schema": {
    "version": 1,
    "tables": {
      "items": {
        "columns": {
          "name": { "type": "string" }
        }
      }
    }
  },
  "state": {
    "view/active": "list"
  },
  "elements": {
    "shell": {
      "type": "Stack",
      "props": { "spacing": "md" },
      "children": ["title", "list"]
    },
    "title": {
      "type": "Text",
      "props": { "content": "My App", "variant": "heading" }
    },
    "list": {
      "type": "List",
      "props": { "dataPath": "items" }
    }
  },
  "actions": {
    "add-item": {
      "type": "mutateState",
      "path": "items",
      "operation": "append"
    }
  }
}
```

### State References

| Syntax | Description | Example |
|--------|-------------|---------|
| `$state:path` | Read a value from the store | `$state:todos/row123/title` |
| `$computed:sum:table/column` | Computed aggregate (sum) | `$computed:sum:orders/amount` |
| `$computed:avg:table/column` | Computed aggregate (avg) | `$computed:avg:scores/value` |
| `$computed:count:table` | Row count | `$computed:count:todos` |
| `$item:field` | Current item in a repeater | `$item:title` |

### Action Types

| Type | Description |
|------|-------------|
| `mutateState` | Modify the store — operations: `set`, `append`, `delete`, `update`, `increment`, `decrement`, `toggle` |
| `navigate` | Switch the active view |
| `openDialog` / `closeDialog` | Show or hide a dialog element |
| `toast` | Display a notification |
| `callApi` | HTTP request *(Ring 2+)* |
| `custom` | Extension point for user-defined logic |

### Example: Todo Tracker

A complete working example is included at [`examples/todo-tracker.json`](examples/todo-tracker.json). Load it by pasting the JSON into the `src` attribute of `<forge-app>`.

---

## `<forge-app>` API

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | `string` | — | Manifest as a JSON string |
| `manifest` | `object` | — | Manifest as a JavaScript object (alternative to `src`) |
| `surface` | `'chat' \| 'standalone' \| 'embed'` | `'standalone'` | Rendering context — adjusts spacing, height, and chrome |
| `color-scheme` | `'light' \| 'dark'` | auto | Color theme; auto-detects system preference when omitted |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getStore()` | `Store` | TinyBase store instance |
| `getManifest()` | `ForgeManifest` | Parsed manifest object |
| `getValidation()` | `ValidationResult` | Validation errors / warnings |
| `dispatchAction(actionId, payload?)` | `void` | Trigger a declared action programmatically |
| `static catalogPrompt()` | `string` | System prompt describing the manifest format for LLMs |
| `static catalogJsonSchema()` | `object` | JSON Schema for manifest (use with LLM structured output) |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `forge-ready` | `{ manifest }` | Manifest parsed and rendered |
| `forge-error` | `{ errors }` | Validation failed |
| `forge-action` | `{ actionId, payload }` | User-triggered action |

---

## Project Structure

```
ForgeUI/
├── src/
│   ├── index.ts                  # Public API entry point
│   ├── runtime/index.ts          # <forge-app> web component
│   ├── types/index.ts            # TypeScript interfaces & type unions
│   ├── state/index.ts            # TinyBase state management
│   ├── validation/index.ts       # 4-layer validation pipeline
│   ├── renderer/index.ts         # Manifest → Lit HTML renderer
│   ├── tokens/index.ts           # Design tokens & CSS custom properties
│   ├── components/
│   │   ├── base.ts               # ForgeElement base class
│   │   └── index.ts              # All 36 Lit web components
│   └── catalog/
│       ├── registry.ts           # Component registry, LLM prompt & JSON Schema export
│       └── schemas/index.ts      # Zod schemas for all 36 component prop types
├── docs/
│   ├── architecture.md           # Full technical specification
│   └── implementation-plan.md    # Phase 1 roadmap
├── examples/
│   └── todo-tracker.json         # Complete example manifest
├── build.mjs                     # esbuild build script
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies & scripts
```

---

## Development Workflow

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build all four bundles (`artifact`, `standalone`, `components`, `catalog`) |
| `npm run build:artifact` | Build only the all-in-one artifact bundle (`dist/forge.js`) |
| `npm run dev` | Start the development server *(Ring 2 — not yet implemented)* |
| `npm test` | Run tests with Node's built-in test runner via `tsx` |
| `npm run typecheck` | Run `tsc --noEmit` to check types without emitting files |
| `npm run size` | Build and report the gzipped size of `dist/forge.js` |

### Build Modes

The build script (`build.mjs`) supports three modes:

```bash
# Build everything (default)
npm run build

# Artifact only — all deps inlined, zero network
node build.mjs --mode=artifact

# Standalone only — expects lit, tinybase, ajv from CDN
node build.mjs --mode=standalone

# Development build (source maps, no minification)
node build.mjs --dev
```

### Type Checking

```bash
npm run typecheck
```

### Running Tests

```bash
npm test
```

Tests use Node's built-in `node --test` runner with `tsx` for TypeScript support. Test files are expected in `tests/**/*.test.ts`.

---

## Configuration

ForgeUI's core (Ring 1) is entirely browser-based and does not require any environment variables or server-side configuration. The build script uses `process.env.NODE_ENV` internally (set to `"production"` during builds) — no manual setup is needed.

### Design Tokens

The built-in design system exposes 40+ CSS custom properties on the `<forge-app>` shadow root. Override them to theme your app:

```css
forge-app {
  --forge-color-primary: #2563eb;
  --forge-color-surface: #ffffff;
  --forge-radius-md: 8px;
  --forge-space-md: 16px;
  --forge-font-family: 'Inter', sans-serif;
}
```

**Token categories:** colors (primary, success, warning, error, info, text, surface, border), spacing (3xs–2xl), typography (font family, sizes xs–3xl, weights, line heights), border radii (none–full), shadows (sm–lg), transitions (fast–slow), and sizing (icon, input height, button height, touch target).

---

## Validation

ForgeUI applies a strict multi-layer validation pipeline before rendering any manifest:

1. **JSON Schema** — Structural validation via Ajv
2. **URL sanitization** — Blocks dangerous schemes (`javascript:`, `data:text/html`, `vbscript:`, `file:`)
3. **State path validation** — Verifies `$state:` and `$computed:` references
4. **Component catalog enforcement** — Rejects unknown component types
5. **Cross-reference checks** — Root element exists, all `children` IDs resolve
6. **Cycle detection** — Prevents circular element references
7. **Size warnings** — Flags manifests exceeding 100 KB

Access validation results programmatically:

```js
const app = document.querySelector('forge-app');
const result = app.getValidation();
// { valid: boolean, errors: [{ path, message, severity }] }
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Blank screen after loading** | Open the browser console — look for `forge-error` events. Check that `src` contains valid JSON and that the `root` ID exists in `elements`. |
| **Component not rendering** | Verify the `type` field matches one of the 36 supported component types (case-sensitive, e.g., `TextInput` not `textinput`). |
| **State bindings not updating** | Ensure paths use the `$state:table/rowId/column` format and that matching tables are declared in `schema`. |
| **Build fails** | Run `npm install` first. Requires Node ≥ 18. |
| **Bundle too large** | Use `npm run size` to check gzipped size. Use `--mode=standalone` if external deps are acceptable. |

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Install dependencies (`npm install`)
4. Make your changes and ensure they pass type checking (`npm run typecheck`)
5. Run the test suite (`npm test`)
6. Commit with a clear message and open a pull request

Please keep PRs focused. For large changes, open an issue first to discuss the approach.

---

## License

[MIT](https://opensource.org/licenses/MIT) — see `package.json` for details.

> **Note to maintainers:** Consider adding a `LICENSE` file to the repository root for clarity.
