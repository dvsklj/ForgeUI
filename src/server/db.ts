/**
 * Forge Server — Database Layer
 *
 * Uses better-sqlite3 for manifest storage.
 * Simple schema: apps table with JSON manifest blob.
 */

import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';
import type { ForgeUIManifest } from '../types/index.js';

export interface StoredApp {
  id: string;
  title: string;
  manifest: ForgeUIManifest;
  created_at: string;
  updated_at: string;
}

export interface ReadAppDataOptions {
  tables?: string[];
  limit?: number;
  since?: string;
}

export interface ReadAppDataResult {
  schema: ForgeUIManifest['schema'];
  data: Record<string, Array<Record<string, unknown>>>;
  rowCounts: Record<string, number>;
  returnedRows: Record<string, number>;
}

export type AppDataAggregate = 'count' | 'max' | 'min' | 'avg' | 'sum' | 'distinct';

export interface QueryAppDataRequest {
  table: string;
  aggregate: AppDataAggregate;
  column?: string;
  groupBy?: string;
  where?: Record<string, unknown>;
}

export interface QueryAppDataResult {
  results: Array<{
    table: string;
    aggregate: AppDataAggregate;
    column?: string;
    groupBy?: string;
    data: unknown;
  }>;
}

let _db: Database.Database | null = null;

export function initDatabase(dbPath: string = './forgeui.db'): Database.Database {
  if (_db) return _db;

  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS apps (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled',
      manifest TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_apps_updated ON apps(updated_at DESC);
  `);

  return _db;
}

export function getDatabase(): Database.Database {
  if (!_db) throw new Error('Database not initialized. Call initDatabase() first.');
  return _db;
}

export function closeDatabase(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

/**
 * Generate a short, URL-friendly app ID.
 * Format: 8 random hex chars (e.g., "a3f7b2c1").
 * 4 billion combinations — sufficient for personal/small-team use.
 */
export function generateAppId(): string {
  return randomBytes(4).toString('hex');
}

/** Create an app. Returns the stored app with generated ID. */
export function createApp(manifest: ForgeUIManifest): StoredApp {
  const db = getDatabase();
  const id = manifest.id || generateAppId();
  const title = manifest.meta?.title || id;

  db.prepare(`
    INSERT INTO apps (id, title, manifest, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `).run(id, title, JSON.stringify(manifest));

  return getApp(id)!;
}

/** Get an app by ID. Returns null if not found. */
export function getApp(id: string): StoredApp | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM apps WHERE id = ?').get(id) as any;
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    manifest: JSON.parse(row.manifest),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** List all apps, newest first. */
export function listApps(limit = 50, offset = 0): { apps: StoredApp[]; total: number } {
  const db = getDatabase();

  const total = (db.prepare('SELECT COUNT(*) as count FROM apps').get() as any).count;
  const rows = db.prepare(
    'SELECT * FROM apps ORDER BY updated_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset) as any[];

  return {
    apps: rows.map(row => ({
      id: row.id,
      title: row.title,
      manifest: JSON.parse(row.manifest),
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
    total,
  };
}

/** Update an app's manifest. Returns the updated app. */
export function updateApp(id: string, manifest: ForgeUIManifest): StoredApp | null {
  const db = getDatabase();
  const title = manifest.meta?.title || id;

  const result = db.prepare(`
    UPDATE apps SET manifest = ?, title = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(JSON.stringify(manifest), title, id);

  if (result.changes === 0) return null;
  return getApp(id);
}

/** Result of a transactional patch attempt. */
export type PatchResult =
  | { status: 'ok'; app: StoredApp }
  | { status: 'invalid'; errors: string[] }
  | { status: 'not-found' };

/** Apply a JSON Merge Patch to an existing app's manifest.
 *  Validates BEFORE writing — an invalid merged manifest never lands on disk.
 */
export function patchApp(
  id: string,
  patch: Partial<ForgeUIManifest>,
  validate: (m: ForgeUIManifest) => { valid: boolean; errors?: string[] },
): PatchResult {
  const existing = getApp(id);
  if (!existing) return { status: 'not-found' };

  const merged = mergePatch(existing.manifest, patch) as ForgeUIManifest;
  const v = validate(merged);
  if (!v.valid) return { status: 'invalid', errors: v.errors ?? ['validation failed'] };

  const written = updateApp(id, merged);
  if (!written) return { status: 'not-found' };
  return { status: 'ok', app: written };
}

/** Delete an app. Returns true if deleted. */
export function deleteApp(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM apps WHERE id = ?').run(id);
  return result.changes > 0;
}

const MAX_READ_ROWS = 100;
const DEFAULT_READ_ROWS = 20;
const MAX_QUERY_DISTINCT_VALUES = 100;

export function readAppData(id: string, options: ReadAppDataOptions = {}): ReadAppDataResult | null {
  const stored = getApp(id);
  if (!stored) return null;

  const manifest = stored.manifest;
  assertDataAccessEnabled(manifest);
  if (manifest.dataAccess?.summaries === true) {
    throw new Error('Raw data reads are disabled because this app allows summaries only.');
  }
  const tableNames = getPermittedTables(manifest, options.tables);
  const limit = boundLimit(options.limit);
  const data: ReadAppDataResult['data'] = {};
  const rowCounts: ReadAppDataResult['rowCounts'] = {};
  const returnedRows: ReadAppDataResult['returnedRows'] = {};

  for (const table of tableNames) {
    const rows = readManifestTableRows(manifest, table, options.since);
    rowCounts[table] = rows.length;
    data[table] = rows.slice(0, limit);
    returnedRows[table] = data[table].length;
  }

  return {
    schema: manifest.schema,
    data,
    rowCounts,
    returnedRows,
  };
}

export function queryAppData(id: string, queries: QueryAppDataRequest[]): QueryAppDataResult | null {
  const stored = getApp(id);
  if (!stored) return null;

  const manifest = stored.manifest;
  assertDataAccessEnabled(manifest);

  return {
    results: queries.map((query) => {
      assertTableReadable(manifest, query.table);
      validateQueryColumns(manifest, query);
      const rows = applyWhere(readManifestTableRows(manifest, query.table), query.where);
      return {
        table: query.table,
        aggregate: query.aggregate,
        column: query.column,
        groupBy: query.groupBy,
        data: aggregateRows(rows, query),
      };
    }),
  };
}

/** Simple deep merge for JSON Merge Patch (RFC 7396). */
function mergePatch(target: any, patch: any): any {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    return patch;
  }

  const result = { ...target };
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete result[key];
    } else {
      result[key] = mergePatch(result[key], value);
    }
  }
  return result;
}

function boundLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_READ_ROWS;
  return Math.max(1, Math.min(MAX_READ_ROWS, Math.floor(limit as number)));
}

function getPermittedTables(manifest: ForgeUIManifest, requested?: string[]): string[] {
  assertDataAccessEnabled(manifest);

  const readable = new Set(manifest.dataAccess?.readable ?? []);
  const restricted = new Set(manifest.dataAccess?.restricted ?? []);
  const schemaTables = Object.keys(manifest.schema?.tables ?? {});
  const schemaTableSet = new Set(schemaTables);
  const candidates = [...new Set(requested === undefined ? schemaTables.filter((table) => readable.has(table)) : requested)];
  const unknown = candidates.filter((table) => !schemaTableSet.has(table));
  if (unknown.length > 0) {
    throw new Error(`Unknown data table(s): ${unknown.join(', ')}`);
  }

  const permitted = candidates.filter((table) => readable.has(table) && !restricted.has(table));

  const denied = candidates.filter((table) => !permitted.includes(table));
  if (denied.length > 0) {
    throw new Error(`Data access denied for table(s): ${denied.join(', ')}`);
  }

  return permitted;
}

function getSchemaColumns(manifest: ForgeUIManifest, table: string): string[] {
  return Object.keys(manifest.schema?.tables?.[table]?.columns ?? {});
}

function validateQueryColumns(manifest: ForgeUIManifest, query: QueryAppDataRequest): void {
  const columns = new Set(getSchemaColumns(manifest, query.table));
  const unknown: string[] = [];
  if (query.column && !columns.has(query.column)) unknown.push(query.column);
  if (query.groupBy && !columns.has(query.groupBy)) unknown.push(query.groupBy);
  for (const key of Object.keys(query.where ?? {})) {
    if (!columns.has(key)) unknown.push(key);
  }
  if (unknown.length > 0) {
    throw new Error(`Unknown column(s) for table "${query.table}": ${[...new Set(unknown)].join(', ')}`);
  }
}

function assertDataAccessEnabled(manifest: ForgeUIManifest): void {
  if (manifest.dataAccess?.enabled !== true) {
    throw new Error('Data access is not enabled for this app.');
  }
}

function assertTableReadable(manifest: ForgeUIManifest, table: string): void {
  getPermittedTables(manifest, [table]);
}

function readManifestTableRows(
  manifest: ForgeUIManifest,
  table: string,
  since?: string,
): Array<Record<string, unknown>> {
  const sinceTime = parseSinceTime(since);
  const raw = manifest.state?.[table];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const columns = getSchemaColumns(manifest, table);

  const rows: Array<Record<string, unknown>> = [];
  for (const [rowId, row] of Object.entries(raw as Record<string, unknown>)) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const materialized: Record<string, unknown> = { id: rowId };
    const rawRow = row as Record<string, unknown>;
    for (const column of columns) {
      const value = rawRow[column];
      if (isReadableCellValue(value)) materialized[column] = value;
    }
    if (sinceTime !== undefined && !rowMatchesSince(materialized, sinceTime)) continue;
    rows.push(materialized);
  }
  return rows;
}

function isReadableCellValue(value: unknown): value is string | number | boolean | null {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function parseSinceTime(since: string | undefined): number | undefined {
  if (since === undefined) return undefined;
  const sinceTime = Date.parse(since);
  if (!Number.isFinite(sinceTime)) {
    throw new Error('Invalid since date. Use a Date.parse()-parseable date/time string.');
  }
  return sinceTime;
}

function rowMatchesSince(row: Record<string, unknown>, sinceTime: number): boolean {
  for (const key of ['created_at', 'createdAt', 'updated_at', 'updatedAt', 'date', 'timestamp']) {
    const value = row[key];
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    const rowTime = typeof value === 'number' ? value : Date.parse(value);
    if (Number.isFinite(rowTime)) return rowTime >= sinceTime;
  }
  return true;
}

function applyWhere(
  rows: Array<Record<string, unknown>>,
  where?: Record<string, unknown>,
): Array<Record<string, unknown>> {
  if (!where || Object.keys(where).length === 0) return rows;
  return rows.filter((row) =>
    Object.entries(where).every(([key, expected]) => row[key] === expected)
  );
}

function aggregateRows(rows: Array<Record<string, unknown>>, query: QueryAppDataRequest): unknown {
  if (query.groupBy) {
    const groups = new Map<unknown, Array<Record<string, unknown>>>();
    for (const row of rows) {
      const key = row[query.groupBy];
      const group = groups.get(key);
      if (group) {
        group.push(row);
      } else {
        groups.set(key, [row]);
      }
    }
    const data: Record<string, unknown> = {};
    for (const [key, groupRows] of groups) {
      data[serializeGroupKey(key)] = aggregateRows(groupRows, { ...query, groupBy: undefined });
    }
    return data;
  }

  switch (query.aggregate) {
    case 'count':
      return rows.length;
    case 'distinct': {
      if (!query.column) throw new Error('distinct aggregate requires a column.');
      const values = Array.from(new Set(rows.map((row) => row[query.column!]).filter((value) => value !== undefined)));
      return { values: values.slice(0, MAX_QUERY_DISTINCT_VALUES), count: values.length };
    }
    case 'sum':
    case 'avg':
    case 'min':
    case 'max': {
      if (!query.column) throw new Error(`${query.aggregate} aggregate requires a column.`);
      const values = rows.map((row) => row[query.column!]).filter((value): value is number => typeof value === 'number');
      if (query.aggregate === 'sum') return values.reduce((sum, value) => sum + value, 0);
      if (query.aggregate === 'avg') return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
      if (query.aggregate === 'min') return values.length ? values.reduce((min, value) => Math.min(min, value)) : null;
      return values.length ? values.reduce((max, value) => Math.max(max, value)) : null;
    }
    default:
      throw new Error(`Unsupported aggregate: ${String((query as { aggregate?: unknown }).aggregate)}`);
  }
}

function serializeGroupKey(value: unknown): string {
  if (typeof value === 'string') {
    return /^(string|number|boolean):|^(null|\(missing\))$/.test(value) ? `string:${value}` : value;
  }
  if (value === undefined) return '(missing)';
  if (value === null) return 'null';
  return `${typeof value}:${String(value)}`;
}
