# Analytics, KPIs and diagrams: agent reference

Use the canonical catalog/schema and `examples/manifests/sales-analytics.json` with the contract
in `examples/analytics_host.py`. The generation prompt includes these semantics automatically.
Use `calm-neutral`, `signal-cards` or `ops-compact` for detailed charts/tables; the existing
`executive-summary` profile intentionally excludes detailed data components.

## Statistics and scope

`metric` displays provider-computed totals. `format` is `text` (compatible default), `number`,
or `percent` (fraction 0.25 displays as 25%). Optional numeric `comparison` displays an absolute
difference, never a relative percentage or an inferred good/bad status. For percent metrics,
the difference is in percentage points. Use `detail` to name the baseline and reporting period.
Always label currency/unit, scope, period and data freshness. Do not total incompatible currencies.

`aggregate-metric` takes `label`, a `data` reference, `operation` (`count`, `sum`, `mean`, `min`,
`max`), optional `value_key` (required except count), `format` (`number` or `percent`) and `filters`.
It takes the first 100 input rows, applies filters, then computes the statistic, and is explicitly labelled as a
filtered sample. Missing, boolean and non-finite numeric values are excluded; an empty numeric
set shows an em dash and count shows zero. Overflow is unavailable, never a plausible total.
Bar/line/area charts place signed values on a zero-based signed scale. Donut charts accept
one series of non-negative row values and render proportional slices; negative parts are rejected.
Use `x_key` for slice labels; the legend and data summary list each category and its value.
For full-dataset statistics, weighted means, percentiles, time bucketing, or large datasets, aggregate
in the authorized host provider and expose typed results. Never infer a full total from a sample.

## Interactive filtering

Tables, charts, sparklines, status lists, timelines, repeats, pagination and aggregate metrics
accept up to eight AND-combined filters:

```json
{"filters": [{"key": "region", "state_path": "state.region", "operator": "eq"}]}
```

Operators: `eq` typed equality, `contains` Unicode case-insensitive text search, `in` list
membership, `gte`/`lte` finite numeric bounds. Empty string, null, empty list and `all` disable
a filter. False and zero remain active values. Declare writable state, connect a `select`,
`search`, numeric input or host control, and reuse filters on all related components including
pagination. Legacy `filter_state` + `filter_key` remain supported and combine with the new list.
Row keys must belong to the registered contract. Filtering applies to the first 100 rows before
pagination; hosts must query/aggregate upstream to explore larger datasets.

## Sankey diagrams

Use `sankey` for quantitative flows, with structured `nodes` and `links`; use `mermaid` for
unweighted process connections. Required annotations are `title`, `description` (scope, reporting
period and freshness) and `unit` (one common unit for every link). A minimal props object is:

```json
{
  "title": "Material allocation",
  "description": "Synthetic example · September 2026 · measured at period end",
  "unit": "kg",
  "nodes": [
    {"id": "input", "label": "Material input"},
    {"id": "used", "label": "Production"},
    {"id": "recovered", "label": "Recovered"}
  ],
  "links": [
    {"source": "input", "target": "used", "value": 75, "label": "Manufacturing"},
    {"source": "input", "target": "recovered", "value": 25}
  ]
}
```

Declare 1–40 nodes (`id`, `label`) and up to 80 links (`source`, `target`, `value`, optional
`label`). IDs and source-target pairs must be unique and endpoints must exist. Cycles, including
self links, are rejected before persistence/rendering. Aggregate parallel flows upstream, or
use distinct intermediate nodes when the paths have separate meaning. Disconnected graphs and
empty link lists are valid.

Values are numbers or existing typed ForgeUI expressions referencing approved data/state paths.
Every resolved value must be finite, non-boolean, between zero and 1,000,000,000 inclusive.
Provider values are checked again before geometry; invalid data produces a component-local error
and a render issue, preserving siblings. Unknown data paths fail normal manifest validation.
No raw Sankey/Mermaid syntax, SVG paths, colors, URLs, callbacks or layout code are accepted.

The trusted renderer uses deterministic left-to-right layers and a shared proportional width
scale. Ribbons blend from their source node color to their destination node color using trusted,
theme-aware SVG gradients in a desaturated palette. Very pale ribbons have slim, rounded node bars
and contrasting labels, with stronger emphasis on hover/focus; manifests cannot choose paint values.
Node bars/labels represent
`max(inflow, outflow)`; the Flow data tables report both totals
and their difference. Intermediate-node imbalance is displayed without normalization or invented
balancing links. Do not sum link values across stages as an overall total: that double-counts
the same flow. Zero links remain in the connection table and have no visible ribbon; no positive
values produces an explicit empty state. Extremely small relative flows may be subpixel but
remain in annotations and tables. The layout is bounded and deterministic, not a crossing optimizer;
for dense graphs, order nodes/links intentionally and simplify upstream where appropriate.

Hover or focus a ribbon to inspect its endpoints, quantity, unit and annotation using the existing
chart tooltip runtime. Full labels and exact displayed quantities also remain available in native
SVG titles and keyboard-expandable Flow data tables without JavaScript, including inert exports.
The diagram and tables scroll within their containers on narrow screens. Trusted light/dark
tokens provide colors and visible focus, and the diagram introduces no animation or network
dependency. `action` supports the usual host-registered whole-diagram drilldown.

Sankey has no local row filters: topology is declared in the manifest and values come from typed
expressions or upstream aggregation. The reference `sales-analytics.json` uses provider fields in
`SalesSnapshot.revenue_flow` from `examples/analytics_host.py`, explicitly independent of the
regional row filter. Use fresh immutable manifest revisions when the topology changes. Include
`forgeui-charts.css` with portable fragments (returned in `RenderResult.assets`); the hosted shell
loads and versions it automatically.

## Mermaid-compatible flowcharts

`mermaid` is a structured component, not a raw language escape hatch. Props are `title`,
`direction` (TB/BT/LR/RL), `nodes` (up to 40: id, label, optional group), and `edges` (up to 80:
source, target, optional label). Duplicate IDs and dangling edges fail validation. Cycles,
self edges and disconnected graphs render without network dependencies. The HTML adapter uses
trusted SVG and an accessible connection table with full labels, including edge labels; it
is not Mermaid.js and does not promise Mermaid.js layout parity. Dense graphs use a simple lane
layout and scroll. No CDN, JavaScript parser, or remote rendering service is required.

`filter_state` binds a writable state value to node groups and removes incident edges of hidden
nodes. `state_path` provides a keyboard-accessible node selector. Other components can reference
that selection through the existing state expressions/filters. Hosts may use normal typed
ForgeUI actions for related controls. Node selection is a labelled select, not a Mermaid click
callback. Inert exports disable state, action and navigation controls while keeping headings,
tables, diagram content and expandable chart summaries accessible. Hosted/events surfaces wire
controls to the host runtime.

`HtmlRendererAdapter` merges supplied state over manifest defaults, including when the host only
supplies data. It preserves the caller's context. Typed Pydantic rows are normalized before local
filtering and aggregation. Invalid component data yields a local error and a render issue while
unaffected sibling components remain available.
Portable fragments include their own responsive container and selected design profile; the host
continues to provide the stylesheet and theme. Direct renderer users can disable controls with
`Renderer(interactive=False)`.

Host-side `forgeui.mermaid.import_mermaid` accepts a bounded subset: flowchart/graph headers,
ID or ID[plain label] declarations, one directed `-->` edge per statement and optional `|label|`.
It returns validated DiagramProps and an explicit corrections tuple. Safe corrections remove
an enclosing Mermaid fence and normalize `graph` and `TD`. IDs are remapped deterministically.
`export_mermaid` encodes punctuation in labels and emits flowchart syntax.

Unsupported syntax (sequence/Gantt diagrams, subgraphs, shapes, styles, init directives,
callbacks and links) fails with `MermaidImportError` carrying code and statement number. Never
repair by deleting security checks or feeding rejected input to a browser. Convert supported
intent into structured nodes/edges or ask the generator to repair against the catalog.

Reference: [official Mermaid flowcharts](https://mermaid.js.org/syntax/flowchart.html).
Mermaid's own strict mode disables click callbacks; ForgeUI interactions instead use the trusted
state/action boundary. No implementation can guarantee that every arbitrary Mermaid input works.
