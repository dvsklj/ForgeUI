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

export class UndoRedoStack {
  private _stack: ForgeManifest[] = [];
  private _position = -1; // current position (-1 = empty)
  private _maxDepth: number;
  private _listeners: Array<(state: UndoRedoState) => void> = [];

  constructor(maxDepth = 50) {
    this._maxDepth = maxDepth;
  }

  /** Push a new manifest onto the stack. Clears any redo history. */
  push(manifest: ForgeManifest): void {
    // If we're not at the top, truncate future states
    if (this._position < this._stack.length - 1) {
      this._stack = this._stack.slice(0, this._position + 1);
    }

    // Dedup: don't push if identical to current
    if (this._position >= 0) {
      const current = this._stack[this._position];
      if (JSON.stringify(current) === JSON.stringify(manifest)) {
        return;
      }
    }

    // Push snapshot
    this._stack.push(structuredClone(manifest));

    // Enforce depth limit
    if (this._stack.length > this._maxDepth) {
      this._stack.shift();
    } else {
      this._position++;
    }

    this._notifyListeners();
  }

  /** Undo: return previous manifest, or null if at the beginning. */
  undo(): ForgeManifest | null {
    if (this._position <= 0) return null;
    this._position--;
    this._notifyListeners();
    return structuredClone(this._stack[this._position]);
  }

  /** Redo: return next manifest, or null if at the end. */
  redo(): ForgeManifest | null {
    if (this._position >= this._stack.length - 1) return null;
    this._position++;
    this._notifyListeners();
    return structuredClone(this._stack[this._position]);
  }

  /** Get the current manifest without navigating. */
  current(): ForgeManifest | null {
    if (this._position < 0) return null;
    return structuredClone(this._stack[this._position]);
  }

  /** Jump to a specific position. */
  jumpTo(position: number): ForgeManifest | null {
    if (position < 0 || position >= this._stack.length) return null;
    this._position = position;
    this._notifyListeners();
    return structuredClone(this._stack[this._position]);
  }

  /** Get current state. */
  getState(): UndoRedoState {
    return {
      canUndo: this._position > 0,
      canRedo: this._position < this._stack.length - 1,
      position: this._position,
      total: this._stack.length,
    };
  }

  /** Get all snapshots (for timeline UI). */
  getTimeline(): Array<{ position: number; id: string; timestamp?: number }> {
    return this._stack.map((m, i) => ({
      position: i,
      id: m.id,
    }));
  }

  /** Clear the stack. */
  clear(): void {
    this._stack = [];
    this._position = -1;
    this._notifyListeners();
  }

  /** Register a listener for state changes. Returns unsubscribe function. */
  addListener(listener: (state: UndoRedoState) => void): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  private _notifyListeners(): void {
    const state = this.getState();
    for (const listener of this._listeners) {
      try { listener(state); } catch { /* ignore */ }
    }
  }
}
