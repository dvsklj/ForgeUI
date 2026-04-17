/**
 * ForgeUIApp — The core web component entry point
 * 
 * <forgeui-app manifest='...' surface='chat|standalone|embed' color-scheme='light|dark'></forgeui-app>
 * 
 * Creates a TinyBase store, validates the manifest, and renders the element tree.
 */

import { LitElement, html } from 'lit';
import { Store } from 'tinybase';
import type { ForgeUIManifest, SurfaceMode } from '../types/index.js';
import { createForgeUIStore, executeAction } from '../state/index.js';
import { validateManifest, ValidationResult } from '../validation/index.js';
import { renderManifest, RenderContext } from '../renderer/index.js';
import { tokenStyles, surfaceStyles } from '../tokens/index.js';
import { catalogPrompt, catalogToJsonSchema } from '../catalog/prompt.js';
import { ingestPayload } from '../a2ui/index.js';
import { createForgePersister, type ForgePersister, type PersisterStatus, type PersisterMode } from './persister.js';
import { UndoRedoStack, type UndoRedoState } from './undo-redo.js';

// Import all components to register them
import '../components/index.js';

export class ForgeUIApp extends LitElement {
  static styles = [tokenStyles, surfaceStyles];

  static get properties() {
    return {
      manifest: { type: Object },
      src: { type: String },
      surface: { type: String, reflect: true },
      colorScheme: { type: String, reflect: true },
    };
  }

  declare manifest?: ForgeUIManifest;
  declare src?: string;
  declare surface: SurfaceMode;
  declare colorScheme?: 'light' | 'dark';

  private _activeView = '';
  private _store?: Store;
  private _validation?: ValidationResult;
  private _parsedManifest?: ForgeUIManifest;
  private _persister: ForgePersister | null = null;
  private _undoStack: UndoRedoStack = new UndoRedoStack(50);

  constructor() {
    super();
    this.surface = 'standalone';
  }

  connectedCallback() {
    super.connectedCallback();
    this._readInlineManifest();
    this._initManifest();
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

    // Parse from string if provided
    if (!manifest && this.src) {
      try {
        manifest = JSON.parse(this.src);
      } catch (e) {
        this._validation = {
          valid: false,
          errors: [{ path: '/', message: `Invalid JSON: ${(e as Error).message}`, severity: 'error' as const }],
          warnings: [],
        };
        return;
      }
    }

    if (!manifest) return;

    // Auto-detect A2UI payloads and convert to Forge manifest
    manifest = ingestPayload(manifest);

    // Validate
    const result = validateManifest(manifest);
    this._validation = result;

    if (!result.valid) {
      console.error('[Forge] Manifest validation failed:', result.errors);
      // Still try to render — show errors inline
    }

    this._parsedManifest = manifest;

    // Create store
    this._store = createForgeUIStore({
      schema: manifest.schema,
      initialState: manifest.state,
    });

    // Set initial active view from root
    this._activeView = manifest.root;

    // Setup persistence — re-renders when IndexedDB load completes (or on failure)
    this._setupPersistence(manifest)
      .then(() => this.requestUpdate())
      .catch((err) => {
        console.warn('[forge] persister setup failed:', err);
        this.requestUpdate();
      });

    // Push initial state to undo stack
    this._undoStack.push(manifest);

    // Signal ready
    this.dispatchEvent(new CustomEvent('forgeui-ready', {
      detail: { appId: manifest.id },
      bubbles: true,
      composed: true,
    }));

    // _initManifest() runs in both connectedCallback and updated(); in the
    // latter case Lit has already completed its render pass before we set
    // _parsedManifest/_store, so nothing would re-render without an explicit
    // request. This makes `app.manifest = obj` after connection work reliably.
    this.requestUpdate();
  }

  render() {
    if (!this._parsedManifest || !this._store) {
      if (this._validation && !this._validation.valid) {
        return this._renderErrors();
      }
      return html`<div style="padding:1rem;color:var(--forgeui-color-text-secondary)">Loading...</div>`;
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
      <div style="padding:var(--forgeui-space-md);font-family:var(--forgeui-font-family)">
        <div style="color:var(--forgeui-color-error);font-weight:var(--forgeui-weight-semibold);margin-bottom:var(--forgeui-space-sm)">
          Manifest Validation Errors
        </div>
        ${errors.map((e: any) => html`
          <div style="font-size:var(--forgeui-text-sm);color:var(--forgeui-color-text-secondary);margin-bottom:var(--forgeui-space-2xs)">
            <code>${e.path}</code>: ${e.message}
          </div>
        `)}
      </div>
    `;
  }

  /** ─── Persistence ──────────────────────────────────────────── */

  private async _setupPersistence(manifest: ForgeUIManifest) {
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
        const key = action.key?.replace('{{id}}', String(payload?.id || ''));
        executeAction(this._store, {
          type: action.type,
          path: action.path,
          operation: action.operation,
          key,
          value: action.value ?? payload,
        });
        this.requestUpdate();
        break;
      }
      
      case 'navigate': {
        if (action.target) {
          this._activeView = action.target;
          this.requestUpdate();
        }
        break;
      }
      
      case 'callApi': {
        console.warn('[Forge] callApi requires Forge Server (Ring 2+)');
        break;
      }
      
      default: {
        this.dispatchEvent(new CustomEvent('forgeui-action', {
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

  getManifest(): ForgeUIManifest | undefined {
    return this._parsedManifest;
  }

  getValidation(): ValidationResult | undefined {
    return this._validation;
  }

  dispatchAction(actionId: string, payload?: Record<string, unknown>) {
    this._handleAction(actionId, payload);
  }

  /** Push a manifest update to the undo stack (for LLM-driven updates). */
  pushManifestUpdate(manifest: ForgeUIManifest): void {
    this._undoStack.push(manifest);
  }

  /** Undo the last manifest change. Returns the restored manifest, or null. */
  undo(): ForgeUIManifest | null {
    const prev = this._undoStack.undo();
    if (prev) {
      this.manifest = prev;
      this.requestUpdate();
    }
    return prev;
  }

  /** Redo an undone manifest change. Returns the restored manifest, or null. */
  redo(): ForgeUIManifest | null {
    const next = this._undoStack.redo();
    if (next) {
      this.manifest = next;
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

customElements.define('forgeui-app', ForgeUIApp);

declare global {
  interface HTMLElementTagNameMap {
    'forgeui-app': ForgeUIApp;
  }
}
