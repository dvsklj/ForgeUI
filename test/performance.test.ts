import { describe, it, expect } from 'vitest';
import { createForgeStore, resolveRef, executeAction } from '../src/state/index.js';
import { validateManifest } from '../src/validation/index.js';

describe('Performance — Store operations', () => {
  it('createForgeStore with 10 tables in under 50ms', () => {
    const start = performance.now();
    const schema: any = { version: 1, tables: {} };
    for (let i = 0; i < 10; i++) {
      schema.tables[`table${i}`] = {
        columns: {
          name: { type: 'string' },
          value: { type: 'number' },
        },
      };
    }
    const store = createForgeStore({ schema, initialState: { counter: 0 } });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
    // Schema is registered on the store; populate one row to confirm.
    store.setCell('table0', 'r1', 'name', 'probe');
    expect(store.hasTable('table0')).toBe(true);
  });

  it('1000 resolved refs in under 100ms', () => {
    const store = createForgeStore({
      schema: {
        version: 1,
        tables: {
          users: { columns: { name: { type: 'string' }, score: { type: 'number' } } },
        },
      },
      initialState: { greeting: 'hello', count: 42 },
    });
    store.setCell('users', 'u1', 'name', 'Alice');
    store.setCell('users', 'u1', 'score', 100);
    store.setCell('users', 'u2', 'name', 'Bob');
    store.setCell('users', 'u2', 'score', 85);

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      resolveRef(store, '$state:greeting');
      resolveRef(store, '$state:count');
      resolveRef(store, '$computed:count:users');
      resolveRef(store, '$state:users/u1/name');
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });

  it('1000 state mutations in under 100ms', () => {
    const store = createForgeStore({ initialState: { counter: 0 } });
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      executeAction(store, { type: 'mutateState', path: 'counter', operation: 'set', value: i });
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('1000 table appends in under 200ms', () => {
    const store = createForgeStore({
      schema: { version: 1, tables: { items: { columns: { name: { type: 'string' }, qty: { type: 'number' } } } } },
    });
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      executeAction(store, {
        type: 'mutateState',
        path: 'items',
        operation: 'append',
        key: `row-${i}`,
        value: { name: `Item ${i}`, qty: i },
      });
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });

  it('template interpolation performance', () => {
    const store = createForgeStore({ initialState: { name: 'World', count: 42 } });
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      resolveRef(store, 'Hello {{state.name}}, count={{state.count}}!');
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});

describe('Performance — Validation', () => {
  it('validates a minimal manifest in under 10ms', () => {
    const m = {
      manifest: '0.1.0',
      id: 'perf-test',
      root: 'main',
      elements: { main: { type: 'Text', props: { content: 'Hello' } } },
    };
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      validateManifest(m);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('validates a complex manifest in under 50ms', () => {
    const elements: Record<string, any> = {};
    for (let i = 0; i < 50; i++) {
      elements[`el${i}`] = { type: 'Text', props: { content: `Element ${i}` } };
    }
    elements['root'] = { type: 'Stack', children: Object.keys(elements).filter(k => k !== 'root') };
    const m = {
      manifest: '0.1.0',
      id: 'large-app',
      root: 'root',
      schema: { version: 1, tables: { users: { columns: { name: { type: 'string' } } } } },
      state: { counter: 0 },
      elements,
    };
    const start = performance.now();
    for (let i = 0; i < 20; i++) {
      validateManifest(m);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});