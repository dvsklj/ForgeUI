# Contributing to Forge UI

Thanks for your interest in Forge UI. This guide covers what you need to hack on the project itself — if you're looking to *use* Forge to render apps, start with the [README](README.md) and the [Getting Started guide](docs/getting-started.md) instead.

## Where to start

- **Found a bug?** Open an issue with a minimal manifest that reproduces it.
- **Have an idea?** Open an issue first to sanity-check the direction before writing code.
- **Want to add a component?** See the [Adding a Component](#adding-a-component) section below.
- **Security issue?** Please report privately via [GitHub Private Vulnerability Reporting](https://github.com/dvsklj/ForgeUI/security/advisories/new) — don't open a public issue.

All participation is under the [Code of Conduct](CODE_OF_CONDUCT.md).

## Development setup

Requires Node.js 20 or newer.

```bash
git clone https://github.com/dvsklj/ForgeUI.git && cd ForgeUI
npm install
npm run build        # Build all packages
npm test             # Run test suite
npm run validate     # Validate example manifests
```

Once built, open [`demos/index.html`](demos/index.html) via any static server (`npx serve .`) to see a live runtime.

## Project structure

```
forgeui/
├── src/
│   ├── index.ts                 # Runtime/package entry and public exports
│   ├── cli.ts                   # forgeui CLI entry point
│   ├── components/
│   │   ├── index.ts             # Component implementations in one file for now
│   │   └── base.ts              # ForgeUIElement base class
│   ├── runtime/
│   │   ├── index.ts             # <forgeui-app> web component host
│   │   ├── persister.ts         # Persistence mode selection and IndexedDB wiring
│   │   └── undo-redo.ts         # Manifest undo/redo stack
│   ├── renderer/
│   │   └── index.ts             # Manifest element tree → Lit templates
│   ├── validation/
│   │   ├── index.ts             # validateManifest(), validateManifestPatch(), extractManifest()
│   │   ├── manifest-schema.ts   # JSON Schema definition for ForgeUIManifest
│   │   └── manifest-validator.generated.ts  # Precompiled Ajv standalone validator
│   ├── state/
│   │   └── index.ts             # TinyBase store creation, refs, expressions, actions
│   ├── catalog/
│   │   ├── registry.ts          # Component catalog + type definitions
│   │   └── prompt.ts            # LLM prompt and JSON schema generation
│   ├── tokens/
│   │   └── index.ts             # CSS design tokens and surface styles
│   ├── a2ui/
│   │   └── index.ts             # A2UI adapter
│   ├── server/
│   │   ├── index.ts             # Hono HTTP server
│   │   ├── db.ts                # SQLite persistence (better-sqlite3)
│   │   ├── body.ts              # Bounded JSON reader
│   │   ├── client-ip.ts         # Trusted proxy/client IP helpers
│   │   ├── rate-limit.ts        # Token-bucket rate limiter
│   │   └── cli.ts               # forgeui-server CLI entry point
│   ├── connect/
│   │   └── index.ts             # MCP connector (stdio transport)
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   └── __tests__/               # Test suite
├── examples/                    # Example manifests
├── demos/                       # Browser demos
├── packages/                    # Publishable package staging directories
├── scripts/
│   ├── check-size.mjs           # IIFE gzip size budget gate
│   ├── gen-validator.mjs        # Precompile Ajv standalone validator
│   ├── validate-examples.mjs    # Example manifest validation
│   └── pack-smoke.mjs           # Package smoke tests
├── build.mjs                    # esbuild build script
├── package.json
└── tsconfig.json
```

## Build modes

```bash
npm run build                    # All bundles
npm run build -- --mode=artifact # dist/forgeui.js only (IIFE, all inline)
npm run build -- --mode=standalone # dist/forgeui-standalone.js only
npm run build -- --mode=server   # dist/forgeui-server.js only
npm run build -- --mode=server-cli # dist/forgeui-cli.js only
npm run build -- --mode=cli      # dist/forgeui.mjs only
npm run build -- --mode=connect  # dist/forgeui-connect.mjs only
npm run build -- --mode=types    # Type declarations only
npm run build -- --dev           # Dev mode (sourcemaps, no minify)
```

## Adding a component

Component implementations currently live in `src/components/index.ts`, and valid manifest type strings are registered in `src/catalog/registry.ts` plus `src/types/index.ts`.

1. Add or update the component class in `src/components/index.ts`.
2. Extend `ForgeUIElement` from `./base.js`.
3. Register with `customElements.define()`.
4. Add the manifest component type to `src/types/index.ts`.
5. Add the component to `componentCategories` and `componentsByCategory` in `src/catalog/registry.ts`.
6. Add renderer dispatch in `src/renderer/index.ts`.
7. Add docs in `docs/components.md`.
8. Add example usage to `examples/` or `demos/` where useful.

Example:

```typescript
import { html, css } from 'lit';
import { ForgeUIElement } from './base.js';

export class ForgeMyComponent extends ForgeUIElement {
  static get styles() { return css`
    :host { display: block; }
  `; }

  render() {
    const label = this.getString('label', 'Default');
    return html`<div class="my-component">${label}</div>`;
  }
}

customElements.define('forgeui-my-component', ForgeMyComponent);
```

## Validation pipeline

`validateManifest()` runs layered checks:

1. **JSON Schema** — top-level structure, element envelope shape, component type enum, required fields.
2. **URL and value checks** — dangerous URL schemes, event handler prop names, obvious script/object/embed injection patterns.
3. **State reference checks** — `$state:` and `$computed:` sanity checks where state/schema information is available.
4. **Component catalog enforcement** — type values match registered manifest component types.
5. **Reference checks** — root exists, child IDs exist, and the element graph has no cycles.
6. **Size warning** — manifests above 100 KB produce a warning.

When adding features that affect validation:

- Update `src/validation/manifest-schema.ts` for structural rules.
- Update `src/validation/index.ts` for semantic rules.
- Run `npm run gen:validator` after schema changes.
- Add tests covering both valid and invalid inputs.

## Testing

```bash
npm test                         # Run all tests (vitest)
npm run test:watch               # Watch mode
npm run test:coverage            # Coverage report
npm run typecheck                # TypeScript type checking
npm run ci:size                  # IIFE gzip size budget check
npm run e2e                      # Playwright browser tests
npm run smoke:pack               # Package smoke tests
npm run gauntlet                 # LLM/app generation gauntlet
```

## Size budget

Forge UI enforces a gzip size ceiling on `dist/forgeui.js` via CI. Current ceiling: 50,000 bytes (50 KB gzip). Run locally:

```bash
npm run ci:size
```

Any PR that pushes past the ceiling fails the size check. The ceiling is a ratchet — it drops as the bundle shrinks. To raise it intentionally, edit `BUDGET_BYTES` in `scripts/check-size.mjs` and include the bump in the same PR.

## Regenerating the validator

The Ajv validator for `ForgeUIManifest` is precompiled into `src/validation/manifest-validator.generated.ts`. `npm run build` regenerates it automatically via the `prebuild` script. To regenerate manually after editing `src/validation/manifest-schema.ts`:

```bash
npm run gen:validator
```

The generated file is checked into git so CI does not need to regenerate on every run.

## Code style

- TypeScript strict mode.
- No `any` in public APIs unless unavoidable at integration boundaries.
- All components must work with zero external CSS.
- Mobile-first responsive design.
- All string interpolation in Lit templates must rely on Lit escaping, not manual `innerHTML`.
- Avoid runtime code execution from manifests. Expressions must remain constrained and auditable.

## Manifest version

Current version: `0.1.0`.

Version bump when:

- Adding/removing component types → minor bump.
- Changing prop semantics → minor bump.
- Removing fields or other breaking changes → major bump.
