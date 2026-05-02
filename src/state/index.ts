/**
 * Forge State Layer
 * 
 * Wraps TinyBase for reactive state management.
 * - Creates store from manifest schema
 * - Resolves $state:, $computed:, $item: references
 * - Supports progressive persistence (in-memory → IndexedDB → sync)
 */

import { createStore, Store, TablesSchema } from 'tinybase';

// ─── Security: path safety ────────────────────────────────────────

const FORBIDDEN = new Set(['__proto__','prototype','constructor']);

function isSafe(p: string): boolean {
  if (p.length === 0 || p.length > 256) return false;
  for (const s of p.normalize('NFC').split('.'))
    if (FORBIDDEN.has(s)) return false;
  return true;
}

export interface ForgeStateConfig {
  schema?: {
    version: number;
    tables: Record<string, {
      columns: Record<string, { type: 'string' | 'number' | 'boolean'; default?: unknown }>;
    }>;
  };
  initialState?: Record<string, unknown>;
}

/** Resolve a $state:path reference to a value */
function resolveStatePath(store: Store, path: string): unknown {
  // Format: "tableName/rowId/columnName" or "key" (for values)
  if (path.includes('/')) {
    const parts = path.split('/');
    if (parts.length === 3) {
      const [table, rowId, column] = parts;
      return store.getCell(table, rowId, column);
    }
    if (parts.length === 2) {
      // Could be table/rowId → return whole row, or key/subkey for values
      const [first, second] = parts;
      // Try as value first
      const value = store.getValue(path);
      if (value !== undefined) return value;
      // Try as table row
      const cellIds = store.getCellIds(first, second);
      if (cellIds.length > 0) {
        const row: Record<string, unknown> = {};
        for (const cellId of cellIds) {
          row[cellId] = store.getCell(first, second, cellId);
        }
        return row;
      }
    }
  }
  // Simple value key
  return store.getValue(path);
}

/** Evaluate a $computed: expression */
function evaluateComputed(store: Store, expression: string): unknown {
  // Supported patterns:
  // "tableName/totalColumnName" → sum of column across all rows
  // "count:tableName" → row count
  // "sum:tableName/columnName" → sum of column
  // "avg:tableName/columnName" → average of column
  
  if (expression.startsWith('count:')) {
    const table = expression.slice(6);
    return store.getRowCount(table);
  }
  
  if (expression.startsWith('sum:')) {
    const [_, rest] = expression.split(':');
    const [table, column] = rest.split('/');
    let sum = 0;
    const rowIds = store.getRowIds(table);
    for (const rowId of rowIds) {
      const cell = store.getCell(table, rowId, column);
      if (typeof cell === 'number') sum += cell;
    }
    return sum;
  }
  
  if (expression.startsWith('avg:')) {
    const [_, rest] = expression.split(':');
    const [table, column] = rest.split('/');
    let sum = 0;
    let count = 0;
    const rowIds = store.getRowIds(table);
    for (const rowId of rowIds) {
      const cell = store.getCell(table, rowId, column);
      if (typeof cell === 'number') { sum += cell; count++; }
    }
    return count > 0 ? sum / count : 0;
  }
  
  // Direct path reference
  return resolveStatePath(store, expression);
}

/** Context for repeater items ($item: references) */
let currentItemContext: Record<string, unknown> | null = null;

export function setItemContext(item: Record<string, unknown> | null) {
  currentItemContext = item;
}

export function getItemContext(): Record<string, unknown> | null {
  return currentItemContext;
}

// ─── Safe Arithmetic Evaluation ────────────────────────────────────────────────

type ExprToken =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'literal'; value: boolean | null }
  | { type: 'state'; path: string }
  | { type: 'op'; value: string }
  | { type: 'paren'; value: '(' | ')' };

/** Safely evaluate a small expression grammar without eval/Function. */
function evaluateArithmetic(store: Store, expr: string): unknown {
  const tokens = tokenizeExpression(expr);
  if (!tokens) return undefined;

  let i = 0;
  const bad = {};
  const peek = () => tokens[i];

  const primary = (): unknown | typeof bad => {
    const token = tokens[i++];
    if (!token) return bad;
    if (token.type === 'number' || token.type === 'string' || token.type === 'literal') return token.value;
    if (token.type === 'state') return resolveStateDotPath(store, token.path);
    if (token.type === 'paren' && token.value === '(') {
      const value = parseExpression(1);
      const next = tokens[i++];
      return next?.type === 'paren' && next.value === ')' ? value : bad;
    }
    return bad;
  };

  const unary = (): unknown | typeof bad => {
    const token = peek();
    if (token?.type === 'op' && token.value === '-') {
      i++;
      const value = unary();
      if (value === bad) return bad;
      return typeof value === 'number' ? -value : bad;
    }
    return primary();
  };

  function parseExpression(minPrecedence: number): unknown | typeof bad {
    let left = unary();
    while (left !== bad) {
      const token = peek();
      if (token?.type !== 'op') break;
      const precedence = OP_PRECEDENCE[token.value];
      if (!precedence || precedence < minPrecedence) break;
      i++;
      left = applyBinary(token.value, left, parseExpression(precedence + 1), bad);
    }
    return left;
  }

  const result = parseExpression(1);
  return result !== bad && i === tokens.length ? result : undefined;
}

const OP_PRECEDENCE: Record<string, number> = {
  '&&': 2, '>': 4, '<': 4, '>=': 4, '<=': 4,
  '+': 5, '-': 5, '*': 6, '/': 6,
};

function applyBinary(op: string, left: unknown, right: unknown, bad: object): unknown | object {
  if (right === bad) return bad;
  if (op === '&&') return !!left && !!right;
  if (op === '+') {
    if (typeof left === 'number' && typeof right === 'number') return left + right;
    if (typeof left !== 'object' && typeof right !== 'object') return String(left) + String(right);
    return bad;
  }
  if (typeof left !== 'number' || typeof right !== 'number') return bad;
  if (op === '/' && right === 0) return bad;
  switch (op) {
    case '-': return (left as number) - (right as number);
    case '*': return (left as number) * (right as number);
    case '/': return (left as number) / (right as number);
    case '>': return left > right;
    case '<': return left < right;
    case '>=': return left >= right;
    case '<=': return left <= right;
    default: return bad;
  }
}

function tokenizeExpression(expr: string): ExprToken[] | undefined {
  if (expr.length > 1024) return undefined;
  const tokens: ExprToken[] = [];
  const re = /\s*(>=|<=|&&|[()+\-*/><]|"(?:\\.|[^"\\])*"|\d+(?:\.\d+)?|[a-zA-Z_][a-zA-Z0-9_.]*)/gy;
  let m: RegExpExecArray | null;
  let end = 0;
  while ((m = re.exec(expr))) {
    const raw = m[1];
    end = re.lastIndex;
    if ('()'.includes(raw)) tokens.push({ type: 'paren', value: raw as '(' | ')' });
    else if (OP_PRECEDENCE[raw]) tokens.push({ type: 'op', value: raw });
    else if (raw[0] === '"') tokens.push({ type: 'string', value: JSON.parse(raw) });
    else if (/^\d/.test(raw)) tokens.push({ type: 'number', value: Number(raw) });
    else if (raw === 'true' || raw === 'false') tokens.push({ type: 'literal', value: raw === 'true' });
    else if (raw === 'null') tokens.push({ type: 'literal', value: null });
    else if (raw.startsWith('state.') && isSafe(raw.slice(6))) tokens.push({ type: 'state', path: raw.slice(6) });
    else return undefined;
  }
  return end === expr.length ? tokens : undefined;
}

/**
 * Evaluate an $expr: expression against the store.
 * Supported patterns:
 *   state.foo.bar           → read a nested value from state values or tables
 *   state.table.row.col     → direct cell access
 *   state.table | values    → return all rows of a table as an array
 *   state.table | count     → row count
 *   state.table | keys      → row ids
 *   item.field              → repeater item field
 *   literal "hello", 42, true/false/null
 */
function evaluateExpression(store: Store, expr: string): unknown {
  const trimmed = expr.trim();
  if (trimmed === '') return undefined;

  // Literal strings
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  // Unclosed quotes — reject and warn once
  if ((trimmed.startsWith('"') && !trimmed.endsWith('"')) || (trimmed.startsWith("'") && !trimmed.endsWith("'")))
    return undefined;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  // Arithmetic / string / comparison expressions
  const hasOperators = /(?:[+\-*/%]|===?|!==?|>=?|<=?|\&\&|\|\|)/.test(trimmed);
  if (hasOperators && !trimmed.includes('|')) {
    return evaluateArithmetic(store, trimmed);
  }

  // Pipe operator: `path | filter [arg]`
  if (trimmed.includes('|')) {
    const [lhs, ...rhsParts] = trimmed.split('|').map((s) => s.trim());
    const base = evaluateExpression(store, lhs);
    let result: unknown = base;
    for (const filter of rhsParts) {
      const [fname, ...fargs] = filter.split(/\s+/);
      result = applyFilter(result, fname, fargs);
    }
    return result;
  }

  // item.field (repeater context)
  if (trimmed.startsWith('item.') || trimmed === 'item') {
    if (trimmed === 'item') return currentItemContext;
    const path = trimmed.slice(5);
    return getDeepPath(currentItemContext, path);
  }

  // state.foo.bar — try cell access, then table row, then value, then deep value lookup
  if (trimmed.startsWith('state.') || trimmed === 'state') {
    if (trimmed === 'state') return undefined;
    const path = trimmed.slice(6);
    return resolveStateDotPath(store, path);
  }

  // Fallback: treat as a plain state path
  return resolveStatePath(store, trimmed);
}

function applyFilter(value: unknown, name: string, _args: string[]): unknown {
  switch (name) {
    case 'values':
      if (Array.isArray(value)) return value;
      if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>);
      return [];
    case 'keys':
      if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>);
      return [];
    case 'count':
    case 'length':
      if (Array.isArray(value)) return value.length;
      if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).length;
      if (typeof value === 'string') return value.length;
      return 0;
    case 'sum':
      if (Array.isArray(value)) return value.reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0);
      return 0;
    case 'first':
      if (Array.isArray(value)) return value[0];
      return undefined;
    case 'last':
      if (Array.isArray(value)) return value[value.length - 1];
      return undefined;
    default:
      return value;
  }
}

function getDeepPath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object' || !path) return undefined;
  if (!isSafe(path)) return undefined;
  const parts = path.split('.');
  if (parts.length > 32) return undefined;
  let cur: any = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[p];
  }
  return cur;
}

function resolveStateDotPath(store: Store, path: string): unknown {
  if (!isSafe(path)) return undefined;

  // Try value first (for simple flat keys like "state.name")
  const direct = store.getValue(path);
  if (direct !== undefined) {
    if (typeof direct === 'string') {
      try {
        return JSON.parse(direct);
      } catch { /* plain string value */ }
    }
    return direct;
  }

  const parts = path.split('.');
  // [table, row, col]
  if (parts.length >= 3) {
    const [table, row, col, ...rest] = parts;
    if (store.hasTable(table) && store.hasRow(table, row)) {
      const cell = store.getCell(table, row, col);
      if (rest.length === 0) return cell;
      if (typeof cell === 'string') {
        try {
          const parsed = JSON.parse(cell);
          return getDeepPath(parsed, rest.join('.'));
        } catch { /* not JSON */ }
      }
      return undefined;
    }
  }
  // [table, row] — return row as object
  if (parts.length >= 2) {
    const [table, row, ...rest] = parts;
    if (store.hasTable(table) && store.hasRow(table, row)) {
      const rowObj = store.getRow(table, row);
      return rest.length === 0 ? rowObj : getDeepPath(rowObj, rest.join('.'));
    }
  }
  // [table] — return all rows keyed by row id
  if (parts.length >= 1) {
    const [table, ...rest] = parts;
    if (store.hasTable(table)) {
      const rowIds = store.getRowIds(table);
      const tableData: Record<string, Record<string, unknown>> = {};
      for (const rid of rowIds) tableData[rid] = store.getRow(table, rid);
      return rest.length === 0 ? tableData : getDeepPath(tableData, rest.join('.'));
    }
  }

  // Fallback: try parsing a JSON-valued state value at first segment
  const rootVal = store.getValue(parts[0]);
  if (typeof rootVal === 'string' && parts.length > 1) {
    try {
      const parsed = JSON.parse(rootVal);
      return getDeepPath(parsed, parts.slice(1).join('.'));
    } catch { /* no-op */ }
  }
  return undefined;
}

/**
 * Resolve any reference string to its actual value.
 * - $state:path → store value
 * - $computed:expression → computed value
 * - $item:field → current repeater item field
 * - $expr:expression → expression evaluated against store and item context
 * - {{state.x}} / {{item.x}} → interpolated string
 * - Plain value → returned as-is
 */
export function resolveRef(store: Store, value: unknown): unknown {
  if (typeof value !== 'string') {
    if (value !== null && typeof value === 'object') {
      const o = value as Record<string, unknown>;
      if ('$expr' in o) return resolveRef(store, `$expr:${o.$expr}`);
      if ('$state' in o) return resolveRef(store, `$state:${o.$state}`);
      if ('$computed' in o) return resolveRef(store, `$computed:${o.$computed}`);
      if ('$item' in o) return resolveRef(store, `$item:${o.$item}`);
    }
    return value;
  }

  if (value.startsWith('$state:')) {
    const path = value.slice(7);
    if (!isSafe(path)) return undefined;
    return resolveStatePath(store, path);
  }

  if (value.startsWith('$computed:')) {
    const expression = value.slice(10);
    if (expression.length > 1024) return undefined;
    return evaluateComputed(store, expression);
  }

  // $item: resolution — supports dot-notation paths (same traversal as $expr:item.<path>)
  if (value.startsWith('$item:')) {
    const field = value.slice(6);
    if (!isSafe(field)) return undefined;
    if (field.includes('.')) return getDeepPath(currentItemContext, field);
    return currentItemContext?.[field];
  }

  if (value.startsWith('$expr:')) {
    const expression = value.slice(6);
    if (expression.length > 1024) return undefined;
    return evaluateExpression(store, expression);
  }

  // Template interpolation: "Hello {{state.name}}, you have {{item.count}} items"
  if (value.length > 4096) return value;
  if (value.includes('{{') && value.includes('}}')) {
    return replaceTemplates(value, store);
  }

  return value;
}

function replaceTemplates(input: string, store: Store): string {
  let out='',i=0;
  while(i<input.length){
    if(input[i]==='{'&&input[i+1]==='{'){
      let s=i+2,d=1,j=s;
      while(j<input.length-1&&d>0){
        const a=input[j],b=input[j+1];
        if(a==='{'&&b==='{'){d++;j+=2}
        else if(a==='}'&&b==='}'){d--;j+=2}
        else j++;
      }
      if(!d){
        const inner=input.slice(s,j-2);
        if(inner.length<=256){const v=evaluateExpression(store,inner.trim());out+=v==null?'':String(v)}
        else out+=input.slice(i,j);
        i=j;
      }else out+=input[i++];
    }else out+=input[i++];
  }
  return out;
}

/** Convert ForgeUISchema to TinyBase TablesSchema */
function forgeuiSchemaToTinyBase(schema: ForgeStateConfig['schema']): TablesSchema {
  if (!schema) return {};
  
  const tablesSchema: TablesSchema = {};
  for (const [tableName, tableDef] of Object.entries(schema.tables)) {
    tablesSchema[tableName] = {};
    for (const [colName, colDef] of Object.entries(tableDef.columns)) {
      tablesSchema[tableName][colName] = { type: colDef.type };
    }
  }
  return tablesSchema;
}

/** Create a Forge state store from config */
export function createForgeUIStore(config: ForgeStateConfig): Store {
  const store = createStore();
  
  if (config.schema) {
    const tablesSchema = forgeuiSchemaToTinyBase(config.schema);
    store.setTablesSchema(tablesSchema);
  }
  
  // Set initial state values
  if (config.initialState) {
    for (const [key, value] of Object.entries(config.initialState)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        store.setValue(key, value);
      } else if (typeof value === 'object' && value !== null) {
        // Object values go into tables
        store.setValue(key, JSON.stringify(value));
      }
    }
  }
  
  return store;
}

/** Execute a declarative action against the store */
export function executeAction(
  store: Store, 
  action: {
    type: string;
    path?: string;
    operation?: string;
    key?: string;
    value?: unknown;
  }
): boolean {
  const { type, path, operation, key, value } = action;
  
  if (type !== 'mutateState' || !path) return false;
  
  switch (operation) {
    case 'set': {
      if (path.includes('/')) {
        const parts = path.split('/');
        if (parts.length === 3) {
          const [table, rowId, column] = parts;
          store.setCell(table, rowId, column, value as string | number | boolean);
          return true;
        }
      }
      store.setValue(path, value as string | number | boolean);
      return true;
    }
    
    case 'append': {
      // Add a row to a table
      const table = path;
      const rowId = key || `row_${Date.now()}`;
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
    
    case 'delete': {
      const table = path;
      const rowId = key;
      if (rowId) {
        store.delRow(table, rowId);
        return true;
      }
      return false;
    }
    
    case 'update': {
      const table = path;
      const rowId = key;
      if (rowId && typeof value === 'object' && value !== null) {
        for (const [col, val] of Object.entries(value as Record<string, unknown>)) {
          if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            store.setCell(table, rowId, col, val);
          }
        }
        return true;
      }
      return false;
    }
    
    case 'increment': {
      if (path.includes('/')) {
        const parts = path.split('/');
        if (parts.length === 3) {
          const [table, rowId, column] = parts;
          const current = store.getCell(table, rowId, column);
          if (typeof current === 'number') {
            store.setCell(table, rowId, column, current + ((value as number) || 1));
            return true;
          }
        }
      }
      const currentVal = store.getValue(path);
      if (typeof currentVal === 'number') {
        store.setValue(path, currentVal + ((value as number) || 1));
        return true;
      }
      return false;
    }
    
    case 'decrement': {
      if (path.includes('/')) {
        const parts = path.split('/');
        if (parts.length === 3) {
          const [table, rowId, column] = parts;
          const current = store.getCell(table, rowId, column);
          if (typeof current === 'number') {
            store.setCell(table, rowId, column, current - ((value as number) || 1));
            return true;
          }
        }
      }
      const currentVal = store.getValue(path);
      if (typeof currentVal === 'number') {
        store.setValue(path, currentVal - ((value as number) || 1));
        return true;
      }
      return false;
    }
    
    case 'toggle': {
      if (path.includes('/')) {
        const parts = path.split('/');
        if (parts.length === 3) {
          const [table, rowId, column] = parts;
          const current = store.getCell(table, rowId, column);
          if (typeof current === 'boolean') {
            store.setCell(table, rowId, column, !current);
            return true;
          }
        }
      }
      const currentVal = store.getValue(path);
      if (typeof currentVal === 'boolean') {
        store.setValue(path, !currentVal);
        return true;
      }
      return false;
    }
    
    default:
      return false;
  }
}
