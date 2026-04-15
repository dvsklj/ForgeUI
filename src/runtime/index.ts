/**
 * ForgeApp — The core web component entry point
 * 
 * <forge-app manifest='...' surface='chat|standalone|embed' color-scheme='light|dark'></forge-app>
 * 
 * Creates a TinyBase store, validates the manifest, and renders the element tree.
 */

import { LitElement, html, PropertyValues, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Store, createStore } from 'tinybase';
import type { ForgeManifest, SurfaceMode } from '../types/index.js';
import { createForgeStore, executeAction } from '../state/index.js';
import { validateManifest, ValidationResult } from '../validation/index.js';
import { renderManifest, RenderContext } from '../renderer/index.js';
import { tokenStyles, surfaceStyles } from '../tokens/index.js';
import { catalogPrompt, catalogToJsonSchema } from '../catalog/registry.js';

// Import all components to register them
import '../components/index.js';

@customElement('forge-app')
export class ForgeApp extends LitElement {
  static styles = [tokenStyles, surfaceStyles];

  /** Manifest as a JS object */
  @property({ type: Object })
  manifest?: ForgeManifest;

  /** Manifest as a JSON string (alternative to object) */
  @property({ type: String })
  src?: string;

  /** Surface mode: chat, standalone, or embed */
  @property({ type: String, reflect: true })
  surface: SurfaceMode = 'standalone';

  /** Color scheme override: light or dark. Auto-detects if unset. */
  @property({ type: String, reflect: true })
  colorScheme?: 'light' | 'dark';

  /** Active view state (for navigation) */
  @state()
  private _activeView = '';

  /** TinyBase store */
  private _store?: Store;

  /** Validation result */
  @state()
  private _validation?: ValidationResult;

  /** Parsed manifest */
  private _parsedManifest?: ForgeManifest;

  connectedCallback() {
    super.connectedCallback();
    this._initManifest();
  }

  updated(changed: PropertyValues) {
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
          errors: [{ path: '/', message: `Invalid JSON: ${(e as Error).message}`, severity: 'error' }],
        };
        return;
      }
    }

    if (!manifest) return;

    // Validate
    const result = validateManifest(manifest);
    this._validation = result;

    if (!result.valid) {
      console.error('[Forge] Manifest validation failed:', result.errors);
      this.dispatchEvent(new CustomEvent('forge-error', {
        detail: { errors: result.errors },
        bubbles: true,
        composed: true,
      }));
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
        ${errors.map(e => html`
          <div style="font-size:var(--forge-text-sm);color:var(--forge-color-text-secondary);margin-bottom:var(--forge-space-2xs)">
            <code>${e.path}</code>: ${e.message}
          </div>
        `)}
      </div>
    `;
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
      
      case 'openDialog': {
        // TODO: implement dialog management
        break;
      }
      
      case 'closeDialog': {
        // TODO: implement dialog management
        break;
      }
      
      case 'toast': {
        // TODO: implement toast system
        break;
      }
      
      case 'callApi': {
        // Ring 2+ feature
        console.warn('[Forge] callApi requires Forge Server (Ring 2+)');
        break;
      }
      
      default: {
        // Dispatch as custom event for external handling
        this.dispatchEvent(new CustomEvent('forge-action', {
          detail: { action: actionId, payload, definition: action },
          bubbles: true,
          composed: true,
        }));
      }
    }
  }

  // ─── Public API ──────────────────────────────────────────────

  /** Get the TinyBase store (for external manipulation) */
  getStore(): Store | undefined {
    return this._store;
  }

  /** Get the manifest */
  getManifest(): ForgeManifest | undefined {
    return this._parsedManifest;
  }

  /** Get validation results */
  getValidation(): ValidationResult | undefined {
    return this._validation;
  }

  /** Programmatically trigger an action */
  dispatchAction(actionId: string, payload?: Record<string, unknown>) {
    this._handleAction(actionId, payload);
  }

  // ─── Static API ──────────────────────────────────────────────

  /** Get the LLM system prompt for the component catalog */
  static catalogPrompt(): string {
    return catalogPrompt();
  }

  /** Get the JSON Schema for LLM structured output */
  static catalogJsonSchema(): object {
    return catalogToJsonSchema();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'forge-app': ForgeApp;
  }
}
