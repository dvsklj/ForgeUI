# Forge UI

**Declarative UI manifests for AI agents.**

A JSON manifest describes a web app — components, state, data schema, layout. The Forge runtime renders it as a live, interactive web application. No build step. No framework lock-in. One ESM bundle at ~42 KB gzipped.

```
LLM generates JSON  →  Forge runtime renders  →  Live web app
```

## Why

AI agents need to generate UIs. Traditional approaches require the agent to write framework code (React, Vue, etc.), which is fragile and verbose. Forge inverts this:

- **The agent outputs a structured manifest** — a declarative description of the UI
- **The runtime handles rendering** — components, state, reactivity, all pre-built
- **The manifest is data, not code** — deterministic, testable, version-controlled

This makes LLM-generated UIs reliable, secure, and instant to deploy.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    @forge/runtime                        │
│                                                         │
│  <forge-app> custom element (Lit-based Web Component)   │
│  ├── TinyBase reactive state store                      │
│  ├── Ajv JSON Schema validation                         │
│  ├── 39 pre-built components                            │
│  └── Expression engine ($expr: "state.data.items | values") │
│                                                         │
│  173 KB raw, ~42 KB gzip (ESM)                          │
│  IIFE/CDN: 334 KB raw, ~95 KB gzip                      │
│  Works: artifacts, embeds, iframes, standalone pages    │
└────────────────────────┬────────────────────────────────┘
                         │ JSON manifest
┌────────────────────────┴────────────────────────────────┐
│                    @forge/server                         │
│                                                         │
│  Hono HTTP server + SQLite persistence                  │
│  REST CRUD: POST/GET/PUT/PATCH/DELETE /api/apps/:id     │
│  URL hosting: /apps/:id → shareable app page            │
│  Runtime serving: /runtime/forge.js                     │
│                                                         │
│  Deploy: node, Docker, CF Workers, Deno Deploy           │
└────────────────────────┬────────────────────────────────┘
                         │ stdio MCP
┌────────────────────────┴────────────────────────────────┐
│                   @forge/connect                         │
│                                                         │
│  MCP tools: create, update, get, list, delete apps      │
│  Works with: Claude Code, Hermes, any MCP agent         │
│  Transport: stdio (stdin/stdout JSON-RPC)               │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Embed in an HTML page

```html
<forge-app id="my-app" surface="standalone"></forge-app>
<script type="module" src="https://your-server/runtime/forge.js"></script>
<script>
  document.getElementById('my-app').manifest = {
    manifest: "0.1.0",
    id: "hello",
    meta: { title: "Hello World", description: "My first Forge app" },
    elements: {
      root: {
        type: "Stack",
        props: { gap: "16", padding: "24" },
        children: ["title", "button"]
      },
      title: {
        type: "Text",
        props: { content: "Hello from Forge!", variant: "heading1" }
      },
      button: {
        type: "Button",
        props: { label: "Click Me", variant: "primary" }
      }
    },
    root: "root"
  };
</script>
```

### 2. Deploy with the server

```bash
# Install
npm install @forge/server

# Start
npx forge-server --port 3000 --db ./apps.db

# Create an app via API
curl -X POST http://localhost:3000/api/apps \
  -H "Content-Type: application/json" \
  -d @manifest.json

# App is live at http://localhost:3000/apps/<app-id>
```

### 3. Connect via MCP

```json
{
  "mcpServers": {
    "forge": {
      "command": "npx",
      "args": ["@forge/connect"]
    }
  }
}
```

The agent can now create, update, and manage apps via MCP tools.

## Manifest Format

```jsonc
{
  "manifest": "0.1.0",           // Format version (required)
  "id": "my-app",                // Unique app ID
  "meta": {                      // App metadata
    "title": "My App",
    "description": "What it does"
  },
  "schema": {                    // Data schema (optional)
    "version": 1,
    "tables": {
      "items": {
        "columns": {
          "id": "string",
          "name": "string",
          "value": "number"
        }
      }
    }
  },
  "state": {                     // Initial data (optional)
    "data": {
      "items": {
        "item-1": { "id": "item-1", "name": "First", "value": 42 }
      }
    }
  },
  "elements": {                  // Component tree
    "root": {
      "type": "Stack",
      props: { "gap": "16" },
      "children": ["child-1", "child-2"]
    },
    "child-1": {
      "type": "Text",
      "props": { "content": "Hello!", "variant": "heading1" }
    },
    "child-2": {
      "type": "Table",
      "props": {
        "data": { "$expr": "state.data.items | values" },
        "columns": [
          { "key": "name", "label": "Name", "type": "text" },
          { "key": "value", "label": "Value", "type": "number" }
        ]
      }
    }
  },
  "root": "root"                 // Entry point element ID
}
```

## Components

### Structural

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| **Stack** | Vertical/horizontal layout | `direction`, `gap`, `padding`, `align`, `wrap` |
| **Grid** | CSS Grid container | `columns`, `gap` |
| **Card** | Bordered container with header | `title`, `subtitle` |
| **Container** | Slot container for tabs/modals | `slot`, `padding` |
| **ButtonGroup** | Horizontal button layout | - |
| **Divider** | Horizontal line | `variant` |
| **Spacer** | Empty space | `height`, `width` |

### Data Display

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| **Table** | Data table with columns | `data`, `columns`, `selectable` |
| **Chart** | Bar/line/pie charts | `chartType`, `data`, `xKey`, `yKey`, `color` |
| **Metric** | KPI card | `label`, `value`, `trend`, `unit`, `subtitle` |
| **Text** | Typography | `content`, `variant` (heading1-3, body, muted, code, label) |
| **Badge** | Status label | `text`, `variant` (success/warning/error/info) |
| **ProgressBar** | Progress indicator | `value`, `max`, `label`, `showValue` |

### Input

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| **TextInput** | Text field | `label`, `placeholder`, `required` |
| **NumberInput** | Number field | `label`, `min`, `max`, `step` |
| **Select** | Dropdown | `label`, `options`, `value` |
| **Toggle** | Switch | `label`, `value`, `description` |
| **Checkbox** | Checkbox | `label`, `checked` |
| **Slider** | Range slider | `label`, `min`, `max`, `value`, `showValue`, `unit` |

### Presentation

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| **Button** | Action button | `label`, `variant` (primary/secondary/ghost), `disabled` |
| **Tabs** | Tab container | `tabs` (array of `{id, label}`), `activeTab` |
| **Modal** | Dialog overlay | `title`, `open`, `children` |
| **Alert** | Notification | `message`, `variant` (success/warning/error/info), `title` |

## Expressions

Bind component props to state data using `$expr`:

```jsonc
{
  "data": { "$expr": "state.data.items | values" }
  // "state.data.items | values" → Object.values(state.data.items)
}
```

Expression syntax:
- `state.data.path.to.value` — dot-notation state access
- `| values` — pipe to Object.values()
- `| keys` — pipe to Object.keys()
- `| entries` — pipe to Object.entries()
- `| json` — JSON.stringify

## Column Types (Table)

```jsonc
{
  "key": "status",
  "label": "Status",
  "type": "badge",           // text | number | badge | date
  "badgeMap": {              // Only for type: "badge"
    "active": "success",
    "pending": "warning",
    "error": "error"
  }
}
```

## CLI

```bash
# Create a new app interactively
npx forge create

# Validate a manifest
npx forge validate manifest.json

# Start the server
npx forge serve --port 3000

# List available components
npx forge components

# Scaffold a project
npx forge init my-project
```

## API Reference

### Server Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Landing page (list of apps) |
| GET | `/apps/:id` | Rendered app page |
| GET | `/runtime/forge.js` | Runtime bundle |
| GET | `/api/health` | Health check |
| GET | `/api/apps` | List apps (query: `limit`, `offset`) |
| GET | `/api/apps/:id` | Get app manifest |
| POST | `/api/apps` | Create app (body: manifest JSON) |
| PUT | `/api/apps/:id` | Replace app (body: manifest JSON) |
| PATCH | `/api/apps/:id` | Patch app (body: JSON merge patch) |
| DELETE | `/api/apps/:id` | Delete app |

### MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `forge_create_app` | Create a new app | `manifest` (required) |
| `forge_update_app` | Update an app | `id` (required), `manifest` (required) |
| `forge_get_app` | Get app manifest | `id` (required) |
| `forge_list_apps` | List all apps | `limit`, `offset` |
| `forge_delete_app` | Delete an app | `id` (required) |

## Security

- **URL validation**: `javascript:`, `data:text/html`, `vbscript:`, `file:` blocked
- **Event handler props**: `onclick`, `onerror`, etc. stripped from elements
- **XSS patterns**: `<script>`, `<iframe>`, `<object>`, `<embed>` detected in string props
- **Validation pipeline**: Schema → URL security → Semantic checks → Cross-references
- **Lit auto-escaping**: All template interpolation auto-escaped by Lit
- **SQL injection**: All queries use parameterized statements (better-sqlite3)
- **PUT/PATCH validation**: All write endpoints validate manifests before persisting

See [SECURITY-REVIEW.md](./SECURITY-REVIEW.md) for the full security analysis.

## Performance

| Metric | Value |
|--------|-------|
| Runtime bundle | 334 KB raw, ~95 KB gzip (IIFE); 173 KB raw, ~42 KB gzip (ESM) |
| Parse 100-element manifest | 0.066ms |
| Parse 1000-element manifest | 0.75ms |
| Parse 5000-element manifest | 4.0ms |
| Deep merge (1000 elements) | 0.23ms |
| Memory (10K elements) | ~5 MB RSS |

## License

MIT
