# ForgeUI Robustness & Polish — Follow-up Plan

_Status as of branch `fix/layout-robustness` (2026-04-16)._

This branch closes the biggest perceptual-quality and robustness gaps
(overlapping layout, broken Tabs/Card/Metric/Stepper, missing Repeater,
stub Chart, missing `$expr:` bindings). This doc tracks what's still
worth doing before a public release.

## Landed in this branch

- Stack / Grid / Container — layout CSS moved off `<slot>` and onto the host
  so gap, padding, grid-template-columns, and max-width actually apply.
  Direction token normalized (row/column + horizontal/vertical).
- Tabs — only the active panel is shown; tab items accept objects with
  id/label; ARIA roles; scrolls horizontally if many tabs.
- Card — title/subtitle header; body gap between children; ghost variant.
- Text — heading1/2/3, h1/h2/h3, title/subtitle, muted, label variants
  (legacy heading/subheading/body/caption/code still work); colorScheme,
  weight, align modifiers.
- Metric — string trend values (`up`/`down`/`+12%`), subtitle, unit,
  suffix, trendLabel; colored trend pill.
- Table — typed cell rendering (badge/number/date/currency/boolean) with
  status-color auto-detection; row action clicks; per-column align + width.
- Stepper — correctly-positioned connector line; larger circles.
- Repeater — new layout component that iterates `data` and renders a child
  template per item with `$item:` / `$expr:item.x` / `{{item.x}}` context.
- State bindings — `$expr:` expressions (`state.x.y | values`, pipe
  filters) + `{{…}}` template interpolation.
- Chart — minimal SVG implementation (bar, line, area, pie, donut) with
  gridlines, Y-axis labels, tooltips, legend.

## Still worth doing

### Component polish

- **Chart**: tick label collision when many categories; support
  stacked/grouped bars; area fill gradient; dark-mode contrast on slice
  borders; x-axis scale for time series.
- **Drawing**: `@click` handlers bound via Lit inside `svg` templates can
  break when shapes are re-rendered — confirm event delegation still
  works after state changes.
- **Dialog**: backdrop click closes the dialog but doesn't respect an
  `onClose` action. Add focus trap + return-focus semantics + ESC to
  close.
- **Toast**: no auto-dismiss timer, no stack (only one toast at a time).
  Add a toast queue on `<forge-app>` and a `toast` action type.
- **List**: the `<slot name="item">` composition is broken — Lit slots
  don't project `.item` / `.index` template properties into a single slot
  used for every row. Either move List to the Repeater pattern or accept
  a `renderItem` elementId prop.
- **MultiSelect**: currently renders selected tags only; no dropdown/combobox
  to pick from a list of options. Needs a popover and keyboard nav.
- **Button**: loading state + icon-only variant.
- **Table**: sort by column click; pagination; selection checkboxes; sticky
  header when overflowing.
- **Breadcrumb**: items render even when empty; add trailing chevron
  styling option; collapse to `…` when many.

### Runtime & state

- **`$expr:` parser**: current parser is single-pipeline with space-split
  args. A real expression evaluator (jsep + sandboxed visitor) would
  unlock comparisons, ternaries, arithmetic, `item.field | filter arg`.
- **Computed caching**: every `resolveRef($computed:sum:x/y)` recomputes
  from scratch; wire into TinyBase metrics/indexes so these are O(1) after
  first compute.
- **Undo/redo**: undoStack only receives full-manifest pushes from the
  runtime on `_initManifest`. Wire state mutations into the stack so a
  user can undo a row deletion.
- **Persister**: IndexedDB persister hides any error from the user; surface
  a `getPersistenceStatus()` badge and a reset path.
- **Router / activeView**: `forge-app._activeView` is set but never
  consulted by the renderer — `navigate` actions are a no-op in terms of
  what actually renders. Either drop the action type, or add a
  `renderView` path that swaps the root element id.

### Validation & authoring

- **Validator**: `validateManifest` runs but the runtime still tries to
  render on failure. For dev mode show the errors inline; for prod fail
  fast with a safe fallback.
- **Catalog prompt**: the prompt in `catalog/prompt.ts` still lists 37
  components and doesn't mention Repeater, `$expr:`, or the new Text
  variants. Refresh before shipping to LLMs.
- **JSON Schema export**: `catalogToJsonSchema()` is used by agents to
  constrain generation — regenerate after the schema additions above and
  include in the bundled catalog.

### Testing / DX

- **Visual regression**: a tiny Playwright/Puppeteer harness that loads
  each manifest in `examples/` at three surface sizes and diffs against a
  golden PNG. Would have caught the `<slot>` bug on day one.
- **Unit tests**: `resolveRef` has enough edge cases
  ($state / $computed / $item / $expr / {{…}} / literals / filters) that
  it deserves vitest coverage. Same for `executeAction` operations.
- **Manifest lint**: warn when a prop references a state path that isn't
  declared in `schema.tables` or `state`.

### Observability

- **`console.error` noise**: `forge-app` logs every validation error to
  console. Dedup, and gate behind a `debug` attribute.
- **forge-action event**: good escape hatch but there's no
  `forge-state-change` dispatcher even though the type is declared.

### Docs

- **Binding reference**: single page explaining `$state:` vs `$computed:`
  vs `$item:` vs `$expr:` vs `{{…}}` with a decision tree.
- **Component docs**: propsheet per component, generated from Zod
  schemas + JSDoc. Many components (Table, Metric, Chart) grew props in
  this branch that aren't documented anywhere.

## Pre-existing tsc noise (not regressed, not addressed here)

`npx tsc --noEmit` reports errors that existed before this branch and
are unrelated to the fixes above:

- `src/cli.ts` — unused import + missing `.default` export.
- `src/connect/index.ts` — `.properties` access on `object`.
- `src/runtime/index.ts` — `ValidationResult.warnings` missing.
- `src/server/index.ts` — unused imports.
- `src/validation/index.ts` — references `action.data` which isn't on
  `ForgeAction`.
- `src/validation/migration.ts` — unused import.

These don't block `npm run build` (esbuild ignores them) but would block
a strict-mode `tsc` build. Worth clearing in a separate pass.
