# API Reference

This reference describes the current ForgeUI runtime, server, CLI, MCP connector, and manifest shape implemented in the repository.

## Runtime package

### Browser custom element

The runtime registers one app host element:

```html
<forgeui-app id="app" surface="standalone"></forgeui-app>
```

Set a manifest as a JavaScript property:

```js
document.getElementById('app').manifest = manifest;
```

Or place inline JSON inside the element:

```html
<forgeui-app surface="embed">
  <script type="application/json">
    { "manifest": "0.1.0", "id": "hello", "root": "root", "elements": { "root": { "type": "Text", "props": { "content": "Hello" } } } }
  </script>
</forgeui-app>
```

Supported `surface` values are `chat`, `standalone`, and `embed`.

### Runtime exports

```js
import {
  ForgeUIApp,
  validateManifest,
  extractManifest,
  createForgeUIStore,
  resolveRef,
  executeAction,
  catalogPrompt,
  catalogToJsonSchema,
  isValidComponentType,
  isA2UIPayload,
  ingestPayload
} from '@nedast/forgeui-runtime';
```

The package also exposes:

```js
import '@nedast/forgeui-runtime/components';
import '@nedast/forgeui-runtime/forgeui.js';
import '@nedast/forgeui-runtime/standalone';
```

### `ForgeUIApp` public methods

Once you have a `<forgeui-app>` element, the instance exposes:

| Method | Description |
|---|---|
| `getStore()` | Returns the TinyBase store, if initialized. |
| `getManifest()` | Returns the parsed manifest after A2UI ingestion and validation. |
| `getValidation()` | Returns the latest validation result. |
| `dispatchAction(actionId, payload?)` | Dispatches a declarative action by ID. |
| `getPersistenceStatus()` | Returns IndexedDB persister status when persistence is active. |
| `undo()` / `redo()` | Restores previous/next manifest snapshots from the runtime undo stack. |
| `pushManifestUpdate(manifest)` | Adds a manifest snapshot to the undo stack. |
| `getUndoRedoState()` | Returns undo/redo availability. |

Static helpers:

```js
ForgeUIApp.catalogPrompt('minimal'); // 'minimal' | 'default' | 'full'
ForgeUIApp.catalogJsonSchema();
```

## CLI

The intended server package exposes two binaries:

```bash
forgeui-server --port 3000 --host 0.0.0.0 --db ./forgeui.db
forgeui serve --port 3000 --host 0.0.0.0 --db ./forgeui.db
```

The `forgeui` CLI supports:

```bash
forgeui serve
forgeui deploy <manifest.json> [--server http://localhost:3000]
forgeui validate <manifest.json> [--json]
forgeui catalog [--tier minimal|default|full] [--json]
forgeui connect [--db ./forgeui.db]
forgeui dev
```

## Server API

Base URL in local examples: `http://localhost:3000`.

### Health check

```http
GET /api/health
```

Response:

```json
{ "status": "ok", "timestamp": "2026-04-15T17:00:00.000Z" }
```

### Create app

```http
POST /api/apps
Content-Type: application/json
```

Body: manifest JSON.

If `id` is missing, the server generates an 8-character hex ID. If `id` is present, the server validates it with:

```txt
^[a-z0-9][a-z0-9\-_]{0,127}$
```

Response: `201 Created`

```json
{
  "id": "abc12345",
  "title": "My App",
  "manifest": { "manifest": "0.1.0", "id": "abc12345", "root": "root", "elements": {} },
  "created_at": "2026-04-15 17:00:00",
  "updated_at": "2026-04-15 17:00:00",
  "url": "http://localhost:3000/apps/abc12345"
}
```

Current behavior: `POST /api/apps` checks JSON/body size and the app ID format, but full manifest validation is performed by the runtime, by `forgeui validate`, by the MCP validation tool, and by the `PUT`/`PATCH` update paths.

Errors include:

```json
{ "error": "Invalid JSON" }
{ "error": "Request body too large" }
{ "error": "invalid id" }
```

### List apps

```http
GET /api/apps?limit=20&offset=0
```

`limit` defaults to `20` and is clamped to `1..100`. `offset` defaults to `0`.

Response:

```json
{
  "apps": [
    {
      "id": "abc12345",
      "title": "My App",
      "manifest": { "manifest": "0.1.0", "id": "abc12345", "root": "root", "elements": {} },
      "created_at": "2026-04-15 17:00:00",
      "updated_at": "2026-04-15 17:00:00"
    }
  ],
  "total": 42
}
```

### Get app

```http
GET /api/apps/:id
```

Response: `200 OK` — full stored app record with `manifest`.

Response: `400 Bad Request`

```json
{ "error": "invalid id" }
```

Response: `404 Not Found`

```json
{ "error": "App not found" }
```

### Update app with full replacement

```http
PUT /api/apps/:id
Content-Type: application/json
```

Body: full manifest JSON. The server enforces the path ID by assigning `manifest.id = :id`, then validates the complete manifest before writing.

Response: `200 OK` — updated app record with `url`.

Response: `400 Bad Request`

```json
{ "error": "Validation failed", "details": [ ... ] }
```

Response: `404 Not Found`

```json
{ "error": "App not found" }
```

### Patch app with JSON Merge Patch

```http
PATCH /api/apps/:id
Content-Type: application/json
```

Body: JSON Merge Patch object. `null` deletes keys. The patch envelope is checked for unsafe keys, nesting depth, and size before merge. The merged manifest is validated before writing.

Example — update state only:

```json
{
  "state": {
    "todos": {
      "t1": { "done": true }
    }
  }
}
```

Response: `200 OK` — patched app record with `url`.

Response: `400 Bad Request`

```json
{ "error": "Invalid patch", "details": [ ... ] }
```

or:

```json
{ "error": "Validation failed after patch", "details": [ ... ] }
```

Response: `404 Not Found`

```json
{ "error": "App not found" }
```

### Delete app

```http
DELETE /api/apps/:id
```

Response: `200 OK`

```json
{ "deleted": true }
```

Response: `400 Bad Request`

```json
{ "error": "invalid id" }
```

Response: `404 Not Found`

```json
{ "error": "App not found" }
```

### Rendered app page

```http
GET /apps/:id
```

Returns a complete HTML page with the stored manifest embedded in a JSON script tag and the runtime loaded from `/runtime/forgeui.js`.

The rendered app page has a CSP header with a nonce for the inline manifest loader. Invalid IDs return an HTML error page.

### Runtime bundles served by the server

```http
GET /runtime/forgeui.js
GET /runtime/forgeui-standalone.js
```

Both are served as JavaScript with `Cache-Control: public, max-age=3600` when the corresponding built runtime file can be resolved.

## MCP connector

`@nedast/forgeui-connect` runs an MCP server over stdio. It stores apps in the same SQLite database layer as the server package. Set `FORGEUI_DB_PATH` or use the `forgeui connect --db` wrapper to choose the database path.

### `forgeui_create_app`

Create a new app from a full manifest. The tool validates the manifest before writing.

```json
{
  "manifest": {
    "manifest": "0.1.0",
    "id": "my-app",
    "meta": { "title": "My App" },
    "root": "root",
    "elements": {
      "root": { "type": "Text", "props": { "content": "Hello" } }
    }
  }
}
```

Returns JSON text containing `success`, `id`, `title`, `url`, and `created_at`.

### `forgeui_update_app`

Update an existing app. By default, `manifest` is treated as a JSON Merge Patch. Set `patch` to `false` for full replacement.

```json
{
  "app_id": "my-app",
  "manifest": {
    "meta": { "title": "Updated title" }
  },
  "patch": true
}
```

### `forgeui_validate_manifest`

Validate a manifest without creating an app.

```json
{
  "manifest": { "manifest": "0.1.0", "id": "my-app", "root": "root", "elements": { ... } }
}
```

Returns `valid`, `errors`, and `warnings`.

### `forgeui_component_docs`

Return the LLM prompt text and generated manifest JSON schema.

```json
{ "tier": "full" }
```

`tier` may be `minimal`, `default`, or `full`.

### `forgeui_list_apps`

List hosted apps, newest first.

```json
{ "limit": 20, "offset": 0 }
```

### `forgeui_get_app`

Fetch a stored app by ID.

```json
{ "app_id": "my-app" }
```

### `forgeui_delete_app`

Delete a stored app by ID.

```json
{ "app_id": "my-app" }
```

## Manifest schema

The generated Ajv schema is intentionally strict at the top level and for element envelopes, while keeping component `props`, `actions`, `state`, and table definitions open enough for the component catalog and state runtime.

Top-level shape:

```jsonc
{
  "manifest": "0.1.0",        // string matching ^0\.\d+\.\d+$
  "id": "my-app",            // required, 1..128 chars
  "root": "root",            // required element ID
  "schema": {                 // optional
    "version": 1,
    "tables": {},
    "migrations": [],
    "views": {}
  },
  "state": {},                // optional arbitrary object
  "elements": {               // required, at least one element
    "root": {
      "type": "Stack",
      "props": {},
      "children": [],
      "visible": {}
    }
  },
  "actions": {},              // optional object
  "meta": {},                 // optional object
  "persistState": true,
  "skipPersistState": false,
  "dataAccess": {
    "enabled": false,
    "readable": [],
    "restricted": [],
    "summaries": false
  }
}
```

Required top-level keys:

```txt
manifest, id, root, elements
```

Allowed top-level keys:

```txt
manifest, id, root, schema, state, elements, actions, meta, persistState, skipPersistState, dataAccess
```

Element envelope:

```jsonc
{
  "type": "Button",           // must be one of the registered manifest component types
  "props": { "label": "Save", "action": "save" },
  "children": ["child-id"],
  "visible": { "$when": { "path": "ready", "eq": true } }
}
```

Element objects do not allow arbitrary sibling keys outside `type`, `props`, `children`, and `visible`.

## Validation behavior

`validateManifest(data)` runs:

1. Ajv schema validation.
2. URL and dangerous string checks for string props and action data.
3. `$state:` / `$computed:` reference checks where a schema or state keys are available.
4. Component catalog enforcement.
5. Root/child reference checks and cycle detection.
6. Manifest size warning above 100 KB.

`extractManifest(rawText)` removes a surrounding Markdown JSON fence before callers pass the result to `JSON.parse`.

## State references and expressions

The runtime resolves references in props before rendering:

| Form | Meaning |
|---|---|
| `$state:path` | Resolve a TinyBase value, table row, or cell path. Slash paths such as `todos/t1/done` are supported. |
| `$computed:count:table` | Row count for a table. |
| `$computed:sum:table/column` | Sum a numeric column. |
| `$computed:avg:table/column` | Average a numeric column. |
| `$item:field` | Read a field from the current `Repeater` item. Dot paths are supported. |
| `$expr:state.todos \| values` | Evaluate a constrained expression. |
| `Hello {{state.name}}` | Interpolate expression results into a string. |

Supported `$expr` forms include `state.foo.bar`, `item.field`, literals, pipe filters (`values`, `keys`, `count`, `length`, `sum`, `first`, `last`), and simple numeric/comparison expressions with one operator.