# Component Catalog

All 39 components available in the Forge runtime, organized by category.

---

## Structural

### Stack

Vertical or horizontal layout container.

```json
{
  "type": "Stack",
  "props": {
    "direction": "vertical",
    "gap": "16",
    "padding": "24",
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
  "props": { "columns": 3, "gap": "16" },
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
  "props": { "slot": "tab-1", "padding": "16" },
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
{ "type": "Spacer", "props": { "height": "24" } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | string | `"16"` | Height in px |
| `width` | string | — | Width in px (for horizontal layouts) |

---

## Data Display

### Table

Data table with typed columns.

```json
{
  "type": "Table",
  "props": {
    "data": { "$expr": "state.data.items | values" },
    "columns": [
      { "key": "name", "label": "Name", "type": "text" },
      { "key": "status", "label": "Status", "type": "badge", "badgeMap": { "active": "success", "inactive": "error" } },
      { "key": "count", "label": "Count", "type": "number" }
    ],
    "selectable": true
  }
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | array or expr | `[]` | Array of row objects |
| `columns` | array | `[]` | Column definitions |
| `selectable` | boolean | `false` | Enable row selection |

**Column definition:**

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Property name in row data |
| `label` | string | Header text |
| `type` | string | `"text"`, `"number"`, `"badge"`, `"date"` |
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
    "color": "#6366f1",
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
| `color` | string | `"#6366f1"` | Primary chart color |
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

### ProgressBar

Progress indicator.

```json
{ "type": "ProgressBar", "props": { "value": 75, "max": 100, "label": "Loading", "showValue": true } }
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | number | `0` | Current value |
| `max` | number | `100` | Maximum value |
| `label` | string | — | Label text |
| `showValue` | boolean | `false` | Show percentage |

---

## Input

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

### Modal

Dialog overlay.

```json
{
  "type": "Modal",
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

(tier: TBD — pending review)

Error boundary / fallback display for invalid manifests or failed renders.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | string | — | Error message to display |
| `details` | string | — | Optional technical details |

### Drawing

(tier: TBD — pending review)

Canvas-based drawing surface.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | number | `400` | Canvas width in px |
| `height` | number | `300` | Canvas height in px |
| `tool` | string | `"pen"` | Drawing tool (`"pen"`, `"eraser"`) |
| `color` | string | `"#000"` | Stroke color |

---

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
2. **Mount** — `<forge-app>` connected to DOM, TinyBase store created with `state`
3. **Render** — element tree walked, components instantiated, props bound
4. **Update** — state changes trigger TinyBase reactivity, components re-render
5. **Destroy** — `<forge-app>` disconnected, store cleaned up
