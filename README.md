# ForgeUI

Dynamic web app platform for LLM-generated apps. From manifest to working app in milliseconds.

## What It Does

Forge renders interactive web applications from declarative JSON manifests. Any LLM generates the manifest. Forge renders it. Same manifest, same app, always.

```html
<forge-app manifest='{"root":"shell","elements":{...}}'></forge-app>
```

No build step. No server required. No framework lock-in.

## Three Rings

- **Ring 1 — Forge Core** (~40KB, browser-only, MIT): The renderer. Lit + TinyBase + 36-component catalog + validation. A2UI-compatible superset.
- **Ring 2 — Forge Server** (self-hostable, MIT): Manifest storage, shareable URLs, WebSocket sync, MCP tool.
- **Ring 3 — Forge Cloud** (commercial): Cloudflare edge, V8 sandboxing, data residency.

## Quick Start

```bash
npm install
npm run build
```

Then in HTML:

```html
<script type="module" src="dist/forge.js"></script>
<forge-app surface="standalone" src='{"manifest":"0.1.0","id":"hello","root":"greeting","elements":{"greeting":{"type":"Text","props":{"content":"Hello, Forge!","variant":"heading"}}}}'></forge-app>
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full technical specification.

## 36 Components

| Category | Components |
|----------|-----------|
| Layout | Stack, Grid, Card, Container, Tabs, Accordion, Divider, Spacer |
| Content | Text, Image, Icon, Badge, Avatar, EmptyState |
| Input | TextInput, NumberInput, Select, MultiSelect, Checkbox, Toggle, DatePicker, Slider, FileUpload |
| Action | Button, ButtonGroup, Link |
| Data Display | Table, List, Chart, Metric |
| Feedback | Alert, Dialog, Progress, Toast |
| Navigation | Breadcrumb, Stepper |

## Manifest Format

Flat, ID-based JSON. LLMs handle flat structures more reliably.

```json
{
  "manifest": "0.1.0",
  "id": "my-app",
  "root": "shell",
  "schema": { "version": 1, "tables": { "items": { "columns": { "name": { "type": "string" } } } } },
  "state": { "view/active": "list" },
  "elements": {
    "shell": { "type": "Stack", "props": { "spacing": "md" }, "children": ["title", "list"] },
    "title": { "type": "Text", "props": { "content": "My App", "variant": "heading" } },
    "list": { "type": "List", "props": { "dataPath": "items" } }
  },
  "actions": {
    "add-item": { "type": "mutateState", "path": "items", "operation": "append" }
  }
}
```

## License

MIT
