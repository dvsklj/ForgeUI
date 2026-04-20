/**
 * Forge State Layer
 *
 * Wraps TinyBase for reactive state management.
 * State is stored as JSON strings (not TinyBase tables) for simplicity and portability.
 * All mutations are JSON-native: parse → mutate → stringify → set.
 */

import { createStore, Store } from 'tinybase';

export interface ForgeStateConfig {
  schema?: {
    version: number;
    tables: Record<string, {
      columns: Record<string, { type: 'string' | 'number' | 'boolean'; default?: unknown }>;
    }>;
  };
  initialState?: Record<string, unknown>;
}

// ─── JSON-Native State Helpers ─────────────────────────────────────────────────

/** Parse a stored JSON string value, returning an object or the raw value. */
function parseJson(raw: unknown): unknown {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw;
}

/** Set a nested key path in an object. Supports 'a.b.c' dot notation. */
function setNestedPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

/** Get a nested key path from an object. Returns undefined if not found. */
function getNestedPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** Delete a nested key path from an object. */
function deleteNestedPath(obj: Record<string, unknown>, path: string): boolean {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') return false;
    current = current[part] as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  if (last in current) {
    delete current[last];
    return true;
  }
  return false;
}

/** Clone a value deeply (for undo snapshots). */
function deepClone<T>(val: T): T {
  if (val === null || val === undefined) return val as T;
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
  return JSON.parse(JSON.stringify(val));
}

// ─── State Resolution ──────────────────────────────────────────────────────────

/** Resolve a state path to a value. Handles dot-notation on JSON-stored values. */
function resolveStatePath(store: Store, path: string): unknown {
  // Path formats:
  // - "tableName/rowId/columnName" → TinyBase cell (backward compat)
  // - "tableName/rowId" → TinyBase row as object (backward compat)
  // - "data.tasks" → JSON value stored at key 'data', sub-key 'tasks'
  // - "key" → TinyBase top-level value

  if (!path.includes('/') && !path.includes('.')) {
    // Simple key
    let val = store.getValue(path);
    return parseJson(val);
  }

  const parts = path.includes('/') ? path.split('/') : path.split('.');

  // 3 parts: table/row/column → TinyBase cell (backward compat)
  if (parts.length === 3) {
    const [table, rowId, column] = parts;
    return store.getCell(table, rowId, column);
  }

  // 2 parts: ambiguous — JSON nested path OR TinyBase table/row
  if (parts.length === 2) {
    const [first, second] = parts;

    // Try TinyBase table lookup first (backward compat)
    const cellIds = store.getCellIds(first, second);
    if (cellIds.length > 0) {
      const row: Record<string, unknown> = {};
      for (const cellId of cellIds) {
        row[cellId] = store.getCell(first, second, cellId);
      }
      return row;
    }

    // JSON nested path: look up top-level key, then sub-key
    let topValue = store.getValue(first);
    topValue = parseJson(topValue);
    if (topValue !== undefined && typeof topValue === 'object' && topValue !== null) {
      const sub = (topValue as Record<string, unknown>)[second];
      if (sub !== undefined) return parseJson(sub);
      return topValue;
    }

    return undefined;
  }

  // Multi-part path (e.g., "data.tasks.t1.status") → JSON nested
  const [topKey, ...rest] = parts;
  let topValue = store.getValue(topKey);
  topValue = parseJson(topValue);
  if (rest.length === 0) return topValue;
  return getNestedPath(topValue, rest.join('.'));
}

// ─── Safe Arithmetic Evaluation ────────────────────────────────────────────────

/** Safely evaluate an arithmetic/string expression by resolving state refs first. */
function evaluateArithmetic(store: Store, expr: string): unknown {
  // Find all state.path references (e.g. state.count, state.data.tasks.length)
  const stateRefRe = /\bstate\.([a-zA-Z_][a-zA-Z0-9_.]*)\b/g;
  let replaced = expr;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;

  // Collect unique refs
  while ((m = stateRefRe.exec(expr)) !== null) {
    seen.add(m[1]);
  }

  // Replace each ref with its resolved value
  for (const path of seen) {
    const val = resolveStatePath(store, path);
    const placeholder = `state.${path}`;
    let serialized: string;
    if (typeof val === 'string') {
      serialized = JSON.stringify(val);
    } else if (typeof val === 'number') {
      serialized = String(val);
    } else if (typeof val === 'boolean') {
      serialized = String(val);
    } else if (val === null || val === undefined) {
      serialized = 'null';
    } else if (Array.isArray(val)) {
      serialized = JSON.stringify(val);
    } else {
      serialized = JSON.stringify(val);
    }
    replaced = replaced.split(placeholder).join(serialized);
  }

  // Evaluate the sanitized expression
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`"use strict"; return (${replaced});`);
    return fn();
  } catch {
    return undefined;
  }
}

// ─── Expression Evaluation ─────────────────────────────────────────────────────

/** Tokenize a filter or map expression like 'status=done' or 'x + 1'. */
function parsePredicate(expr: string): (item: Record<string, unknown>) => boolean {
  // Simple equality: "field=value" or "field!=value" or "field>5" or "field<5"
  const eqMatch = expr.match(/^(\w+)(!=?|>=?|<=)(.+)$/);
  if (eqMatch) {
    const [, field, op, rawVal] = eqMatch;
    const numVal = Number(rawVal);
    const isNum = !isNaN(numVal) && rawVal.trim() !== '';
    return (item: Record<string, unknown>) => {
      const itemVal = item[field];
      if (op === '=' || op === '==') return String(itemVal) === rawVal.trim();
      if (op === '!=') return String(itemVal) !== rawVal.trim();
      if (op === '>' && isNum) return Number(itemVal) > numVal;
      if (op === '<' && isNum) return Number(itemVal) < numVal;
      if (op === '>=' && isNum) return Number(itemVal) >= numVal;
      if (op === '<=' && isNum) return Number(itemVal) <= numVal;
      return false;
    };
  }
  // Contains: "field~value"
  const containsMatch = expr.match(/^(\w+)~(.+)$/);
  if (containsMatch) {
    const [, field, val] = containsMatch;
    return (item: Record<string, unknown>) => String(item[field] ?? '').includes(val.trim());
  }
  // Truthy check: just "field"
  return (item: Record<string, unknown>) => Boolean(item[expr]);
}

/** Parse a map expression like 'name' or 'x.name'. */
function parseMapExpr(expr: string): (item: unknown) => unknown {
  if (expr.includes('.')) {
    const parts = expr.split('.');
    return (item: unknown) => getNestedPath(item as Record<string, unknown>, parts.join('.'));
  }
  return (item: unknown) => (item as Record<string, unknown>)[expr];
}

/** Evaluate a $expr: expression against the store. */
function evaluateExpr(store: Store, expr: string): unknown {
  const parts = expr.split('|').map(s => s.trim());
  let base = parts[0];

  // Remove "state." prefix
  if (base.startsWith('state.')) base = base.slice(6);

  // If base contains operators, evaluate as arithmetic/string expression
  const hasOperators = /[+\-*/%]/.test(base) || /===?|!==?|>=?|<=?|&&|\|\|/.test(base);
  let result: unknown;
  if (hasOperators) {
    result = evaluateArithmetic(store, 'state.' + base);
  } else {
    // Keep dots for JSON path lookup (data.tasks → look up key "data", then sub-key "tasks")
    const path = base;
    result = resolveStatePath(store, path);
  }

  // Apply pipe operators left-to-right
  for (let i = 1; i < parts.length; i++) {
    const op = parts[i];

    // Filter: | filter(field=value) or | filter(field!=value)
    if (op.startsWith('filter(') && op.endsWith(')')) {
      const inner = op.slice(7, -1).trim();
      const predicate = parsePredicate(inner);
      if (Array.isArray(result)) {
        result = result.filter(item => {
          if (typeof item === 'object' && item !== null) {
            return predicate(item as Record<string, unknown>);
          }
          return false;
        });
      }
      continue;
    }

    // Map: | map(field) or | map(field.subfield)
    if (op.startsWith('map(') && op.endsWith(')')) {
      const inner = op.slice(4, -1).trim();
      const mapper = parseMapExpr(inner);
      if (Array.isArray(result)) {
        result = result.map(mapper);
      }
      continue;
    }

    // Sort: | sort(field) or | sort(-field) for descending
    if (op.startsWith('sort(') && op.endsWith(')')) {
      const inner = op.slice(5, -1).trim();
      const desc = inner.startsWith('-');
      const field = desc ? inner.slice(1) : inner;
      if (Array.isArray(result)) {
        result = [...result].sort((a, b) => {
          const aVal = field.includes('.') ? getNestedPath(a as Record<string, unknown>, field) : (a as Record<string, unknown>)[field];
          const bVal = field.includes('.') ? getNestedPath(b as Record<string, unknown>, field) : (b as Record<string, unknown>)[field];
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return desc ? bVal - aVal : aVal - bVal;
          }
          const cmp = String(aVal).localeCompare(String(bVal));
          return desc ? -cmp : cmp;
        });
      }
      continue;
    }

    // Limit: | limit(n)
    if (op.startsWith('limit(') && op.endsWith(')')) {
      const n = parseInt(op.slice(6, -1).trim(), 10);
      if (Array.isArray(result)) result = result.slice(0, isNaN(n) ? result.length : n);
      continue;
    }

    // Pluck: | pluck(key) → extract single field from array of objects
    if (op.startsWith('pluck(') && op.endsWith(')')) {
      const field = op.slice(6, -1).trim();
      if (Array.isArray(result)) {
        result = result.map(item => {
          if (typeof item === 'object' && item !== null) {
            return field.includes('.')
              ? getNestedPath(item as Record<string, unknown>, field)
              : (item as Record<string, unknown>)[field];
          }
          return undefined;
        });
      }
      continue;
    }

    // values, keys, json, entries (original)
    if (op === 'values') {
      result = (result != null && typeof result === 'object' && !Array.isArray(result))
        ? Object.values(result as Record<string, unknown>)
        : [];
    } else if (op === 'keys') {
      result = (result != null && typeof result === 'object' && !Array.isArray(result))
        ? Object.keys(result as Record<string, unknown>)
        : [];
    } else if (op === 'json') {
      result = JSON.stringify(result);
    } else if (op === 'entries') {
      result = (result != null && typeof result === 'object' && !Array.isArray(result))
        ? Object.entries(result as Record<string, unknown>)
        : [];
    } else if (op === 'length') {
      result = Array.isArray(result) ? result.length : (result != null && typeof result === 'object' ? Object.keys(result as object).length : 0);
    } else if (op === 'first') {
      result = Array.isArray(result) ? result[0] : undefined;
    } else if (op === 'last') {
      result = Array.isArray(result) ? result[result.length - 1] : undefined;
    }
  }

  return result;
}

/** Evaluate a $computed: expression against the store. */
function evaluateComputed(store: Store, expression: string): unknown {
  // Patterns:
  // "count:data.tasks" → length of array at state.data.tasks
  // "sum:data.items.price" → sum of 'price' field in array
  // "avg:data.items.price" → average of 'price' field
  // "pluck:data.tasks.name" → all names from array
  // "filter:data.tasks|values|filter(status=done)|length" → count after filter

  if (expression.startsWith('count:')) {
    const path = expression.slice(6);
    const val = evaluateExpr(store, path);
    return Array.isArray(val) ? val.length : (val != null && typeof val === 'object' ? Object.keys(val as object).length : 0);
  }

  if (expression.startsWith('sum:')) {
    const field = expression.slice(4);
    const val = evaluateExpr(store, field);
    if (!Array.isArray(val)) return 0;
    return val.reduce((acc: number, item: unknown) => {
      if (typeof item === 'object' && item !== null) {
        const parts = field.split('.');
        const last = parts[parts.length - 1];
        const num = Number((item as Record<string, unknown>)[last] ?? 0);
        return acc + (isNaN(num) ? 0 : num);
      }
      return acc + (Number(item) || 0);
    }, 0);
  }

  if (expression.startsWith('avg:')) {
    const field = expression.slice(4);
    const val = evaluateExpr(store, field);
    if (!Array.isArray(val) || val.length === 0) return 0;
    const sum = val.reduce((acc: number, item: unknown) => {
      if (typeof item === 'object' && item !== null) {
        const parts = field.split('.');
        const last = parts[parts.length - 1];
        const num = Number((item as Record<string, unknown>)[last] ?? 0);
        return acc + (isNaN(num) ? 0 : num);
      }
      return acc + (Number(item) || 0);
    }, 0);
    return Math.round((sum / val.length) * 100) / 100;
  }

  if (expression.startsWith('filter:')) {
    // "filter:data.tasks|values|filter(status=done)|length"
    const pipeExpr = expression.slice(7);
    const val = evaluateExpr(store, `state.${pipeExpr}`);
    return val;
  }

  // Fallback: treat as a $expr
  return evaluateExpr(store, expression.startsWith('state.') ? expression : `state.${expression}`);
}

// ─── Item Context (for repeater items) ─────────────────────────────────────────

let _currentItemContext: Record<string, unknown> | null = null;

export function setItemContext(item: Record<string, unknown> | null) {
  _currentItemContext = item;
}

export function getItemContext(): Record<string, unknown> | null {
  return _currentItemContext;
}

// ─── Template Resolution ──────────────────────────────────────────────────────

/**
 * Resolve `{{$state:path}}` and `{{$item:field}}` and `{{literal}}` templates
 * in a string value, using the current store state and item context.
 */
export function resolveTemplate(
  store: Store,
  template: string,
  extraContext?: Record<string, unknown>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, inner) => {
    const innerTrimmed = inner.trim();

    // {{$state:path}} → resolve from store
    if (innerTrimmed.startsWith('$state:')) {
      const path = innerTrimmed.slice(7);
      const val = resolveStatePath(store, path);
      return val !== undefined ? String(val) : '';
    }

    // {{$item:field}} → resolve from current repeater item context
    if (innerTrimmed.startsWith('$item:')) {
      const field = innerTrimmed.slice(6);
      if (_currentItemContext) {
        const val = field.includes('.')
          ? getNestedPath(_currentItemContext, field)
          : _currentItemContext[field];
        return val !== undefined ? String(val) : '';
      }
      return '';
    }

    // {{$computed:expression}} → compute from store
    if (innerTrimmed.startsWith('$computed:')) {
      const expr = innerTrimmed.slice(9);
      const val = evaluateComputed(store, expr);
      return val !== undefined ? String(val) : '';
    }

    // {{$ctx.key}} → resolve from extra context
    if (innerTrimmed.startsWith('$ctx.')) {
      const key = innerTrimmed.slice(5);
      const val = extraContext?.[key];
      return val !== undefined ? String(val) : '';
    }

    // Plain {{literal}} — return as-is
    return innerTrimmed;
  });
}

/** Resolve a value that may contain templates. Returns the resolved value. */
export function resolveValue(
  store: Store,
  value: unknown,
  extraContext?: Record<string, unknown>
): unknown {
  if (typeof value === 'string') {
    // Only do template resolution if the string actually contains {{...}}
    if (value.includes('{{')) {
      return resolveTemplate(store, value, extraContext);
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(item => resolveValue(store, item, extraContext));
  }
  if (value !== null && typeof value === 'object') {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      resolved[k] = resolveValue(store, v, extraContext);
    }
    return resolved;
  }
  return value;
}

// ─── Action Execution ─────────────────────────────────────────────────────────

/** Snapshot all JSON-stored values in the store (for undo/redo). */
export function snapshotState(store: Store): Record<string, unknown> {
  const snap: Record<string, unknown> = {};
  store.forEachValue((tableId) => {
    const val = store.getValue(tableId);
    snap[tableId] = parseJson(val);
  });
  return deepClone(snap);
}

/** Restore a state snapshot into the store. */
export function restoreSnapshot(store: Store, snap: Record<string, unknown>): void {
  for (const [key, val] of Object.entries(snap)) {
    store.setValue(key, typeof val === 'object' ? JSON.stringify(val) : val);
  }
}

/** Execute a declarative action against the JSON-native store. */
export function executeAction(
  store: Store,
  action: {
    type?: string;
    path?: string;
    operation?: string;
    key?: string;
    value?: unknown;
  }
): boolean {
  const { type, path, operation, key, value } = action;

  if (type !== 'mutateState' || !path) return false;

  // For JSON-native operations, we work on the parsed JSON structure.
  // Split path: top-level key + nested rest (e.g., "data.tasks.t6" → key="data", rest="tasks.t6")
  // or for TinyBase backward compat: "tasks/t6" → key="tasks", rest="t6"
  const useSlash = path.includes('/');
  const parts = useSlash ? path.split('/') : path.split('.');

  if (useSlash && parts.length === 2) {
    // TinyBase backward compat: table/row → operate on TinyBase tables
    return executeLegacyAction(store, action);
  }

  if (useSlash && parts.length === 3) {
    // TinyBase backward compat: table/row/col → operate on TinyBase cells
    return executeLegacyAction(store, action);
  }

  // JSON-native path: "data.tasks.t6.status"
  const topKey = parts[0];
  const rest = parts.slice(1).join('.');

  // Get current state at top key, parse if string
  let currentRaw = store.getValue(topKey);
  let current: unknown = parseJson(currentRaw);

  switch (operation) {
    case 'set': {
      // "set" at nested path
      if (rest) {
        if (typeof current !== 'object' || current === null) current = {};
        setNestedPath(current as Record<string, unknown>, rest, value);
        store.setValue(topKey, JSON.stringify(current));
      } else {
        // Direct top-level set
        store.setValue(topKey, typeof value === 'object' ? JSON.stringify(value) : value);
      }
      return true;
    }

    case 'update': {
      // Shallow merge at path
      if (rest) {
        if (typeof current !== 'object' || current === null) current = {};
        const target = getNestedPath(current, rest);
        if (typeof target !== 'object' || target === null) {
          setNestedPath(current as Record<string, unknown>, rest, {});
        }
        const mergeTarget = getNestedPath(current, rest) as Record<string, unknown>;
        const merged = { ...mergeTarget, ...((value as Record<string, unknown>) || {}) };
        setNestedPath(current as Record<string, unknown>, rest, merged);
        store.setValue(topKey, JSON.stringify(current));
      } else {
        if (typeof current !== 'object' || current === null) current = {};
        store.setValue(topKey, JSON.stringify({ ...(current as Record<string, unknown>), ...((value as Record<string, unknown>) || {}) }));
      }
      return true;
    }

    case 'merge': {
      // Deep merge
      if (rest) {
        if (typeof current !== 'object' || current === null) current = {};
        const target = getNestedPath(current, rest);
        const merged = deepMerge(typeof target === 'object' && target !== null ? target : {}, value as Record<string, unknown>);
        setNestedPath(current as Record<string, unknown>, rest, merged);
        store.setValue(topKey, JSON.stringify(current));
      } else {
        store.setValue(topKey, JSON.stringify(deepMerge(typeof current === 'object' && current !== null ? current : {}, value as Record<string, unknown>)));
      }
      return true;
    }

    case 'delete': {
      if (rest) {
        if (typeof current === 'object' && current !== null) {
          const deleted = deleteNestedPath(current as Record<string, unknown>, rest);
          if (deleted) store.setValue(topKey, JSON.stringify(current));
          return deleted;
        }
      } else {
        // Delete top-level key
        store.setValue(topKey, undefined);
        return true;
      }
      return false;
    }

    case 'clear': {
      // Reset to empty
      if (rest) {
        setNestedPath((current || {}) as Record<string, unknown>, rest, null);
        store.setValue(topKey, JSON.stringify(current));
      } else {
        store.setValue(topKey, typeof value === 'string' ? value : JSON.stringify(value ?? null));
      }
      return true;
    }

    case 'push': {
      // Append value to array at path
      const arrPath = rest || '_root';
      if (rest) {
        if (typeof current !== 'object' || current === null) current = {};
        const arr = (getNestedPath(current, rest) as unknown[]) || [];
        const pushed = Array.isArray(arr) ? [...arr, value] : [value];
        setNestedPath(current as Record<string, unknown>, rest, pushed);
        store.setValue(topKey, JSON.stringify(current));
      } else {
        const arr = Array.isArray(current) ? current : [];
        store.setValue(topKey, JSON.stringify([...arr, value]));
      }
      return true;
    }

    case 'pop': {
      // Remove last element from array
      if (rest) {
        if (typeof current !== 'object' || current === null) return false;
        const arr = getNestedPath(current, rest) as unknown[];
        if (!Array.isArray(arr) || arr.length === 0) return false;
        const popped = arr.slice(0, -1);
        setNestedPath(current as Record<string, unknown>, rest, popped);
        store.setValue(topKey, JSON.stringify(current));
      } else {
        const arr = Array.isArray(current) ? current : [];
        store.setValue(topKey, JSON.stringify(arr.slice(0, -1)));
      }
      return true;
    }

    case 'toggle': {
      // Toggle boolean at path
      if (rest) {
        if (typeof current !== 'object' || current === null) return false;
        const val = getNestedPath(current, rest);
        setNestedPath(current as Record<string, unknown>, rest, !Boolean(val));
        store.setValue(topKey, JSON.stringify(current));
      } else {
        store.setValue(topKey, !Boolean(current));
      }
      return true;
    }

    case 'increment': {
      if (rest) {
        if (typeof current !== 'object' || current === null) return false;
        const val = Number(getNestedPath(current, rest) ?? 0);
        setNestedPath(current as Record<string, unknown>, rest, val + (Number(value) || 1));
        store.setValue(topKey, JSON.stringify(current));
      } else {
        store.setValue(topKey, Number(current ?? 0) + (Number(value) || 1));
      }
      return true;
    }

    case 'decrement': {
      if (rest) {
        if (typeof current !== 'object' || current === null) return false;
        const val = Number(getNestedPath(current, rest) ?? 0);
        setNestedPath(current as Record<string, unknown>, rest, val - (Number(value) || 1));
        store.setValue(topKey, JSON.stringify(current));
      } else {
        store.setValue(topKey, Number(current ?? 0) - (Number(value) || 1));
      }
      return true;
    }

    default:
      return false;
  }
}

/** Execute action on TinyBase tables (backward compatibility). */
function executeLegacyAction(
  store: Store,
  action: {
    type?: string;
    path?: string;
    operation?: string;
    key?: string;
    value?: unknown;
  }
): boolean {
  const { path, operation, key, value } = action;
  if (!path) return false;

  const parts = path.split('/');
  if (parts.length === 3) {
    const [table, rowId, column] = parts;
    switch (operation) {
      case 'set': store.setCell(table, rowId, column, value as string | number | boolean); return true;
      case 'delete': store.setCell(table, rowId, column, undefined); return true;
      case 'toggle': store.setCell(table, rowId, column, !Boolean(store.getCell(table, rowId, column))); return true;
      case 'increment': store.setCell(table, rowId, column, (Number(store.getCell(table, rowId, column)) || 0) + (Number(value) || 1)); return true;
      case 'decrement': store.setCell(table, rowId, column, (Number(store.getCell(table, rowId, column)) || 0) - (Number(value) || 1)); return true;
      default: return false;
    }
  }

  if (parts.length === 2) {
    const [table, rowId] = parts;
    switch (operation) {
      case 'delete': store.delRow(table, rowId); return true;
      case 'append': {
        if (typeof value === 'object' && value !== null) {
          for (const [col, val] of Object.entries(value as Record<string, unknown>)) {
            if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
              store.setCell(table, rowId, col, val);
            }
          }
          return true;
        }
        return false;
      }
      case 'update': {
        if (typeof value === 'object' && value !== null) {
          for (const [col, val] of Object.entries(value as Record<string, unknown>)) {
            if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
              store.setCell(table, rowId, col, val);
            }
          }
          return true;
        }
        return false;
      }
      case 'toggle': {
        const cols = store.getCellIds(table, rowId);
        for (const col of cols) {
          const current = store.getCell(table, rowId, col);
          if (typeof current === 'boolean') {
            store.setCell(table, rowId, col, !current);
            return true;
          }
        }
        return false;
      }
      default: return false;
    }
  }

  return false;
}

/** Alias for backward compatibility. */
export function resolveRef(store: Store, value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.startsWith('$state:')) return resolveStatePath(store, value.slice(7));
    if (value.startsWith('$computed:')) return evaluateComputed(store, value.slice(9));
    if (value.startsWith('$expr:')) return evaluateExpr(store, value.slice(6));
  }
  // Handle $expr objects: { "$expr": "state.data.tasks | values" }
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    '$expr' in (value as Record<string, unknown>)
  ) {
    const exprStr = (value as Record<string, unknown>)['$expr'] as string;
    return evaluateExpr(store, exprStr);
  }
  return value;
}

/** Resolve a value recursively, handling $state:, $computed:, $expr:, $item:, and {{...}} templates. */
function deepMerge(base: Record<string, unknown>, overlay: Record<string, unknown>): Record<string, unknown> {
  const result = { ...base };
  for (const [key, val] of Object.entries(overlay)) {
    if (
      val !== null &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, val as Record<string, unknown>);
    } else {
      result[key] = val as unknown;
    }
  }
  return result;
}

// ─── Store Creation ────────────────────────────────────────────────────────────

export function createForgeStore(config: ForgeStateConfig): Store {
  const store = createStore();

  // Set initial state values
  if (config.initialState) {
    for (const [key, value] of Object.entries(config.initialState)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        store.setValue(key, value);
      } else if (value !== null && typeof value === 'object') {
        // Store all nested objects as JSON strings
        store.setValue(key, JSON.stringify(value));
      }
    }
  }

  return store;
}

// ─── Undo/Redo Stack ──────────────────────────────────────────────────────────

export interface UndoableSnapshot {
  state: Record<string, unknown>;
  timestamp: number;
}

export class UndoRedoStack {
  private _stack: UndoableSnapshot[] = [];
  private _pointer = -1;
  private _maxSize: number;

  constructor(maxSize = 50) {
    this._maxSize = maxSize;
  }

  push(state: Record<string, unknown>) {
    // Remove any redo states
    this._stack = this._stack.slice(0, this._pointer + 1);
    this._stack.push({ state: deepClone(state), timestamp: Date.now() });
    if (this._stack.length > this._maxSize) {
      this._stack.shift();
    }
    this._pointer = this._stack.length - 1;
  }

  undo(): Record<string, unknown> | null {
    if (this._pointer <= 0) return null;
    this._pointer--;
    return deepClone(this._stack[this._pointer].state);
  }

  redo(): Record<string, unknown> | null {
    if (this._pointer >= this._stack.length - 1) return null;
    this._pointer++;
    return deepClone(this._stack[this._pointer].state);
  }

  canUndo(): boolean { return this._pointer > 0; }
  canRedo(): boolean { return this._pointer < this._stack.length - 1; }

  getState() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      size: this._stack.length,
      pointer: this._pointer,
    };
  }
}

// Re-export
export { evaluateExpr, evaluateComputed, resolveStatePath };
