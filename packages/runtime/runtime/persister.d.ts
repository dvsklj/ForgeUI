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
export declare function createForgePersister(store: Store, appId: string | undefined, mode?: PersisterMode): ForgePersister;
//# sourceMappingURL=persister.d.ts.map