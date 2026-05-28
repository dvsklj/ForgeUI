import { afterEach, describe, expect, it } from 'vitest';
import {
  closeDatabase,
  createApp,
  initDatabase,
  queryAppData,
  readAppData,
} from '../src/server/db.js';
import type { ForgeUIManifest } from '../src/types/index.js';

afterEach(() => {
  closeDatabase();
});

function manifest(overrides: Partial<ForgeUIManifest> = {}): ForgeUIManifest {
  return {
    manifest: '0.1.0',
    id: 'data-app',
    root: 'root',
    schema: {
      version: 1,
      tables: {
        workouts: {
          columns: {
            exercise: { type: 'string' },
            weight: { type: 'number' },
            reps: { type: 'number' },
            created_at: { type: 'string' },
          },
        },
        privateNotes: {
          columns: {
            note: { type: 'string' },
          },
        },
      },
    },
    state: {
      workouts: {
        r1: { exercise: 'squat', weight: 100, reps: 5, created_at: '2026-04-01' },
        r2: { exercise: 'squat', weight: 110, reps: 4, created_at: '2026-04-08' },
        r3: { exercise: 'bench', weight: 80, reps: 6, created_at: '2026-04-09' },
      },
      privateNotes: {
        n1: { note: 'do not expose' },
      },
    },
    elements: {
      root: { type: 'Card', props: { title: 'Data App' } },
    },
    dataAccess: {
      enabled: true,
      readable: ['workouts'],
      restricted: ['privateNotes'],
    },
    ...overrides,
  };
}

describe('server app data read-back helpers', () => {
  it('reads only manifest.dataAccess readable tables with bounded rows', () => {
    initDatabase(':memory:');
    createApp(manifest());

    const result = readAppData('data-app', { tables: ['workouts'], limit: 2 });

    expect(result?.rowCounts.workouts).toBe(3);
    expect(result?.returnedRows.workouts).toBe(2);
    expect(result?.data.workouts).toEqual([
      { id: 'r1', exercise: 'squat', weight: 100, reps: 5, created_at: '2026-04-01' },
      { id: 'r2', exercise: 'squat', weight: 110, reps: 4, created_at: '2026-04-08' },
    ]);

    expect(Object.keys(readAppData('data-app')?.data ?? {})).toEqual(['workouts']);
  });

  it('denies reads unless dataAccess is explicitly enabled and table is readable', () => {
    initDatabase(':memory:');
    createApp(manifest({ dataAccess: { enabled: false, readable: ['workouts'] } }));

    expect(() => readAppData('data-app', { tables: ['workouts'] })).toThrow(/not enabled/);

    closeDatabase();
    initDatabase(':memory:');
    createApp(manifest());

    expect(() => readAppData('data-app', { tables: ['privateNotes'] })).toThrow(/denied/);
  });

  it('limits reads and queries to schema-declared tables', () => {
    initDatabase(':memory:');
    const app = manifest();
    createApp({
      ...app,
      state: {
        ...app.state,
        shadow: {
          s1: { secret: true },
        },
      },
      dataAccess: {
        enabled: true,
        readable: ['workouts', 'shadow'],
      },
    });

    expect(Object.keys(readAppData('data-app')?.data ?? {})).toEqual(['workouts']);
    expect(() => readAppData('data-app', { tables: ['shadow'] })).toThrow(/Unknown data table/);
    expect(() => queryAppData('data-app', [{ table: 'shadow', aggregate: 'count' }])).toThrow(/Unknown data table/);
  });

  it('projects raw reads to schema-declared columns only', () => {
    initDatabase(':memory:');
    const app = manifest();
    createApp({
      ...app,
      state: {
        ...app.state,
        workouts: {
          r1: {
            exercise: 'squat',
            weight: 100,
            reps: 5,
            created_at: '2026-04-01',
            secret: 'hidden',
            nested: { leak: true },
          },
        },
      },
    });

    expect(readAppData('data-app', { tables: ['workouts'] })?.data.workouts).toEqual([
      { id: 'r1', exercise: 'squat', weight: 100, reps: 5, created_at: '2026-04-01' },
    ]);
  });

  it('does not broaden explicit empty table lists and blocks raw reads in summaries mode', () => {
    initDatabase(':memory:');
    createApp(manifest());

    expect(readAppData('data-app', { tables: [] })?.data).toEqual({});

    closeDatabase();
    initDatabase(':memory:');
    createApp(manifest({ dataAccess: { enabled: false, readable: ['workouts'], summaries: true } }));

    expect(() => readAppData('data-app', { tables: ['workouts'] })).toThrow(/not enabled/);

    closeDatabase();
    initDatabase(':memory:');
    createApp(manifest({ dataAccess: { enabled: true, readable: ['workouts'], summaries: true } }));

    expect(() => readAppData('data-app', { tables: ['workouts'] })).toThrow(/summaries only/);
    expect(queryAppData('data-app', [{ table: 'workouts', aggregate: 'count' }])?.results[0].data).toBe(3);
  });

  it('rejects invalid since filters instead of silently widening reads', () => {
    initDatabase(':memory:');
    createApp(manifest());

    expect(() => readAppData('data-app', { since: 'not-a-date' })).toThrow(/Invalid since/);
  });

  it('queries count, numeric aggregates, distinct, where, and groupBy', () => {
    initDatabase(':memory:');
    createApp(manifest());

    const result = queryAppData('data-app', [
      { table: 'workouts', aggregate: 'count' },
      { table: 'workouts', aggregate: 'max', column: 'weight' },
      { table: 'workouts', aggregate: 'min', column: 'weight' },
      { table: 'workouts', aggregate: 'avg', column: 'reps', where: { exercise: 'squat' } },
      { table: 'workouts', aggregate: 'sum', column: 'weight', groupBy: 'exercise' },
      { table: 'workouts', aggregate: 'distinct', column: 'exercise' },
    ]);

    expect(result?.results).toEqual([
      { table: 'workouts', aggregate: 'count', column: undefined, groupBy: undefined, data: 3 },
      { table: 'workouts', aggregate: 'max', column: 'weight', groupBy: undefined, data: 110 },
      { table: 'workouts', aggregate: 'min', column: 'weight', groupBy: undefined, data: 80 },
      { table: 'workouts', aggregate: 'avg', column: 'reps', groupBy: undefined, data: 4.5 },
      { table: 'workouts', aggregate: 'sum', column: 'weight', groupBy: 'exercise', data: { squat: 210, bench: 80 } },
      { table: 'workouts', aggregate: 'distinct', column: 'exercise', groupBy: undefined, data: { values: ['squat', 'bench'], count: 2 } },
    ]);
  });

  it('rejects unknown query columns and de-duplicates table requests', () => {
    initDatabase(':memory:');
    createApp(manifest());

    expect(Object.keys(readAppData('data-app', { tables: ['workouts', 'workouts'] })?.data ?? {})).toEqual(['workouts']);
    expect(() => queryAppData('data-app', [{ table: 'workouts', aggregate: 'max', column: 'secret' }])).toThrow(/Unknown column/);
    expect(() => queryAppData('data-app', [{ table: 'workouts', aggregate: 'count', where: { secret: true } }])).toThrow(/Unknown column/);
    expect(() => queryAppData('data-app', [{ table: 'workouts', aggregate: 'count', groupBy: 'secret' }])).toThrow(/Unknown column/);
  });

  it('keeps grouped aggregate keys distinct for non-string values', () => {
    initDatabase(':memory:');
    const app = manifest();
    createApp({
      ...app,
      schema: {
        ...app.schema!,
        tables: {
          ...app.schema!.tables,
          workouts: {
            columns: {
              ...app.schema!.tables.workouts.columns,
              bucket: { type: 'number' },
            },
          },
        },
      },
      state: {
        ...app.state,
        workouts: {
          r1: { exercise: 'squat', weight: 100, reps: 5, created_at: '2026-04-01', bucket: 1 },
          r2: { exercise: 'bench', weight: 80, reps: 6, created_at: '2026-04-09', bucket: 2 },
          r3: { exercise: 'curl', weight: 40, reps: 8, created_at: '2026-04-11', bucket: 'number:1' },
        },
      },
    });

    expect(queryAppData('data-app', [
      { table: 'workouts', aggregate: 'sum', column: 'weight', groupBy: 'bucket' },
    ])?.results[0].data).toEqual({ 'number:1': 100, 'number:2': 80, 'string:number:1': 40 });
  });
});
