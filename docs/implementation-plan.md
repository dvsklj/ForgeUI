# Forge Implementation Plan

## Phase 1, Sprint 1 (Core Runtime) — Step-by-step

### Step 1: Project scaffolding
- package.json with exact dependencies (lit, tinybase, ajv, zod, esbuild, typescript, tsx)
- tsconfig.json targeting ES2020 + DOM
- .gitignore
- Build script (esbuild)
- Directory structure

### Step 2: Core types (src/types/)
- `manifest.ts` — Manifest, Element, Schema, Action, State types
- `component.ts` — ComponentProps base, ComponentDefinition
- `catalog.ts` — ComponentType enum (36 types), CatalogEntry

### Step 3: Zod schemas for all 36 components (src/catalog/schemas/)
- 8 Layout: Stack, Grid, Card, Container, Tabs, Accordion, Divider, Spacer
- 6 Content: Text, Image, Icon, Badge, Avatar, EmptyState
- 9 Input: TextInput, NumberInput, Select, MultiSelect, Checkbox, Toggle, DatePicker, Slider, FileUpload
- 3 Action: Button, ButtonGroup, Link
- 4 Data: Table, List, Chart, Metric
- 4 Feedback: Alert, Dialog, Progress, Toast
- 2 Navigation: Breadcrumb, Stepper
- Each schema defines props with enums, defaults, and semantic tokens

### Step 4: Design tokens + CSS (src/tokens/)
- CSS custom properties: colors, spacing, radii, typography, shadows
- Cascade layers: tokens, base, components, surfaces
- Surface variants: chat (compact), standalone (full), embed
- Dark/light mode via prefers-color-scheme

### Step 5: Base component class (src/components/base.ts)
- ForgeElement extends LitElement
- Common patterns: reactive props, event dispatching, state binding helpers
- `$state:path` resolution helper
- `$computed:expression` evaluation
- `$item:field` repeater context resolution

### Step 6: Implement all 36 components (src/components/)
- Each component: extends ForgeElement, static styles, render()
- Bind to manifest props via Zod-validated properties
- Emit forge-action events for declarative action binding

### Step 7: Catalog registry (src/catalog/registry.ts)
- Map component type strings → Lit component classes
- catalog.prompt() → LLM system prompt
- catalog.jsonSchema() → full JSON Schema for LLM structured output
- Validate component type against registry before rendering

### Step 8: State layer (src/state/)
- TinyBase store creation from manifest.schema
- State binding: $state:path → store.getValue()
- Computed values: $computed:expression → derived from store
- Repeater context: $item:field → current row data

### Step 9: Manifest parser + renderer (src/renderer/)
- Validate manifest against JSON Schema (Ajv)
- Parse flat element map
- Recursively render element tree from manifest.root
- Resolve state bindings and computed values
- Wire actions to state mutations

### Step 10: ForgeApp web component (src/runtime/)
- <forge-app> entry point
- Accept manifest as JSON string attribute or JS object property
- Surface mode: "chat" | "standalone" | "embed"
- Create TinyBase store from manifest
- Render element tree

### Step 11: Validation pipeline (src/validation/)
- Ajv schema for full manifest
- URL allowlisting
- State path validation
- Component type enforcement

### Step 12: Build + export (build.mjs)
- esbuild bundle for browser (ESM)
- Artifact mode: inline everything
- Standalone mode: external deps from CDN
- Size targets: ~40KB gzip for full Core

### Step 13: Tests (tests/)
- Manifest parsing tests
- Component rendering tests
- State binding tests
- Validation tests

### Step 14: First demo apps (examples/)
- Todo tracker (minimal manifest)
- Nutrition tracker (from architecture doc)
- Dashboard (Metric + Chart + Table)

### Step 15: Commit + push to GitHub

## Dependency order (what blocks what):

```
Types (2) → Zod schemas (3) → Base component (5) → Components (6)
Types (2) → Catalog registry (7)
Types (2) → State layer (8)
State layer (8) + Components (6) → Renderer (9)
Renderer (9) + Validation (11) → ForgeApp (10)
ForgeApp (10) → Build (12) → Tests (13) → Demos (14) → Push (15)
```

## Parallelizable work:
- Steps 3, 4, 5 can run in parallel (schemas, CSS, base class)
- Step 6 depends on step 5 but individual components are independent
- Steps 7, 8, 11 can run in parallel

## Estimated effort:
- Steps 1-2: 30 min (scaffolding + types)
- Step 3: 2-3 hours (36 Zod schemas)
- Step 4: 1 hour (design tokens + CSS)
- Step 5: 30 min (base component)
- Step 6: 4-5 hours (36 components, ~7 min each)
- Steps 7-8: 1 hour (catalog + state)
- Step 9: 1.5 hours (renderer)
- Steps 10-11: 1 hour (ForgeApp + validation)
- Steps 12-15: 1 hour (build, tests, demos, push)

**Total: ~12-14 hours of implementation**

## Commit strategy:
1. First commit: scaffolding + types + design tokens
2. Second commit: all 36 component schemas + base component
3. Third commit: all 36 components
4. Fourth commit: state + catalog + renderer + validation + ForgeApp
5. Fifth commit: build + tests + demos
