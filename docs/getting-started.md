# Getting Started with Forge UI

## What You'll Build

A data table app — takes 2 minutes. By the end, you'll have a live web app running in your browser.

## Prerequisites

- Node.js 20+
- A text editor

## Step 1: Install

```bash
npm install @forgeui/server
```

## Step 2: Create a Manifest

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
          "id": "string",
          "task": "string",
          "done": "boolean",
          "priority": "string"
        }
      }
    }
  },
  "state": {
    "data": {
      "todos": {
        "t1": { "id": "t1", "task": "Build the UI", "done": true, "priority": "high" },
        "t2": { "id": "t2", "task": "Add authentication", "done": false, "priority": "high" },
        "t3": { "id": "t3", "task": "Write tests", "done": false, "priority": "medium" },
        "t4": { "id": "t4", "task": "Deploy to production", "done": false, "priority": "low" }
      }
    }
  },
  "elements": {
    "root": {
      "type": "Stack",
      "props": { "gap": "20", "padding": "24" },
      "children": ["header", "stats", "table"]
    },
    "header": {
      "type": "Card",
      "props": { "title": "Todo App", "subtitle": "Track your tasks" },
      "children": ["badges"]
    },
    "badges": {
      "type": "Stack",
      "props": { "direction": "horizontal", "gap": "8" },
      "children": ["b1", "b2"]
    },
    "b1": { "type": "Badge", "props": { "text": "4 Tasks", "variant": "info" } },
    "b2": { "type": "Badge", "props": { "text": "1 Done", "variant": "success" } },
    "stats": {
      "type": "Grid",
      "props": { "columns": 3 },
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
        "data": { "$expr": "state.data.todos | values" },
        "columns": [
          { "key": "task", "label": "Task", "type": "text" },
          { "key": "priority", "label": "Priority", "type": "badge", "badgeMap": { "high": "error", "medium": "warning", "low": "info" } },
          { "key": "done", "label": "Status", "type": "badge", "badgeMap": { "true": "success", "false": "warning" } }
        ],
        "selectable": true
      }
    }
  },
  "root": "root"
}
```

## Step 3: Start the Server

```bash
npx forgeui serve --port 3000
```

## Step 4: Deploy Your App

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

## Step 5: Open It

Open `http://localhost:3000/apps/todo-app` in your browser.

You'll see:
- A header card with badges showing task counts
- 3 KPI metrics (total, done, pending)
- A data table with all 4 tasks, color-coded by priority and status

## What Just Happened?

1. **You wrote a JSON manifest** — no HTML, no CSS, no JavaScript
2. **The server stored it** in SQLite
3. **The server served an HTML page** with the manifest embedded
4. **The Forge runtime** (loaded via `<script>` tag) read the manifest and rendered a live web app
5. **TinyBase** provided reactive state — the table binds to `state.data.todos` via `$expr`

## Next Steps

### Add a Form

Add a form to create new todos:

```json
{
  "add-form": {
    "type": "Card",
    "props": { "title": "Add Task" },
    "children": ["form-fields", "form-actions"]
  },
  "form-fields": {
    "type": "Grid",
    "props": { "columns": 2 },
    "children": ["input-task", "select-priority"]
  },
  "input-task": {
    "type": "TextInput",
    "props": { "label": "Task", "placeholder": "What needs to be done?", "required": true }
  },
  "select-priority": {
    "type": "Select",
    "props": {
      "label": "Priority",
      "options": [
        { "value": "high", "label": "High" },
        { "value": "medium", "label": "Medium" },
        { "value": "low", "label": "Low" }
      ]
    }
  },
  "form-actions": {
    "type": "ButtonGroup",
    "props": {},
    "children": ["btn-add"]
  },
  "btn-add": {
    "type": "Button",
    "props": { "label": "Add Task", "variant": "primary" }
  }
}
```

### Add Charts

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
        { "name": "High", "value": 1 },
        { "name": "Medium", "value": 1 },
        { "name": "Low", "value": 1 }
      ],
      "xKey": "name",
      "yKey": "value",
      "color": "#6366f1"
    }
  }
}
```

### Update via API

```bash
# Update a task
curl -X PATCH http://localhost:3000/api/apps/todo-app \
  -H "Content-Type: application/json" \
  -d '{
    "state": {
      "data": {
        "todos": {
          "t2": { "id": "t2", "task": "Add authentication", "done": true, "priority": "high" }
        }
      }
    }
  }'
```

### Use with an AI Agent

Connect Forge to Claude Code or any MCP agent:

```json
{
  "mcpServers": {
    "forgeui": {
      "command": "npx",
      "args": ["@forgeui/connect"]
    }
  }
}
```

The agent can now say "create a todo app" and Forge will generate and deploy it.

## Troubleshooting

**App not rendering?** Check the browser console for errors. Common issues:
- Missing `root` field in manifest
- `children` references to non-existent element IDs
- Invalid component type (run `npx forgeui validate manifest.json` to check)

**Server won't start?** Make sure port 3000 is free:
```bash
lsof -i :3000
```

**Validation errors?** Run the validator:
```bash
npx forgeui validate my-app.json
```

It will tell you exactly what's wrong with line-by-line error details.
