import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'tinybase';
import { createForgeUIStore, resolveRef, executeAction, setItemContext, getItemContext } from '../src/state/index.js';

describe('createForgeUIStore', () => {
  it('creates a store with no config', () => {
    const store = createForgeUIStore({});
    expect(store).toBeDefined();
  });

  it('creates a store with schema and initial state', () => {
    const store = createForgeUIStore({
      schema: {
        version: 1,
        tables: {
          users: {
            columns: {
              name: { type: 'string' },
              age: { type: 'number' },
            },
          },
        },
      },
      initialState: {
        greeting: 'hello',
        count: 42,
        active: true,
      },
    });

    expect(store.getValue('greeting')).toBe('hello');
    expect(store.getValue('count')).toBe(42);
    expect(store.getValue('active')).toBe(true);
    // setTablesSchema registers the schema; verify by reading it back.
    // (TinyBase's `hasTable` reports row presence, so a schema-only table
    // is reported as absent until a row lands in it.)
    expect(store.getTablesSchemaJson()).toContain('users');
  });

  it('serializes complex objects as JSON strings in values', () => {
    const store = createForgeUIStore({
      initialState: {
        config: { theme: 'dark', lang: 'en' },
      },
    });
    const raw = store.getValue('config');
    expect(typeof raw).toBe('string');
    expect(JSON.parse(raw as string)).toEqual({ theme: 'dark', lang: 'en' });
  });

  it('handles empty schema gracefully', () => {
    const store = createForgeUIStore({ schema: undefined });
    expect(store).toBeDefined();
  });
});

describe('resolveRef — $state: paths', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.setValue('name', 'Alice');
    store.setValue('count', 42);
    store.setValue('active', true);
    store.setValue('empty', '');
    store.setTable('users', {
      u1: { name: 'Bob', age: 30 },
      u2: { name: 'Carol', age: 25 },
    });
  });

  it('resolves simple value', () => {
    expect(resolveRef(store, '$state:name')).toBe('Alice');
  });

  it('resolves numeric value', () => {
    expect(resolveRef(store, '$state:count')).toBe(42);
  });

  it('resolves boolean value', () => {
    expect(resolveRef(store, '$state:active')).toBe(true);
  });

  it('resolves table cell via slash path', () => {
    expect(resolveRef(store, '$state:users/u1/name')).toBe('Bob');
  });

  it('resolves table cell with numeric value', () => {
    expect(resolveRef(store, '$state:users/u1/age')).toBe(30);
  });

  it('resolves entire table row via two-segment path', () => {
    const row = resolveRef(store, '$state:users/u1');
    expect(row).toEqual({ name: 'Bob', age: 30 });
  });

  it('resolves entire table via $expr: single segment path', () => {
    // $state: treats a single segment as a value key (no table lookup).
    // The $expr:state.<table> form is what resolves a whole table to a
    // row-id-keyed object.
    const table = resolveRef(store, '$expr:state.users') as Record<string, Record<string, unknown>>;
    expect(table).toBeDefined();
    expect(table.u1).toEqual({ name: 'Bob', age: 30 });
    expect(table.u2).toEqual({ name: 'Carol', age: 25 });
  });

  it('returns undefined for unknown path', () => {
    expect(resolveRef(store, '$state:nonexistent')).toBeUndefined();
  });

  it('returns undefined for unknown table/row', () => {
    expect(resolveRef(store, '$state:fake/u1')).toBeUndefined();
  });

  it('resolves deep JSON path from a string value via $expr:', () => {
    // $state: is a flat path resolver — JSON deep traversal is an $expr:
    // feature (see resolveStateDotPath fallback).
    store.setValue('settings', JSON.stringify({ theme: 'dark', nested: { color: 'blue' } }));
    expect(resolveRef(store, '$expr:state.settings.theme')).toBe('dark');
  });

  it('handles empty string value', () => {
    expect(resolveRef(store, '$state:empty')).toBe('');
  });
});

describe('resolveRef — $computed: expressions', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.setTable('tasks', {
      t1: { name: 'Task1', done: false, priority: 3 },
      t2: { name: 'Task2', done: true, priority: 5 },
      t3: { name: 'Task3', done: false, priority: 1 },
    });
  });

  it('count: counts table rows', () => {
    expect(resolveRef(store, '$computed:count:tasks')).toBe(3);
  });

  it('sum: sums a numeric column', () => {
    expect(resolveRef(store, '$computed:sum:tasks/priority')).toBe(9);
  });

  it('avg: averages a numeric column', () => {
    const result = resolveRef(store, '$computed:avg:tasks/priority');
    expect(result).toBeCloseTo(3);
  });

  it('returns 0 for avg of empty table', () => {
    store.setTable('empty', {});
    expect(resolveRef(store, '$computed:avg:empty/col')).toBe(0);
  });

  it('falls through to resolveStatePath for direct path', () => {
    store.setValue('myVal', 'hello');
    expect(resolveRef(store, '$computed:myVal')).toBe('hello');
  });

  it('rejects computed expressions over 1024 chars', () => {
    expect(resolveRef(store, '$computed:' + 'x'.repeat(1025))).toBeUndefined();
  });
});

describe('resolveRef — $item: references', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('resolves top-level field from item context', () => {
    setItemContext({ name: 'Widget', price: 10 });
    expect(resolveRef(store, '$item:name')).toBe('Widget');
    expect(resolveRef(store, '$item:price')).toBe(10);
    setItemContext(null);
  });

  it('resolves nested field with dot notation', () => {
    setItemContext({ user: { name: 'Alice', role: 'admin' } });
    expect(resolveRef(store, '$item:user.name')).toBe('Alice');
    expect(resolveRef(store, '$item:user.role')).toBe('admin');
    setItemContext(null);
  });

  it('returns undefined when no item context', () => {
    setItemContext(null);
    expect(resolveRef(store, '$item:name')).toBeUndefined();
  });

  it('returns undefined for forbidden path segments', () => {
    setItemContext({ name: 'test' });
    expect(resolveRef(store, '$item:__proto__')).toBeUndefined();
    expect(resolveRef(store, '$item:constructor')).toBeUndefined();
    expect(resolveRef(store, '$item:prototype')).toBeUndefined();
    setItemContext(null);
  });

  it('returns undefined for paths exceeding 32 depth', () => {
    setItemContext({ a: 1 });
    const deepPath = Array(35).fill('a').join('.');
    expect(resolveRef(store, `$item:${deepPath}`)).toBeUndefined();
    setItemContext(null);
  });
});

describe('resolveRef — $expr: expressions', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.setValue('name', 'World');
    store.setValue('count', 5);
    store.setValue('active', true);
  });

  it('resolves state dot path', () => {
    expect(resolveRef(store, '$expr:state.name')).toBe('World');
  });

  it('resolves state.value shorthand', () => {
    expect(resolveRef(store, '$expr:state.count')).toBe(5);
  });

  it('resolves state table access', () => {
    store.setTable('items', { i1: { x: 10 }, i2: { x: 20 } });
    const result = resolveRef(store, '$expr:state.items | values');
    expect(Array.isArray(result)).toBe(true);
  });

  it('resolves pipe filters: count, length, first, last, sum', () => {
    store.setTable('items', { i1: { x: 10 }, i2: { x: 20 }, i3: { x: 30 } });
    expect(resolveRef(store, '$expr:state.items | count')).toBe(3);
    expect(resolveRef(store, '$expr:state.items | length')).toBe(3);
    // first/last require array input — pipe through `values` first to
    // convert the row-id-keyed object into an array.
    const first = resolveRef(store, '$expr:state.items | values | first');
    expect(first).toBeDefined();
    const sum = resolveRef(store, '$expr:state.items | values | sum');
    expect(sum).toBeDefined();
  });

  it('resolves item field', () => {
    setItemContext({ fieldA: 'hello' });
    expect(resolveRef(store, '$expr:item.fieldA')).toBe('hello');
    setItemContext(null);
  });

  it('resolves literal values', () => {
    expect(resolveRef(store, '$expr:"hello"')).toBe('hello');
    expect(resolveRef(store, "$expr:'hello'")).toBe('hello');
    expect(resolveRef(store, '$expr:42')).toBe(42);
    expect(resolveRef(store, '$expr:true')).toBe(true);
    expect(resolveRef(store, '$expr:false')).toBe(false);
    expect(resolveRef(store, '$expr:null')).toBeNull();
  });

  it('handles empty expression', () => {
    expect(resolveRef(store, '$expr:')).toBeUndefined();
    expect(resolveRef(store, '$expr: ')).toBeUndefined();
  });

  it('rejects expressions over 1024 chars', () => {
    expect(resolveRef(store, '$expr:' + 'x'.repeat(1025))).toBeUndefined();
  });
});

describe('resolveRef — template interpolation', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.setValue('name', 'World');
    store.setValue('count', 42);
  });

  it('interpolates {{state.x}} in strings', () => {
    expect(resolveRef(store, 'Hello {{state.name}}!')).toBe('Hello World!');
  });

  it('interpolates multiple templates', () => {
    expect(resolveRef(store, '{{state.name}} = {{state.count}}')).toBe('World = 42');
  });

  it('returns undefined for missing values', () => {
    const result = resolveRef(store, 'Hello {{state.nonexistent}}');
    expect(result).toBe('Hello ');
  });

  it('returns plain strings unchanged', () => {
    expect(resolveRef(store, 'just text')).toBe('just text');
  });

  it('returns non-string values unchanged', () => {
    expect(resolveRef(store, 42)).toBe(42);
    expect(resolveRef(store, true)).toBe(true);
    expect(resolveRef(store, null)).toBeNull();
  });

  it('handles object-form references', () => {
    expect(resolveRef(store, { $state: 'name' } as any)).toBe('World');
    expect(resolveRef(store, { $expr: 'state.count' } as any)).toBe(42);
  });

  it('does not interpolate strings over 4096 chars', () => {
    const long = 'a'.repeat(4097);
    expect(resolveRef(store, long)).toBe(long);
  });
});

describe('executeAction', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.setValue('counter', 0);
    store.setValue('flag', true);
    store.setTable('items', {
      i1: { name: 'Alpha', count: 10 },
      i2: { name: 'Beta', count: 20 },
    });
  });

  it('set: sets a simple value', () => {
    const result = executeAction(store, { type: 'mutateState', path: 'counter', operation: 'set', value: 99 });
    expect(result).toBe(true);
    expect(store.getValue('counter')).toBe(99);
  });

  it('set: sets a cell value via table/row/column path', () => {
    const result = executeAction(store, { type: 'mutateState', path: 'items/i1/count', operation: 'set', value: 99 });
    expect(result).toBe(true);
    expect(store.getCell('items', 'i1', 'count')).toBe(99);
  });

  it('append: adds a row to a table', () => {
    const result = executeAction(store, {
      type: 'mutateState', path: 'items', operation: 'append',
      key: 'i3', value: { name: 'Gamma', count: 30 },
    });
    expect(result).toBe(true);
    expect(store.getCell('items', 'i3', 'name')).toBe('Gamma');
  });

  it('append: generates auto key when key not provided', () => {
    const result = executeAction(store, {
      type: 'mutateState', path: 'items', operation: 'append',
      value: { name: 'Delta', count: 40 },
    });
    expect(result).toBe(true);
  });

  it('append: fails for non-object value', () => {
    const result = executeAction(store, { type: 'mutateState', path: 'items', operation: 'append', value: 'string' });
    expect(result).toBe(false);
  });

  it('delete: removes a row by key', () => {
    const result = executeAction(store, { type: 'mutateState', path: 'items', operation: 'delete', key: 'i1' });
    expect(result).toBe(true);
    expect(store.hasRow('items', 'i1')).toBe(false);
  });

  it('delete: fails without key', () => {
    const result = executeAction(store, { type: 'mutateState', path: 'items', operation: 'delete' });
    expect(result).toBe(false);
  });

  it('update: updates specific columns in a row', () => {
    const result = executeAction(store, { type: 'mutateState', path: 'items', operation: 'update', key: 'i1', value: { count: 15 } });
    expect(result).toBe(true);
    expect(store.getCell('items', 'i1', 'count')).toBe(15);
    expect(store.getCell('items', 'i1', 'name')).toBe('Alpha');
  });

  it('increment: increments a numeric value', () => {
    const result = executeAction(store, { type: 'mutateState', path: 'counter', operation: 'increment' });
    expect(result).toBe(true);
    expect(store.getValue('counter')).toBe(1);
  });

  it('increment: increments by custom amount', () => {
    executeAction(store, { type: 'mutateState', path: 'counter', operation: 'increment', value: 10 });
    expect(store.getValue('counter')).toBe(10);
  });

  it('increment: increments a cell value', () => {
    const result = executeAction(store, { type: 'mutateState', path: 'items/i1/count', operation: 'increment', value: 5 });
    expect(result).toBe(true);
    expect(store.getCell('items', 'i1', 'count')).toBe(15);
  });

  it('decrement: decrements a numeric value', () => {
    const result = executeAction(store, { type: 'mutateState', path: 'counter', operation: 'decrement', value: 5 });
    expect(result).toBe(true);
    expect(store.getValue('counter')).toBe(-5);
  });

  it('toggle: toggles a boolean value', () => {
    const result = executeAction(store, { type: 'mutateState', path: 'flag', operation: 'toggle' });
    expect(result).toBe(true);
    expect(store.getValue('flag')).toBe(false);
  });

  it('toggle: toggles a cell boolean', () => {
    store.setCell('items', 'i1', 'active', true);
    const result = executeAction(store, { type: 'mutateState', path: 'items/i1/active', operation: 'toggle' });
    expect(result).toBe(true);
    expect(store.getCell('items', 'i1', 'active')).toBe(false);
  });

  it('returns false for unknown action type', () => {
    const result = executeAction(store, { type: 'navigate', path: 'view1' });
    expect(result).toBe(false);
  });

  it('returns false for mutateState without path', () => {
    const result = executeAction(store, { type: 'mutateState' });
    expect(result).toBe(false);
  });

  it('increment fails on non-numeric value', () => {
    store.setValue('text', 'hello');
    const result = executeAction(store, { type: 'mutateState', path: 'text', operation: 'increment' });
    expect(result).toBe(false);
  });

  it('decrement fails on non-numeric value', () => {
    store.setValue('text', 'hello');
    const result = executeAction(store, { type: 'mutateState', path: 'text', operation: 'decrement' });
    expect(result).toBe(false);
  });

  it('toggle fails on non-boolean value', () => {
    store.setValue('text', 'hello');
    const result = executeAction(store, { type: 'mutateState', path: 'text', operation: 'toggle' });
    expect(result).toBe(false);
  });
});

describe('resolveRef — security hardening', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.setValue('secret', 'classified');
  });

  it('blocks $state:__proto__', () => {
    expect(resolveRef(store, '$state:__proto__')).toBeUndefined();
  });

  it('blocks $state:constructor', () => {
    expect(resolveRef(store, '$state:constructor')).toBeUndefined();
  });

  it('blocks $state paths with forbidden segments', () => {
    expect(resolveRef(store, '$state:a.__proto__.b')).toBeUndefined();
    expect(resolveRef(store, '$state:prototype.x')).toBeUndefined();
  });

  it('blocks $state paths over 256 chars', () => {
    expect(resolveRef(store, '$state:' + 'a'.repeat(257))).toBeUndefined();
  });

  it('blocks empty $state path', () => {
    expect(resolveRef(store, '$state:')).toBeUndefined();
  });

  it('does not resolve values for __proto__ key on store', () => {
    expect(resolveRef(store, '$state:__proto__')).toBeUndefined();
  });
});

describe('resolveRef — performance', () => {
  it('resolves 1000 $state references in under 100ms', () => {
    const store = createStore();
    store.setValue('val', 42);
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      resolveRef(store, '$state:val');
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('resolves 1000 $computed:count expressions in under 100ms', () => {
    const store = createStore();
    store.setTable('data', { d1: { x: 1 }, d2: { x: 2 }, d3: { x: 3 } });
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      resolveRef(store, '$computed:count:data');
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('executes 1000 state mutations in under 100ms', () => {
    const store = createStore();
    store.setValue('counter', 0);
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      executeAction(store, { type: 'mutateState', path: 'counter', operation: 'set', value: i });
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
    expect(store.getValue('counter')).toBe(999);
  });
});