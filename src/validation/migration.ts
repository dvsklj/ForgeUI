/**
 * Forge Schema Migrations
 *
 * Rules:
 *   - ADDITIVE-ONLY by default — new columns with defaults are always safe
 *   - Breaking changes (removed columns, changed types) require explicit migrations
 *   - Migrations run automatically when schema version bumps
 *   - Data is NEVER lost — old columns are preserved unless explicitly migrated
 *
 * Migration format:
 *   {
 *     "fromVersion": 1,
 *     "toVersion": 2,
 *     "operations": [
 *       { "op": "rename", "table": "habits", "old": "name", "new": "habit_name" },
 *       { "op": "cast", "table": "habits", "column": "streak", "from": "string", "to": "number" },
 *       { "op": "drop", "table": "habits", "column": "old_field" }
 *     ]
 *   }
 */

import type { ForgeSchema, Migration } from '../types/index.js';

export interface MigrationResult {
  success: boolean;
  appliedVersion: number;
  operationsApplied: number;
  warnings: string[];
  errors: string[];
}

/**
 * Validate that a schema change is additive-only (safe without migration).
 * Returns an empty array if the change is safe, or a list of warnings/errors.
 */
export function validateAdditiveChange(
  oldSchema: ForgeSchema,
  newSchema: ForgeSchema
): { warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!oldSchema?.tables || !newSchema?.tables) {
    return { warnings, errors };
  }

  const oldTables = oldSchema.tables;
  const newTables = newSchema.tables;

  // Check for removed tables
  for (const tableName of Object.keys(oldTables)) {
    if (!(tableName in newTables)) {
      errors.push(`Table "${tableName}" was removed — use a drop_table migration instead`);
    }
  }

  // Check for removed columns
  for (const tableName of Object.keys(oldTables)) {
    if (!(tableName in newTables)) continue;
    const oldCols = oldTables[tableName].columns;
    const newCols = newTables[tableName].columns;

    for (const colName of Object.keys(oldCols)) {
      if (!(colName in newCols)) {
        errors.push(
          `Column "${tableName}.${colName}" was removed — use a drop migration or keep it deprecated`
        );
      }
    }
  }

  // Check for changed column types
  for (const tableName of Object.keys(oldTables)) {
    if (!(tableName in newTables)) continue;
    const oldCols = oldTables[tableName].columns;
    const newCols = newTables[tableName].columns;

    for (const colName of Object.keys(oldCols)) {
      if (!(colName in newCols)) continue;
      const oldType = oldCols[colName].type;
      const newType = newCols[colName].type;

      if (oldType !== newType) {
        errors.push(
          `Column "${tableName}.${colName}" type changed from ${oldType} to ${newType} — use a cast migration`
        );
      }
    }
  }

  // Check for new columns (additive, but warn if no default)
  for (const tableName of Object.keys(newTables)) {
    if (!(tableName in oldTables)) {
      warnings.push(`New table "${tableName}" added`);
      continue;
    }

    const oldCols = oldTables[tableName].columns;
    const newCols = newTables[tableName].columns;

    for (const colName of Object.keys(newCols)) {
      if (!(colName in oldCols)) {
        if (newCols[colName].default === undefined) {
          warnings.push(
            `New column "${tableName}.${colName}" has no default — existing rows will get null`
          );
        }
      }
    }
  }

  // Check for new tables (additive, always safe)
  for (const tableName of Object.keys(newTables)) {
    if (!(tableName in oldTables)) {
      // New table — always safe
    }
  }

  return { warnings, errors };
}

/**
 * Apply a migration to a store.
 * This is a pure data transformation — no side effects.
 *
 * In practice, the actual migration happens in the ForgeApp's state layer.
 * This function validates the migration and returns instructions.
 */
export function validateMigration(
  migration: Migration,
  currentVersion: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (migration.from !== currentVersion) {
    errors.push(
      `Migration targets version ${migration.from} but current version is ${currentVersion}`
    );
  }

  if (migration.to <= migration.from) {
    errors.push(
      `Migration to (${migration.to}) must be greater than from (${migration.from})`
    );
  }

  for (const op of migration.operations) {
    switch (op.op) {
      case 'rename_column':
        if (!op.from || !op.to) {
          errors.push(`Rename column operation requires both "from" and "to"`);
        }
        break;
      case 'drop_column':
        if (!op.column) {
          errors.push(`Drop column operation requires "column"`);
        }
        break;
      case 'add_column':
        if (!op.column || !op.definition) {
          errors.push(`Add column operation requires "column" and "definition"`);
        }
        break;
      case 'drop_table':
        if (!op.table) {
          errors.push(`Drop table operation requires "table"`);
        }
        break;
      case 'add_table':
        if (!op.definition) {
          errors.push(`Add table operation requires "definition"`);
        }
        break;
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Compute the migration path from one version to another.
 * Supports chained migrations (1→2→3).
 */
export function computeMigrationPath(
  migrations: Migration[],
  fromVersion: number,
  toVersion: number
): Migration[] {
  if (fromVersion >= toVersion) return [];

  const path: Migration[] = [];
  let current = fromVersion;

  while (current < toVersion) {
    const next = migrations.find(m => m.from === current && m.to === current + 1);
    if (!next) {
      throw new Error(
        `No migration path from version ${current} to ${current + 1}`
      );
    }
    path.push(next);
    current = next.to;
  }

  return path;
}
