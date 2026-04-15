# Contributing to Forge UI

## Development Setup

```bash
git clone <repo-url> && cd forgeui
npm install
npm run build        # Build all packages
npm test             # Run test suite
npm run validate     # Validate example manifests
```

## Project Structure

```
forgeui/
├── src/
│   ├── index.ts                 # Runtime entry — IIFE bundle
│   ├── components/
│   │   ├── index.ts             # Component barrel export
│   │   ├── base.ts              # ForgeElement base class
│   │   ├── structural/          # Stack, Grid, Card, Container, etc.
│   │   ├── data/                # Table, Chart, Metric
│   │   ├── input/               # TextInput, Select, Toggle, Slider, etc.
│   │   └── presentation/        # Button, Tabs, Modal, Alert, Badge, Text
│   ├── runtime/
│   │   ├── index.ts             # ForgeAppElement (web component host)
│   │   └── expressions.ts       # $expr evaluation engine
│   ├── renderer/
│   │   └── index.ts             # Manifest → Lit template compiler
│   ├── validation/
│   │   ├── index.ts             # validateManifest() — 3-layer pipeline
│   │   └── schemas.ts           # JSON Schema definitions
│   ├── store/
│   │   └── index.ts             # TinyBase store creation
│   ├── catalog/
│   │   └── registry.ts          # Component catalog + type definitions
│   ├── server/
│   │   ├── index.ts             # Hono HTTP server
│   │   ├── db.ts                # SQLite persistence (better-sqlite3)
│   │   └── cli.ts               # CLI entry point
│   ├── connect/
│   │   └── index.ts             # MCP connector (stdio transport)
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   └── cli.ts                   # CLI tool entry point
├── examples/                    # Example manifests
├── tests/                       # Test suite
├── build.mjs                    # esbuild build script
├── package.json
└── tsconfig.json
```

## Build Modes

```bash
npm run build                    # All bundles
npm run build -- --mode=artifact # forge.js only (IIFE, all inline)
npm run build -- --mode=server   # forge-server.js only
npm run build -- --mode=cli      # forge.mjs only
npm run build -- --mode=connect  # forge-connect.mjs only
npm run build -- --dev           # Dev mode (sourcemaps, no minify)
```

## Adding a Component

1. Create `src/components/<category>/<name>.ts`
2. Extend `ForgeElement` from `../base.js`
3. Register with `customElements.define()`
4. Export from `src/components/<category>/index.ts`
5. Add to component catalog in `src/catalog/registry.ts`
6. Add JSON Schema for props in `src/validation/schemas.ts`
7. Add example usage to `examples/`

Example:

```typescript
import { html, css } from 'lit';
import { ForgeElement } from '../base.js';

export class ForgeMyComponent extends ForgeElement {
  static styles = css`
    :host { display: block; }
  `;

  render() {
    const label = this.getProp('label', 'Default');
    return html`<div class="my-component">${label}</div>`;
  }
}

customElements.define('forge-my-component', ForgeMyComponent);
```

## Validation Pipeline

Three layers, all must pass:

1. **Schema** (Ajv strict mode) — structure, types, required fields
2. **Security** — URL schemes, event handlers, XSS patterns
3. **Semantic** — state paths resolve, catalog membership, no cycles

When adding features that affect validation:
- Update `src/validation/schemas.ts` for structural rules
- Update `src/validation/index.ts` for semantic rules
- Add tests covering both valid and invalid inputs

## Testing

```bash
npm test                         # Run all tests
node test-manifests.mjs          # Validate example manifests
node bench.mjs                   # Performance benchmarks
```

## Code Style

- TypeScript strict mode
- No `any` in public APIs (use `unknown` or proper types)
- All components must work with zero external CSS
- Mobile-first responsive design (components adapt to container width)
- All string interpolation in templates auto-escaped by Lit

## Manifest Version

Current version: `0.1.0`

Version bump when:
- Adding/removing component types → minor bump
- Changing prop semantics → minor bump
- Removing fields or breaking changes → major bump
