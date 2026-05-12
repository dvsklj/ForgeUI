# Getting Started with Forge UI

## What you'll build

A small todo dashboard that runs in the Forge server. By the end, you will have a manifest stored in SQLite and served as a shareable app URL.

## Prerequisites

- Node.js 20+
- A text editor

## Step 1: Install

```bash
npm install @nedast/forgeui-server
```

## Step 2: Create a manifest

Create `my-app.json`:

```json
{
  "manifest": "0.1.0",
  "id": "todo-app",
  "meta": {
    "title": "Todo App",
    "description": "A simple task tracker"
  },
  "schema": {
    "version": 1,
    "tables": {
      "todos": {
        "columns": {
          "task": { "type": "string" },
          "done": { "type": "boolean", "default": false },
          "priority": { "type": "string" }
        }
      }
    }
  },
  "state": {
    "todos": {
      "t1": { "task": "Build the UI", "done": true, "priority": "high" },
      "t2": { "task": "Add authentication", "done": false, "priority": "high" },
      "t3": { "task": "Write tests", "done": false, "priority": "medium" },
      "t4": { "task": "Deploy to production", "done": false, "priority": "low" }
    }
  },
  "elements": {
    "root": {
      "type": "Stack",
      "props": { "gap": "lg", "padding": "lg" },
      "children": ["header", "stats", "table"]
    },
    "header": {
      "type": "Card",
      "props": { "title": "Todo App", "subtitle": "Track your tasks" },
      "children": ["badges"]
    },
    "badges": {
      "type": "Stack",
      "props": { "direction": "horizontal", "gap": "xs", "wrap": true },
      "children": ["b1", "b2"]
    },
    "b1": { "type": "Badge", "props": { "text": "4 Tasks", "variant": "info" } },
    "b2": { "type": "Badge", "props": { "text": "1 Done", "variant": "success" } },
    "stats": {
      "type": "Grid",
      "props": { "columns": 3, "gap": "md" },
      "children": ["m1", "m2", "m3"]
    },
    "m1": { "type": "Metric", "props": { "label": "Total", "value": "4", "subtitle": "tasks" } },
    "m2": { "type": "Metric", "props": { "label": "Done", "value": "1", "trend": "up" } },
    "m3": { "type": "Metric", "props": { "label": "Pending", "value": "3", "trend": "down" } },
    "table": {
      "type": "Card",
      "props": { "title": "All Tasks" },
      "children": ["todos-table"]
    },
    "todos-table": {
      "type": "Table",
      "props": {
        "data": { "$expr": "state.todos | values" },
        "columns": [
          { "key": "task", "label": "Task", "type": "text" },
          { "key": "priority", "label": "Priority", "type": "badge", "badgeMap": { "high": "error", "medium": "warning", "low": "info" } },
          { "key": "done", "label": "Status", "type": "badge", "badgeMap": { "true": "success", "false": "warning" } }
        ],
        "selectable": true,
        "emptyMessage": "No tasks yet"
      }
    }
  },
  "root": "root"
}
```

Why the state is shaped this way: when a manifest declares `schema.tables.todos`, the initial `state.todos` object is loaded into the TinyBase `todos` table. Expressions can then read it with `state.todos | values`.

## Step 3: Start the server

```bash
npx forgeui serve --port 3000
```

Equivalent server-only binary:

```bash
npx forgeui-server --port 3000
```

## Step 4: Deploy your app

```bash
curl -X POST http://localhost:3000/api/apps \
  -H "Content-Type: application/json" \
  -d @my-app.json
```

Response:

```json
{
  "id": "todo-app",
  "title": "Todo App",
  "url": "http://localhost:3000/apps/todo-app"
}
```

The real response also includes the stored manifest and timestamps.

## Step 5: Open it

Open `http://localhost:3000/apps/todo-app` in your browser.

You should see:

- A header card with task-count badges.
- Three KPI metrics.
- A table with all four tasks, color-coded by priority and status.

## What just happened?

1. You wrote a flat JSON manifest — no HTML, CSS, or JavaScript.
2. The server stored it in SQLite.
3. The server served an HTML page with the manifest embedded.
4. `<forgeui-app>` loaded the manifest, validated it, created a TinyBase store, and rendered the app.
5. The table read the `todos` table through a `$expr` binding.

## Next steps

### Add a form

Add these element definitions to `elements`, then include `add-form` in `root.children`:

```json
{
  "add-form": {
    "type": "Card",
    "props": { "title": "Add Task" },
    "children": ["form-fields", "form-actions"]
  },
  "form-fields": {
    "type": "Grid",
    "props": { "columns": 2, "gap": "md" },
    "children": ["input-task", "select-priority"]
  },
  "input-task": {
    "type": "TextInput",
    "props": { "label": "Task", "placeholder": "What needs to be done?", "bind": "$state:draft/task", "required": true }
  },
  "select-priority": {
    "type": "Select",
    "props": {
      "label": "Priority",
      "bind": "$state:draft/priority",
      "options": [
        { "value": "high", "label": "High" },
        { "value": "medium", "label": "Medium" },
        { "value": "low", "label": "Low" }
      ]
    }
  },
  "form-actions": {
    "type": "ButtonGroup",
    "props": { "direction": "horizontal", "spacing": "sm" },
    "children": ["btn-add"]
  },
  "btn-add": {
    "type": "Button",
    "props": { "label": "Add Task", "variant": "primary", "action": "add-task" }
  }
}
```

Then add a matching action:

```json
{
  "actions": {
    "add-task": {
      "type": "mutateState",
      "path": "todos",
      "operation": "append",
      "value": {
        "task": "$state:draft/task",
        "priority": "$state:draft/priority",
        "done": false
      }
    }
  }
}
```

### Add a chart

Add these element definitions to `elements`, then include `chart-section` in `root.children`:

```json
{
  "chart-section": {
    "type": "Card",
    "props": { "title": "Task Distribution" },
    "children": ["priority-chart"]
  },
  "priority-chart": {
    "type": "Chart",
    "props": {
      "chartType": "pie",
      "data": [
        { "name": "High", "value": 2 },
        { "name": "Medium", "value": 1 },
        { "name": "Low", "value": 1 }
      ],
      "xKey": "name",
      "yKey": "value"
    }
  }
}
```

### Update via API

Patch the app with JSON Merge Patch:

```bash
curl -X PATCH http://localhost:3000/api/apps/todo-app \
  -H "Content-Type: application/json" \
  -d '{
    "state": {
      "todos": {
        "t2": { "task": "Add authentication", "done": true, "priority": "high" }
      }
    }
  }'
```

`PATCH` merges into the stored manifest, validates the merged manifest, and writes only if validation passes.

### Use with an AI agent

Connect Forge to Claude Code or any MCP-aware client:

```json
{
  "mcpServers": {
    "forgeui": {
      "command": "npx",
      "args": ["@nedast/forgeui-connect"]
    }
  }
}
```

The connector exposes tools for creating, updating, validating, listing, reading, and deleting apps, plus a component-docs tool for prompt/schema retrieval.

## Troubleshooting

**App not rendering?** Check the browser console and run validation:

```bash
npx forgeui validate my-app.json
```

Common issues:

- Missing required top-level fields: `manifest`, `id`, `root`, or `elements`.
- `root` points to an element ID that does not exist.
- `children` references point to missing element IDs.
- Invalid component type.
- Schema columns are strings instead of objects like `{ "type": "string" }`.

**Server won't start?** Make sure port 3000 is free:

```bash
lsof -i :3000
```

**Write requests fail with 401?** `FORGEUI_API_TOKEN` is set. Include:

```http
Authorization: Bearer <token>
```
