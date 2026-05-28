# Component Catalog

All 45 manifest components available in Forge, organized by category.

---

## Structural

### Stack

Vertical or horizontal layout container.

```json
{
  "type": "Stack",
  "props": {
    "direction": "vertical",
    "gap": "md",
    "padding": "lg",
    "align": "stretch",
    "wrap": false
  },
  "children": ["child-1", "child-2"]
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `direction` | string | `"vertical"` | `"vertical"` or `"horizontal"` |
| `gap` | string | `"8"` | CSS gap value (px) |
| `padding` | string | `"0"` | CSS padding value (px) |
| `align` | string | `"stretch"` | `"start"`, `"center"`, `"end"`, `"stretch"` |
| `wrap` | boolean | `false` | Allow wrapping in horizontal mode |

### Grid

CSS Grid container.

```json
{
  "type": "Grid",
  "props": { "columns": 3, "gap": "md" },
  "children": ["a", "b", "c"]
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | number | `2` | Number of grid columns |
| `gap` | string | `"16"` | CSS gap value |

### Card

Bordered container with optional title/subtitle.

```json
{
  "type": "Card",
  "props": { "title": "Section", "subtitle": "Description" },
  "children": ["content"]
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | — | Card heading |
| `subtitle` | string | — | Card subheading |

### Container

Slot container for use inside Tabs and Modals.

```json
{
  "type": "Container",
  "props": { "slot": "tab-1", "padding": "md" },
  "children": ["content"]
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `slot` | string | — | Slot name (must match tab/modal slot ID) |
| `padding` | string | `"0"` | Inner padding |

### ButtonGroup

Horizontal button layout.

```json
{
  "type": "ButtonGroup",
  "props": {},
  "children": ["btn-1", "btn-2"]
}
```

### Divider

Horizontal separator line.

```json
{ "type": "Divider", "props": { "variant": "solid" } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | `"solid"` | `"solid"`, `"dashed"`, `"dotted"` |

### Spacer

Empty space element.

```json
{ "type": "Spacer", "props": { "height": "lg" } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | string | `"16"` | Height in px |
| `width` | string | — | Width in px (for horizontal layouts) |

---

## Data Display

### Table

Data table with typed columns, optional search, sorting, and pagination.

```json
{
  "type": "Table",
  "props": {
    "data": { "$expr": "state.data.items | values" },
    "columns": [
      { "key": "name", "label": "Name", "type": "text", "sortable": true },
      { "key": "status", "label": "Status", "type": "badge", "badgeMap": { "active": "success", "inactive": "error" } },
      { "key": "count", "label": "Count", "type": "number" }
    ],
    "searchable": true,
    "pageSize": 10,
    "selectable": true
  }
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | array or expr | `[]` | Array of row objects |
| `columns` | array | `[]` | Column definitions |
| `searchable` | boolean | `false` | Show a table-wide search input |
| `pageSize` | number | `0` | Rows per page; `0` disables pagination |
| `selectable` | boolean | `false` | Enable row selection |
| `rowAction` | string | — | Action dispatched when a row is clicked or keyboard-activated |
| `caption` | string | — | Accessible table caption |

**Column definition:**

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Property name in row data |
| `label` | string | Header text |
| `type` | string | `"text"`, `"number"`, `"badge"`, `"date"` |
| `sortable` | boolean | Enable header click sorting for this column |
| `badgeMap` | object | Value→variant mapping (only for `type: "badge"`) |

### Chart

Data visualization using recharts.

```json
{
  "type": "Chart",
  "props": {
    "chartType": "bar",
    "data": { "$expr": "state.data.revenue" },
    "xKey": "month",
    "yKey": "value",
    "color": "var(--forgeui-color-primary)",
    "yFormat": "$"
  }
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `chartType` | string | `"bar"` | `"bar"`, `"line"`, `"area"`, `"pie"` |
| `data` | array or expr | `[]` | Data points |
| `xKey` | string | — | X-axis property name |
| `yKey` | string | — | Y-axis property name |
| `color` | string | `"var(--forgeui-color-primary)"` | Primary chart color |
| `yFormat` | string | — | Y-axis prefix (e.g. `"$"`, `"%"`) |
| `height` | number | `300` | Chart height in px |

### Metric

KPI card with trend indicator.

```json
{
  "type": "Metric",
  "props": {
    "label": "Revenue",
    "value": "$299K",
    "trend": "up",
    "subtitle": "+12% vs last period",
    "unit": "USD"
  }
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | — | Metric name |
| `value` | string | — | Display value |
| `trend` | string | — | `"up"`, `"down"`, or omit |
| `subtitle` | string | — | Secondary text |
| `unit` | string | — | Unit label |

### StatCard

Compact dashboard statistic card with trend and supporting context.

```json
{
  "type": "StatCard",
  "props": {
    "label": "Revenue",
    "value": "$299K",
    "trend": "up",
    "trendLabel": "+12%",
    "subtitle": "vs last period",
    "unit": "USD"
  }
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | — | Statistic name |
| `value` | string or number | — | Display value |
| `trend` | string | — | `"up"`, `"down"`, `"positive"`, `"negative"`, `+...`, `-...`, or omit |
| `trendLabel` | string | — | Trend text, such as `"+12%"` |
| `subtitle` | string | — | Secondary context |
| `unit` | string | — | Unit label |

### KpiGrid

Responsive grid for dashboard KPI and stat cards.

```json
{
  "type": "KpiGrid",
  "props": { "columns": 4, "gap": "md" },
  "children": ["revenue", "orders", "conversion", "churn"]
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | number | auto-fit | Fixed column count; omit for responsive auto-fit |
| `gap` | string | `"md"` | CSS gap token or value |

### Text

Typography element.

```json
{ "type": "Text", "props": { "content": "Hello!", "variant": "heading1" } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | string | — | Text content |
| `variant` | string | `"body"` | `"heading1"`, `"heading2"`, `"heading3"`, `"body"`, `"muted"`, `"code"`, `"label"` |

### Badge

Status/color label.

```json
{ "type": "Badge", "props": { "text": "Active", "variant": "success" } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | string | — | Badge text |
| `variant` | string | `"info"` | `"success"`, `"warning"`, `"error"`, `"info"` |

### Progress

Progress indicator.

```json
{ "type": "Progress", "props": { "value": 75, "max": 100, "label": "Loading", "showValue": true } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | number | `0` | Current value |
| `max` | number | `100` | Maximum value |
| `label` | string | — | Label text |
| `showValue` | boolean | `false` | Show percentage |

---

## Input

### Form

Semantic submit wrapper.

```json
{ "type": "Form", "props": { "action": "saveForm" }, "children": ["email", "submit"] }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `action` | string | — | Action dispatched on submit |

### FieldGroup

Grouped form fields.

```json
{ "type": "FieldGroup", "props": { "label": "Contact", "description": "Primary details" }, "children": ["email", "phone"] }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | — | Group label |
| `description` | string | — | Help text |
| `error` | string | — | Group error text |

### TextInput

Text input field.

```json
{ "type": "TextInput", "props": { "label": "Name", "placeholder": "Enter your name", "required": true } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | — | Field label |
| `placeholder` | string | — | Placeholder text |
| `required` | boolean | `false` | Required field |
| `value` | string | — | Initial value |

### Textarea

Multi-line text field.

```json
{ "type": "Textarea", "props": { "label": "Notes", "placeholder": "Add details", "rows": 4 } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | — | Field label |
| `placeholder` | string | — | Placeholder text |
| `rows` | number | `4` | Visible text rows |
| `required` | boolean | `false` | Required field |
| `maxLength` | number | — | Maximum character count |
| `value` | string | — | Initial value |

### NumberInput

Numeric input field.

```json
{ "type": "NumberInput", "props": { "label": "Quantity", "min": 0, "max": 100, "step": 1 } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | — | Field label |
| `min` | number | — | Minimum value |
| `max` | number | — | Maximum value |
| `step` | number | `1` | Step increment |
| `value` | number | — | Initial value |

### Select

Dropdown select.

```json
{
  "type": "Select",
  "props": {
    "label": "Category",
    "options": [
      { "value": "a", "label": "Option A" },
      { "value": "b", "label": "Option B" }
    ],
    "value": "a"
  }
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | — | Field label |
| `options` | array | `[]` | `[{value, label}]` pairs |
| `value` | string | — | Selected value |

### Combobox

Text input with suggested options.

```json
{
  "type": "Combobox",
  "props": {
    "label": "Assignee",
    "options": ["Ari", "Sam"],
    "placeholder": "Type a name"
  }
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | — | Field label |
| `options` | array | `[]` | `[{value, label}]` pairs or strings |
| `placeholder` | string | — | Placeholder text |
| `value` | string | — | Current value |
| `hint` | string | — | Help text |

### RadioGroup

Single-choice radio group.

```json
{
  "type": "RadioGroup",
  "props": {
    "label": "Priority",
    "options": [
      { "value": "low", "label": "Low" },
      { "value": "high", "label": "High" }
    ],
    "value": "low"
  }
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | — | Group label |
| `options` | array | `[]` | `[{value, label}]` pairs or strings |
| `value` | string | — | Selected value |
| `hint` | string | — | Help text |

### Toggle

Switch toggle.

```json
{ "type": "Toggle", "props": { "label": "Dark Mode", "value": true, "description": "Use dark theme" } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | — | Toggle label |
| `value` | boolean | `false` | Current state |
| `description` | string | — | Help text |

### Checkbox

Checkbox input.

```json
{ "type": "Checkbox", "props": { "label": "Accept terms", "checked": false } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | — | Checkbox label |
| `checked` | boolean | `false` | Current state |

### Slider

Range slider.

```json
{ "type": "Slider", "props": { "label": "Font Size", "min": 10, "max": 24, "value": 14, "showValue": true, "unit": "px" } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | — | Slider label |
| `min` | number | `0` | Minimum value |
| `max` | number | `100` | Maximum value |
| `value` | number | `50` | Current value |
| `showValue` | boolean | `false` | Show current value |
| `unit` | string | — | Unit suffix (e.g. `"px"`, `"%"`) |
| `step` | number | `1` | Step increment |

---

## Presentation

### Button

Action button.

```json
{ "type": "Button", "props": { "label": "Save", "variant": "primary", "disabled": false } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | — | Button text |
| `variant` | string | `"secondary"` | `"primary"`, `"secondary"`, `"ghost"` |
| `disabled` | boolean | `false` | Disabled state |

### Tabs

Tabbed container.

```json
{
  "type": "Tabs",
  "props": {
    "tabs": [
      { "label": "General", "id": "general" },
      { "label": "Security", "id": "security" }
    ],
    "activeTab": "general"
  },
  "children": ["tab-general", "tab-security"]
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | array | `[]` | `[{id, label}]` tab definitions |
| `activeTab` | string | — | Initially active tab ID |

Child containers must use `"slot"` prop matching the tab ID.

### Dialog

Dialog overlay.

```json
{
  "type": "Dialog",
  "props": { "title": "Confirm", "open": false },
  "children": ["modal-content"]
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | — | Modal heading |
| `open` | boolean | `false` | Visibility state |

### Alert

Notification banner.

```json
{ "type": "Alert", "props": { "message": "Settings saved!", "variant": "success", "title": "Success" } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | string | — | Alert text |
| `variant` | string | `"info"` | `"success"`, `"warning"`, `"error"`, `"info"` |
| `title` | string | — | Optional heading |

### Error

Error boundary / fallback display for invalid manifests or failed renders.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | string | — | Error message to display |
| `details` | string | — | Optional technical details |

### Drawing

SVG drawing surface for small diagrams and custom icons. LLMs should generate `shapes` data, not raw SVG markup. See the [LLM SVG icon guide](llm-svg-icon-guide.md) for icon-specific constraints.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | number | `400` | SVG width in px |
| `height` | number | `300` | SVG height in px |
| `background` | string | `"transparent"` | SVG background color |
| `shapes` | array | `[]` | Shape records: `rect`, `circle`, `ellipse`, `line`, `text`, or `path` |

```json
{
  "type": "Drawing",
  "props": {
    "width": 24,
    "height": 24,
    "shapes": [
      { "type": "circle", "cx": 12, "cy": 12, "r": 9, "stroke": "currentColor", "strokeWidth": 2 },
      { "type": "path", "d": "M8 12l3 3 5-6", "stroke": "currentColor", "strokeWidth": 2 }
    ]
  }
}
```

---

## Design Tokens

Always use design tokens instead of raw CSS values. This ensures consistency, accessibility, and resilience across themes.

| Token Category | Values |
|---|---|
| **Spacing** | `none`, `3xs` (2px), `2xs` (4px), `xs` (8px), `sm` (12px), `md` (16px), `lg` (24px), `xl` (32px), `2xl` (48px) |
| **Colors** | `primary`, `success`, `warning`, `error`, `info`, `secondary`, `muted` |
| **Sizes** | `sm`, `md`, `lg` |
| **Radius** | `none`, `sm` (4px), `md` (8px), `lg` (12px), `full` |

**Bad practice:** `"gap": "16"`, `"padding": "24"`, `"color": "#ff0000"`
**Good practice:** `"gap": "md"`, `"padding": "lg"`, `"colorScheme": "error"`

## Responsive Guidelines

Forge components adapt automatically, but manifests should be written with mobile in mind:

- Use `KpiGrid` for dashboard KPI cards; omit `columns` when cards should auto-fit.
- Keep `Metric` and `StatCard` labels short so they wrap gracefully.
- Use `Stack` with `wrap` for horizontal button rows.
- Avoid fixed widths; let containers fill available space.

## Expressions

Use `$expr` to bind props to state data:

```
state.data.path           → access nested state
state.data.items | values → Object.values()
state.data.items | keys   → Object.keys()
state.data.items | json   → JSON.stringify()
```

Example — bind table data to a state collection:
```json
{ "data": { "$expr": "state.data.todos | values" } }
```

Example — bind a metric to a computed value:
```json
{ "value": { "$expr": "state.data.stats.total" } }
```

---

## Lifecycle

1. **Parse** — manifest JSON parsed and validated (Ajv schema + security + semantic)
2. **Mount** — `<forgeui-app>` connected to DOM, TinyBase store created with `state`
3. **Render** — element tree walked, components instantiated, props bound
4. **Update** — state changes trigger TinyBase reactivity, components re-render
5. **Destroy** — `<forgeui-app>` disconnected, store cleaned up
