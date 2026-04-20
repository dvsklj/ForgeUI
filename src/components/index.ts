/**
 * Forge Components — All 37 Lit Web Components
 * 
 * Design principles:
 * - Layout components use explicit div wrappers, NOT <slot> for gap/padding
 * - Never call setAttribute() inside render() — use reactive properties
 * - Use design tokens for ALL spacing/colors, never raw values
 * - Touch-friendly minimum: 44px tap targets
 */

import { html, css, svg, nothing } from 'lit';
import { ForgeElement } from './base.js';

// ═══════════════════════════════════════════════════════════════
// LAYOUT (8)
// ═══════════════════════════════════════════════════════════════

export class ForgeStack extends ForgeElement {
  static get properties() {
    return {
      props: { type: Object },
      // Track direction/align/wrap as reactive properties to avoid setAttribute in render
      _direction: { type: String },
      _align: { type: String },
      _wrap: { type: Boolean },
    };
  }

  static get styles() {
    return css`
      :host { display: block; }
      .stack {
        display: flex;
        height: 100%;
      }
      :host([direction="column"]) .stack,
      .stack.column { flex-direction: column; }
      :host([direction="row"]) .stack,
      .stack.row { flex-direction: row; }
      :host([align="start"]) .stack,
      .stack.align-start { align-items: flex-start; }
      :host([align="center"]) .stack,
      .stack.align-center { align-items: center; }
      :host([align="end"]) .stack,
      .stack.align-end { align-items: flex-end; }
      :host([align="stretch"]) .stack,
      .stack.align-stretch { align-items: stretch; }
      :host([wrap]) .stack,
      .stack.wrap { flex-wrap: wrap; }
    `;
  }

  constructor() {
    super();
    this._direction = 'column';
    this._align = 'stretch';
    this._wrap = false;
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('props')) {
      const p = this.props || {};
      this._direction = String(p['direction'] || 'column');
      this._align = String(p['align'] || 'stretch');
      this._wrap = p['wrap'] === true || p['wrap'] === 'true';
    }
  }

  render() {
    const p = this.props || {};
    const gap = this.gapValue(String(p['gap'] || 'md'));
    const pad = p['padding']
      ? `padding: var(--forge-space-${p['padding']}, 0)`
      : '';

    return html`
      <div
        class="stack ${this._direction === 'row' ? 'row' : 'column'} align-${this._align}${this._wrap ? ' wrap' : ''}"
        style="gap:${gap};${pad}"
      >
        <slot></slot>
      </div>
    `;
  }
}
customElements.define('forge-stack', ForgeStack);

export class ForgeGrid extends ForgeElement {
  static get properties() {
    return {
      props: { type: Object },
      _cols: { type: String },
      _gap: { type: String },
    };
  }

  static get styles() {
    return css`
      :host { display: block; }
      .grid {
        display: grid;
        width: 100%;
        /* Responsive: auto-stack based on column count */
        /* Large screens: honor explicit column count */
        /* Tablet: max 2 columns */
        /* Mobile: max 1 column */
        grid-template-columns: repeat(var(--forge-cols, 1), 1fr);
        gap: var(--forge-gap, var(--forge-space-md));
      }
      @media (max-width: 640px) {
        .grid { grid-template-columns: repeat(min(var(--forge-cols, 1), 2), 1fr) !important; }
      }
      @media (max-width: 400px) {
        .grid { grid-template-columns: 1fr !important; }
      }
    `;
  }

  constructor() {
    super();
    this._cols = '1';
    this._gap = 'md';
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('props')) {
      const p = this.props || {};
      this._cols = String(p['columns'] || '1');
      this._gap = String(p['gap'] || 'md');
      // Set CSS custom property for responsive breakpoints
      const root = this.shadowRoot?.querySelector('.grid');
      if (root) {
        root.style.setProperty('--forge-cols', this._cols);
        root.style.setProperty('--forge-gap', this.gapValue(this._gap));
      }
    }
  }

  render() {
    return html`<div class="grid"><slot></slot></div>`;
  }
}
customElements.define('forge-grid', ForgeGrid);

export class ForgeCard extends ForgeElement {
  static get properties() {
    return {
      props: { type: Object },
      _variant: { type: String },
    };
  }

  static get styles() {
    return css`
      :host { display: block; }
      .card {
        background: var(--forge-color-surface);
        border: 1px solid var(--forge-color-border);
        border-radius: var(--forge-radius-xl);
        padding: var(--forge-space-lg);
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: var(--forge-space-sm);
        transition: box-shadow var(--forge-transition-normal), border-color var(--forge-transition-fast);
      }
      :host([variant="elevated"]) .card {
        border-color: transparent;
        box-shadow: var(--forge-shadow-lg);
      }
      :host([variant="compact"]) .card {
        padding: var(--forge-space-md);
        border-radius: var(--forge-radius-lg);
      }
      :host([variant="outline"]) .card {
        background: transparent;
      }
      .card-header {
        display: flex;
        flex-direction: column;
        gap: var(--forge-space-2xs);
      }
      .card-title {
        font-size: var(--forge-text-base);
        font-weight: var(--forge-weight-semibold);
        color: var(--forge-color-text);
        margin: 0;
        line-height: var(--forge-leading-tight);
      }
      .card-subtitle {
        font-size: var(--forge-text-sm);
        color: var(--forge-color-text-secondary);
        margin: 0;
        line-height: var(--forge-leading-normal);
      }
      .card-body { flex: 1; }
    `;
  }

  constructor() {
    super();
    this._variant = '';
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('props')) {
      const v = String(this.props?.['variant'] || '');
      this._variant = v;
      if (v) this.setAttribute('variant', v);
    }
  }

  render() {
    const title = this.getString('title', '');
    const subtitle = this.getString('subtitle', '');
    const hasHeader = title || subtitle;

    return html`
      ${hasHeader ? html`
        <div class="card-header">
          ${title ? html`<h3 class="card-title">${title}</h3>` : nothing}
          ${subtitle ? html`<p class="card-subtitle">${subtitle}</p>` : nothing}
        </div>
      ` : nothing}
      <div class="card-body"><slot></slot></div>
    `;
  }
}
customElements.define('forge-card', ForgeCard);

export class ForgeContainer extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .container {
        width: 100%;
        margin: 0 auto;
      }
    `;
  }
  render() {
    const p = this.props || {};
    const maxWidth = String(p['maxWidth'] || '1200px');
    const pad = p['padding']
      ? `padding: 0 var(--forge-space-${p['padding']})`
      : 'padding: 0 var(--forge-space-lg)';
    return html`<div class="container" style="max-width:${maxWidth};${pad}"><slot></slot></div>`;
  }
}
customElements.define('forge-container', ForgeContainer);

export class ForgeTabs extends ForgeElement {
  static get properties() {
    return {
      props: { type: Object },
      _active: { type: String },
      _tabs: { type: Array },
    };
  }

  static get styles() {
    return css`
      :host { display: block; }
      .tabs-wrapper { display: flex; flex-direction: column; height: 100%; }
      .tab-list {
        display: flex;
        border-bottom: 1px solid var(--forge-color-border);
        gap: var(--forge-space-2xs);
        overflow-x: auto;
        scrollbar-width: none;
      }
      .tab-list::-webkit-scrollbar { display: none; }
      .tab-btn {
        padding: var(--forge-space-sm) var(--forge-space-md);
        border: none;
        background: none;
        color: var(--forge-color-text-secondary);
        font: inherit;
        font-size: var(--forge-text-sm);
        font-weight: var(--forge-weight-medium);
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: color var(--forge-transition-fast), border-color var(--forge-transition-fast);
        white-space: nowrap;
        min-height: var(--forge-touch-target);
      }
      .tab-btn:hover {
        color: var(--forge-color-text);
        background: var(--forge-color-surface-hover);
      }
      .tab-btn[active] {
        color: var(--forge-color-primary);
        border-bottom-color: var(--forge-color-primary);
      }
      .tab-panel {
        padding: var(--forge-space-lg) 0;
        flex: 1;
        overflow-y: auto;
      }
      .tab-content {
        display: none;
      }
      .tab-content[active] {
        display: block;
      }
    `;
  }

  constructor() {
    super();
    this._active = '';
    this._tabs = [];
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('props')) {
      const p = this.props || {};
      // Support both 'tabs' (manifests use this) and 'items' (legacy)
      const rawTabs = p['tabs'] || p['items'] || [];
      this._tabs = Array.isArray(rawTabs) ? rawTabs.map((t: any) => typeof t === 'string' ? t : t.label || String(t)) : [];
      // Also support activeTab prop
      const activeTab = p['activeTab'];
      this._active = activeTab
        ? String(activeTab)
        : (this._active || (this._tabs.length > 0 ? this._tabs[0] : ''));
    }
    // Show/hide tab panels based on active tab
    this._updateTabPanels();
  }

  private _updateTabPanels() {
    const slot = this.shadowRoot?.querySelector('slot');
    if (!slot) return;
    const nodes = slot.assignedNodes({ flatten: true });
    for (const node of nodes) {
      if (node instanceof HTMLElement && node.hasAttribute('data-tab-id')) {
        node.style.display = node.getAttribute('data-tab-id') === this._active ? '' : 'none';
      }
    }
  }

  private _selectTab(tab: string) {
    this._active = tab;
    this.dispatchAction('tab-change', { active: tab });
    this.requestUpdate();
    // Immediately update panel visibility without waiting for re-render
    this._updateTabPanels();
  }
  render() {
    return html`
      <div class="tabs-wrapper">
        <div class="tab-list" role="tablist">
          ${this._tabs.map((tab: string) => html`
            <button
              class="tab-btn"
              role="tab"
              ?active=${tab === this._active}
              aria-selected=${tab === this._active}
              @click=${() => this._selectTab(tab)}
            >${tab}</button>
          `)}
        </div>
        <div class="tab-panel" role="tabpanel">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
customElements.define('forge-tabs', ForgeTabs);

export class ForgeAccordion extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      details {
        border: 1px solid var(--forge-color-border);
        border-radius: var(--forge-radius-lg);
        overflow: hidden;
        margin-bottom: var(--forge-space-sm);
      }
      summary {
        padding: var(--forge-space-md);
        cursor: pointer;
        font-weight: var(--forge-weight-medium);
        list-style: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--forge-color-surface);
        transition: background var(--forge-transition-fast);
        min-height: var(--forge-touch-target);
      }
      summary::-webkit-details-marker { display: none; }
      summary::after { content: '›'; transition: transform var(--forge-transition-fast); font-size: 1.2em; }
      details[open] summary::after { transform: rotate(90deg); }
      summary:hover { background: var(--forge-color-surface-hover); }
      .content { padding: var(--forge-space-md); border-top: 1px solid var(--forge-color-border); }
    `;
  }
  render() {
    const title = this.getString('title', 'Section');
    return html`<details><summary>${title}</summary><div class="content"><slot></slot></div></details>`;
  }
}
customElements.define('forge-accordion', ForgeAccordion);

export class ForgeDivider extends ForgeElement {
  static get styles() {
    return css`
      :host { display: block; }
      hr {
        border: none;
        border-top: 1px solid var(--forge-color-border);
        margin: var(--forge-space-md) 0;
      }
    `;
  }
  render() { return html`<hr>`; }
}
customElements.define('forge-divider', ForgeDivider);

export class ForgeSpacer extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`:host { display: block; }`; }
  render() {
    // Support both 'size' and 'height' props (manifests use either)
    const size = String(this.props?.['size'] || this.props?.['height'] || 'md');
    return html`<div style="height:var(--forge-space-${size}, var(--forge-space-md))"></div>`;
  }
}
customElements.define('forge-spacer', ForgeSpacer);

// ═══════════════════════════════════════════════════════════════
// CONTENT (6)
// ═══════════════════════════════════════════════════════════════

export class ForgeText extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .text-heading {
        font-size: var(--forge-text-2xl);
        font-weight: var(--forge-weight-bold);
        line-height: var(--forge-leading-tight);
        margin: 0 0 var(--forge-space-sm);
        color: var(--forge-color-text);
      }
      .text-heading1 {
        font-size: var(--forge-text-3xl);
        font-weight: var(--forge-weight-bold);
        line-height: var(--forge-leading-tight);
        margin: 0 0 var(--forge-space-md);
        color: var(--forge-color-text);
      }
      .text-heading2 {
        font-size: var(--forge-text-xl);
        font-weight: var(--forge-weight-semibold);
        line-height: var(--forge-leading-tight);
        margin: 0 0 var(--forge-space-sm);
        color: var(--forge-color-text);
      }
      .text-subheading {
        font-size: var(--forge-text-lg);
        font-weight: var(--forge-weight-semibold);
        color: var(--forge-color-text);
        margin: 0 0 var(--forge-space-xs);
      }
      .text-body {
        font-size: var(--forge-text-base);
        line-height: var(--forge-leading-normal);
        margin: 0;
        color: var(--forge-color-text);
      }
      .text-caption {
        font-size: var(--forge-text-xs);
        color: var(--forge-color-text-tertiary);
        margin: 0;
      }
      .text-code {
        font-family: var(--forge-font-mono);
        font-size: var(--forge-text-sm);
        background: var(--forge-color-surface-alt);
        padding: var(--forge-space-2xs) var(--forge-space-xs);
        border-radius: var(--forge-radius-sm);
        color: var(--forge-color-text);
      }
    `;
  }
  render() {
    const content = this.getString('content', '');
    const variant = String(this.props?.['variant'] || 'body');
    const colorScheme = String(this.props?.['colorScheme'] || '');
    const style = colorScheme === 'secondary' ? 'color:var(--forge-color-text-secondary)' :
                  colorScheme === 'primary' ? 'color:var(--forge-color-primary)' :
                  colorScheme === 'tertiary' ? 'color:var(--forge-color-text-tertiary)' : '';
    return html`<div class="text-${variant}" style="${style}">${content}<slot></slot></div>`;
  }
}
customElements.define('forge-text', ForgeText);

export class ForgeImage extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      img { max-width: 100%; height: auto; display: block; border-radius: var(--forge-radius-lg); }
    `;
  }
  render() {
    const src = this.getString('src', '');
    const alt = this.getString('alt', '');
    const fit = this.getString('fit', 'contain');
    if (!src) return html`${nothing}`;
    return html`<img src="${src}" alt="${alt}" style="object-fit:${fit}" loading="lazy">`;
  }
}
customElements.define('forge-image', ForgeImage);

export class ForgeIcon extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: inline-flex; align-items: center; justify-content: center; }
      svg { width: var(--forge-icon-md); height: var(--forge-icon-md); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    `;
  }
  render() {
    const name = this.getString('name', 'circle');
    const size = this.getString('size', 'md');
    const icons: Record<string, string> = {
      check: 'M5 13l4 4L19 7',
      x: 'M6 18L18 6M6 6l12 12',
      plus: 'M12 5v14M5 12h14',
      minus: 'M20 12H4',
      chevron: 'M9 5l7 7-7 7',
      arrow: 'M13 7l5 5m0 0l-5 5m5-5H6',
      star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.063 8.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z',
      circle: 'M12 22a10 10 0 100-20 10 10 0 000 20z',
      alert: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
    };
    const path = icons[name] || icons.circle;
    return html`<svg viewBox="0 0 24 24" style="width:var(--forge-icon-${size});height:var(--forge-icon-${size})"><path d="${path}"/></svg>`;
  }
}
customElements.define('forge-icon', ForgeIcon);

export class ForgeBadge extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: inline-flex; align-items: center; }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: var(--forge-space-2xs);
        padding: 2px var(--forge-space-xs);
        border-radius: var(--forge-radius-full);
        font-size: var(--forge-text-xs);
        font-weight: var(--forge-weight-medium);
        line-height: 1.4;
      }
      .badge.default { background: var(--forge-color-primary-subtle); color: var(--forge-color-primary); }
      .badge.success { background: var(--forge-color-success-subtle); color: var(--forge-color-success); }
      .badge.warning { background: var(--forge-color-warning-subtle); color: var(--forge-color-warning); }
      .badge.error { background: var(--forge-color-error-subtle); color: var(--forge-color-error); }
      .badge.info { background: var(--forge-color-info-subtle); color: var(--forge-color-info); }
    `;
  }
  render() {
    // Support both 'label' and 'text' props (manifests use either)
    const label = this.getString('label', '') || this.getString('text', '');
    const variant = String(this.props?.['variant'] || 'default');
    return html`<span class="badge ${variant}">${label}<slot></slot></span>`;
  }
}
customElements.define('forge-badge', ForgeBadge);

export class ForgeAvatar extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: inline-flex; }
      .avatar {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: var(--forge-radius-full);
        background: var(--forge-color-primary-subtle);
        color: var(--forge-color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: var(--forge-weight-semibold);
        font-size: var(--forge-text-sm);
        overflow: hidden;
        flex-shrink: 0;
      }
      .avatar.sm { width: 2rem; height: 2rem; font-size: var(--forge-text-xs); }
      .avatar.lg { width: 3rem; height: 3rem; font-size: var(--forge-text-base); }
      img { width: 100%; height: 100%; object-fit: cover; }
    `;
  }
  render() {
    const src = this.getString('src', '');
    const name = this.getString('name', '?');
    const size = String(this.props?.['size'] || '');
    const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    return html`<div class="avatar ${size}">${src ? html`<img src="${src}" alt="${name}">` : initials}<slot></slot></div>`;
  }
}
customElements.define('forge-avatar', ForgeAvatar);

export class ForgeEmptyState extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--forge-space-2xl) var(--forge-space-lg);
        text-align: center;
        gap: var(--forge-space-sm);
      }
      .title { font-size: var(--forge-text-base); font-weight: var(--forge-weight-medium); color: var(--forge-color-text-secondary); }
      .desc { font-size: var(--forge-text-sm); color: var(--forge-color-text-tertiary); }
    `;
  }
  render() {
    const title = this.getString('title', 'Nothing here yet');
    const desc = this.getString('description', '');
    return html`
      <div class="empty">
        ${title ? html`<div class="title">${title}</div>` : nothing}
        ${desc ? html`<div class="desc">${desc}</div>` : nothing}
        <slot></slot>
      </div>
    `;
  }
}
customElements.define('forge-empty-state', ForgeEmptyState);

// ═══════════════════════════════════════════════════════════════
// INPUT (9)
// ═══════════════════════════════════════════════════════════════

export class ForgeTextInput extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .field { display: flex; flex-direction: column; gap: var(--forge-space-2xs); }
      label {
        font-size: var(--forge-text-sm);
        font-weight: var(--forge-weight-medium);
        color: var(--forge-color-text);
      }
      input, textarea {
        width: 100%;
        padding: var(--forge-space-sm) var(--forge-space-md);
        border: 1.5px solid var(--forge-color-border);
        border-radius: var(--forge-radius-lg);
        font: inherit;
        font-size: var(--forge-text-base);
        background: var(--forge-color-surface);
        color: var(--forge-color-text);
        height: var(--forge-input-height);
        transition: border-color var(--forge-transition-fast), box-shadow var(--forge-transition-fast);
        outline: none;
      }
      input:focus, textarea:focus {
        border-color: var(--forge-color-primary);
        box-shadow: 0 0 0 3px var(--forge-color-primary-subtle);
      }
      input::placeholder, textarea::placeholder { color: var(--forge-color-text-tertiary); }
      textarea { height: auto; min-height: 5rem; resize: vertical; }
      .hint { font-size: var(--forge-text-xs); color: var(--forge-color-text-tertiary); }
      .error-msg { font-size: var(--forge-text-xs); color: var(--forge-color-error); }
    `;
  }
  render() {
    const label = this.getString('label', '');
    const placeholder = this.getString('placeholder', '');
    const hint = this.getString('hint', '');
    const error = this.getString('error', '');
    const type = String(this.props?.['inputType'] || 'text');
    const multiline = this.getBool('multiline');
    const val = this.getString('value', '');
    return html`
      <div class="field">
        ${label ? html`<label>${label}</label>` : nothing}
        ${multiline
          ? html`<textarea placeholder="${placeholder}" .value=${val} @input=${(e: any) => this.dispatchAction('change', { value: e.target.value })}></textarea>`
          : html`<input type="${type}" placeholder="${placeholder}" .value=${val} @input=${(e: any) => this.dispatchAction('change', { value: e.target.value })}>`}
        ${hint && !error ? html`<span class="hint">${hint}</span>` : nothing}
        ${error ? html`<span class="error-msg">${error}</span>` : nothing}
      </div>
    `;
  }
}
customElements.define('forge-text-input', ForgeTextInput);

export class ForgeNumberInput extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .field { display: flex; flex-direction: column; gap: var(--forge-space-2xs); }
      label { font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); }
      input {
        width: 100%;
        padding: var(--forge-space-sm) var(--forge-space-md);
        border: 1.5px solid var(--forge-color-border);
        border-radius: var(--forge-radius-lg);
        font: inherit;
        height: var(--forge-input-height);
        background: var(--forge-color-surface);
        color: var(--forge-color-text);
        outline: none;
        transition: border-color var(--forge-transition-fast), box-shadow var(--forge-transition-fast);
      }
      input:focus { border-color: var(--forge-color-primary); box-shadow: 0 0 0 3px var(--forge-color-primary-subtle); }
    `;
  }
  render() {
    const label = this.getString('label', '');
    const min = this.getProp('min') as number | undefined;
    const max = this.getProp('max') as number | undefined;
    const step = this.getProp('step') as number | undefined;
    const val = this.getProp('value') as number | undefined;
    return html`
      <div class="field">
        ${label ? html`<label>${label}</label>` : nothing}
        <input type="number" min=${min ?? 0} max=${max ?? 100} step=${step ?? 1} .value=${val ?? ''}
          @input=${(e: any) => this.dispatchAction('change', { value: Number(e.target.value) })}>
      </div>
    `;
  }
}
customElements.define('forge-number-input', ForgeNumberInput);

export class ForgeSelect extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .field { display: flex; flex-direction: column; gap: var(--forge-space-2xs); }
      label { font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); }
      select {
        width: 100%;
        padding: var(--forge-space-sm) var(--forge-space-md);
        border: 1.5px solid var(--forge-color-border);
        border-radius: var(--forge-radius-lg);
        font: inherit;
        height: var(--forge-input-height);
        background: var(--forge-color-surface);
        color: var(--forge-color-text);
        cursor: pointer;
        outline: none;
        transition: border-color var(--forge-transition-fast), box-shadow var(--forge-transition-fast);
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 2.5rem;
      }
      select:focus { border-color: var(--forge-color-primary); box-shadow: 0 0 0 3px var(--forge-color-primary-subtle); }
    `;
  }
  render() {
    const label = this.getString('label', '');
    const options = (this.getProp('options') || []) as any[];
    const val = this.getString('value', '');
    return html`
      <div class="field">
        ${label ? html`<label>${label}</label>` : nothing}
        <select .value=${val} @change=${(e: any) => this.dispatchAction('change', { value: e.target.value })}>
          ${options.map((o: any) => html`<option value=${typeof o === 'string' ? o : o.value} ?selected=${(typeof o === 'string' ? o : o.value) === val}>
            ${typeof o === 'string' ? o : (o.label || o.value)}
          </option>`)}
        </select>
      </div>
    `;
  }
}
customElements.define('forge-select', ForgeSelect);

export class ForgeMultiSelect extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .field { display: flex; flex-direction: column; gap: var(--forge-space-2xs); }
      label { font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); }
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--forge-space-2xs);
        padding: var(--forge-space-sm);
        border: 1.5px solid var(--forge-color-border);
        border-radius: var(--forge-radius-lg);
        min-height: var(--forge-input-height);
        background: var(--forge-color-surface);
        transition: border-color var(--forge-transition-fast);
      }
      .tag {
        display: inline-flex;
        align-items: center;
        gap: var(--forge-space-2xs);
        padding: 2px var(--forge-space-xs);
        background: var(--forge-color-primary-subtle);
        color: var(--forge-color-primary);
        border-radius: var(--forge-radius-full);
        font-size: var(--forge-text-xs);
      }
      .tag button { background: none; border: none; cursor: pointer; color: inherit; font: inherit; padding: 0; line-height: 1; }
    `;
  }
  render() {
    const label = this.getString('label', '');
    const selected = (this.getProp('selected') || []) as any[];
    return html`
      <div class="field">
        ${label ? html`<label>${label}</label>` : nothing}
        <div class="tags">
          ${selected.map((s: any) => html`<span class="tag">${String(s)}<button @click=${() => this.dispatchAction('remove', { value: s })}>×</button></span>`)}
          <slot></slot>
        </div>
      </div>
    `;
  }
}
customElements.define('forge-multi-select', ForgeMultiSelect);

export class ForgeCheckbox extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: flex; align-items: center; gap: var(--forge-space-sm); cursor: pointer; }
      :host([disabled]) { opacity: 0.5; pointer-events: none; }
      input { width: 1.125rem; height: 1.125rem; accent-color: var(--forge-color-primary); cursor: pointer; flex-shrink: 0; }
      label { font-size: var(--forge-text-sm); cursor: pointer; color: var(--forge-color-text); }
    `;
  }
  render() {
    const label = this.getString('label', '');
    const checked = this.getBool('checked');
    const disabled = this.getBool('disabled');
    return html`
      <input type="checkbox" ?checked=${checked} ?disabled=${disabled}
        @change=${(e: any) => this.dispatchAction('change', { checked: e.target.checked })}>
      ${label ? html`<label>${label}</label>` : nothing}
    `;
  }
}
customElements.define('forge-checkbox', ForgeCheckbox);

export class ForgeToggle extends ForgeElement {
  static get properties() {
    return {
      props: { type: Object },
      _on: { type: Boolean },
    };
  }
  static get styles() {
    return css`
      :host { display: flex; align-items: center; gap: var(--forge-space-sm); cursor: pointer; }
      :host([disabled]) { opacity: 0.5; pointer-events: none; }
      .track {
        position: relative;
        width: 2.75rem;
        height: 1.5rem;
        background: var(--forge-color-border-strong);
        border-radius: var(--forge-radius-full);
        cursor: pointer;
        transition: background var(--forge-transition-fast);
        flex-shrink: 0;
      }
      .track.on { background: var(--forge-color-primary); }
      .thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 1.25rem;
        height: 1.25rem;
        background: white;
        border-radius: var(--forge-radius-full);
        transition: transform var(--forge-transition-fast);
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }
      .track.on .thumb { transform: translateX(1.25rem); }
      label { font-size: var(--forge-text-sm); cursor: pointer; color: var(--forge-color-text); }
    `;
  }
  constructor() {
    super();
    this._on = false;
  }
  updated(changed: Map<string, unknown>) {
    if (changed.has('props')) {
      // Support both 'on' and 'value' props (manifests may use either)
      const onVal = this.getBool('on');
      const valueVal = this.getBool('value');
      this._on = onVal || valueVal;
    }
  }
  render() {
    const label = this.getString('label', '');
    const disabled = this.getBool('disabled');
    return html`
      <div class="track ${this._on ? 'on' : ''}" @click=${disabled ? undefined : () => {
        this._on = !this._on;
        this.dispatchAction('change', { on: this._on });
        this.requestUpdate();
      }}>
        <div class="thumb"></div>
      </div>
      ${label ? html`<label>${label}</label>` : nothing}
    `;
  }
}
customElements.define('forge-toggle', ForgeToggle);

export class ForgeDatePicker extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .field { display: flex; flex-direction: column; gap: var(--forge-space-2xs); }
      label { font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); }
      input {
        width: 100%;
        padding: var(--forge-space-sm) var(--forge-space-md);
        border: 1.5px solid var(--forge-color-border);
        border-radius: var(--forge-radius-lg);
        font: inherit;
        height: var(--forge-input-height);
        background: var(--forge-color-surface);
        color: var(--forge-color-text);
        outline: none;
        transition: border-color var(--forge-transition-fast), box-shadow var(--forge-transition-fast);
      }
      input:focus { border-color: var(--forge-color-primary); box-shadow: 0 0 0 3px var(--forge-color-primary-subtle); }
    `;
  }
  render() {
    const label = this.getString('label', '');
    const val = this.getString('value', '');
    return html`
      <div class="field">
        ${label ? html`<label>${label}</label>` : nothing}
        <input type="date" .value=${val} @change=${(e: any) => this.dispatchAction('change', { value: e.target.value })}>
      </div>
    `;
  }
}
customElements.define('forge-date-picker', ForgeDatePicker);

export class ForgeSlider extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .field { display: flex; flex-direction: column; gap: var(--forge-space-2xs); }
      .row { display: flex; align-items: center; justify-content: space-between; gap: var(--forge-space-sm); }
      label { font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); color: var(--forge-color-text); }
      input[type=range] {
        flex: 1;
        accent-color: var(--forge-color-primary);
        height: 4px;
        cursor: pointer;
      }
      .value-display {
        min-width: 2.5rem;
        text-align: right;
        font-size: var(--forge-text-sm);
        font-weight: var(--forge-weight-medium);
        color: var(--forge-color-text);
        background: var(--forge-color-surface-alt);
        padding: var(--forge-space-2xs) var(--forge-space-xs);
        border-radius: var(--forge-radius-md);
      }
    `;
  }
  render() {
    const label = this.getString('label', '');
    const min = this.getNumber('min', 0);
    const max = this.getNumber('max', 100);
    const step = this.getNumber('step', 1);
    const val = this.getNumber('value', min);
    return html`
      <div class="field">
        ${label ? html`<label>${label}</label>` : nothing}
        <div class="row">
          <input type="range" min=${min} max=${max} step=${step} .value=${val}
            @input=${(e: any) => this.dispatchAction('change', { value: Number(e.target.value) })}>
          <span class="value-display">${val}</span>
        </div>
      </div>
    `;
  }
}
customElements.define('forge-slider', ForgeSlider);

export class ForgeFileUpload extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .field { display: flex; flex-direction: column; gap: var(--forge-space-2xs); }
      label { font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); }
      .dropzone {
        border: 2px dashed var(--forge-color-border-strong);
        border-radius: var(--forge-radius-xl);
        padding: var(--forge-space-xl);
        text-align: center;
        cursor: pointer;
        transition: border-color var(--forge-transition-fast), background var(--forge-transition-fast);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--forge-space-xs);
        min-height: 8rem;
        justify-content: center;
      }
      .dropzone:hover { border-color: var(--forge-color-primary); background: var(--forge-color-primary-subtle); }
      .dropzone p { color: var(--forge-color-text-secondary); font-size: var(--forge-text-sm); margin: 0; }
      .dropzone .hint { color: var(--forge-color-text-tertiary); font-size: var(--forge-text-xs); }
    `;
  }
  render() {
    const label = this.getString('label', 'Upload file');
    const accept = this.getString('accept', '*');
    return html`
      <div class="field">
        ${label ? html`<label>${label}</label>` : nothing}
        <div class="dropzone" @click=${() => this.shadowRoot?.querySelector('input')?.click()}>
          <p>Click or drop a file here</p>
          <span class="hint">Any file type accepted</span>
          <input type="file" accept="${accept}" hidden @change=${(e: any) => {
            const file = e.target.files?.[0];
            if (file) this.dispatchAction('change', { name: file.name, size: file.size, type: file.type });
          }}>
        </div>
      </div>
    `;
  }
}
customElements.define('forge-file-upload', ForgeFileUpload);

// ═══════════════════════════════════════════════════════════════
// ACTION (3)
// ═══════════════════════════════════════════════════════════════

export class ForgeButton extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: inline-flex; }
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--forge-space-xs);
        padding: 0 var(--forge-space-lg);
        height: var(--forge-button-height);
        min-width: var(--forge-touch-target);
        border: none;
        border-radius: var(--forge-radius-lg);
        font: inherit;
        font-size: var(--forge-text-sm);
        font-weight: var(--forge-weight-medium);
        cursor: pointer;
        transition: all var(--forge-transition-fast);
        white-space: nowrap;
        text-decoration: none;
      }
      button:focus-visible { outline: 2px solid var(--forge-color-primary); outline-offset: 2px; }
      button.primary { background: var(--forge-color-primary); color: var(--forge-color-text-inverse); }
      button.primary:hover { background: var(--forge-color-primary-hover); transform: translateY(-1px); box-shadow: var(--forge-shadow-md); }
      button.primary:active { background: var(--forge-color-primary-active); transform: translateY(0); }
      button.secondary { background: transparent; color: var(--forge-color-primary); border: 1.5px solid var(--forge-color-primary); }
      button.secondary:hover { background: var(--forge-color-primary-subtle); }
      button.ghost { background: transparent; color: var(--forge-color-text-secondary); }
      button.ghost:hover { background: var(--forge-color-surface-hover); color: var(--forge-color-text); }
      button.danger { background: var(--forge-color-error); color: var(--forge-color-text-inverse); }
      button.danger:hover { opacity: 0.9; transform: translateY(-1px); }
      button.sm { height: 2rem; padding: 0 var(--forge-space-sm); font-size: var(--forge-text-xs); }
      button.lg { height: 3rem; padding: 0 var(--forge-space-xl); font-size: var(--forge-text-base); }
      button:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
    `;
  }
  render() {
    const label = this.getString('label', 'Button');
    const variant = String(this.props?.['variant'] || 'primary');
    const size = String(this.props?.['size'] || '');
    const disabled = this.getBool('disabled');
    return html`<button class="${variant} ${size}" ?disabled=${disabled} @click=${(e: Event) => this.handleAction(e)}>${label}<slot></slot></button>`;
  }
}
customElements.define('forge-button', ForgeButton);

export class ForgeButtonGroup extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: inline-flex; }
      .group { display: flex; gap: 1px; }
      ::slotted(forge-button) { border-radius: 0; }
      ::slotted(forge-button:first-child) { border-radius: var(--forge-radius-lg) 0 0 var(--forge-radius-lg); }
      ::slotted(forge-button:last-child) { border-radius: 0 var(--forge-radius-lg) var(--forge-radius-lg) 0; }
    `;
  }
  render() { return html`<div class="group"><slot></slot></div>`; }
}
customElements.define('forge-button-group', ForgeButtonGroup);

export class ForgeLink extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: inline-flex; }
      a { color: var(--forge-color-primary); text-decoration: none; font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); }
      a:hover { text-decoration: underline; }
    `;
  }
  render() {
    const label = this.getString('label', '');
    const href = this.getString('href', '#');
    return html`<a href="${href}" target="_blank" rel="noopener noreferrer">${label}<slot></slot></a>`;
  }
}
customElements.define('forge-link', ForgeLink);

// ═══════════════════════════════════════════════════════════════
// DATA DISPLAY (4)
// ═══════════════════════════════════════════════════════════════

export class ForgeTable extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .table-wrapper {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        border: 1px solid var(--forge-color-border);
        border-radius: var(--forge-radius-lg);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--forge-text-sm);
        min-width: 400px;
      }
      th {
        text-align: left;
        padding: var(--forge-space-sm) var(--forge-space-md);
        font-weight: var(--forge-weight-semibold);
        color: var(--forge-color-text-secondary);
        border-bottom: 2px solid var(--forge-color-border);
        white-space: nowrap;
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        background: var(--forge-color-surface-alt);
      }
      td {
        padding: var(--forge-space-sm) var(--forge-space-md);
        border-bottom: 1px solid var(--forge-color-border);
        vertical-align: middle;
        font-size: var(--forge-text-sm);
      }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: var(--forge-color-surface-hover); }
      .empty { padding: var(--forge-space-xl); text-align: center; color: var(--forge-color-text-tertiary); }
      .badge-pill {
        display: inline-flex;
        align-items: center;
        padding: 2px var(--forge-space-xs);
        border-radius: 9999px;
        font-size: 0.7rem;
        font-weight: 500;
        line-height: 1.4;
        white-space: nowrap;
      }
      .badge-pill.success { background: var(--forge-color-success-subtle); color: var(--forge-color-success); }
      .badge-pill.error { background: var(--forge-color-error-subtle); color: var(--forge-color-error); }
      .badge-pill.warning { background: var(--forge-color-warning-subtle); color: var(--forge-color-warning); }
      .badge-pill.info { background: var(--forge-color-info-subtle); color: var(--forge-color-info); }
      .badge-pill.default { background: var(--forge-color-primary-subtle); color: var(--forge-color-primary); }
    `;
  }
  render() {
    const data = this.getProp('data');
    const columns = (this.getProp('columns') || []) as any[];
    const emptyMsg = this.getString('emptyMessage', 'No data available');
    if (!Array.isArray(data) || data.length === 0 && columns.length === 0) return html`<div class="empty">${emptyMsg}</div>`;
    const cols = columns.length > 0
      ? columns
      : (data.length > 0 ? Object.keys(data[0]).map(k => ({ key: k, label: k })) : []);
    return html`
      <div class="table-wrapper">
        <table>
          <thead><tr>${cols.map((c: any) => html`<th>${typeof c === 'string' ? c : (c.label || c.key)}</th>`)}</tr></thead>
          <tbody>
            ${!Array.isArray(data) || data.length === 0
              ? html`<tr><td colspan="${cols.length}" class="empty">${emptyMsg}</td></tr>`
              : data.map((row: any) => html`<tr>${cols.map((c: any) => {
                  const key = typeof c === 'string' ? c : c.key;
                  const rawVal = row[key] ?? '—';
                  // Render badge if column type is 'badge'
                  if (typeof c === 'object' && c['type'] === 'badge') {
                    const badgeMap = c['badgeMap'] || {};
                    const badgeVariant = badgeMap[rawVal] || 'default';
                    return html`<td><span class="badge-pill ${badgeVariant}">${rawVal}</span></td>`;
                  }
                  return html`<td>${rawVal}</td>`;
                })}</tr>`)}
          </tbody>
        </table>
      </div>
    `;
  }
}
customElements.define('forge-table', ForgeTable);

export class ForgeList extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .list { display: flex; flex-direction: column; gap: var(--forge-space-xs); }
      .item {
        padding: var(--forge-space-md);
        background: var(--forge-color-surface);
        border: 1px solid var(--forge-color-border);
        border-radius: var(--forge-radius-lg);
        display: flex;
        align-items: center;
        gap: var(--forge-space-sm);
        cursor: pointer;
        transition: border-color var(--forge-transition-fast), background var(--forge-transition-fast);
        min-height: var(--forge-touch-target);
      }
      .item:hover { background: var(--forge-color-surface-hover); border-color: var(--forge-color-border-strong); }
      .empty { padding: var(--forge-space-xl); text-align: center; color: var(--forge-color-text-tertiary); font-size: var(--forge-text-sm); }
    `;
  }
  render() {
    const data = this.getProp('data');
    const emptyMsg = this.getString('emptyMessage', 'No items');
    if (!Array.isArray(data) || data.length === 0) return html`<div class="empty">${emptyMsg}</div>`;
    return html`
      <div class="list">
        ${data.map((item: any, i: number) => html`
          <div class="item" data-index=${i} @click=${() => this.dispatchAction('select', { item, index: i })}>
            <slot name="item" .item=${item} .index=${i}>${JSON.stringify(item)}</slot>
          </div>
        `)}
      </div>
    `;
  }
}
customElements.define('forge-list', ForgeList);

export class ForgeChart extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .fallback {
        padding: var(--forge-space-xl);
        text-align: center;
        background: var(--forge-color-surface-alt);
        border-radius: var(--forge-radius-lg);
        border: 1px dashed var(--forge-color-border-strong);
      }
      .fallback-title { font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); color: var(--forge-color-text-secondary); margin-bottom: var(--forge-space-xs); }
      .fallback-meta { font-size: var(--forge-text-xs); color: var(--forge-color-text-tertiary); }
    `;
  }
  render() {
    const chartType = this.getString('chartType', 'bar');
    const data = (this.getProp('data') || []) as any[];
    const title = this.getString('title', '');
    return html`
      ${title ? html`<div style="font-weight:var(--forge-weight-semibold);margin-bottom:var(--forge-space-sm);font-size:var(--forge-text-sm)">${title}</div>` : nothing}
      <div class="fallback">
        <div class="fallback-title">Chart: ${chartType}</div>
        <div class="fallback-meta">${data.length} data points — Canvas rendering in Phase 2</div>
      </div>
      <slot></slot>
    `;
  }
}
customElements.define('forge-chart', ForgeChart);

export class ForgeMetric extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; height: 100%; }
      .metric {
        background: var(--forge-color-surface);
        border: 1px solid var(--forge-color-border);
        border-radius: var(--forge-radius-xl);
        padding: var(--forge-space-md);
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: var(--forge-space-xs);
        box-sizing: border-box;
        transition: border-color var(--forge-transition-fast), box-shadow var(--forge-transition-fast);
      }
      .metric:hover { border-color: var(--forge-color-border-strong); }
      .metric-label {
        font-size: var(--forge-text-xs);
        font-weight: var(--forge-weight-medium);
        color: var(--forge-color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .metric-value {
        font-size: clamp(1.25rem, 4vw, var(--forge-text-3xl));
        font-weight: var(--forge-weight-bold);
        color: var(--forge-color-text);
        line-height: 1;
        letter-spacing: -0.02em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .metric-footer { display: flex; align-items: center; gap: var(--forge-space-sm); flex-wrap: wrap; }
      .trend {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        font-size: var(--forge-text-xs);
        font-weight: var(--forge-weight-medium);
        padding: 2px var(--forge-space-xs);
        border-radius: var(--forge-radius-full);
      }
      .trend.up { color: var(--forge-color-success); background: var(--forge-color-success-subtle); }
      .trend.down { color: var(--forge-color-error); background: var(--forge-color-error-subtle); }
      .trend.neutral { color: var(--forge-color-text-tertiary); background: var(--forge-color-surface-alt); }
      .goal { font-size: var(--forge-text-xs); color: var(--forge-color-text-tertiary); }
    `;
  }
  render() {
    const label = this.getString('label', '');
    const value = this.getProp('value');
    const trend = this.getProp('trend') as number | undefined;
    const goal = this.getProp('goal');
    const displayValue = typeof value === 'number' ? value.toLocaleString() : String(value ?? '—');
    const trendAbs = trend !== undefined ? Math.abs(trend) : undefined;
    const trendDir = trend !== undefined ? (trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral') : undefined;

    return html`
      <div class="metric">
        <div>
          <div class="metric-label">${label}</div>
          <div class="metric-value">${displayValue}</div>
        </div>
        <div class="metric-footer">
        ${goal !== undefined ? html`<span class="goal">Goal: ${typeof goal === 'number' ? goal.toLocaleString() : goal}</span>` : nothing}
        ${trendDir ? html`<span class="trend ${trendDir}">${trendDir === 'up' ? '↑' : trendDir === 'down' ? '↓' : '→'} ${trendAbs}%</span>` : nothing}
        ${this.props?.['subtitle'] ? html`<span class="goal">${this.props?.['subtitle']}</span>` : nothing}
      </div>
    `;
  }
}
customElements.define('forge-metric', ForgeMetric);

// ═══════════════════════════════════════════════════════════════
// FEEDBACK (4)
// ═══════════════════════════════════════════════════════════════

export class ForgeAlert extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .alert {
        padding: var(--forge-space-md) var(--forge-space-lg);
        border-radius: var(--forge-radius-xl);
        border-left: 4px solid;
        display: flex;
        align-items: flex-start;
        gap: var(--forge-space-sm);
        font-size: var(--forge-text-sm);
      }
      .alert.info { background: var(--forge-color-info-subtle); border-color: var(--forge-color-info); color: var(--forge-color-info); }
      .alert.success { background: var(--forge-color-success-subtle); border-color: var(--forge-color-success); color: #065f46; }
      .alert.warning { background: var(--forge-color-warning-subtle); border-color: var(--forge-color-warning); color: #92400e; }
      .alert.error { background: var(--forge-color-error-subtle); border-color: var(--forge-color-error); color: #991b1b; }
      .alert-icon { flex-shrink: 0; margin-top: 1px; }
      .alert-body { flex: 1; }
      .alert-title { font-weight: var(--forge-weight-semibold); margin-bottom: 2px; }
    `;
  }
  render() {
    const variant = String(this.props?.['variant'] || 'info');
    const title = this.getString('title', '');
    const message = this.getString('message', '');
    return html`
      <div class="alert ${variant}" role="alert">
        <div class="alert-icon">${this._alertIcon(variant)}</div>
        <div class="alert-body">
          ${title ? html`<div class="alert-title">${title}</div>` : nothing}
          ${message ? html`<div>${message}</div>` : nothing}
          <slot></slot>
        </div>
      </div>
    `;
  }
  private _alertIcon(v: string) {
    const paths: Record<string, string> = {
      info: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a1 1 0 00-1 1v4a1 1 0 002 0v-4a1 1 0 00-1-1zm0 8a1 1 0 110-2 1 1 0 010 2z',
      success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    };
    return html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[v] || paths.info}"/></svg>`;
  }
}
customElements.define('forge-alert', ForgeAlert);

export class ForgeDialog extends ForgeElement {
  static get properties() {
    return {
      props: { type: Object },
      _open: { type: Boolean },
    };
  }
  static get styles() {
    return css`
      :host { display: none; }
      :host([open]) { display: flex; position: fixed; inset: 0; z-index: 50; align-items: center; justify-content: center; padding: var(--forge-space-lg); }
      .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px); }
      .dialog {
        position: relative;
        background: var(--forge-color-surface);
        border-radius: var(--forge-radius-xl);
        padding: var(--forge-space-xl);
        min-width: 20rem;
        max-width: min(90vw, 32rem);
        max-height: 90vh;
        overflow: auto;
        box-shadow: var(--forge-shadow-lg);
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: var(--forge-space-lg);
      }
      .dialog-title { font-size: var(--forge-text-lg); font-weight: var(--forge-weight-semibold); color: var(--forge-color-text); margin: 0; }
      .dialog-body { flex: 1; overflow-y: auto; }
      .dialog-actions { display: flex; justify-content: flex-end; gap: var(--forge-space-sm); }
    `;
  }
  constructor() {
    super();
    this._open = false;
  }
  updated(changed: Map<string, unknown>) {
    if (changed.has('props')) {
      this._open = this.getBool('open');
      if (this._open) this.setAttribute('open', '');
      else this.removeAttribute('open');
    }
  }
  render() {
    const title = this.getString('title', '');
    return html`
      <div class="backdrop" @click=${() => this.dispatchAction('close')}></div>
      <div class="dialog" role="dialog" aria-modal="true">
        ${title ? html`<div class="dialog-title">${title}</div>` : nothing}
        <div class="dialog-body"><slot></slot></div>
        <div class="dialog-actions"><slot name="actions"></slot></div>
      </div>
    `;
  }
}
customElements.define('forge-dialog', ForgeDialog);

export class ForgeProgress extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .progress-wrap { display: flex; flex-direction: column; gap: var(--forge-space-2xs); }
      .progress-header { display: flex; justify-content: space-between; align-items: baseline; gap: var(--forge-space-sm); }
      .progress-label { font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); color: var(--forge-color-text); }
      .progress-value { font-size: var(--forge-text-xs); font-weight: var(--forge-weight-medium); color: var(--forge-color-text-secondary); flex-shrink: 0; }
      .bar-track { height: 8px; background: var(--forge-color-surface-alt); border-radius: var(--forge-radius-full); overflow: hidden; }
      .bar-fill {
        height: 100%;
        border-radius: var(--forge-radius-full);
        background: var(--forge-color-primary);
        transition: width var(--forge-transition-slow);
      }
      .bar-fill.success { background: var(--forge-color-success); }
      .bar-fill.warning { background: var(--forge-color-warning); }
      .bar-fill.error { background: var(--forge-color-error); }
    `;
  }
  render() {
    const value = this.getProp('value') as number | undefined;
    const max = this.getNumber('max', 100);
    const label = this.getString('label', '');
    const showValue = this.getBool('showValue', false);
    const colorVariant = String(this.props?.['colorVariant'] || '');
    const indeterminate = value === undefined;
    const pct = typeof value === 'number' ? `${Math.min(100, Math.max(0, (value / max) * 100))}%` : '0%';
    const displayValue = typeof value === 'number' ? `${value}${max !== 100 ? ' / ' + max : ''}` : (showValue ? '0' : '');

    return html`
      <div class="progress-wrap">
        ${label || showValue ? html`
          <div class="progress-header">
            <span class="progress-label">${label}</span>
            ${showValue || displayValue ? html`<span class="progress-value">${displayValue}</span>` : nothing}
          </div>
        ` : nothing}
        <div class="bar-track">
          <div class="bar-fill ${colorVariant}" style="${indeterminate ? '' : `width:${pct}`}${indeterminate ? ';animation:indeterminate 1.5s ease infinite' : ''}"></div>
        </div>
      </div>
      <style>@keyframes indeterminate { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }</style>
    `;
  }
}
customElements.define('forge-progress', ForgeProgress);

export class ForgeToast extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host {
        display: block;
        position: fixed;
        bottom: var(--forge-space-xl);
        right: var(--forge-space-xl);
        z-index: 60;
        pointer-events: none;
      }
      .toast {
        padding: var(--forge-space-md) var(--forge-space-lg);
        border-radius: var(--forge-radius-xl);
        background: var(--forge-color-text);
        color: var(--forge-color-text-inverse);
        font-size: var(--forge-text-sm);
        box-shadow: var(--forge-shadow-lg);
        max-width: 20rem;
        pointer-events: auto;
      }
    `;
  }
  render() {
    const message = this.getString('message', '');
    if (!message) return html`${nothing}`;
    return html`<div class="toast" role="status">${message}</div>`;
  }
}
customElements.define('forge-toast', ForgeToast);

// ═══════════════════════════════════════════════════════════════
// NAVIGATION (2)
// ═══════════════════════════════════════════════════════════════

export class ForgeBreadcrumb extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: flex; align-items: center; gap: var(--forge-space-xs); font-size: var(--forge-text-sm); }
      .sep { color: var(--forge-color-text-tertiary); }
      a { color: var(--forge-color-primary); text-decoration: none; font-weight: var(--forge-weight-medium); }
      a:hover { text-decoration: underline; }
      .current { color: var(--forge-color-text); font-weight: var(--forge-weight-medium); }
    `;
  }
  render() {
    const items = (this.getProp('items') || []) as any[];
    return html`${items.map((item: any, i: number) => {
      const isLast = i === items.length - 1;
      const label = typeof item === 'string' ? item : item.label;
      const href = typeof item === 'string' ? '#' : item.href;
      return html`
        ${i > 0 ? html`<span class="sep" aria-hidden="true">/</span>` : nothing}
        ${isLast ? html`<span class="current" aria-current="page">${label}</span>` : html`<a href="${href}">${label}</a>`}
      `;
    })}`;
  }
}
customElements.define('forge-breadcrumb', ForgeBreadcrumb);

export class ForgeStepper extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .stepper { display: flex; width: 100%; }
      .step { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; }
      .step:not(:last-child)::after {
        content: '';
        position: absolute;
        top: 0.875rem;
        left: calc(50% + 1rem);
        right: calc(-50% + 1rem);
        height: 2px;
        background: var(--forge-color-border);
        z-index: 0;
      }
      .step.completed:not(:last-child)::after { background: var(--forge-color-success); }
      .circle {
        width: 1.75rem;
        height: 1.75rem;
        border-radius: var(--forge-radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--forge-text-xs);
        font-weight: var(--forge-weight-semibold);
        background: var(--forge-color-surface-alt);
        color: var(--forge-color-text-secondary);
        border: 2px solid var(--forge-color-border);
        z-index: 1;
        transition: all var(--forge-transition-fast);
      }
      .step.active .circle { background: var(--forge-color-primary); color: white; border-color: var(--forge-color-primary); }
      .step.completed .circle { background: var(--forge-color-success); color: white; border-color: var(--forge-color-success); }
      .step-label {
        font-size: var(--forge-text-xs);
        color: var(--forge-color-text-tertiary);
        margin-top: var(--forge-space-xs);
        text-align: center;
        max-width: 6rem;
      }
      .step.active .step-label { color: var(--forge-color-text); font-weight: var(--forge-weight-medium); }
    `;
  }
  render() {
    const steps = (this.getProp('steps') || []) as any[];
    const active = this.getNumber('active', 0);
    return html`
      <div class="stepper" role="list">
        ${steps.map((step: any, i: number) => {
          const label = typeof step === 'string' ? step : step.label;
          const isActive = i === active;
          const isCompleted = i < active;
          return html`
            <div class="step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" role="listitem">
              <div class="circle">${isCompleted ? html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>` : i + 1}</div>
              <div class="step-label">${label}</div>
            </div>
          `;
        })}
      </div>
    `;
  }
}
customElements.define('forge-stepper', ForgeStepper);

// ═══════════════════════════════════════════════════════════════
// ERROR
// ═══════════════════════════════════════════════════════════════

export class ForgeError extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() {
    return css`
      :host { display: block; }
      .error {
        padding: var(--forge-space-md) var(--forge-space-lg);
        background: var(--forge-color-error-subtle);
        color: var(--forge-color-error);
        border: 1px solid var(--forge-color-error);
        border-radius: var(--forge-radius-lg);
        font-size: var(--forge-text-sm);
        display: flex;
        align-items: flex-start;
        gap: var(--forge-space-sm);
      }
    `;
  }
  render() {
    const msg = this.getString('msg', 'Something went wrong');
    return html`
      <div class="error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>${msg}</span>
      </div>
    `;
  }
}
customElements.define('forge-error', ForgeError);

// ═══════════════════════════════════════════════════════════════
// DRAWING (1)
// ═══════════════════════════════════════════════════════════════

export class ForgeDrawing extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`:host { display: block; }`; }
  render() {
    const width = this.getNumber('width', 400);
    const height = this.getNumber('height', 300);
    const background = this.getString('background', 'transparent');
    const shapes = (this.getProp('shapes') || []) as any[];
    return svg`
      <svg width="${width}" height="${height}" style="background:${background}" viewBox="0 0 ${width} ${height}">
        ${shapes.map((s: any) => this.renderShape(s))}
      </svg>
    `;
  }

  renderShape(s: any) {
    const handleClick = s.action ? () => { if (this.onAction) this.onAction(s.action); } : undefined;
    const common = {
      fill: s.fill ?? 'none',
      stroke: s.stroke ?? 'none',
      'stroke-width': s.strokeWidth ?? 0,
      opacity: s.opacity ?? 1,
    };
    const style = s.action ? 'cursor:pointer' : undefined;

    switch (s.type) {
      case 'rect':
        return svg`<rect x="${s.x ?? 0}" y="${s.y ?? 0}" width="${s.width ?? 0}" height="${s.height ?? 0}" rx="${s.rx ?? 0}" fill="${common.fill}" stroke="${common.stroke}" stroke-width="${common['stroke-width']}" opacity="${common.opacity}" style="${style}" @click=${handleClick}/>`;
      case 'circle':
        return svg`<circle cx="${s.cx ?? 0}" cy="${s.cy ?? 0}" r="${s.r ?? 0}" fill="${common.fill}" stroke="${common.stroke}" stroke-width="${common['stroke-width']}" opacity="${common.opacity}" style="${style}" @click=${handleClick}/>`;
      case 'line':
        return svg`<line x1="${s.x1 ?? 0}" y1="${s.y1 ?? 0}" x2="${s.x2 ?? 0}" y2="${s.y2 ?? 0}" stroke="${common.stroke || 'currentColor'}" stroke-width="${common['stroke-width'] || 1}" opacity="${common.opacity}" style="${style}" @click=${handleClick}/>`;
      case 'text':
        return svg`<text x="${s.x ?? 0}" y="${s.y ?? 0}" fill="${common.fill || 'currentColor'}" font-size="${s.fontSize ?? 14}" font-weight="${s.fontWeight ?? 'normal'}" font-family="${s.fontFamily ?? 'sans-serif'}" text-anchor="${s.textAnchor ?? 'start'}" opacity="${common.opacity}" style="${style}" @click=${handleClick}>${s.content ?? ''}</text>`;
      case 'path':
        return svg`<path d="${s.d ?? ''}" fill="${common.fill}" stroke="${common.stroke}" stroke-width="${common['stroke-width']}" opacity="${common.opacity}" style="${style}" @click=${handleClick}/>`;
      default:
        return svg``;
    }
  }
}
customElements.define('forge-drawing', ForgeDrawing);
