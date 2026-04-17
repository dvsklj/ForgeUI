# Forge UI Framework — LLM Instructions

You can create interactive applications by generating Forge manifests — declarative JSON that describes UI, data, and behavior. You never write code. You describe what the app should be, and the Forge renderer handles how it works.

## Manifest Structure

```json
{
  "manifest": "0.1.0",
  "id": "my-app",
  "root": "shell",
  "schema": {
    "version": 1,
    "tables": {
      "tableName": {
        "columns": {
          "colName": { "type": "string|number|boolean", "default": "optional" }
        }
      }
    }
  },
  "state": {
    "key/path": "initial value"
  },
  "elements": {
    "elementId": {
      "type": "ComponentName",
      "props": { },
      "children": ["childId1", "childId2"]
    }
  },
  "actions": {
    "actionName": {
      "type": "mutateState|setState|navigate|submitForm",
      "path": "state/or/table/path",
      "operation": "append|update|delete"
    }
  }
}
```

**Key rules:**
- Elements are a **flat map** of `id → component`. Never nest components inline — reference children by ID.
- The `root` field points to the top-level element ID.
- All styling uses **design tokens**, never raw CSS values.

## State Bindings

| Syntax | Meaning | Example |
|--------|---------|---------|
| `$state:path` | Reads/writes a reactive value | `"bind": "$state:view/active"` |
| `$computed:path` | Derived from table data | `"value": "$computed:meals/totalCalories"` |
| `$item:field` | Current item inside a Repeater | `"content": "$item:name"` |
| `$form:fieldId` | Value from an input component | `"data": {"name": "$form:name-input"}` |

## Design Tokens

**Spacing:** `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"`
**Color schemes:** `"primary"` | `"secondary"` | `"success"` | `"warning"` | `"error"` | `"muted"` | `"default"`
**Sizes:** `"sm"` | `"md"` | `"lg"`
**Radius:** `"none"` | `"sm"` | `"md"` | `"lg"` | `"full"`
**Font weight:** `"normal"` | `"medium"` | `"semibold"` | `"bold"`

Never use raw colors (`#3B82F6`), pixel values (`16px`), or CSS properties. Always use tokens.

## Components (39)

### Layout

**Stack** — Flex column or row.
`Stack(spacing: token, direction: "vertical"|"horizontal", align: "start"|"center"|"end"|"stretch", gap: token)`

**Grid** — CSS grid layout.
`Grid(columns: number|"auto", gap: token, minChildWidth: token)`

**Card** — Surface container with optional header/footer.
`Card(title: string?, variant: "default"|"outlined"|"elevated"|"compact", padding: token)`

**Container** — Max-width wrapper for content centering.
`Container(maxWidth: "sm"|"md"|"lg"|"xl"|"full", padding: token)`

**Tabs** — Switchable tab views. Each tab name maps to a child element.
`Tabs(items: string[], bind: $state:path)`

**Accordion** — Collapsible sections.
`Accordion(items: [{title, contentId}], multiple: boolean)`

**Divider** — Horizontal or vertical rule.
`Divider(direction: "horizontal"|"vertical", spacing: token)`

**Spacer** — Flexible empty space.
`Spacer(size: token)`

### Content

**Text** — Paragraph, heading, caption, or label.
`Text(content: string|$binding, variant: "body"|"heading1"|"heading2"|"heading3"|"caption"|"label"|"code", weight: token, color: scheme, align: "left"|"center"|"right")`

**Image** — Responsive image with alt text.
`Image(src: url, alt: string, aspectRatio: "auto"|"1:1"|"4:3"|"16:9"|"21:9", fit: "cover"|"contain"|"fill", radius: token)`

**Icon** — From curated icon set.
`Icon(name: string, size: token, color: scheme)`

**Badge** — Status indicator label.
`Badge(text: string|$binding, colorScheme: scheme, variant: "solid"|"subtle"|"outline")`

**Avatar** — User or entity image with fallback.
`Avatar(src: url?, name: string, size: token)`

**EmptyState** — Placeholder when data is absent.
`EmptyState(title: string, description: string, icon: string?, actionLabel: string?, action: actionRef?)`

### Input

**TextInput** — Single or multi-line text entry.
`TextInput(label: string, placeholder: string?, bind: $state:path, multiline: boolean, required: boolean, maxLength: number?)`

**NumberInput** — Numeric entry with constraints.
`NumberInput(label: string, bind: $state:path, min: number?, max: number?, step: number?, required: boolean)`

**Select** — Dropdown selection.
`Select(label: string, options: [{value, label}]|string[], bind: $state:path, placeholder: string?, required: boolean)`

**MultiSelect** — Multiple choice selection.
`MultiSelect(label: string, options: [{value, label}]|string[], bind: $state:path, maxSelections: number?)`

**Checkbox** — Single checkbox or group.
`Checkbox(label: string, bind: $state:path, description: string?)`

**Toggle** — On/off switch.
`Toggle(label: string, bind: $state:path, description: string?)`

**DatePicker** — Date/time selection.
`DatePicker(label: string, bind: $state:path, format: "date"|"datetime"|"time", min: string?, max: string?)`

**Slider** — Range input.
`Slider(label: string, bind: $state:path, min: number, max: number, step: number, showValue: boolean)`

**FileUpload** — File upload (stored as Blobs in IndexedDB, 5MB limit in browser-only mode).
`FileUpload(label: string, accept: string[]?, maxSize: number?, multiple: boolean, bind: $state:path)`

### Action

**Button** — Clickable action trigger.
`Button(label: string, action: actionRef, variant: "primary"|"secondary"|"danger"|"ghost", size: token, icon: string?, disabled: boolean|$binding)`

**ButtonGroup** — Row of related buttons.
`ButtonGroup(direction: "horizontal"|"vertical", spacing: token)`
Children: Button elements.

**Link** — Navigation or external link.
`Link(label: string, href: url|$state:path, variant: "default"|"subtle"|"bold", external: boolean)`

### Data Display

**Table** — Sortable, filterable data table with pagination.
`Table(dataPath: string, columns: [{key, label, sortable?, format?}], pageSize: number?, searchable: boolean, emptyMessage: string?)`

**List** — Mobile-friendly vertical data list.
`List(dataPath: string, template: elementId, emptyMessage: string?, dividers: boolean)`

**Chart** — Data visualization.
`Chart(variant: "line"|"bar"|"donut"|"area"|"scatter"|"pie", dataPath: string, xKey: string?, yKey: string?, colorScheme: scheme, height: number?)`

**Metric** — Single KPI display with optional trend/goal.
`Metric(label: string, value: $binding|number, format: "number"|"currency"|"percent", goal: number|$binding?, trend: "up"|"down"|"flat"?, prefix: string?, suffix: string?)`

### Feedback

**Alert** — Inline notification.
`Alert(title: string, message: string?, variant: "info"|"success"|"warning"|"error", dismissible: boolean)`

**Dialog** — Modal confirmation/form.
`Dialog(title: string, trigger: elementId, confirmLabel: string?, cancelLabel: string?, action: actionRef?)`
Children: content elements for dialog body.

**Progress** — Loading/completion indicator.
`Progress(value: number|$binding, max: number, variant: "bar"|"ring", size: token, label: string?)`

**Toast** — Non-blocking temporary notification.
`Toast(message: string, variant: "info"|"success"|"warning"|"error", duration: number?)`

### Navigation

**Breadcrumb** — Hierarchical location indicator.
`Breadcrumb(items: [{label, view?}])`

**Stepper** — Multi-step wizard progress.
`Stepper(steps: [{label, description?}], activeStep: $state:path, variant: "horizontal"|"vertical")`

### Drawing

**Drawing** — Declarative shapes rendered as SVG. For diagrams, illustrations, flowcharts, and visual annotations.
`Drawing(width: number, height: number, shapes: Shape[], viewBox: string?)`

Shapes are structured data, never raw SVG. Each shape uses design tokens for styling.

**Shape types:**

```
rect:    { shape: "rect", x, y, w, h, fill?: scheme, stroke?: scheme, radius?: token, label?: string, id?: string }
circle:  { shape: "circle", cx, cy, r, fill?: scheme, stroke?: scheme, label?: string, id?: string }
ellipse: { shape: "ellipse", cx, cy, rx, ry, fill?: scheme, stroke?: scheme, label?: string, id?: string }
line:    { shape: "line", x1, y1, x2, y2, stroke?: scheme, strokeWidth?: number }
text:    { shape: "text", x, y, content: string, size?: token, weight?: token, color?: scheme, align?: "left"|"center"|"right" }
arrow:   { shape: "arrow", from: string|{x,y}, to: string|{x,y}, stroke?: scheme, label?: string, curved?: boolean }
group:   { shape: "group", x?, y?, children: Shape[] }
path:    { shape: "path", points: [{x,y}], closed?: boolean, fill?: scheme, stroke?: scheme, smooth?: boolean }
icon:    { shape: "icon", name: string, x, y, size?: token, color?: scheme }
badge:   { shape: "badge", x, y, text: string, colorScheme?: scheme }
```

- `arrow.from` / `arrow.to` can reference shape `id` strings for auto-connected arrows, or use `{x, y}` coordinates.
- `label` on rect/circle/ellipse renders centered text inside the shape.
- `group` allows composing shapes with relative positioning.
- `path` with `smooth: true` renders curved Bézier paths through the points.

## Conditional Rendering

Show/hide elements based on state:

```json
{
  "type": "Alert",
  "props": { "variant": "error", "title": "Overdue!" },
  "visible": { "$when": { "path": "tasks/overdueCount", "gt": 0 } }
}
```

Operators: `eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `in`, `notIn`, `exists`.

## Repeater Pattern

Loop over table data:

```json
{
  "meal-list": {
    "type": "Repeater",
    "props": { "dataPath": "meals", "template": "meal-row", "emptyMessage": "No meals yet" }
  },
  "meal-row": {
    "type": "Card",
    "props": { "variant": "compact" },
    "children": ["meal-name", "meal-cals"]
  },
  "meal-name": { "type": "Text", "props": { "content": "$item:name", "weight": "medium" } },
  "meal-cals": { "type": "Text", "props": { "content": "$item:calories", "suffix": " kcal", "color": "muted" } }
}
```

## Actions

Actions are declarative — never write JavaScript.

```json
{
  "actions": {
    "add-task":     { "type": "mutateState", "path": "tasks", "operation": "append", "data": { "title": "$form:task-input", "done": false } },
    "toggle-task":  { "type": "mutateState", "path": "tasks", "operation": "update", "key": "{{id}}", "data": { "done": "{{!done}}" } },
    "delete-task":  { "type": "mutateState", "path": "tasks", "operation": "delete", "key": "{{id}}" },
    "set-view":     { "type": "setState", "path": "view/active", "value": "{{target}}" },
    "submit-form":  { "type": "submitForm", "formId": "entry-form", "action": "add-task" }
  }
}
```

Reference actions in Button props: `"action": "add-task"`.

## Complete Example — Habit Tracker

```json
{
  "manifest": "0.1.0",
  "id": "habit-tracker",
  "root": "shell",
  "schema": {
    "version": 1,
    "tables": {
      "habits": {
        "columns": {
          "name": { "type": "string" },
          "streak": { "type": "number", "default": 0 },
          "done_today": { "type": "boolean", "default": false },
          "icon": { "type": "string", "default": "star" }
        }
      }
    }
  },
  "state": {
    "view/active": "today"
  },
  "elements": {
    "shell": {
      "type": "Container",
      "props": { "maxWidth": "md", "padding": "lg" },
      "children": ["header", "tabs", "content"]
    },
    "header": {
      "type": "Stack",
      "props": { "direction": "horizontal", "align": "center", "spacing": "md" },
      "children": ["title", "streak-metric"]
    },
    "title": {
      "type": "Text",
      "props": { "content": "Daily Habits", "variant": "heading1" }
    },
    "streak-metric": {
      "type": "Metric",
      "props": { "label": "Best Streak", "value": "$computed:habits/maxStreak", "format": "number", "suffix": " days" }
    },
    "tabs": {
      "type": "Tabs",
      "props": { "items": ["Today", "All Habits", "Add New"], "bind": "$state:view/active" }
    },
    "content": {
      "type": "Stack",
      "props": { "spacing": "md" },
      "children": ["habit-list", "empty"]
    },
    "habit-list": {
      "type": "Repeater",
      "props": { "dataPath": "habits", "template": "habit-row" }
    },
    "habit-row": {
      "type": "Card",
      "props": { "variant": "outlined", "padding": "md" },
      "children": ["habit-info", "habit-toggle"]
    },
    "habit-info": {
      "type": "Stack",
      "props": { "direction": "horizontal", "align": "center", "spacing": "sm" },
      "children": ["habit-icon", "habit-name", "habit-streak"]
    },
    "habit-icon": {
      "type": "Icon",
      "props": { "name": "$item:icon", "size": "md", "color": "primary" }
    },
    "habit-name": {
      "type": "Text",
      "props": { "content": "$item:name", "weight": "medium" }
    },
    "habit-streak": {
      "type": "Badge",
      "props": { "text": "$item:streak", "colorScheme": "success", "variant": "subtle" }
    },
    "habit-toggle": {
      "type": "Toggle",
      "props": { "label": "Done today", "bind": "$item:done_today" }
    },
    "empty": {
      "type": "EmptyState",
      "props": {
        "title": "No habits yet",
        "description": "Add your first habit to start tracking",
        "icon": "plus-circle",
        "actionLabel": "Add Habit",
        "action": "show-add-form"
      },
      "visible": { "$when": { "path": "habits", "eq": [] } }
    }
  },
  "actions": {
    "toggle-habit": {
      "type": "mutateState",
      "path": "habits",
      "operation": "update",
      "key": "{{id}}",
      "data": { "done_today": "{{!done_today}}" }
    },
    "add-habit": {
      "type": "mutateState",
      "path": "habits",
      "operation": "append",
      "data": { "name": "$form:habit-name", "icon": "$form:habit-icon", "streak": 0, "done_today": false }
    },
    "delete-habit": {
      "type": "mutateState",
      "path": "habits",
      "operation": "delete",
      "key": "{{id}}"
    },
    "show-add-form": {
      "type": "setState",
      "path": "view/active",
      "value": "Add New"
    }
  }
}
```

## Drawing Example — System Architecture

```json
{
  "type": "Drawing",
  "props": {
    "width": 600,
    "height": 280,
    "shapes": [
      { "shape": "rect", "id": "user", "x": 20, "y": 110, "w": 100, "h": 50, "fill": "primary", "radius": "sm", "label": "User" },
      { "shape": "rect", "id": "llm", "x": 200, "y": 50, "w": 120, "h": 50, "fill": "secondary", "radius": "sm", "label": "LLM" },
      { "shape": "rect", "id": "forge", "x": 200, "y": 170, "w": 120, "h": 50, "fill": "success", "radius": "sm", "label": "Forge" },
      { "shape": "rect", "id": "app", "x": 440, "y": 110, "w": 130, "h": 50, "fill": "primary", "radius": "sm", "label": "Live App" },
      { "shape": "arrow", "from": "user", "to": "llm", "label": "prompt", "stroke": "muted" },
      { "shape": "arrow", "from": "llm", "to": "forge", "label": "manifest", "stroke": "muted" },
      { "shape": "arrow", "from": "forge", "to": "app", "label": "render", "stroke": "success" }
    ]
  }
}
```

## Data Access (Reading App Data)

Forge apps can optionally allow the LLM to read user data for personalized updates. **This is disabled by default.** The user must consent at app creation time.

### Permission declaration

Add `dataAccess` to the manifest:

```json
{
  "manifest": "0.1.0",
  "id": "workout-tracker",
  "dataAccess": {
    "enabled": true,
    "readable": ["workouts", "exercises"],
    "restricted": ["user_profile"]
  },
  "schema": { ... }
}
```

- `enabled: false` (default) — the LLM cannot read any app data. The app is a sealed box.
- `enabled: true` — the LLM can read tables listed in `readable`. Tables in `restricted` are never sent to the LLM.
- Always inform the user clearly: "This app allows the AI to read your workout data to provide personalized updates."

### Reading data via tools

**`forge_read_app_data`** — returns raw rows from permitted tables:

```
Tool: forge_read_app_data
Input: { app_id: "workout-tracker", tables: ["workouts"], limit: 20, since: "2026-04-01" }
Output: {
  schema: { workouts: { columns: { exercise: "string", weight: "number", reps: "number", date: "string" } } },
  data: { workouts: [ { id: "w1", exercise: "Bench Press", weight: 80, reps: 8, date: "2026-04-14" }, ... ] },
  rowCounts: { workouts: 147 }
}
```

**`forge_query_app_data`** — returns aggregated summaries (far more token-efficient):

```
Tool: forge_query_app_data
Input: {
  app_id: "workout-tracker",
  queries: [
    { table: "workouts", aggregate: "count", groupBy: "exercise" },
    { table: "workouts", aggregate: "max", column: "weight", groupBy: "exercise" },
    { table: "workouts", aggregate: "trend", column: "weight", where: { "exercise": "Bench Press" }, periods: 4 }
  ]
}
Output: {
  results: [
    { query: 0, data: { "Bench Press": 34, "Squat": 28, "Deadlift": 22 } },
    { query: 1, data: { "Bench Press": 85, "Squat": 110, "Deadlift": 140 } },
    { query: 2, data: { trend: "up", values: [72.5, 77.5, 80, 85], change: "+17.2%" } }
  ]
}
```

**Prefer `forge_query_app_data` over `forge_read_app_data`.** Summaries cost ~50-150 tokens vs. ~2,000+ for raw rows. Ask smart questions about the data rather than reading everything.

### The data interaction loop

1. **Read** — call `forge_query_app_data` to understand the user's data (trends, patterns, gaps)
2. **Reason** — identify what should change in the app (adjust targets, add alerts, modify plans)
3. **Update** — call `forge_update_app` with a manifest patch to modify the app structure

The LLM updates the *manifest* (the app structure, plans, goals, UI), not the user's raw data. Workout logs, tracked meals, and journal entries stay untouched in TinyBase. The LLM modifies the app *around* the data.

**Example:** the LLM reads that squat weight has plateaued for 3 weeks. It sends a manifest patch that changes the squat rep scheme from 5×5 to 3×8, adds an `Alert` saying "Deload week — lighter weight, more reps," and updates the goal `Metric`. The user's logged workouts are unchanged — only the plan adapts.

## Guidelines

1. **Always use design tokens** — never raw CSS values, hex colors, or pixel sizes.
2. **Keep manifests under ~100KB** — if an app needs more, it has outgrown Forge.
3. **Use flat element maps** — never nest component definitions, always reference by ID.
4. **Data tables use pagination** — never dump hundreds of rows; set `pageSize` on Table components.
5. **Actions are data** — never write JavaScript callbacks or event handlers.
6. **Shapes in Drawing are data** — never write raw SVG markup. Use the shape types.
7. **State paths use `/` separators** — e.g., `view/active`, `goals/calories`.
8. **Prefer Repeater for lists** — define the template element once, bind to a data path.
9. **Use EmptyState** — always handle the case where a list or table has no data.
10. **Use conditional visibility** — `"visible": {"$when": {...}}` to show/hide elements based on state.
11. **Data access is opt-in** — always set `dataAccess.enabled: false` (or omit it) unless the user explicitly wants the LLM to read their data.
12. **Prefer query over read** — use `forge_query_app_data` for aggregates instead of `forge_read_app_data` for raw rows. Cheaper, faster, more private.
13. **Never modify user data directly** — read data to reason about it, then update the manifest (structure, plans, goals), not the underlying records.
