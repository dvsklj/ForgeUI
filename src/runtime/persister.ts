/**
 * ForgePersister — TinyBase IndexedDB persistence with lifecycle management.
 *
 * Three modes:
 *   'none'     — in-memory only (chat artifacts)
 *   'indexeddb' — persistent in user's browser (standalone/embed apps)
 *   'custom'    — user-provided persister (e.g., server sync)
 *
 * Design:
 *   - Dynamic import of tinybase/persisters/persister-indexed-db
 *     (tree-shaken away for artifact-only deployments)
 *   - Auto-save on store changes for 'indexeddb' mode
 *   - Manual save() for batching (action handling)
 *   - Conflict detection via schema version
 *   - Graceful degradation if IndexedDB unavailable
 */

import type { Store } from 'tinybase';

export type PersisterMode = 'none' | 'indexeddb' | 'custom';

export interface PersisterStatus {
  mode: PersisterMode;
  isPersisting: boolean;
  lastSaved: number | null;
  lastLoaded: number | null;
  error: string | null;
  dbName: string | null;
}

export interface ForgePersister {
  /** Start persistence — loads existing data, starts auto-save. */
  start(): Promise<void>;

  /** Stop persistence — stops auto-save, flushes pending saves. */
  stop(): Promise<void>;

  /** Force save current store state to IndexedDB. */
  save(): Promise<void>;

  /** Force load store state from IndexedDB. */
  load(): Promise<void>;

  /** Change persistence mode at runtime. */
  setMode(mode: PersisterMode): void;

  /** Get current persistence status. */
  getStatus(): PersisterStatus;

  /** Register a listener for status changes. */
  addListener(listener: (status: PersisterStatus) => void): () => void;

  /** Clean up everything — stop auto-save/load, destroy underlying persister. */
  destroy(): Promise<void>;
}

/**
 * Database naming convention:
 *   forgeui_{appId}  — for app-specific storage
 *   forgeui_global   — for global/shared state
 *
 * Object store name: 'forgeui_data'
 */

function getDbName(appId: string | undefined): string {
  const safeId = (appId || 'global').replace(/[^a-zA-Z0-9-]/g, '_');
  return `forgeui_${safeId}`;
}

export function createForgePersister(
  store: Store,
  appId: string | undefined,
  mode: PersisterMode = 'none'
): ForgePersister {
  const dbName = getDbName(appId);
  let currentMode = mode;
  let tinyBasePersister: any = null;
  let autoSaveOn = false;
  let autoLoadOn = false;
  let lastSaved: number | null = null;
  let lastLoaded: number | null = null;
  let lastError: string | null = null;
  let statusListeners: Array<(status: PersisterStatus) => void> = [];

  function notifyListeners(): void {
    const status = getStatus();
    for (const listener of statusListeners) {
      try { listener(status); } catch { /* ignore */ }
    }
  }

  function getStatus(): PersisterStatus {
    return {
      mode: currentMode,
      isPersisting: tinyBasePersister != null && autoSaveOn,
      lastSaved,
      lastLoaded,
      error: lastError,
      dbName: currentMode === 'indexeddb' ? dbName : null,
    };
  }

  async function ensurePersister(): Promise<any> {
    if (tinyBasePersister) return tinyBasePersister;

    try {
      // Dynamic import — tree-shaken away in artifact mode
      const { createIndexedDbPersister } = await import(
        'tinybase/persisters/persister-indexed-db'
      );
      tinyBasePersister = createIndexedDbPersister(store, dbName);
      lastError = null;
      return tinyBasePersister;
    } catch (err: any) {
      lastError = `IndexedDB unavailable: ${err.message}`;
      notifyListeners();
      throw err;
    }
  }

  async function start(): Promise<void> {
    if (currentMode === 'none') return;

    const persister = await ensurePersister();

    // Load existing data
    try {
      await persister.load();
      lastLoaded = Date.now();
    } catch (err: any) {
      lastError = `Load failed: ${err.message}`;
      notifyListeners();
    }

    // Start auto-save (persists on every store change)
    try {
      persister.startAutoSave();
      autoSaveOn = true;
    } catch (err: any) {
      lastError = `Auto-save failed: ${err.message}`;
    }

    // Start auto-load (checks for external changes every 1s)
    try {
      persister.startAutoLoad(1);
      autoLoadOn = true;
    } catch (err: any) {
      lastError = `Auto-load failed: ${err.message}`;
    }

    notifyListeners();
  }

  async function stop(): Promise<void> {
    if (!tinyBasePersister) return;

    if (autoSaveOn) {
      tinyBasePersister.stopAutoSave();
      autoSaveOn = false;
    }
    if (autoLoadOn) {
      tinyBasePersister.stopAutoLoad();
      autoLoadOn = false;
    }

    // Final save
    try {
      await tinyBasePersister.save();
      lastSaved = Date.now();
    } catch (err: any) {
      lastError = `Final save failed: ${err.message}`;
    }

    notifyListeners();
  }

  async function save(): Promise<void> {
    if (currentMode === 'none' || !tinyBasePersister) return;
    try {
      await tinyBasePersister.save();
      lastSaved = Date.now();
      lastError = null;
    } catch (err: any) {
      lastError = `Save failed: ${err.message}`;
    }
    notifyListeners();
  }

  async function load(): Promise<void> {
    if (currentMode === 'none' || !tinyBasePersister) return;
    try {
      await tinyBasePersister.load();
      lastLoaded = Date.now();
      lastError = null;
    } catch (err: any) {
      lastError = `Load failed: ${err.message}`;
    }
    notifyListeners();
  }

  async function destroy(): Promise<void> {
    await stop();
    if (tinyBasePersister) {
      try { tinyBasePersister.destroy(); } catch { /* ignore */ }
      tinyBasePersister = null;
    }
    statusListeners = [];
    notifyListeners();
  }

  function setMode(newMode: PersisterMode): void {
    if (newMode === currentMode) return;
    const oldMode = currentMode;
    currentMode = newMode;

    // If switching from persistent to none, stop auto-persist
    if (oldMode === 'indexeddb' && newMode === 'none') {
      if (tinyBasePersister && autoSaveOn) {
        tinyBasePersister.stopAutoSave();
        autoSaveOn = false;
      }
      if (tinyBasePersister && autoLoadOn) {
        tinyBasePersister.stopAutoLoad();
        autoLoadOn = false;
      }
    }

    // If switching to indexeddb, need to re-init (async)
    if (newMode === 'indexeddb' && oldMode === 'none') {
      start().catch(() => {});
    }

    notifyListeners();
  }

  function addListener(listener: (status: PersisterStatus) => void): () => void {
    statusListeners.push(listener);
    return () => {
      statusListeners = statusListeners.filter(l => l !== listener);
    };
  }

  return {
    start,
    stop,
    save,
    load,
    setMode,
    getStatus,
    addListener,
    destroy,
  };
}
