import { describe, expect, it, vi } from 'vitest';
import { createStore } from 'tinybase';
import { migrateManifestFormat } from '../src/runtime/manifest-migrations.js';
import { applyForgeUISchemaToStore } from '../src/state/index.js';
import { applySchemaMigrations, SCHEMA_VERSION_VALUE_ID } from '../src/state/migrations.js';
import { validateManifest } from '../src/validation/index.js';
import type { ForgeUISchema } from '../src/types/index.js';

describe('manifest-format migrations', () => {
  it('transforms legacy 0.0 manifests before current validation', () => {
    const legacy = {
      version: '0.0.0',
      id: 'legacy-app',
      rootElement: 'root',
      components: {
        root: { component: 'Text', props: { content: 'Hello' } },
      },
    };

    const result = migrateManifestFormat(legacy);
    const validation = validateManifest(result);

    expect(validation.valid).toBe(true);
    expect(result).toMatchObject({
      manifest: '0.1.0',
      root: 'root',
      elements: {
        root: { type: 'Text' },
      },
    });
  });

  it('does not mutate the caller-provided manifest object', () => {
    const legacy = {
      version: '0.0.0',
      id: 'legacy-app',
      rootElement: 'root',
      components: {
        root: { component: 'Text', props: { content: 'Hello' } },
      },
    };

    migrateManifestFormat(legacy);

    expect(legacy).toHaveProperty('version', '0.0.0');
    expect(legacy).toHaveProperty('rootElement', 'root');
    expect(legacy.components.root).toHaveProperty('component', 'Text');
  });

  it('leaves newer manifest versions untouched', () => {
    const newer = {
      manifest: '0.2.0',
      id: 'future-app',
      root: 'root',
      elements: {
        root: { type: 'Text', props: { content: 'Hello' } },
      },
    };

    expect(migrateManifestFormat(newer)).toBe(newer);
  });
});

describe('TinyBase schema migrations', () => {
  it('applies a chained declarative migration to existing rows', () => {
    const schema: ForgeUISchema = {
      version: 3,
      tables: {
        meals: {
          columns: {
            calories: { type: 'number' },
            protein: { type: 'number', default: 0 },
          },
        },
      },
      migrations: [
        {
          from: 1,
          to: 2,
          operations: [
            { op: 'rename_column', table: 'meals', from: 'cals', to: 'calories' },
          ],
        },
        {
          from: 2,
          to: 3,
          operations: [
            { op: 'add_column', table: 'meals', column: 'protein', default: 0 },
            { op: 'drop_column', table: 'meals', column: 'notes' },
          ],
        },
      ],
    };
    const store = createStore();
    store.setCell('meals', 'm1', 'cals', 500);
    store.setCell('meals', 'm1', 'notes', 'ok');
    store.setValue(SCHEMA_VERSION_VALUE_ID, 1);

    const result = applySchemaMigrations(store, schema);
    applyForgeUISchemaToStore(store, schema);

    expect(result.migrated).toBe(true);
    expect(result.missingStep).toBeUndefined();
    expect(store.getCell('meals', 'm1', 'calories')).toBe(500);
    expect(store.getCell('meals', 'm1', 'protein')).toBe(0);
    expect(store.hasCell('meals', 'm1', 'cals')).toBe(false);
    expect(store.hasCell('meals', 'm1', 'notes')).toBe(false);
    expect(store.getValue(SCHEMA_VERSION_VALUE_ID)).toBe(3);
    expect(typeof store.getValue('__forgeui_migration_backup_1_2')).toBe('string');
    expect(typeof store.getValue('__forgeui_migration_backup_2_3')).toBe('string');
  });

  it('reports a missing migration step without advancing the stored version', () => {
    const schema: ForgeUISchema = {
      version: 3,
      tables: {
        meals: { columns: { calories: { type: 'number' } } },
      },
      migrations: [
        {
          from: 2,
          to: 3,
          operations: [
            { op: 'rename_column', table: 'meals', from: 'cals', to: 'calories' },
          ],
        },
      ],
    };
    const store = createStore();
    store.setCell('meals', 'm1', 'cals', 500);
    store.setValue(SCHEMA_VERSION_VALUE_ID, 1);

    const result = applySchemaMigrations(store, schema);

    expect(result.migrated).toBe(false);
    expect(result.missingStep).toBe(1);
    expect(store.getValue(SCHEMA_VERSION_VALUE_ID)).toBe(1);
    expect(store.getCell('meals', 'm1', 'cals')).toBe(500);
  });

  it('treats unversioned data-bearing stores as already current', () => {
    const schema: ForgeUISchema = {
      version: 2,
      tables: {
        meals: { columns: { calories: { type: 'number' } } },
      },
      migrations: [
        {
          from: 1,
          to: 2,
          operations: [
            { op: 'rename_column', table: 'meals', from: 'cals', to: 'calories' },
          ],
        },
      ],
    };
    const store = createStore();
    store.setCell('meals', 'm1', 'cals', 500);

    const result = applySchemaMigrations(store, schema);

    expect(result.migrated).toBe(false);
    expect(result.missingStep).toBeUndefined();
    expect(store.getValue(SCHEMA_VERSION_VALUE_ID)).toBe(2);
    expect(store.getCell('meals', 'm1', 'cals')).toBe(500);
    expect(store.hasCell('meals', 'm1', 'calories')).toBe(false);
  });

  it('warns when duplicate migration sources are ignored', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const schema: ForgeUISchema = {
      version: 2,
      tables: {
        meals: { columns: { calories: { type: 'number' } } },
      },
      migrations: [
        { from: 1, to: 2, operations: [] },
        { from: 1, to: 2, operations: [{ op: 'add_table', table: 'meals' }] },
      ],
    };
    const store = createStore();
    store.setValue(SCHEMA_VERSION_VALUE_ID, 1);

    applySchemaMigrations(store, schema);

    expect(warn).toHaveBeenCalledWith('[forgeui] duplicate schema migration from v1; ignoring later entry');
    warn.mockRestore();
  });
});
