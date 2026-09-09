# Component catalog and design profiles

ForgeUI ships 55 catalog entries. The catalog is server-owned: it maps an element type to strict
Pydantic props, a fixed Jinja template, schema/prompt documentation, and allowed design profiles.
Models select a profile ID, never individual colors, fonts, classes, CSS, or SVG paths.

All profiles inherit a compact ForgeUI foundation: system typography, deep-teal accents,
cool-neutral surfaces, restrained 6 px radii, dense operational tables, and a charcoal shell. A
profile can safely alter emphasis, density, and composition without replacing that visual identity
or exposing low-level styling to a model.

## Profiles

| Profile | Intended use |
| --- | --- |
| `ops-compact` | Dense fleet monitoring and operational triage. |
| `signal-cards` | KPI- and chart-forward health summaries. |
| `executive-summary` | Spacious high-level summaries with non-data layout/content controls. |
| `calm-neutral` | Quiet, detail-oriented status views. |

Each profile has trusted light, dark, and system-mode styling. Data-rich components are compatible
with `ops-compact`, `signal-cards`, and `calm-neutral`; the semantic validator rejects an
incompatible `executive-summary` combination.

## Catalog

| Group | Types |
| --- | --- |
| Structure | `page`, `page-header`, `container`, `stack`, `inline`, `grid`, `grid-item`, `card`, `card-header`, `card-body`, `card-footer`, `content-group`, `disclosure`, `section`, `divider`, `repeat` |
| Content | `heading`, `text`, `badge`, `icon`, `key-value`, `metric`, `alert`, `progress`, `empty-state` |
| Data and charts | `table`, `status-list`, `timeline`, `sparkline`, `line-chart`, `bar-chart`, `donut-chart`, `aggregate-metric`, `mermaid`, `sankey` |
| Controls | `button`, `modal`, `form`, `field-group`, `field`, `text-input`, `textarea`, `number-input`, `select`, `radio-group`, `checkbox`, `toggle`, `search`, `tabs`, `date-range`, `breadcrumbs`, `pagination`, `toast` |
| Assets | `image`, `file-upload` |

`image` and `file-upload` use constrained catalog props; they do not create a general remote-media
or filesystem escape hatch. Icons are names from a fixed catalog. Charts are trusted server SVG
with bounded numeric data and accessible summaries, not model-authored SVG.

The fixed icon catalog and trusted shell controls use selected 24 px outline paths from
[Heroicons](https://github.com/tailwindlabs/heroicons). Icons inherit `currentColor`, remain
legible at 16–20 px, and use consistent 1.5 px strokes. The model chooses only semantic names such
as `cpu`, `device`, or `warning`; it cannot provide SVG or path data. See
[third-party notices](../THIRD_PARTY_NOTICES.md).

Collection components, charts, and aggregate metrics support up to eight AND-combined filters
using allowlisted row fields and declared writable state. Tables, repeaters, and timelines also
retain the legacy exact-match filter. Tables support bounded server-side pagination
(5/10/25/50/100 rows); the paired `pagination` component uses the same data/filter declarations to
disable invalid page movement. Models cannot supply a predicate, callback, query language, or
arbitrary field name.

Donut charts accept one non-negative series, with one slice per row. Their legends and accessible
summaries list categories and values; `x_key` supplies category labels. Chart inspection exposes
the selected slice's value to pointer and keyboard users.

Table columns and key/value rows may select one renderer-owned display format: `text`, `number`,
`percent`, `status`, `datetime`, `temperature`, or `duration-ms`. These are fixed enum choices,
not user-defined format strings, expressions, or locale templates.

## Layout controls

Compose `page`, `container`, `stack`, `inline`, `repeat`, and `grid` with typed props. Layout props are semantic
tokens; they never contain CSS, widths, breakpoint maps, or expressions. They render through the
same trusted stylesheet in hosted documents, standalone pages, embedded fragments, and the HTML
adapter.

### Responsive grids and sizing

`grid.columns` accepts `1`, `2`, `3`, `4`, or `"auto"`; the default remains `2`. Numeric columns
retain the established responsive presets. `"auto"` uses `min_item_width` (`"sm"`, `"md"`, or
`"lg"`) and `repeat(auto-fit, ...)` internally, so cards wrap as the grid's container changes.
The preferred minimums are 12 rem, 16 rem, and 24 rem. A narrow container can shrink a single
track to fit; the mobile surface always uses one column.

```json
{
  "type": "grid",
  "props": {"columns": "auto", "min_item_width": "md", "gap": "md"},
  "children": ["summary", "details"]
}
```

For explicit compositions, set `responsive` to bounded counts at renderer-owned container widths:

```json
{"responsive": {"small": 1, "medium": 2, "large": 3}, "ratio": "equal"}
```

`ratio` is `"equal"`, `"main-start"`, or `"main-end"`. A main-column ratio is permitted only
when every responsive size has one or two columns. `main-start` gives the first track a 2:1 ratio;
`main-end` gives the second track 2:1. Use `grid-item` directly inside a grid for bounded
`column_span` and `row_span` values from 1 through 4. Spans clamp to the active column count.
Auto-fit grids require `column_span: 1`, because their track count is data-independent and may
change at any width.

### Spacing and alignment

`gap` remains the compact all-direction token (`none`, `sm`, `md`, `lg`). `gap_x` and `gap_y`
override horizontal and vertical gaps separately. `padding` uses the same four tokens. `density`
is `inherit`, `compact`, `comfortable`, or `spacious`, and adjusts the trusted spacing scale for
the subtree. Grid and stack alignment accepts `start`, `end`, `center`, and `stretch` (stack and
inline also support `baseline`). `grid.equal_height: true` gives its rows equal height and must
be paired with `align: "stretch"`.

```json
{
  "type": "grid",
  "props": {
    "responsive": {"small": 1, "medium": 2, "large": 2},
    "ratio": "main-end",
    "gap_x": "lg",
    "gap_y": "sm",
    "padding": "md",
    "density": "comfortable",
    "align": "stretch",
    "equal_height": true
  }
}
```

### Card and content grouping

Cards can keep ordinary children for a simple card. For consistent composition, use optional
`card-header`, exactly one `card-body`, and optional `card-footer`, in that order. Slot components
must be direct card children; slot mode cannot mix loose children. The body grows to align footers
across equal-height grid rows.

`content-group` associates a `description` and/or `caption` with exactly one child. It renders a
semantic `figure`/`figcaption` boundary and an `aria-describedby` relationship, keeping explanatory
text with the chart, metric, or other component it explains. Use a `stack` child when one
description should cover several pieces of content.

### Passive disclosure

`disclosure` renders native `<details>/<summary>` markup. It takes a required `title`, optional
`summary`, nested children, and an `expanded` boolean. It deliberately has no action field or
action runtime dependency. Browser keyboard behavior, focus treatment, and reduced-motion policy
come from native semantics and trusted CSS.

### Layout diagnostics

Validation reports actionable `layout_parent`, `card_slots`, `content_group_child`,
`auto_grid_span`, and `empty_layout` diagnostics. Structural mistakes are errors and prevent
persistence or rendering. `empty_layout` is a warning when a wrapper is provably empty (for
example, a card containing only a divider and a literal-hidden child); data-driven visibility is
left valid because it may produce content at runtime. Warnings remain visible in API and adapter
results while valid output can still render.

## Accessibility behavior

Trusted templates provide semantic headings, labels, tables/forms, visible focus treatment, and
native dialog behavior. The shell owns light/dark/system selection and reduced-motion behavior.
Model-authored plain text is escaped by Jinja and cannot select a template or safety filter.

For exact props and compatibility, query `GET /api/catalog`; it is generated from the same registry
the renderer and validator use.

## Analytics additions

`aggregate-metric`, structured `mermaid` flowcharts and weighted `sankey` diagrams share the
canonical catalog/schema. Sankey supports annotated acyclic flows with provider expressions,
proportional ribbons, keyboard inspection and accessible connection/node tables. Hosts loading
portable fragments must load `forgeui-charts.css` from the adapter asset list alongside the
core and layout stylesheets; hosted documents load it automatically.
Common filters apply to collection components; metrics support formatting and comparisons.
See [analytics and diagram authoring](analytics.md) for all fields and limits.
