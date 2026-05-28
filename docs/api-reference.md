# API Reference

## Server API

Base URL: `http://localhost:3000`

### Health Check

```
GET /api/health
```

Response:
```json
{ "status": "ok", "timestamp": "2026-04-15T17:00:00.000Z" }
```

### Create App

```
POST /api/apps
Content-Type: application/json
```

Body: Full manifest JSON.

Response: `201 Created`
```json
{
  "id": "abc12345",
  "title": "My App",
  "manifest": { ... },
  "created_at": "2026-04-15 17:00:00",
  "updated_at": "2026-04-15 17:00:00",
  "url": "http://localhost:3000/apps/abc12345"
}
```

If `id` is not provided, one is auto-generated (8-char hex).

### List Apps

```
GET /api/apps?limit=50&offset=0
```

Response:
```json
{
  "apps": [
    { "id": "abc12345", "title": "My App", "created_at": "...", "updated_at": "..." }
  ],
  "total": 42
}
```

### Get App

```
GET /api/apps/:id
```

Response: `200 OK` — full app record with manifest.
Response: `404 Not Found` — `{ "error": "App not found" }`

### Update App (Full Replace)

```
PUT /api/apps/:id
Content-Type: application/json
```

Body: Full manifest JSON. Validated before persisting.

Response: `200 OK` — updated app record.
Response: `400 Bad Request` — `{ "error": "Validation failed", "details": [...] }`
Response: `404 Not Found`

### Patch App (JSON Merge Patch)

```
PATCH /api/apps/:id
Content-Type: application/json
```

Body: Partial JSON. Deep-merged into existing manifest. `null` values delete keys.

Example — update state only:
```json
{
  "state": {
    "data": {
      "todos": {
        "t1": { "done": true }
      }
    }
  }
}
```

Response: `200 OK` — patched app record (validated after merge).
Response: `400 Bad Request` — `{ "error": "Validation failed after patch", "details": [...] }`
Response: `404 Not Found`

### Delete App

```
DELETE /api/apps/:id
```

Response: `200 OK` — `{ "deleted": true }`
Response: `404 Not Found`

### Rendered App Page

```
GET /apps/:id
```

Returns: Full HTML page with embedded manifest and runtime script.

## MCP Tools

### forgeui_create_app

Create a new app from a manifest.

```json
{
  "name": "forgeui_create_app",
  "arguments": {
    "manifest": {
      "manifest": "0.1.0",
      "meta": { "title": "My App" },
      "elements": { ... },
      "root": "root"
    }
  }
}
```

### forgeui_update_app

Update an existing app.

```json
{
  "name": "forgeui_update_app",
  "arguments": {
    "id": "abc12345",
    "manifest": { ... }
  }
}
```

### forgeui_get_app

Get an app's manifest.

```json
{
  "name": "forgeui_get_app",
  "arguments": { "id": "abc12345" }
}
```

### forgeui_list_apps

List all apps.

```json
{
  "name": "forgeui_list_apps",
  "arguments": { "limit": 10, "offset": 0 }
}
```

### forgeui_delete_app

Delete an app.

```json
{
  "name": "forgeui_delete_app",
  "arguments": { "id": "abc12345" }
}
```

## Manifest Actions

Manifest actions live under `actions` and are referenced by component props such
as `action`, `rowAction`, and form submit actions.

```json
{
  "actions": {
    "save": {
      "type": "callApi",
      "url": "/api/save",
      "method": "POST",
      "body": { "name": "$state:form/name" }
    }
  }
}
```

| Type | Required fields | Effect |
|------|-----------------|--------|
| `mutateState` | `path` or `set` | Updates TinyBase state. `operation` may be `set`, `append`, `update`, `delete`, `increment`, `decrement`, or `toggle`. |
| `navigate` | `target` | Switches the active root view to another element ID. |
| `openDialog` | `target` | Opens a `Dialog` element by ID. |
| `closeDialog` | — | Closes `target`, or the most recently opened dialog when `target` is omitted. |
| `toast` | `message` or `data.message` | Renders a transient `Toast`. `duration` is milliseconds; `0` keeps it visible. |
| `callApi` | `url` | Calls an HTTP(S) endpoint. `method` may be `GET`, `POST`, `PUT`, `PATCH`, or `DELETE`; non-GET bodies are JSON encoded. |
| `custom` | — | Emits `forgeui-action` for the host app to handle. Extra fields are preserved in `definition`. |

For `mutateState`, `set` writes multiple state paths, `path` writes one state
path, and `append`/`update`/`delete` use `path` as the table path with `key` as
the row ID. `increment` and `decrement` operate on numeric values; `toggle`
operates on boolean values. `path` and `key` may include `{{id}}`, replaced from
the action payload.

Controls with `bind: "$state:..."` update state directly from
`payload.value`, `payload.checked`, or `payload.active`; no manifest action is
required for simple input binding.

Action string values may reference state with `$state:path` or computed values
with `$expr: ...` where the runtime resolves action values. `callApi.body` is
resolved recursively.

## Runtime Events

`forgeui-action`: emitted by components when they dispatch an action. Custom
runtime actions also emit it with the action `definition`.

```json
{
  "action": "export",
  "payload": { "id": "row-1" },
  "definition": { "type": "custom", "action": "export" }
}
```

`forgeui-action-result`: emitted after `callApi` succeeds or fails.

```json
{
  "action": "save",
  "payload": { "id": "row-1" },
  "ok": true,
  "status": 201,
  "result": {}
}
```

`forgeui-api-result`: emitted after a completed `callApi` fetch. Check `ok` for
HTTP success.

```json
{
  "action": "save",
  "payload": { "id": "row-1" },
  "ok": true,
  "status": 201,
  "result": {}
}
```

`forgeui-api-error`: emitted when `callApi` is blocked or fails.

```json
{
  "action": "save",
  "payload": { "id": "row-1" },
  "ok": false,
  "error": "Blocked unsafe callApi URL: javascript:alert(1)"
}
```

`forgeui-persistence`: emitted when persistence is disabled, loading, ready, or failed.

```json
{
  "state": "ready",
  "status": { "mode": "indexeddb", "isPersisting": true }
}
```

`forgeui-ready`: emitted after manifest initialization.

```json
{ "appId": "nutrition-tracker" }
```

`forgeui-submit`: emitted by `Form` submit.

```json
{ "submitted": true }
```

## Manifest Schema

```jsonc
{
  "type": "object",
  "required": ["manifest", "elements", "root"],
  "properties": {
    "manifest": { "type": "string", "const": "0.1.0" },
    "id": { "type": "string", "maxLength": 128 },
    "meta": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "description": { "type": "string" },
        "icon": { "type": "string" }
      }
    },
    "schema": {
      "type": "object",
      "properties": {
        "version": { "type": "number" },
        "tables": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "columns": { "type": "object" }
            }
          }
        }
      }
    },
    "state": { "type": "object" },
    "elements": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "required": ["type"],
        "properties": {
          "type": { "type": "string" },
          "props": { "type": "object" },
          "children": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    },
    "root": { "type": "string" }
  }
}
```
