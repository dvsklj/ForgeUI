/**
 * Forge State Layer
 * 
 * Wraps TinyBase for reactive state management.
 * - Creates store from manifest schema
 * - Resolves $state:, $computed:, $item: references
 * - Supports progressive persistence (in-memory → IndexedDB → sync)
 */

import { createStore, Store, TablesSchema } from 'tinybase';

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

/** 
 * Resolve any reference string to its actual value.
 * - $state:path → store value
 * - $computed:expression → computed value
 * - $item:field → current repeater item field
 * - Plain value → returned as-is
 */
export function resolveRef(store: Store, value: unknown): unknown {
  if (typeof value !== 'string') return value;
  
  if (value.startsWith('$state:')) {
    const path = value.slice(7);
    return resolveStatePath(store, path);
  }
  
  if (value.startsWith('$computed:')) {
    const expression = value.slice(10);
    return evaluateComputed(store, expression);
  }
  
  if (value.startsWith('$item:')) {
    const field = value.slice(6);
    return currentItemContext?.[field];
  }
  
  return value;
}

/** Convert ForgeSchema to TinyBase TablesSchema */
function forgeSchemaToTinyBase(schema: ForgeStateConfig['schema']): TablesSchema {
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
export function createForgeStore(config: ForgeStateConfig): Store {
  const store = createStore();
  
  if (config.schema) {
    const tablesSchema = forgeSchemaToTinyBase(config.schema);
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
