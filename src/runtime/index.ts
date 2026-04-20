/**
 * ForgeApp — The core web component entry point
 * 
 * <forge-app manifest='...' surface='chat|standalone|embed' color-scheme='light|dark'></forge-app>
 * 
 * Creates a TinyBase store, validates the manifest, and renders the element tree.
 */

import { LitElement, html } from 'lit';
import { Store } from 'tinybase';
import type { ForgeManifest, SurfaceMode } from '../types/index.js';
import { createForgeStore, executeAction, resolveTemplate, resolveValue, snapshotState, restoreSnapshot } from '../state/index.js';
import { validateManifest, ValidationResult } from '../validation/index.js';
import { renderManifest, RenderContext } from '../renderer/index.js';
import { tokenStyles, surfaceStyles } from '../tokens/index.js';
import { catalogPrompt, catalogToJsonSchema } from '../catalog/registry.js';
import { ingestPayload } from '../a2ui/index.js';
import { createForgePersister, type ForgePersister, type PersisterStatus, type PersisterMode } from './persister.js';
import { UndoRedoStack, type UndoRedoState } from './undo-redo.js';

// Import all components to register them
import '../components/index.js';

export class ForgeApp extends LitElement {
  static styles = [tokenStyles, surfaceStyles];

  static get properties() {
    return {
      manifest: { type: Object },
      src: { type: String },
      surface: { type: String, reflect: true },
      colorScheme: { type: String, reflect: true },
    };
  }

  declare manifest?: ForgeManifest;
  declare src?: string;
  declare surface: SurfaceMode;
  declare colorScheme?: 'light' | 'dark';

  private _activeView = '';
  private _store?: Store;
  private _validation?: ValidationResult;
  private _parsedManifest?: ForgeManifest;
  private _persister: ForgePersister | null = null;
  private _undoStack: UndoRedoStack = new UndoRedoStack(50);

  constructor() {
    super();
    this.surface = 'standalone';
  }

  connectedCallback() {
    super.connectedCallback();
    this._readInlineManifest();
    // Also handle case where manifest was set as a string HTML attribute
    // (LitElement reflects attributes to properties but doesn't parse JSON)
    if (!this.manifest && this.hasAttribute('manifest')) {
      const attr = this.getAttribute('manifest');
      if (attr) {
        try {
          this.manifest = JSON.parse(attr);
        } catch (e) {
          console.error('[Forge] Failed to parse manifest attribute:', e);
        }
      }
    }
    this._initManifest();
  }

  /**
   * attributeChangedCallback fires when HTML attributes change.
   * We use it to handle manifest changes after initial load.
   */
  attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value);
    if (name === 'manifest' && old !== value && value !== null) {
      // Attribute was updated — parse and re-init
      try {
        const parsed = JSON.parse(value);
        this.manifest = parsed;
        this._initManifest();
      } catch (e) {
        console.error('[Forge] Failed to parse manifest attribute:', e);
      }
    }
    if (name === 'src' && old !== value) {
      this._initManifest();
    }
  }

  async disconnectedCallback(): Promise<void> {
    super.disconnectedCallback();
    if (this._persister) {
      await this._persister.destroy();
      this._persister = null;
    }
  }

  /** Read manifest from an inline <script type="application/json"> child */
  private _readInlineManifest() {
    if (this.manifest) return;
    const script = this.querySelector('script[type="application/json"]');
    if (script?.textContent) {
      try {
        this.manifest = JSON.parse(script.textContent);
      } catch (e) {
        console.error('[Forge] Failed to parse inline manifest JSON:', e);
      }
    }
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('manifest') || changed.has('src')) {
      this._initManifest();
    }
  }

  private _initManifest() {
    let manifest = this.manifest;

    // Parse from string if provided (fallback for edge cases)
    if (!manifest) return;
    if (typeof manifest === 'string') {
      try {
        manifest = JSON.parse(manifest);
        this.manifest = manifest;
      } catch (e) {
        this._validation = {
          valid: false,
          errors: [{ path: '/', message: `Invalid JSON: ${(e as Error).message}`, severity: 'error' }],
        };
        return;
      }
    }

    // Auto-detect A2UI payloads and convert to Forge manifest
    manifest = ingestPayload(manifest);

    // Validate
    const result = validateManifest(manifest);
    this._validation = result;

    if (!result.valid) {
      console.error('[Forge] Manifest validation failed:', JSON.stringify(result.errors, null, 2));
      // Still try to render — show errors inline
    }

    this._parsedManifest = manifest;

    // Create store
    this._store = createForgeStore({
      schema: manifest.schema,
      initialState: manifest.state,
    });

    // Set initial active view from root
    this._activeView = manifest.root;

    // Setup persistence (async, non-blocking)
    this._setupPersistence(manifest);

    // Push initial state to undo stack
    this._undoStack.push(manifest);

    // Signal ready
    this.dispatchEvent(new CustomEvent('forge-ready', {
      detail: { appId: manifest.id },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    if (!this._parsedManifest || !this._store) {
      if (this._validation && !this._validation.valid) {
        return this._renderErrors();
      }
      return html`<div style="padding:1rem;color:var(--forge-color-text-secondary)">Loading...</div>`;
    }

    const ctx: RenderContext = {
      manifest: this._parsedManifest,
      store: this._store,
      activeView: this._activeView,
      onAction: this._handleAction.bind(this),
    };

    return renderManifest(ctx);
  }

  private _renderErrors() {
    const errors = this._validation?.errors || [];
    return html`
      <div style="padding:var(--forge-space-md);font-family:var(--forge-font-family)">
        <div style="color:var(--forge-color-error);font-weight:var(--forge-weight-semibold);margin-bottom:var(--forge-space-sm)">
          Manifest Validation Errors
        </div>
        ${errors.map((e: any) => html`
          <div style="font-size:var(--forge-text-sm);color:var(--forge-color-text-secondary);margin-bottom:var(--forge-space-2xs)">
            <code>${e.path}</code>: ${e.message}
          </div>
        `)}
      </div>
    `;
  }

  /** ─── Persistence ──────────────────────────────────────────── */

  private async _setupPersistence(manifest: ForgeManifest) {
    if (!this._store) return;

    // Destroy previous persister if any
    if (this._persister) {
      await this._persister.destroy();
      this._persister = null;
    }

    // Determine mode
    let mode: PersisterMode;
    const surface = this.surface;

    if ((manifest as any).persistState === true) {
      mode = 'indexeddb';
    } else if ((manifest as any).skipPersistState === true) {
      mode = 'none';
    } else {
      // Auto-detect: persistent for standalone/embed, none for chat
      mode = (surface === 'standalone' || surface === 'embed') ? 'indexeddb' : 'none';
    }

    if (mode === 'none') return;

    // Create and start persister
    this._persister = createForgePersister(this._store, manifest.id, mode);
    try {
      await this._persister.start();
    } catch {
      // IndexedDB unavailable — app still works in-memory
      this._persister = null;
    }
  }

  /** Get persistence status. */
  getPersistenceStatus(): PersisterStatus | null {
    return this._persister?.getStatus() ?? null;
  }

  private _handleAction(actionId: string, payload?: Record<string, unknown>) {
    const manifest = this._parsedManifest;
    if (!manifest?.actions || !this._store) return;

    const action = manifest.actions[actionId];
    if (!action) {
      console.warn(`[Forge] Unknown action: ${actionId}`);
      return;
    }

    switch (action.type) {
      case 'mutateState': {
        // Snapshot before mutation (for undo)
        const before = snapshotState(this._store);

        // Handle shorthand "set": { key: value } format
        if (action.set && typeof action.set === 'object') {
          for (const [key, val] of Object.entries(action.set as Record<string, unknown>)) {
            const resolvedValue = resolveValue(this._store, val, payload as Record<string, unknown>);
            executeAction(this._store, {
              type: action.type,
              path: key,
              operation: 'set',
              value: resolvedValue,
            });
          }
        } else {
          // Resolve templates in path, key, and value
          const resolvedPath = action.path
            ? resolveTemplate(this._store, action.path, payload as Record<string, unknown>)
            : undefined;

          const resolvedKey = action.key
            ? resolveTemplate(this._store, action.key, payload as Record<string, unknown>)
            : undefined;

          // Resolve templates recursively in action value
          const resolvedValue = action.value !== undefined
            ? resolveValue(this._store, action.value, payload as Record<string, unknown>)
            : (payload !== undefined
              ? resolveValue(this._store, payload, undefined)
              : undefined);

          executeAction(this._store, {
            type: action.type,
            path: resolvedPath,
            operation: action.operation,
            key: resolvedKey,
            value: resolvedValue,
          });
        }

        // Push to undo stack after mutation
        const after = snapshotState(this._store);
        this._undoStack.push(after);

        this.requestUpdate();
        break;
      }

      case 'navigate': {
        if (action.target) {
          this._activeView = resolveTemplate(this._store, action.target, payload as Record<string, unknown>);
          this.requestUpdate();
        }
        break;
      }

      case 'callApi': {
        console.warn('[Forge] callApi requires Forge Server (Ring 2+)');
        break;
      }

      default: {
        this.dispatchEvent(new CustomEvent('forge-action', {
          detail: { action: actionId, payload, definition: action },
          bubbles: true,
          composed: true,
        }));
      }
    }
  }

  // ─── Public API ──────────────────────────────────────────────

  getStore(): Store | undefined {
    return this._store;
  }

  getManifest(): ForgeManifest | undefined {
    return this._parsedManifest;
  }

  getValidation(): ValidationResult | undefined {
    return this._validation;
  }

  dispatchAction(actionId: string, payload?: Record<string, unknown>) {
    this._handleAction(actionId, payload);
  }

  /** Push a manifest update to the undo stack (for LLM-driven updates). */
  pushManifestUpdate(manifest: ForgeManifest): void {
    this._undoStack.push(manifest);
  }

  /** Undo the last state mutation. Returns the restored state, or null. */
  undo(): Record<string, unknown> | null {
    if (!this._store) return null;
    const prev = this._undoStack.undo();
    if (prev) {
      restoreSnapshot(this._store, prev);
      this.requestUpdate();
    }
    return prev;
  }

  /** Redo an undone state mutation. Returns the restored state, or null. */
  redo(): Record<string, unknown> | null {
    if (!this._store) return null;
    const next = this._undoStack.redo();
    if (next) {
      restoreSnapshot(this._store, next);
      this.requestUpdate();
    }
    return next;
  }

  /** Get undo/redo state. */
  getUndoRedoState(): UndoRedoState {
    return this._undoStack.getState();
  }

  static catalogPrompt(tier?: 'minimal' | 'default' | 'full'): string {
    return catalogPrompt(tier);
  }

  static catalogJsonSchema(): object {
    return catalogToJsonSchema();
  }
}

customElements.define('forge-app', ForgeApp);

declare global {
  interface HTMLElementTagNameMap {
    'forge-app': ForgeApp;
  }
}
