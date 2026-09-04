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
callback. Inert exports disable controls; hosted/events surfaces wire them to the host runtime.

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
