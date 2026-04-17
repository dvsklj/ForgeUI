/**
 * ForgeUIElement — Base class for all Forge components
 * 
 * Provides state binding resolution, action dispatching,
 * and common styles. No decorators — uses Lit's static properties API.
 */

import { LitElement } from 'lit';
import type { CSSResult } from 'lit';
import type { Store } from 'tinybase';
import { resolveRef, setItemContext } from '../state/index.js';
import { resetStyles } from '../tokens/index.js';

export class ForgeUIElement extends LitElement {
  // ─── Instance ID (stable per component instance) ───────────

  /** Monotonic counter for generating unique instance IDs */
  static _instanceCounter = 0;
  /** Stable unique ID for this component instance — used for label linkage */
  protected readonly _instanceId: string = `forge-${++(ForgeUIElement as any)._instanceCounter}`;

  // ─── Properties (set by renderer) ────────────────────────────

  /** Resolved component props from the manifest */
  props: Record<string, unknown> = {};

  /** TinyBase store instance */
  store: Store | null = null;

  /** Action callback */
  onAction: ((actionId: string, payload?: Record<string, unknown>) => void) | null = null;

  /** Current repeater item context */
  itemContext: Record<string, unknown> | null = null;

  // ─── Lifecycle ───────────────────────────────────────────────

  static get properties() {
    return {
      props: { type: Object },
    };
  }

  connectedCallback() {
    super.connectedCallback();
  }

  // ─── State helpers ───────────────────────────────────────────

  /** Resolve a reference ($state:, $computed:, $item:) to its value */
  protected resolve(value: unknown): unknown {
    if (!this.store) return value;
    if (this.itemContext) {
      setItemContext(this.itemContext);
    }
    try {
      return resolveRef(this.store, value);
    } finally {
      setItemContext(null);
    }
  }

  /** Get a prop value, resolving any references */
  protected getProp(key: string): unknown {
    const value = this.props?.[key];
    if (typeof value === 'string' && (
      value.startsWith('$state:') ||
      value.startsWith('$computed:') ||
      value.startsWith('$item:') ||
      value.startsWith('$expr:') ||
      (value.includes('{{') && value.includes('}}'))
    )) {
      return this.resolve(value);
    }
    return value;
  }

  /** Get a prop as an array, resolving any references */
  protected getArray(key: string): unknown[] {
    const val = this.getProp(key);
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') return Object.values(val as Record<string, unknown>);
    return [];
  }

  /** Get a prop as a string */
  protected getString(key: string, fallback = ''): string {
    const val = this.getProp(key);
    return typeof val === 'string' ? val : String(val ?? fallback);
  }

  /** Get a prop as a number */
  protected getNumber(key: string, fallback = 0): number {
    const val = this.getProp(key);
    return typeof val === 'number' ? val : Number(val) || fallback;
  }

  /** Get a prop as a boolean */
  protected getBool(key: string, fallback = false): boolean {
    const val = this.getProp(key);
    return typeof val === 'boolean' ? val : fallback;
  }

  // ─── Action helpers ──────────────────────────────────────────

  /** Dispatch a forgeui-action event */
  protected dispatchAction(actionId: string, payload?: Record<string, unknown>) {
    if (this.onAction) {
      this.onAction(actionId, payload);
    }
    this.dispatchEvent(new CustomEvent('forgeui-action', {
      detail: { action: actionId, payload },
      bubbles: true,
      composed: true,
    }));
  }

  /** Handle a button/action click by looking up the action prop */
  protected handleAction(_event: Event) {
    const actionId = this.getString('action');
    if (actionId) {
      this.dispatchAction(actionId, this.props);
    }
  }

  // ─── Compatibility aliases (for generated components) ──────────

  /** Alias: get a prop value (compat with generated code) */
  protected prop(key: string): unknown {
    return this.getProp(key);
  }

  /** Alias: shared styles for all Forge components */
  static get sharedStyles() {
    return [resetStyles];
  }

  /** Alias: resolve gap token to CSS value */
  protected gapValue(gap?: string | number): string {
    const tokenMap: Record<string, string> = {
      'none': '0',
      '0': '0',
      '3xs': 'var(--forgeui-space-3xs)',
      '2xs': 'var(--forgeui-space-2xs)',
      'xs': 'var(--forgeui-space-xs)',
      'sm': 'var(--forgeui-space-sm)',
      'md': 'var(--forgeui-space-md)',
      'lg': 'var(--forgeui-space-lg)',
      'xl': 'var(--forgeui-space-xl)',
      '2xl': 'var(--forgeui-space-2xl)',
    };
    if (gap === undefined || gap === null || gap === '') return 'var(--forgeui-space-md)';
    const key = String(gap);
    if (key in tokenMap) return tokenMap[key];
    // Numeric — treat as px
    if (/^\d+(\.\d+)?$/.test(key)) return `${key}px`;
    // Pass-through CSS length values (rem, px, em, %, etc.)
    if (/^\d+(\.\d+)?(px|rem|em|%|vw|vh|ch)$/.test(key)) return key;
    return 'var(--forgeui-space-md)';
  }

  // ─── Common styles ───────────────────────────────────────────

  static get styles(): CSSResult | CSSResult[] { return [resetStyles]; }
}
