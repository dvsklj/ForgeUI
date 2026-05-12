# Component Catalog

Forge currently accepts **38 manifest-addressable component types**. The runtime also has an internal `forgeui-error` fallback component, but `Error` is not a valid manifest `type`.

Component type validation is driven by the catalog registry, and rendering is dispatched through a static renderer map. Element envelopes are flat JSON records:

```json
{
  "type": "Stack",
  "props": { "gap": "md", "padding": "lg" },
  "children": ["title", "actions"],
  "visible": { "$when": { "path": "ready", "eq": true } }
}
```

`props` are component-specific and intentionally open at the manifest-schema level. Most components accept state references in props.

---

## Layout

### Stack

Flex layout container.

```json
{
  "type": "Stack",
  "props": {
    "direction": "vertical",
    "gap": "md",
    "spacing": "md",
    "padding": "lg",
    "align": "stretch",
    "justify": "start",
    "wrap": false
  },
  "children": ["child-1", "child-2"]
}
```

Useful props: `direction` (`vertical`, `horizontal`, `column`, `row`), `gap`, `spacing`, `padding`, `align`, `justify`, `wrap`.

### Grid

CSS Grid container. Numeric `columns` values become `repeat(n, minmax(0, 1fr))`; string values pass through as a grid-template value.

```json
{
  "type": "Grid",
  "props": { "columns": 3, "gap": "md", "padding": "lg" },
  "children": ["a", "b", "c"]
}
```

Useful props: `columns`, `gap`, `padding`. Grids with 2+ numeric columns automatically collapse responsively.

### Card

Bordered content container with optional header.

```json
{
  "type": "Card",
  "props": { "title": "Section", "subtitle": "Description", "variant": "elevated" },
  "children": ["content"]
}
```

Useful props: `title`, `subtitle`, `variant` (`elevated`, `compact`, `outline`, `ghost`).

### Container

Centered width container.

```json
{
  "type": "Container",
  "props": { "maxWidth": "lg", "padding": "md" },
  "children": ["content"]
}
```

Useful props: `maxWidth` (`sm`, `md`, `lg`, `xl`, `2xl`, `full`, `none`, or a CSS width), `padding`. `slot` is also useful when `Container` is used as a tab panel child.

### Tabs

Tabbed container. Child elements are shown when their `props.slot` or position matches the active tab.

```json
{
  "type": "Tabs",
  "props": {
    "items": [
      { "id": "general", "label": "General" },
      { "id": "security", "label": "Security" }
    ],
    "activeTab": "general"
  },
  "children": ["tab-general", "tab-security"]
}
```

Aliases: `items` or `tabs`; `activeTab` or `value`.

### Accordion

Disclosure section.

```json
{
  "type": "Accordion",
  "props": { "title": "Advanced" },
  "children": ["advanced-content"]
}
```

Useful props: `title`.

### Divider

Horizontal separator.

```json
{ "type": "Divider" }
```

### Spacer

Empty spacing element.

```json
{ "type": "Spacer", "props": { "size": "lg", "height": "lg", "width": "100%" } }
```

Useful props: `size`, `height`, `width`.

### Repeater

Renders its children once per item in `props.data`. `$item:` and `item.` expressions are available inside repeated children.

```json
{
  "type": "Repeater",
  "props": {
    "data": { "$expr": "state.todos | values" },
    "emptyMessage": "No todos yet",
    "gap": "md"
  },
  "children": ["todo-row-template"]
}
```

Useful props: `data`, `emptyMessage`, `direction`, `gap`.

---

## Content

### Text

Typography element.

```json
{
  "type": "Text",
  "props": {
    "content": "Hello!",
    "variant": "heading1",
    "colorScheme": "primary",
    "align": "center",
    "weight": "bold"
  }
}
```

Useful props: `content`, `variant`, `colorScheme`, `align`, `weight`.

Common variants: `heading1`, `heading2`, `heading3`, `heading`, `subheading`, `body`, `caption`, `muted`, `code`, `label`. Aliases such as `h1`, `h2`, `title`, `paragraph`, and `secondary` are normalized.

### Image

Image element.

```json
{ "type": "Image", "props": { "src": "https://example.com/image.jpg", "alt": "Description", "fit": "cover" } }
```

Useful props: `src`, `alt`, `fit`.

### Icon

Small built-in line icon.

```json
{ "type": "Icon", "props": { "name": "check" } }
```

Built-in names include `check`, `x`, `plus`, `minus`, `chevron`, `arrow`, `star`, `circle`, and `alert`.

### Badge

Compact status label.

```json
{ "type": "Badge", "props": { "text": "Active", "variant": "success" } }
```

Useful props: `text` or `label`, `variant` (`success`, `warning`, `error`; default styling is primary/info-like).

### Avatar

Circular image or initials avatar.

```json
{ "type": "Avatar", "props": { "name": "Ada Lovelace", "src": "https://example.com/avatar.jpg" } }
```

Useful props: `name`, `src`.

### EmptyState

Empty list or placeholder message.

```json
{
  "type": "EmptyState",
  "props": { "title": "No data yet", "description": "Add your first item to get started." }
}
```

Useful props: `title`, `description`. Put buttons or links in `children` for actions.

---

## Input

All input components can use `bind: "$state:path"` for two-way state updates. They dispatch `change` actions internally; the runtime handles bound state updates before looking for matching manifest actions.

### TextInput

Single-line or multiline text input.

```json
{
  "type": "TextInput",
  "props": {
    "label": "Name",
    "placeholder": "Enter your name",
    "value": { "$state": "name" },
    "bind": "$state:name",
    "required": true,
    "hint": "Shown below the input",
    "error": "Validation message"
  }
}
```

Useful props: `label`, `placeholder`, `value`, `bind`, `required`, `hint`, `error`, `multiline`, `inputType`.

### NumberInput

Numeric input.

```json
{
  "type": "NumberInput",
  "props": { "label": "Quantity", "bind": "$state:quantity", "min": 0, "max": 100, "step": 1 }
}
```

Useful props: `label`, `value`, `bind`, `min`, `max`, `step`, `placeholder`, `required`, `hint`, `error`.

### Select

Single-select dropdown.

```json
{
  "type": "Select",
  "props": {
    "label": "Category",
    "bind": "$state:category",
    "options": [
      { "value": "a", "label": "Option A" },
      { "value": "b", "label": "Option B" }
    ]
  }
}
```

Useful props: `label`, `options`, `value`, `bind`, `placeholder`, `required`, `hint`, `error`.

### MultiSelect

Multi-select input.

```json
{
  "type": "MultiSelect",
  "props": {
    "label": "Tags",
    "bind": "$state:tags",
    "options": ["Design", "Engineering", "Research"]
  }
}
```

Useful props: `label`, `options`, `value`, `bind`, `maxSelections`, `hint`, `error`.

### Checkbox

Checkbox input.

```json
{ "type": "Checkbox", "props": { "label": "Accept terms", "bind": "$state:accepted", "checked": false } }
```

Useful props: `label`, `checked`, `value`, `bind`, `description`, `hint`, `error`.

### Toggle

Switch input.

```json
{ "type": "Toggle", "props": { "label": "Dark Mode", "bind": "$state:settings/dark", "value": true } }
```

Useful props: `label`, `value`, `checked`, `bind`, `description`, `hint`, `error`.

### DatePicker

Date, time, or datetime input.

```json
{ "type": "DatePicker", "props": { "label": "Due date", "bind": "$state:due", "format": "date" } }
```

Useful props: `label`, `value`, `bind`, `format` (`date`, `datetime`, `time`), `min`, `max`, `required`, `hint`, `error`.

### Slider

Range slider.

```json
{
  "type": "Slider",
  "props": { "label": "Font Size", "bind": "$state:fontSize", "min": 10, "max": 24, "step": 1, "showValue": true, "unit": "px" }
}
```

Useful props: `label`, `value`, `bind`, `min`, `max`, `step`, `showValue`, `unit`, `hint`.

### FileUpload

File input.

```json
{
  "type": "FileUpload",
  "props": { "label": "Upload", "accept": "image/*", "multiple": true, "bind": "$state:files" }
}
```

Useful props: `label`, `accept`, `multiple`, `maxSize`, `bind`, `hint`, `error`.

---

## Action

### Button

Action button.

```json
{ "type": "Button", "props": { "label": "Save", "variant": "primary", "action": "save", "disabled": false } }
```

Useful props: `label`, `variant` (`primary`, `secondary`, `danger`, `ghost`), `size`, `icon`, `action`, `disabled`.

### ButtonGroup

Button layout wrapper.

```json
{
  "type": "ButtonGroup",
  "props": { "direction": "horizontal", "spacing": "sm" },
  "children": ["save", "cancel"]
}
```

Useful props: `direction`, `spacing`, `gap`.

### Link

Anchor link.

```json
{ "type": "Link", "props": { "label": "Open docs", "href": "https://example.com", "external": true } }
```

Useful props: `label`, `href`, `variant`, `external`.

---

## Data

### Table

Data table.

```json
{
  "type": "Table",
  "props": {
    "data": { "$expr": "state.todos | values" },
    "columns": [
      { "key": "task", "label": "Task", "type": "text" },
      { "key": "priority", "label": "Priority", "type": "badge", "badgeMap": { "high": "error", "low": "info" } }
    ],
    "selectable": true,
    "emptyMessage": "No rows"
  }
}
```

Useful props: `data`, `dataPath`, `columns`, `selectable`, `pageSize`, `searchable`, `emptyMessage`.

Column fields commonly used: `key`, `label`, `type` (`text`, `number`, `badge`, `date`), `badgeMap`, `format`, `sortable`.

### List

Simple list renderer for arrays or objects.

```json
{
  "type": "List",
  "props": { "data": { "$expr": "state.items | values" }, "emptyMessage": "Nothing here" }
}
```

Useful props: `data`, `dataPath`, `emptyMessage`, `dividers`.

### Chart

Lightweight runtime-rendered SVG chart. No external charting library is required by the runtime component.

```json
{
  "type": "Chart",
  "props": {
    "chartType": "bar",
    "data": { "$expr": "state.revenue" },
    "xKey": "month",
    "yKey": "value",
    "height": 300
  }
}
```

Useful props: `chartType` or `variant` (`bar`, `line`, `area`, `pie`, `donut`, `scatter` depending on renderer support), `data`, `dataPath`, `xKey`, `yKey`, `color`, `colorScheme`, `height`, `yFormat`.

### Metric

KPI display.

```json
{
  "type": "Metric",
  "props": { "label": "Revenue", "value": "$299K", "trend": "up", "subtitle": "+12%", "unit": "USD" }
}
```

Useful props: `label`, `value`, `trend` (`up`, `down`, `flat`, `neutral`), `subtitle`, `unit`, `format`, `prefix`, `suffix`, `goal`.

---

## Feedback

### Alert

Notification banner.

```json
{ "type": "Alert", "props": { "title": "Saved", "message": "Settings saved.", "variant": "success" } }
```

Useful props: `title`, `message`, `variant` (`info`, `success`, `warning`, `error`), `dismissible`.

### Dialog

Modal dialog. The runtime manages focus when it opens.

```json
{
  "type": "Dialog",
  "props": { "title": "Confirm", "open": false },
  "children": ["dialog-content"]
}
```

Useful props: `title`, `open`, `confirmLabel`, `cancelLabel`, `action`.

### Progress

Progress indicator.

```json
{ "type": "Progress", "props": { "value": 75, "max": 100, "label": "Loading", "showValue": true } }
```

Useful props: `value`, `max`, `label`, `showValue`, `variant`, `size`.

### Toast

Toast-style message.

```json
{ "type": "Toast", "props": { "message": "Saved", "variant": "success", "duration": 3000 } }
```

Useful props: `message`, `variant`, `duration`.

---

## Navigation

### Breadcrumb

Breadcrumb navigation.

```json
{
  "type": "Breadcrumb",
  "props": {
    "items": [
      { "label": "Home", "view": "home" },
      { "label": "Settings", "view": "settings" }
    ]
  }
}
```

Useful props: `items`.

### Stepper

Step indicator.

```json
{
  "type": "Stepper",
  "props": {
    "steps": [
      { "label": "Account" },
      { "label": "Profile" }
    ],
    "activeStep": { "$state": "activeStep" },
    "variant": "horizontal"
  }
}
```

Useful props: `steps`, `activeStep`, `variant` (`horizontal`, `vertical`).

---

## Drawing

SVG drawing surface for diagrams and icons. Generate `shapes` data, not raw SVG markup. See the [LLM SVG icon guide](llm-svg-icon-guide.md) for icon-specific constraints.

```json
{
  "type": "Drawing",
  "props": {
    "width": 24,
    "height": 24,
    "background": "transparent",
    "shapes": [
      { "type": "circle", "cx": 12, "cy": 12, "r": 9, "stroke": "currentColor", "strokeWidth": 2, "fill": "none" },
      { "type": "path", "d": "M8 12l3 3 5-6", "stroke": "currentColor", "strokeWidth": 2, "fill": "none" }
    ]
  }
}
```

Useful props: `width`, `height`, `background`, `shapes`.

Shape types: `rect`, `circle`, `ellipse`, `line`, `text`, `path`.

---

## Design tokens and CSS values

Prefer tokens for predictable, theme-safe output:

| Token category | Values |
|---|---|
| Spacing | `none`, `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` |
| Semantic colors | `primary`, `secondary`, `success`, `warning`, `error`, `info`, `muted`, `default` |
| Sizes | `sm`, `md`, `lg` |
| Radius | `none`, `sm`, `md`, `lg`, `full` |

The runtime accepts numeric spacing values and common CSS lengths in some layout props for compatibility, but generated manifests should prefer tokens.

Bad:

```json
{ "gap": "16", "padding": "24", "color": "#ff0000" }
```

Good:

```json
{ "gap": "md", "padding": "lg", "colorScheme": "error" }
```

## State references

Props can reference state and derived values:

```json
{ "content": { "$expr": "state.user.name" } }
{ "value": "$computed:count:todos" }
{ "text": "Hello {{state.user.name}}" }
```

| Form | Description |
|---|---|
| `$state:path` | TinyBase value, row, or cell path. Slash paths such as `todos/t1/done` are supported. |
| `$computed:count:table` | Row count. |
| `$computed:sum:table/column` | Numeric sum. |
| `$computed:avg:table/column` | Numeric average. |
| `$item:field` | Current `Repeater` item field. Dot paths are supported. |
| `$expr:state.todos \| values` | Constrained expression. |
| `{{state.name}}` | Template interpolation. |

Supported `$expr` forms include `state.foo.bar`, `item.field`, literals, pipe filters (`values`, `keys`, `count`, `length`, `sum`, `first`, `last`), and simple numeric/comparison expressions with one operator.

## Actions

Buttons and many interactive components dispatch action IDs. The runtime currently handles `mutateState`, `navigate`, and bound-input state updates directly. Other action types are surfaced as `forgeui-action` events for host applications.

```json
{
  "actions": {
    "inc": {
      "type": "mutateState",
      "path": "count",
      "operation": "increment",
      "value": 1
    },
    "go-settings": {
      "type": "navigate",
      "target": "settings-root"
    }
  }
}
```

`mutateState` operations: `set`, `append`, `delete`, `update`, `increment`, `decrement`, `toggle`.

Shorthand multi-set is also supported:

```json
{
  "actions": {
    "reset": {
      "type": "mutateState",
      "set": {
        "count": 0,
        "status": "idle"
      }
    }
  }
}
```

## Responsive guidelines

- Use `Grid` for KPI cards; numeric multi-column grids collapse on narrower screens.
- Use `Stack` with `wrap: true` for horizontal button rows.
- Keep labels short so they wrap gracefully.
- Prefer token spacing over raw lengths.
- Avoid fixed widths unless the design explicitly needs them.

## Lifecycle

1. Parse manifest input from property, `src`, or inline JSON.
2. Convert A2UI payloads when detected.
3. Validate manifest.
4. Create the TinyBase store from `schema` and `state`.
5. Set up persistence: `persistState: true` forces IndexedDB, `skipPersistState: true` disables it, otherwise `standalone`/`embed` persist and `chat` is in-memory.
6. Render the root element through the static renderer dispatch map.
7. Resolve bound props and dispatch declarative actions during interaction.
8. Clean up the persister when `<forgeui-app>` disconnects.