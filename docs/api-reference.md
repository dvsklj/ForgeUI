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

### forge_create_app

Create a new app from a manifest.

```json
{
  "name": "forge_create_app",
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

### forge_update_app

Update an existing app.

```json
{
  "name": "forge_update_app",
  "arguments": {
    "id": "abc12345",
    "manifest": { ... }
  }
}
```

### forge_get_app

Get an app's manifest.

```json
{
  "name": "forge_get_app",
  "arguments": { "id": "abc12345" }
}
```

### forge_list_apps

List all apps.

```json
{
  "name": "forge_list_apps",
  "arguments": { "limit": 10, "offset": 0 }
}
```

### forge_delete_app

Delete an app.

```json
{
  "name": "forge_delete_app",
  "arguments": { "id": "abc12345" }
}
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
