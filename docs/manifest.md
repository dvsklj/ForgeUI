# `forgeui/1` manifest contract

A manifest is strict JSON data. Every model rejects unknown keys. It contains no HTML, Jinja,
JavaScript, CSS, Tailwind classes, URLs, SQL, file paths, or arbitrary expressions.

```json
{
  "spec": "forgeui/1",
  "metadata": {"title": "Fleet health", "description": "Current device status"},
  "design": {"name": "ops-compact", "color_mode": "system"},
  "context": {"locale": "en-US", "timezone": "UTC", "refresh_seconds": 60},
  "data": {"contract": "device-health/1", "source": "device-health"},
  "state": {
    "values": {"query": "", "page": 1},
    "writable": ["state.query", "state.page"]
  },
  "root": "page",
  "elements": {
    "page": {"type": "page", "children": ["title"]},
    "title": {"type": "heading", "props": {"text": "Fleet health", "level": 1}}
  },
  "actions": {}
}
```

Use the generated schema from `GET /api/catalog` and the example manifests as the authoritative
property-level reference. The catalog validates each element's props by its declared `type`.

## Limits and graph rules

- Encoded manifests: 256 KiB maximum.
- Elements: 80 maximum; children per element: 12 maximum; graph depth: 12 maximum.
- Actions: 40 maximum; state keys/writable paths: 32 each.
- Rendered device rows: 100 maximum; chart points: 120; chart series: 6.
- Element/action IDs are lowercase identifiers (`[a-z][a-z0-9_-]*`); state paths are declared
  `state.<key>` paths.
- `root`, all children, action references, forms, and dialog targets must exist. Cycles and
  unreachable elements are errors. A `repeat` has exactly one template child.

## Data and state

The only first-release data declaration is `device-health/1` from the trusted
`device-health` source. The manifest can reference its allowlisted data paths but cannot bind a
network endpoint or source credential. It may declare bounded UI defaults in `state.values`.
Only paths in `state.writable` may be changed by actions or controls.

Data tables, repeaters, and timelines can use an exact-match filter whose data key and writable
state path are both schema-bounded. Table columns and key/value rows can request only the fixed
renderer formats `text`, `number`, `percent`, `status`, `datetime`, `temperature`, and
`duration-ms`; arbitrary format strings remain forbidden.

## Expressions

Dynamic values use a small JSON AST, never a string language. The evaluator is pure and only sees
JSON namespaces: read-only `data.*`, declared `state.*`, repeater `item.*`, and action-only
`event.value`, `event.key`, or `event.item`.

```json
{"kind": "ref", "path": "data.summary.critical"}
```

```json
{
  "kind": "op",
  "op": "gte",
  "args": [
    {"kind": "ref", "path": "item.temperature"},
    {"kind": "literal", "value": 80}
  ]
}
```

Allowed operators are comparison, boolean, and bounded arithmetic (`eq`, `ne`, `gt`, `gte`, `lt`,
`lte`, `and`, `or`, `not`, `add`, `sub`, `mul`, `div`, `mod`, `contains`, `in`, `if`). Allowlisted
functions include formatting and collection helpers such as `percent`, `number`, `duration`,
`coalesce`, `length`, `sum`, and `avg`. Expressions are limited to depth 8 and 64 nodes.

## Actions

The discriminated action types are `set_state`, `toggle_state`, `increment_state`,
`append_collection`, `update_collection`, `delete_collection`, `refresh_source`, `open_modal`,
`close_modal`, `toast`, `submit_form`, `navigate`, and `invoke_capability`.

State actions write only declared writable paths and preserve their declared JSON type. Dialog and
form actions target registered elements. Navigation accepts only destination IDs registered by the
host policy; the reference runtime exposes `overview` and `devices`. Cards, metrics, charts,
tables, status lists, and timelines show a keyboard-accessible drill-down only when their element
declares a registered `navigate` action. Other action types remain available only through explicit
buttons and forms; unsupported action/component combinations fail validation instead of rendering
an ambiguous affordance. Capabilities are fixed identifiers (`device-note.create` and
`incident.acknowledge`) and only run if the host registers a trusted handler; an unregistered one
returns a typed denial. No action can run shell commands, SQL, arbitrary HTTP, or browser code.

## Generation and repair

Generation uses the same schema and semantic validation as API saves. The pipeline allows an
initial candidate plus no more than two repair candidates. It tracks hashes and rejects repeated
invalid output. A candidate must parse, validate, and dry-render before persistence; failures do
not alter the active or last-known-good revision.

Analytics filters, KPI metrics and structured flowchart props are documented in
[analytics authoring](analytics.md) and generated from the canonical component catalog.
