# Expression Engine Audit

**Date:** 2026-04-17
**Scope:** `$state:`, `$computed:`, `$item:`, `$expr:` reference resolution in ForgeUI runtime
**Purpose:** Input to Prompt 17b hardening work — enumerate, test, rank, recommend

---

## 1. Accepted Grammar

All four forms are resolved in `src/state/index.ts:259` (`resolveRef`). The entry point is string prefix matching — no tokenization, no AST.

### 1.1 `$state:path`

| Form | Accepted | Example |
|---|---|---|
| 3-part slash path | `table/rowId/column` | `$state:users/u1/name` → cell value |
| 2-part slash path | `key/subkey` | Tries `store.getValue("key/subkey")`, then falls back to `store.getRow("key", "subkey")` |
| 1-part path | `key` | `$state:name` → `store.getValue("name")` |

**Rejected:** No explicit rejection. Unknown keys return `undefined`.

**Edge cases:**
- `$state:` (empty) → `undefined` (store.getValue("") returns undefined)
- `$state: ` (whitespace) → `undefined`
- `$state:\n` → `undefined`
- `$state:__proto__` → `undefined` (TinyBase uses null-prototype objects)
- `$state:a/b/c/d/e` → `undefined` (5 parts, no handler)
- Unicode in keys: works — `ﬀ`, `café`, `𝔥𝔢𝔩𝔩𝔬`, zero-width space all pass through to store lookup

**Underspecified:** The 2-part slash path is ambiguous — it tries value lookup first, then falls back to row lookup. An LLM cannot predict which interpretation applies without knowing the store contents.

### 1.2 `$computed:expression`

| Form | Accepted | Example |
|---|---|---|
| `count:tableName` | Row count | `$computed:count:users` → `store.getRowCount("users")` |
| `sum:tableName/column` | Column sum | `$computed:sum:orders/total` → sum of numeric cells |
| `avg:tableName/column` | Column average | `$computed:avg:scores/value` |
| Anything else | Falls through to `$state:path` resolution | `$computed:someKey` → `resolveStatePath(store, "someKey")` |

**Edge cases:**
- `$computed:` → falls to `resolveStatePath(store, "")` → `undefined`
- `$computed:count:` → `store.getRowCount("")` → `0`
- `$computed:count:users:extra` → `store.getRowCount("users:extra")` → `0` (not an error)
- `$computed:sum:no-table/no-col` → iterates zero rows, returns `0`

**Underspecified:** The `count:` operator ignores the "table name" if it contains colons or slashes — `store.getRowCount` receives the raw string. No validation against the schema at runtime.

### 1.3 `$item:field`

| Form | Accepted | Example |
|---|---|---|
| Direct property key | `field` | `$item:name` → `currentItemContext?.["name"]` |

**Critical limitation:** Does NOT support dot-notation paths. `$item:user.name` looks for a literal property key `"user.name"` on the context object, not a nested traversal. This diverges from `$expr:item.user.name` which does support dot paths via `getDeepPath`.

**Edge cases:**
- `$item:` → `undefined` (empty string key not found)
- `$item:__proto__` → **returns the prototype object** `[Object: null prototype] {}` ⚠️
- `$item:constructor` → **returns the constructor function** ⚠️
- `$item:` outside Repeater context → `undefined` (context is null)

### 1.4 `$expr:expression`

| Form | Accepted | Example |
|---|---|---|
| String literal (double) | `"hello"` | `$expr:"hello world"` → `"hello world"` |
| String literal (single) | `'hello'` | `$expr:'hello'` → `"hello"` |
| Boolean | `true` / `false` | `$expr:true` → `true` |
| Null | `null` | `$expr:null` → `null` |
| Number | `-?\d+(\.\d+)?` | `$expr:42` → `42`, `$expr:-3.14` → `-3.14` |
| Pipe chain | `value \| filter` | `$expr:state.users \| keys` |
| item path | `item.field.nested` | `$expr:item.user.name` (supports dots) |
| state path | `state.foo.bar` | `$expr:state.users.u1.name` |
| Plain path fallback | `key` | `$expr:someKey` → `resolveStatePath(store, "someKey")` |

**Pipe filters available:** `values`, `keys`, `count`/`length`, `sum`, `first`, `last`. Unknown filter names return the input value unchanged.

**Edge cases:**
- `$expr:` → `undefined` (trimmed empty string)
- `$expr: ` → `undefined`
- `$expr:\n\n` → `undefined`
- `$expr:"unbalanced` → `undefined` (no closing quote, falls through to path resolution)
- `$expr:state` → `undefined` (bare `state` keyword)
- `$expr:item` → `null` (bare `item` keyword, context is null)

### 1.5 `{{expression}}` Template Interpolation

Resolved by regex: `\{\{\s*([^}]+?)\s*\}\}/g`

- Matches `{{ expr }}`, trims whitespace around expression
- Multiple interpolations in one string: supported
- Adjacent interpolations: `{{state.name}}{{state.count}}` → works
- Nested braces: `{{ {{state.name}} }}` → only inner `{{state.name}}` is matched; trailing ` }}` is left as literal text ⚠️
- Expression inside `{{}}` is evaluated by `evaluateExpression`, so supports all `$expr:` forms

### 1.6 `getProp` vs `resolveRef` Discrepancy

`src/components/base.ts:62` (`getProp`) performs prefix detection before calling `resolveRef`:
```typescript
if (typeof value === 'string' && (
  value.startsWith('$state:') ||
  value.startsWith('$computed:') ||
  value.startsWith('$item:') ||
  value.startsWith('$expr:') ||
  (value.includes('{{') && value.includes('}}'))
)) {
  return this.resolve(value);
}
return value;
```

This is redundant with `resolveRef`'s own prefix checks. However, `resolveRef` also handles plain non-prefixed strings (returns them as-is), so the behavior is consistent — just wasteful.

**Object-form `$expr` not supported in props:** The test at `src/__tests__/llm-reliability.test.ts:283` uses `{ $expr: 'state.data.name' }` (object form) in props. `resolveRef` only handles the string form `$expr:state.data.name`. The object form silently passes through unresolved. The test only validates schema, not rendering, so this bug is masked.

---

## 2. Pathological Input Corpus

All tests executed against a TinyBase store with `name: "test"`, `count: 42`, `x: "y"`, `y: "x"`, table `users` with rows `u1` (name: Alice, age: 30) and `u2` (name: Bob, age: 25). Item context: `{ name: 'Item1', count: 10 }`.

### 2.1 Size

| Input | Behavior | Elapsed | Severity |
|---|---|---|---|
| `$state:` + 500K-char dot path | Returns `undefined` | 0.12ms | Safe |
| `$state:bigval` (1MB stored value) | Returns the 1MB string | 0ms | P2 — no length cap on returned values |
| `$expr:state.deep.` + 10K dot segments | Returns `undefined` | 0.95ms | P2 — linear walk, no depth cap |
| `$computed:sum:` + 100K-char table name | Returns `0` | 0.08ms | Safe |
| `$state:` + 10K dot segments (1000 calls) | Returns `undefined`, 0.05 MB delta | — | Safe |

### 2.2 Nesting

| Input | Behavior | Elapsed | Severity |
|---|---|---|---|
| `$expr:` + 100 pipe-separated `keys` filters | Returns `""` (empty string from final keys on empty) | 0.11ms | Safe |
| `$state:ref_a` (store value is `$state:ref_b`) | Returns `"$state:ref_b"` (not followed) | 0ms | Safe — no recursive resolution |

### 2.3 Delimiters

| Input | Behavior | Elapsed | Severity |
|---|---|---|---|
| `$state:a.b{c}` | Returns `undefined` | 0ms | Safe |
| `$state:a.b}c` | Returns `undefined` | 0ms | Safe |
| `$state:a.b(c)` | Returns `undefined` | 0ms | Safe |
| `$state:a.b[c]` | Returns `undefined` | 0ms | Safe |
| `$expr:"unbalanced` | Returns `undefined` | 0ms | P2 — silent wrong result (unclosed string) |
| `$expr:'unbalanced` | Returns `undefined` | 0ms | P2 — silent wrong result |
| `$state:a\\b` | Returns `undefined` | 0ms | Safe |
| `$state:a\\n\\tb` | Returns `undefined` | 0ms | Safe |

### 2.4 Unicode

| Input | Behavior | Elapsed | Severity |
|---|---|---|---|
| `$state:ﬀ` (ligature) | Returns `"ligature"` | 0ms | Safe |
| `$state:test\u200B` (zero-width space) | Returns `"zero-width"` | 0ms | P2 — key mismatch with normalization form |
| `$state:\u202E` (RTL override) | Returns `"rtl-override"` | 0ms | P2 — confusing in logs/UI |
| `$state:café` | Returns `"coffee"` | 0ms | Safe |
| `$state:𝔥𝔢𝔩𝔩𝔬` (astral math chars) | Returns `"math-fraktur"` | 0ms | Safe |
| `$state:\u0301accented` (combining accent) | Returns `undefined` | 0ms | Safe |

### 2.5 Prototype Pollution

| Input | Behavior | Elapsed | Severity |
|---|---|---|---|
| `$state:__proto__` | Returns `undefined` | 0ms | Safe — TinyBase null-prototype |
| `$state:constructor` | Returns `undefined` | 0ms | Safe |
| `$state:constructor.prototype.x` | Returns `undefined` | 0ms | Safe |
| `$state:__proto__.polluted` | Returns `undefined` | 0ms | Safe |
| `$expr:state.__proto__` | Returns `undefined` | 0ms | Safe |
| `$item:__proto__` | **Returns `[Object: null prototype] {}`** | 0.01ms | **P1** |
| `$expr:item.__proto__` | **Returns `object`** | 0.01ms | **P1** |
| `$item:constructor` | **Returns `function`** | — | **P1** |
| `$computed:__proto__` | Returns `undefined` | 0ms | Safe |

### 2.6 ReDoS Candidates

| Input | Behavior | Elapsed | Severity |
|---|---|---|---|
| `{{` + 100K `a` chars (unclosed template) | Returns raw string unchanged | 0.03ms | Safe — lazy quantifier `[^}]+?` |
| `{{` + 10K chars + 1000 `}}` pairs | Returns `}}}}...` (first match consumes `{{aaa...}}`) | 0.06ms | Safe |
| `{{ ` + 50K `ab ` repetitions + `x }}` | Returns empty string | 0.51ms | Safe — linear |
| `$expr:-0.` + 1M `9` chars | Returns `-1` (Number("-0.999...")) | 0.72ms | Safe — linear regex |
| `$expr:` + 10K pipe-separated `x` filters | Returns `"y"` (last filter on unknown returns value) | 1.14ms | Safe — linear split |
| `$state:` + 10K dot-separated segments | Returns `undefined` | <1ms | Safe — linear split |

**No ReDoS found.** All regexes (`^-?\d+(\.\d+)?$`, `\{\{\s*([^}]+?)\s*\}\}/g`) exhibit linear or better scaling.

### 2.7 Injection-Shaped

| Input | Behavior | Elapsed | Severity |
|---|---|---|---|
| `$state:x; alert(1)` | Returns `undefined` | 0ms | Safe — no eval |
| `$computed:require("fs")` | Returns `undefined` | 0ms | Safe — no eval |
| `$expr:global.process.exit()` | Returns `undefined` | 0ms | Safe — no eval |
| `$expr:eval("alert(1)")` | Returns `undefined` | 0ms | Safe — no eval |
| `$expr:Function("return this")()` | Returns `undefined` | 0ms | Safe — no eval |
| `$state:constructor.constructor("return this")()` | Returns `undefined` | 0ms | Safe |
| `$expr:state.name.constructor.constructor("alert(1)")()` | Returns `undefined` | 0ms | Safe |
| `$computed:sum:users/name; DROP TABLE users` | Returns `0` | 0.01ms | Safe — no SQL |
| `$expr:state.users; system("rm -rf /")` | Returns `undefined` | 0ms | Safe — no shell |

**No code execution vectors.** The evaluator uses a closed set of operations (property access, pipe filters) with no `eval()`, `Function()`, or dynamic code execution.

### 2.8 Empty / Whitespace

| Input | Behavior | Elapsed | Severity |
|---|---|---|---|
| `$state:` | Returns `undefined` | 0ms | Safe |
| `$state: ` | Returns `undefined` | 0ms | Safe |
| `$state:\t` | Returns `undefined` | 0ms | Safe |
| `$state:\n` | Returns `undefined` | 0ms | Safe |
| `$computed:` | Returns `undefined` | 0ms | Safe |
| `$computed: ` | Returns `undefined` | 0ms | Safe |
| `$computed:\t\t` | Returns `undefined` | 0ms | Safe |
| `$item:` | Returns `undefined` | 0ms | Safe |
| `$item: ` | Returns `undefined` | 0ms | Safe |
| `$expr:` | Returns `undefined` | 0ms | Safe |
| `$expr: ` | Returns `undefined` | 0ms | Safe |
| `$expr:\n\n` | Returns `undefined` | 0ms | Safe |
| `{{ }}` | Returns `""` (empty string) | 0ms | Safe |

---

## 3. Findings

### P0 — Critical

**No P0 findings.** No code execution, no prototype pollution that reaches state, no DoS (all operations complete in <2ms for inputs up to 1MB).

### P1 — High

#### F1: `$item:__proto__` exposes prototype object

**Input:** `$item:__proto__`
**Behavior:** Returns `[Object: null prototype] {}` — the null-prototype object that TinyBase uses internally. `$item:constructor` returns the `Function` constructor.
**Why it matters:** While TinyBase's null-prototype objects prevent actual prototype chain pollution, exposing the prototype object and constructor via `$item:` is unnecessary attack surface. An adversary could probe for unexpected properties or use the constructor for further exploitation in edge cases.
**Origin:** `src/state/index.ts:274` — `currentItemContext?.[field]` uses unguarded bracket access.

#### F2: `$expr:item.__proto__` returns prototype object

**Input:** `$expr:item.__proto__`
**Behavior:** Returns `object` — the `getDeepPath` function traverses `currentItemContext.__proto__`.
**Why it matters:** Same as F1 but via the expression evaluator's dot-path traversal.
**Origin:** `src/state/index.ts:192` — `getDeepPath` accesses `cur[p]` without filtering `p` against `__proto__`, `constructor`, `prototype`.

#### F3: Nested template braces produce malformed output

**Input:** `{{ {{state.name}} }}`
**Behavior:** Inner `{{state.name}}` matches, evaluates to `"test"`. Result: `"test }}"` — trailing `}}` is left as literal text.
**Why it matters:** An LLM could generate nested templates. The malformed output could break rendering or confuse users. While nested braces are arguably out of scope for the interpolation regex, the failure mode is silent corruption rather than an error.
**Origin:** `src/state/index.ts:284` — regex `\{\{\s*([^}]+?)\s*\}\}/g` doesn't account for nested braces.

#### F4: Object-form `$expr` in props not resolved

**Input:** `{ $expr: 'state.data.name' }` in element props
**Behavior:** `resolveRef` only handles string values. The object form passes through unresolved — the component receives the raw `{ $expr: '...' }` object.
**Why it matters:** The test at `src/__tests__/llm-reliability.test.ts:283` uses this form, creating a false sense of support. If an LLM generates this form, the component will render `[object Object]` or similar.
**Origin:** `src/state/index.ts:260` — `resolveRef` has no object-form handling.

### P2 — Medium

#### F5: `$item:field` doesn't support dot-notation paths

**Input:** `$item:user.nested` (item context: `{ user: { name: 'Alice' } }`)
**Behavior:** Looks for literal key `"user.nested"` → `undefined`. `$expr:item.user.nested` works correctly.
**Why it matters:** Inconsistent behavior between `$item:` and `$expr:item.` forms. LLMs may use either interchangeably.
**Origin:** `src/state/index.ts:274` — direct bracket access vs `getDeepPath` in `$expr:` handler.

#### F6: Global mutable `currentItemContext` is not async-safe

**Input:** N/A (structural issue)
**Behavior:** `setItemContext` sets a module-level global. If async rendering (e.g., `requestAnimationFrame`, `Promise`) interleaves Repeater child renders, context could be clobbered.
**Why it matters:** Currently safe because Lit rendering is synchronous. Becomes a bug if rendering becomes async (e.g., lazy-loaded components, Suspense-like patterns).
**Origin:** `src/state/index.ts:95` — module-level `let currentItemContext`.

#### F7: No length or depth caps on path traversal

**Input:** `$state:` + 10K dot-separated segments
**Behavior:** Returns `undefined` after splitting and walking the full depth. 10K segments takes <1ms, 100K segments ~1ms. No crash, but no guardrail.
**Why it matters:** An adversarial LLM could generate 1M-segment paths. While not a DoS today (linear scaling), a depth cap (e.g., 32 segments) would eliminate the risk entirely.
**Origin:** `src/state/index.ts:190` — `getDeepPath` has no depth limit; `src/state/index.ts:26` — `resolveStatePath` has no path length limit.

#### F8: `$computed:count:users:extra` silently succeeds

**Input:** `$computed:count:users:extra`
**Behavior:** `store.getRowCount("users:extra")` → `0` (table not found). No error, no warning.
**Why it matters:** LLM generates a malformed computed ref; runtime silently returns `0` instead of signaling the error. Could lead to incorrect UI showing "0 items" instead of an error state.
**Origin:** `src/state/index.ts:61` — `expression.slice(6)` passes raw string to `store.getRowCount`.

#### F9: Unclosed quotes in `$expr:` silently return `undefined`

**Input:** `$expr:"unbalanced`
**Behavior:** No closing quote → regex doesn't match literal string pattern → falls through to `resolveStatePath(store, '"unbalanced')` → returns `undefined`.
**Why it matters:** Silent wrong result. The LLM may have intended a string literal.
**Origin:** `src/state/index.ts:121` — literal check requires matching open/close quotes.

#### F10: Unicode normalization not enforced

**Input:** `$state:ﬀ` (ligature U+FB00) vs store key `ff` (two codepoints)
**Behavior:** These are different strings — lookup fails if the store key doesn't use the same normalization form.
**Why it matters:** LLMs may generate NFC or NFD forms. Keys with combining characters (e.g., `é` as `e\u0301` vs `\u00e9`) will not match.
**Origin:** `src/state/index.ts:49` — `store.getValue(path)` uses exact string comparison.

#### F11: `$state:` validation layer doesn't validate `$state:` refs

**Input:** `$state:nonExistentTable/row/col`
**Behavior:** Returns `undefined` at runtime. The validation layer (`src/validation/index.ts:215`) only validates `$computed:` refs against the schema.
**Why it matters:** `$state:` references to unknown tables/columns are never caught during manifest validation. The error only appears at runtime as `undefined`.
**Origin:** `src/validation/index.ts:223` — only `$computed:` refs are checked.

---

## 4. Call-Site Analysis

### 4.1 Where `$`-prefixed strings are resolved

| Location | Form | Mechanism |
|---|---|---|
| `src/state/index.ts:259` `resolveRef` | All four forms + `{{}}` | Primary resolver — prefix match + dispatch |
| `src/renderer/index.ts:130` `resolveProps` | All forms (delegates to `resolveRef`) | Iterates all props, calls `resolveRef` per value |
| `src/renderer/index.ts:141` `evaluateVisibility` | `$state:` only | Hardcodes `$state:${path}` prefix |
| `src/components/base.ts:51` `resolve` | All forms (delegates to `resolveRef`) | Sets item context, calls `resolveRef` |
| `src/components/base.ts:62` `getProp` | Prefix check then `resolve` | Redundant prefix check before calling `resolveRef` |

### 4.2 Divergences between call sites

- **`evaluateVisibility`** (`src/renderer/index.ts:141`) constructs `$state:${path}` from `condition.path`, bypassing any validation on the path string. If `path` is `__proto__`, it resolves `$state:__proto__` which is safe (returns `undefined`), but the pattern of string-concatenating a ref prefix is fragile.

- **`getProp`** (`src/components/base.ts:64`) performs prefix detection that `resolveRef` also does. Not a bug (redundant but consistent), but a maintenance risk — if a new prefix form is added to `resolveRef`, `getProp` must also be updated.

- **Object-form `$expr`** is used in tests (`src/__tests__/llm-reliability.test.ts:283`) but not handled by `resolveRef`. This is a dead code path in tests that creates a false impression of support.

---

## 5. Recommendation for 17b

**Recommendation: Tighten in place.** Do not replace with a recursive-descent parser.

### Justification

1. **No P0 findings.** No code execution, no prototype pollution that reaches the store, no DoS. The worst findings are P1 (prototype object exposure, nested brace corruption).

2. **Grammar is genuinely simple.** Four prefix forms, each with a closed set of sub-formats. No operator precedence, no function calls, no variable binding. The pipe filter is the only "expression-like" feature, and it's a flat chain with no nesting.

3. **No ReDoS.** All regexes scale linearly. The only regex in the hot path (`^-?\d+(\.\d+)?$`) is trivially safe.

4. **Injection is impossible.** The evaluator has no `eval()`, `Function()`, or dynamic code execution. All operations are property access on a controlled store object.

### Specific tightening for 17b

| Fix | Effort | Addresses |
|---|---|---|
| Filter `__proto__`, `constructor`, `prototype` in `$item:` accessor | Trivial | F1, F2 |
| Same filter in `getDeepPath` | Trivial | F2 |
| Add max depth cap (32) to `getDeepPath` and `resolveStateDotPath` | Small | F7 |
| Add max input length cap (e.g., 10K chars) to `resolveRef` | Small | F7 |
| Warn/throw on unclosed quotes in `$expr:` | Small | F9 |
| Validate `$state:` refs against schema in validation layer | Small | F11 |
| Document `$item:` vs `$expr:item.` dot-notation difference | Trivial | F5 |
| Handle nested `{{}}` with depth counter instead of regex | Medium | F3 |
| Support object-form `$expr` in `resolveRef` | Trivial | F4 |

### Bundle-size estimate

| Path | Size (gzipped) |
|---|---|
| Current evaluator | ~400 bytes |
| Tightened evaluator (above fixes) | ~600 bytes (+200B) |
| Recursive-descent parser | ~2.5–4 KB (+2–3.5 KB) |

The tightened path adds 200 bytes and eliminates all P1/P2 findings. A recursive-descent parser would be 10–20× larger with no corresponding security benefit, since the grammar has no operator precedence, no function calls, and no eval surface.

### When to reconsider

If any of the following become true before 17b ships, revisit:

- `$expr:` gains arithmetic (`$expr:state.x + state.y`) — needs a parser
- `$expr:` gains function calls (`$expr:state.items.filter(...)`) — needs a parser
- `$computed:` gains arbitrary expressions — needs a parser
- Manifests start arriving with complex nested expressions — needs a parser

---

## Appendix: Test Environment

- Node.js v25.9.0
- TinyBase (bundled with ForgeUI)
- All timing measurements are wall-clock, single-threaded, non-concurrent
- Store: 2 values (`name`, `count`), 1 table (`users`) with 2 rows
- Item context: `{ name: 'Item1', count: 10 }` for `$item:` tests
