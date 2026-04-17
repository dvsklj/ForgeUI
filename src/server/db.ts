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

let _db: Database.Database | null = null;

export function initDatabase(dbPath: string = './forge.db'): Database.Database {
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
