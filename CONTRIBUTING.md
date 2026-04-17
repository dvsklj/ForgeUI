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
│   │   ├── index.ts             # All 39 components in one file (by design)
│   │   └── base.ts              # ForgeElement base class
│   ├── runtime/
│   │   ├── index.ts             # ForgeAppElement (web component host)
│   │   └── expressions.ts       # $expr evaluation engine
│   ├── renderer/
│   │   └── index.ts             # Manifest → Lit template compiler
│   ├── validation/
│   │   ├── index.ts             # validateManifest() — 4-layer pipeline
│   │   ├── manifest-schema.ts   # JSON Schema definition for ForgeManifest
│   │   ├── manifest-validator.generated.ts  # Precompiled Ajv standalone validator
│   │   └── migration.ts         # Schema migrations
│   ├── state/
│   │   └── index.ts             # TinyBase store creation
│   ├── catalog/
│   │   ├── registry.ts          # Component catalog + type definitions
│   │   ├── schemas/
│   │   │   └── index.ts         # Zod schemas for component props
│   │   └── prompt.ts            # LLM system prompt generation
│   ├── tokens/
│   │   └── index.ts             # CSS design tokens
│   ├── a2ui/
│   │   └── index.ts             # A2UI adapter
│   ├── server/
│   │   ├── index.ts             # Hono HTTP server
│   │   ├── db.ts                # SQLite persistence (better-sqlite3)
│   │   └── cli.ts               # CLI entry point
│   ├── connect/
│   │   └── index.ts             # MCP connector (stdio transport)
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── __tests__/               # Test suite
│   └── cli.ts                   # CLI tool entry point
├── examples/                    # Example manifests
├── scripts/
│   ├── check-size.mjs           # IIFE gzip size budget gate
│   └── gen-validator.mjs        # Precompile Ajv standalone validator
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
6. Add Zod schema for props in `src/catalog/schemas/index.ts`
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

Four layers, all must pass:

1. **JSON Schema** (Ajv strict mode) — structure, types, required fields
2. **URL allowlisting** — scheme allowlist, event handler rejection, XSS patterns
3. **State path validation** — state paths resolve, no cycles
4. **Component catalog enforcement** — type values match registered components

When adding features that affect validation:
- Update `src/validation/manifest-schema.ts` for structural rules
- Update `src/validation/index.ts` for semantic rules
- Run `npm run gen:validator` after schema changes
- Add tests covering both valid and invalid inputs

## Testing

```bash
npm test                         # Run all tests (vitest)
npm run test:watch               # Watch mode
npm run test:coverage            # Coverage report
npm run typecheck                # TypeScript type checking
npm run ci:size                  # IIFE gzip size budget check
```

## Size budget

Forge UI enforces a gzip size ceiling on `dist/forge.js` via CI. Current ceiling: 50,000 bytes (50 KB gzip). Run locally:

    npm run ci:size

Any PR that pushes past the ceiling fails the `Enforce IIFE gzip size budget` check in GitHub Actions. The ceiling is a ratchet — it drops as the bundle shrinks. To raise it intentionally (rare), edit `BUDGET_BYTES` in `scripts/check-size.mjs` and include the bump in the same PR.

## Regenerating the validator

The Ajv validator for `ForgeManifest` is precompiled at build time into `src/validation/manifest-validator.generated.ts`. `npm run build` regenerates it automatically via the `prebuild` script. To regenerate manually after editing `src/validation/manifest-schema.ts`:

    npm run gen:validator

The generated file is checked into git so CI doesn't need to regenerate on every run.

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
