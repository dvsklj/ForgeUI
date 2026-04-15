# ForgeUI Security Review

**Date:** 2026-04-15
**Scope:** Validation pipeline, HTML rendering, component rendering, server API, SQLite storage

---

## 1. validateManifest (src/validation/index.ts)

### What It Checks
- **JSON Schema** (Layer 1): Validates required fields, types, component type enum, sizes via Ajv strict mode (line 67–112).
- **URL allowlisting** (Layer 2): Rejects `javascript:`, `data:text/html`, `vbscript:`, `file:` schemes. Enforces allowed scheme list. Strips `on*` event handler props. Tests string props against `<script>`, `<iframe>`, `<object>`, `<embed>` regex (lines 28–41, 170–263).
- **State paths** (Layer 3): Validates `$computed:` references resolve to declared schema tables/columns (lines 272–314).
- **Catalog** (Layer 4): Ensures every element type is a registered component (lines 317–327).
- **Cross-references**: Root exists, children exist, no cycles (lines 330–392).
- **Size limits**: Warns at 100KB (line 154).

### What It MISSES

**[CRITICAL] No validation of `state` values (line 83).**
The schema declares `state: { type: 'object' }` — this accepts *any* nested structure. A malicious manifest can inject deeply nested objects to cause excessive memory usage or prototype pollution in `createForgeStore`. No depth limit, no key sanitization.

**[HIGH] `additionalProperties: true` on manifest root (line 70).**
The top-level manifest schema allows arbitrary extra keys. An attacker can attach unexpected properties (e.g., `__proto__`, `constructor`) that may pollute prototype chains if the manifest is shallow-copied or spread with `{...manifest}`.

**[MEDIUM] Injection pattern detection is incomplete (lines 32–41).**
The regex list doesn't cover: `<svg/onload=...>`, `<math>`, `<details open ontoggle=...>`, CSS `expression()` variants beyond parentheses, or `data:text/html;base64,...` payloads. The `data:text/html` check requires an exact prefix match — a Base64-encoded payload bypasses it.

**[MEDIUM] `children` array items are only checked for strings (line 226–240).**
Children references are element IDs (strings), but the schema doesn't enforce `additionalProperties: false` on the element object. Arbitrary keys on elements are silently accepted.

---

## 2. HTML Rendering Pipeline (src/server/index.ts)

### Manifest JSON Embedding

**[HIGH] Manifest embedded as single-quoted attribute (line 268).**
```html
<forge-app manifest='${manifestJson}' ...>
```
Line 109 does `JSON.stringify(...).replace(/</g, '\\u003c')` — this escapes `<` to prevent `<script>` injection *within* a JSON blob, but does NOT escape single quotes. If any manifest value contains a single quote (`'`), it breaks out of the attribute:

```json
{"meta":{"title":"x' onload='alert(1)"}}
```

This yields: `manifest='{"meta":{"title":"x' onload='alert(1)'}}'` which injects an `onload` handler into the page.

**Fix:** Use double quotes for the attribute (and escape `"` inside JSON) or use a `<script type="application/json">` child element instead.

**[MEDIUM] Landing page `a.id` not escaped (line 276).**
```html
<a href="/apps/${a.id}" ...>
```
App IDs are hex-generated (db.ts line 60–62), but if created via the API with a custom ID, the `id` field allows any 1–128 char string per the schema (validation/index.ts line 73). An attacker could set `id` to `javascript:alert(1)` or `"><script>alert(1)</script>` — the first is partially mitigated by URL scheme validation, but the second is not escaped in the href context.

**Fix:** Run `a.id` through `escapeHtml()` before interpolating.

**[LOW] `escapeHtml` doesn't escape single quotes (line 321–323).**
The function escapes `& < > "` but not `'`. Since single-quoted attributes are used (line 268), this is an additional vector for the attribute injection above.

---

## 3. Component Rendering

**[LOW] No per-prop type validation at render time.**
The renderer (`src/renderer/index.ts`) passes resolved props directly to components via `.props=${resolvedProps}` (line 30–73). Components resolve values through `ForgeElement.getProp()` (`src/components/base.ts:56`), which performs type coercion (`getString`, `getNumber`, `getBool`) but does not validate bounds or formats.

However, Lit's template system auto-escapes interpolation (`html\``) — this prevents XSS in rendered output as long as components do not use `unsafeHTML` (confirmed: zero occurrences in the codebase). Components render via Lit's property binding, not innerHTML.

**[MEDIUM] User-controlled state can influence rendering at scale.**
The `state` object is loaded directly into TinyBase (runtime/index.ts line 119–122). Maliciously large state values (arrays, deeply nested objects) could cause rendering performance issues or memory exhaustion. No per-value size cap exists.

---

## 4. Server API (src/server/index.ts)

**[HIGH] CORS is wide open (line 66).**
```ts
app.use('/api/*', cors());
```
The Hono `cors()` with no arguments allows ALL origins (`*`). Any website can create, read, update, or delete apps via the API. In a multi-user or internet-facing deployment, this means:
- Any site can overwrite/delete any app (no auth, no CSRF protection).
- Data exfiltration of all stored manifests.

**Fix:** Restrict to specific allowed origins or disable CORS entirely if only used locally.

**[HIGH] No authentication or authorization on any endpoint.**
There is zero auth on POST/PUT/PATCH/DELETE `/api/apps/:id`. Anyone can create, modify, or delete any app.

**[MEDIUM] No request body size limit.**
`c.req.json()` (lines 151, 174, 197) accepts arbitrarily large JSON payloads. An attacker could send multi-GB manifests to exhaust memory or disk (SQLite).

**[MEDIUM] `limit` and `offset` query params not validated (lines 132–133).**
```ts
const limit = parseInt(c.req.query('limit') || '50');
```
Negative or extremely large values pass through to SQLite `LIMIT ? OFFSET ?`. While SQLite clamps these, an attacker could set `limit=999999999` to force a massive SELECT.

**Fix:** Clamp to `Math.max(1, Math.min(limit, 100))`.

**[LOW] No Content-Type enforcement on API endpoints.**
PUT/PATCH accept any content type — `c.req.json()` will try to parse, but if the client sends non-JSON, the error path leaks `err.message` (lines 166, 189, 209) which may include internal stack information.

---

## 5. SQLite Storage (src/server/db.ts)

**[LOW] No SQL injection risk (parameterized queries).**
All database operations use prepared statements with `?` placeholders (lines 70–73, 81, 98–100, 119–122, 141). This is correctly implemented via `better-sqlite3`.

**[MEDIUM] Arbitrary JSON stored without validation.**
The `manifest` column stores raw JSON (line 33). The PATCH endpoint (`patchApp`, line 129–135) performs a deep merge without schema validation — an attacker could patch in malicious content that bypasses the initial `validateManifest` check on creation (since PUT/PATCH don't call `validateManifest` at all).

**[HIGH] PUT/PATCH endpoints skip validation entirely.**
The POST endpoint (`/api/apps`, line 149) calls `validateManifest` indirectly (through `createApp` which doesn't validate either — the validation happens client-side in the runtime). The PUT endpoint (line 171) and PATCH endpoint (line 194) do NOT call `validateManifest`. An attacker can store a manifest with `javascript:` URLs, `<script>` payloads, etc., and it will be served directly from `/apps/:id`.

**[LOW] App ID collision possible with custom IDs.**
`generateAppId()` produces 8-char hex (4 billion combinations, line 60–62), but the schema allows arbitrary 1–128 char strings for `id` (validation/index.ts line 73). An attacker could overwrite existing apps by guessing or knowing their ID.

---

## Summary Scorecard

| Category               | Severity | Findings |
|------------------------|----------|----------|
| Manifest Validation    | CRITICAL | 4 findings (state not validated, additionalProperties, weak injection regex, children) |
| HTML Rendering         | HIGH     | 3 findings (single-quote attribute injection, unescaped IDs, no quote escaping) |
| Component Rendering    | LOW-MED  | 2 findings (no prop bounds validation, state size abuse) |
| Server API             | HIGH     | 4 findings (open CORS, no auth, no body size limit, unvalidated params) |
| SQLite Storage         | HIGH     | 2 findings (PUT/PATCH skip validation, arbitrary JSON merge) |

### Overall Risk Rating: HIGH

### Top 5 Priority Fixes

1. **[CRITICAL]** Escape single quotes in `manifestJson` before embedding in the HTML attribute, or switch to `<script type="application/json">` embedding.
2. **[HIGH]** Add `validateManifest()` calls to PUT and PATCH API endpoints before persisting.
3. **[HIGH]** Restrict CORS to allowed origins; add authentication middleware.
4. **[HIGH]** Add `additionalProperties: false` to the manifest root schema and sanitize state object keys.
5. **[MEDIUM]** Add request body size limits (`c.req.json({ limit: '1mb' })` or similar), clamp `limit`/`offset` params, and escape `a.id` in the landing page.
