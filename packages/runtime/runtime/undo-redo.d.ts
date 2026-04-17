/**
 * Forge Undo/Redo Stack
 *
 * Stores manifest snapshots for undo/redo during conversational iteration.
 * The LLM patches the manifest → user sees update → can undo if unwanted.
 *
 * Design:
 *   - Stores full manifest snapshots (simple, reliable, no merge complexity)
 *   - Configurable depth (default: 50)
 *   - Memory-efficient: only stores unique states
 *   - Integrates with ForgeApp.setManifest()
 *
 * Usage:
 *   const stack = new UndoRedoStack(50);
 *   stack.push(manifestV1);
 *   stack.push(manifestV2);
 *   stack.undo();  // returns manifestV1
 *   stack.redo();  // returns manifestV2
 */
import type { ForgeManifest } from '../types/index.js';
export interface UndoRedoState {
    /** Can undo? */
    canUndo: boolean;
    /** Can redo? */
    canRedo: boolean;
    /** Current position in stack */
    position: number;
    /** Total entries */
    total: number;
}
export declare class UndoRedoStack {
    private _stack;
    private _position;
    private _maxDepth;
    private _listeners;
    constructor(maxDepth?: number);
    /** Push a new manifest onto the stack. Clears any redo history. */
    push(manifest: ForgeManifest): void;
    /** Undo: return previous manifest, or null if at the beginning. */
    undo(): ForgeManifest | null;
    /** Redo: return next manifest, or null if at the end. */
    redo(): ForgeManifest | null;
    /** Get the current manifest without navigating. */
    current(): ForgeManifest | null;
    /** Jump to a specific position. */
    jumpTo(position: number): ForgeManifest | null;
    /** Get current state. */
    getState(): UndoRedoState;
    /** Get all snapshots (for timeline UI). */
    getTimeline(): Array<{
        position: number;
        id: string;
        timestamp?: number;
    }>;
    /** Clear the stack. */
    clear(): void;
    /** Register a listener for state changes. Returns unsubscribe function. */
    addListener(listener: (state: UndoRedoState) => void): () => void;
    private _notifyListeners;
}
//# sourceMappingURL=undo-redo.d.ts.map