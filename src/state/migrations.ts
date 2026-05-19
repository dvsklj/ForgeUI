import type { Store } from 'tinybase';
import type { ForgeUISchema, Migration, MigrationOperation } from '../types/index.js';

export const SCHEMA_VERSION_VALUE_ID = '__forgeui_schema_version';

export interface SchemaMigrationResult {
  migrated: boolean;
  missingStep?: number;
}

export function markSchemaVersion(store: Store, version: number): void {
  store.setValue(SCHEMA_VERSION_VALUE_ID, version);
}

export function applySchemaMigrations(store: Store, schema?: ForgeUISchema): SchemaMigrationResult {
  const targetVersion = schema?.version;
  if (!schema || !Number.isInteger(targetVersion) || targetVersion < 1) {
    return { migrated: false };
  }

  const migrations = new Map<number, Migration>();
  for (const migration of schema.migrations ?? []) {
    if (migration.to <= migration.from) continue;
    if (migrations.has(migration.from)) {
      console.warn(`[forgeui] duplicate schema migration from v${migration.from}; ignoring later entry`);
      continue;
    }
    migrations.set(migration.from, migration);
  }

  const from = readCurrentVersion(store, schema);
  if (from >= targetVersion) {
    markSchemaVersion(store, targetVersion);
    return { migrated: false };
  }
  let current = from;
  let migrated = false;

  while (current < targetVersion) {
    const migration = migrations.get(current);
    if (!migration) {
      return { migrated, missingStep: current };
    }

    backupForDestructiveOperations(store, migration);
    for (const operation of migration.operations) {
      applyOperation(store, operation);
    }
    current = migration.to;
    markSchemaVersion(store, current);
    migrated = true;
  }

  return { migrated };
}

function readCurrentVersion(store: Store, schema: ForgeUISchema): number {
  const stored = store.getValue(SCHEMA_VERSION_VALUE_ID);
  if (typeof stored === 'number' && Number.isInteger(stored) && stored >= 1) return stored;

  return schema.version;
}

function backupForDestructiveOperations(store: Store, migration: Migration): void {
  if (!migration.operations.some(isDestructiveOperation)) return;
  const backup = {
    version: migration.from,
    tables: store.getTables(),
    values: store.getValues(),
  };
  store.setValue(`__forgeui_migration_backup_${migration.from}_${migration.to}`, JSON.stringify(backup));
}

function isDestructiveOperation(operation: MigrationOperation): boolean {
  return operation.op === 'drop_column' || operation.op === 'drop_table' || operation.op === 'rename_column';
}

function applyOperation(store: Store, operation: MigrationOperation): void {
  switch (operation.op) {
    case 'add_table':
      store.setTable(operation.table, {});
      return;
    case 'drop_table':
      store.delTable(operation.table);
      return;
    case 'add_column': {
      const definition = 'definition' in operation ? operation.definition : undefined;
      const defaultValue = definition?.default ?? (operation as { default?: unknown }).default;
      if (!isCellValue(defaultValue)) return;
      for (const rowId of store.getRowIds(operation.table)) {
        if (!store.hasCell(operation.table, rowId, operation.column)) {
          store.setCell(operation.table, rowId, operation.column, defaultValue);
        }
      }
      return;
    }
    case 'drop_column':
      for (const rowId of store.getRowIds(operation.table)) {
        store.delCell(operation.table, rowId, operation.column);
      }
      return;
    case 'rename_column':
      for (const rowId of store.getRowIds(operation.table)) {
        if (store.hasCell(operation.table, rowId, operation.from)) {
          const value = store.getCell(operation.table, rowId, operation.from);
          store.setCell(operation.table, rowId, operation.to, value);
          store.delCell(operation.table, rowId, operation.from);
        }
      }
      return;
  }
}

function isCellValue(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}
