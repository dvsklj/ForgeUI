/**
 * ForgeUI — All 36 Lit Web Components
 *
 * Each component extends ForgeElement, uses design tokens via CSS custom properties,
 * renders functional Lit html templates, and dispatches 'forge-action' events.
 */

import { html, css, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { ForgeElement } from './base.js';

// ═══════════════════════════════════════════════════════════════════
// LAYOUT (8)
// ═══════════════════════════════════════════════════════════════════

/** ForgeStack — Flexbox layout container */
export class ForgeStack extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: flex; }
      .stack {
        display: flex;
        flex-direction: var(--stack-dir, column);
        gap: var(--stack-gap, var(--forge-space-md));
        align-items: var(--stack-align, stretch);
        justify-content: var(--stack-justify, flex-start);
        flex-wrap: var(--stack-wrap, nowrap);
        padding: var(--stack-padding, 0);
        width: 100%;
      }
    `,
  ];

  render() {
    const dir = this.prop<string>('direction', 'column');
    const gap = this.gapValue(this.prop<string>('gap', 'md'));
    const align = this.prop<string>('align');
    const justify = this.prop<string>('justify');
    const wrap = this.prop<boolean>('wrap', false);
    const padding = this.prop<string>('padding');
    return html`
      <div class="stack" style="
        --stack-dir: ${dir};
        --stack-gap: ${gap};
        --stack-align: ${align || 'stretch'};
        --stack-justify: ${justify === 'between' ? 'space-between' : justify === 'around' ? 'space-around' : justify === 'evenly' ? 'space-evenly' : justify ? `flex-${justify}` : 'flex-start'};
        --stack-wrap: ${wrap ? 'wrap' : 'nowrap'};
        --stack-padding: ${padding ? this.gapValue(padding) : '0'};
      "><slot></slot></div>
    `;
  }
}
customElements.define('forge-stack', ForgeStack);

/** ForgeGrid — CSS Grid layout */
export class ForgeGrid extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      .grid {
        display: grid;
        gap: var(--grid-gap, var(--forge-space-md));
        padding: var(--grid-padding, 0);
      }
    `,
  ];

  render() {
    const cols = this.prop<number | string>('columns', 1);
    const gap = this.gapValue(this.prop<string>('gap', 'md'));
    const colGap = this.prop<string>('columnGap');
    const rowGap = this.prop<string>('rowGap');
    const align = this.prop<string>('align');
    const padding = this.prop<string>('padding');
    const colTemplate = typeof cols === 'number' ? `repeat(${cols}, 1fr)` : cols;
    return html`
      <div class="grid" style="
        grid-template-columns: ${colTemplate};
        --grid-gap: ${gap};
        ${colGap ? `column-gap: ${this.gapValue(colGap)};` : ''}
        ${rowGap ? `row-gap: ${this.gapValue(rowGap)};` : ''}
        align-items: ${align || 'stretch'};
        --grid-padding: ${padding ? this.gapValue(padding) : '0'};
      "><slot></slot></div>
    `;
  }
}
customElements.define('forge-grid', ForgeGrid);

/** ForgeCard — Elevated surface container */
export class ForgeCard extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .card {
        border-radius: var(--card-radius, var(--forge-radius-lg));
        padding: var(--card-padding, var(--forge-space-lg));
        background: var(--forge-color-surface);
        box-shadow: var(--card-shadow, var(--forge-shadow-md));
        border: var(--card-border, none);
        overflow: hidden;
      }
      .card.alt { background: var(--forge-color-surface-alt); }
      .card-header {
        font-size: var(--forge-text-lg);
        font-weight: var(--forge-weight-semibold);
        margin-bottom: var(--forge-space-sm);
        color: var(--forge-color-text);
      }
    `,
  ];

  render() {
    const elevation = this.prop<string>('elevation', 'md');
    const padding = this.prop<string>('padding', 'lg');
    const radius = this.prop<string>('radius', 'lg');
    const outlined = this.prop<boolean>('outlined', false);
    const header = this.prop<string>('header');
    const surface = this.prop<string>('surface', 'default');
    const shadowMap: Record<string, string> = { none: 'none', sm: 'var(--forge-shadow-sm)', md: 'var(--forge-shadow-md)', lg: 'var(--forge-shadow-lg)' };
    const radiusMap: Record<string, string> = { none: '0', sm: 'var(--forge-radius-sm)', md: 'var(--forge-radius-md)', lg: 'var(--forge-radius-lg)', xl: 'var(--forge-radius-xl)', full: 'var(--forge-radius-full)' };
    return html`
      <div class="card ${surface === 'alt' ? 'alt' : ''}" style="
        --card-radius: ${radiusMap[radius] ?? 'var(--forge-radius-lg)'};
        --card-padding: ${this.gapValue(padding)};
        --card-shadow: ${shadowMap[elevation] ?? 'var(--forge-shadow-md)'};
        --card-border: ${outlined ? '1px solid var(--forge-color-border)' : 'none'};
      ">
        ${header ? html`<div class="card-header">${header}</div>` : nothing}
        <slot></slot>
      </div>
    `;
  }
}
customElements.define('forge-card', ForgeCard);

/** ForgeContainer — Constrained-width wrapper */
export class ForgeContainer extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      .container {
        padding: var(--cont-padding, 0);
        max-width: var(--cont-max, none);
        margin: var(--cont-margin, 0);
        overflow: var(--cont-overflow, visible);
      }
    `,
  ];

  render() {
    const padding = this.prop<string>('padding');
    const maxWidth = this.prop<string>('maxWidth');
    const centered = this.prop<boolean>('centered', false);
    const overflow = this.prop<string>('overflow', 'visible');
    return html`
      <div class="container" style="
        --cont-padding: ${padding ? this.gapValue(padding) : '0'};
        --cont-max: ${maxWidth ?? 'none'};
        --cont-margin: ${centered ? '0 auto' : '0'};
        --cont-overflow: ${overflow};
      "><slot></slot></div>
    `;
  }
}
customElements.define('forge-container', ForgeContainer);

/** ForgeTabs — Tab switcher */
export class ForgeTabs extends ForgeElement {
  @state() private _activeTab = '';

  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .tab-list {
        display: flex;
        border-bottom: 2px solid var(--forge-color-border);
        gap: var(--forge-space-xs);
        overflow-x: auto;
      }
      .tab-btn {
        background: none;
        border: none;
        padding: var(--forge-space-sm) var(--forge-space-md);
        font: inherit;
        color: var(--forge-color-text-secondary);
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: color var(--forge-transition-fast), border-color var(--forge-transition-fast);
        white-space: nowrap;
      }
      .tab-btn:hover { color: var(--forge-color-text); }
      .tab-btn.active {
        color: var(--forge-color-primary);
        border-bottom-color: var(--forge-color-primary);
        font-weight: var(--forge-weight-medium);
      }
      .tab-panel { padding: var(--forge-space-md) 0; }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    const tabs = this.prop<Array<{id: string; label: string}>>('tabs', []);
    const active = this.prop<string>('active');
    this._activeTab = active || (tabs[0]?.id ?? '');
  }

  private _selectTab(id: string) {
    this._activeTab = id;
    this.fireAction('onChange', { tabId: id });
  }

  render() {
    const tabs = this.prop<Array<{id: string; label: string; icon?: string}>>('tabs', []);
    return html`
      <div class="tab-list" role="tablist">
        ${tabs.map(t => html`
          <button class="tab-btn ${this._activeTab === t.id ? 'active' : ''}"
                  role="tab"
                  aria-selected="${this._activeTab === t.id}"
                  @click=${() => this._selectTab(t.id)}>
            ${t.label}
          </button>
        `)}
      </div>
      <div class="tab-panel" role="tabpanel"><slot></slot></div>
    `;
  }
}
customElements.define('forge-tabs', ForgeTabs);

/** ForgeAccordion — Collapsible sections */
export class ForgeAccordion extends ForgeElement {
  @state() private _openItems = new Set<string>();

  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .accordion-item {
        border-bottom: 1px solid var(--forge-color-border);
      }
      .accordion-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        background: none;
        border: none;
        padding: var(--forge-space-md) 0;
        font: inherit;
        color: var(--forge-color-text);
        cursor: pointer;
        text-align: left;
      }
      .accordion-header:hover { color: var(--forge-color-primary); }
      .chevron {
        transition: transform var(--forge-transition-fast);
        font-size: var(--forge-text-sm);
        color: var(--forge-color-text-tertiary);
      }
      .chevron.open { transform: rotate(180deg); }
      .accordion-body {
        overflow: hidden;
        transition: max-height var(--forge-transition-normal);
        padding-bottom: var(--forge-space-md);
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    const items = this.prop<Array<{id: string; title: string; defaultOpen?: boolean}>>('items', []);
    items.forEach(i => { if (i.defaultOpen) this._openItems.add(i.id); });
  }

  private _toggle(id: string) {
    const multiple = this.prop<boolean>('multiple', false);
    if (this._openItems.has(id)) {
      this._openItems.delete(id);
    } else {
      if (!multiple) this._openItems.clear();
      this._openItems.add(id);
    }
    this.requestUpdate();
    this.fireAction('onChange', { openItems: [...this._openItems] });
  }

  render() {
    const items = this.prop<Array<{id: string; title: string; defaultOpen?: boolean}>>('items', []);
    return html`
      ${items.map(item => html`
        <div class="accordion-item">
          <button class="accordion-header" @click=${() => this._toggle(item.id)} aria-expanded="${this._openItems.has(item.id)}">
            <span>${item.title}</span>
            <span class="chevron ${this._openItems.has(item.id) ? 'open' : ''}">▾</span>
          </button>
          ${this._openItems.has(item.id) ? html`<div class="accordion-body"><slot name="${item.id}"></slot></div>` : nothing}
        </div>
      `)}
    `;
  }
}
customElements.define('forge-accordion', ForgeAccordion);

/** ForgeDivider — Horizontal or vertical separator */
export class ForgeDivider extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .divider {
        border: none;
        margin: var(--div-spacing, var(--forge-space-md)) 0;
      }
      .divider.horizontal {
        border-top: 1px solid var(--div-color, var(--forge-color-border));
      }
      .divider.vertical {
        display: inline-block;
        width: 1px;
        height: 100%;
        min-height: 1em;
        border-left: 1px solid var(--div-color, var(--forge-color-border));
        margin: 0 var(--div-spacing, var(--forge-space-md));
        vertical-align: middle;
      }
    `,
  ];

  render() {
    const orientation = this.prop<string>('orientation', 'horizontal');
    const spacing = this.prop<string>('spacing', 'md');
    const color = this.prop<string>('color', 'default');
    return html`
      <hr class="divider ${orientation}" style="
        --div-spacing: ${this.gapValue(spacing)};
        --div-color: ${color === 'strong' ? 'var(--forge-color-border-strong)' : 'var(--forge-color-border)'};
      " />
    `;
  }
}
customElements.define('forge-divider', ForgeDivider);

/** ForgeSpacer — Invisible spacing element */
export class ForgeSpacer extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .spacer { width: 100%; }
    `,
  ];

  render() {
    const size = this.prop<string>('size', 'md');
    return html`<div class="spacer" style="height: ${this.gapValue(size)};"></div>`;
  }
}
customElements.define('forge-spacer', ForgeSpacer);

// ═══════════════════════════════════════════════════════════════════
// CONTENT (6)
// ═══════════════════════════════════════════════════════════════════

/** ForgeText — Typography element */
export class ForgeText extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .text { margin: 0; }
      .text.heading { font-size: var(--forge-text-2xl); font-weight: var(--forge-weight-bold); line-height: var(--forge-leading-tight); }
      .text.subheading { font-size: var(--forge-text-xl); font-weight: var(--forge-weight-semibold); line-height: var(--forge-leading-tight); }
      .text.body { font-size: var(--forge-text-base); font-weight: var(--forge-weight-normal); }
      .text.caption { font-size: var(--forge-text-sm); color: var(--forge-color-text-secondary); }
      .text.code { font-family: var(--forge-font-mono); font-size: var(--forge-text-sm); background: var(--forge-color-surface-alt); padding: var(--forge-space-2xs) var(--forge-space-xs); border-radius: var(--forge-radius-sm); }
      .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .nowrap { white-space: nowrap; }
    `,
  ];

  render() {
    const content = this.prop<string>('content', '');
    const variant = this.prop<string>('variant', 'body');
    const align = this.prop<string>('align');
    const weight = this.prop<string>('weight');
    const color = this.prop<string>('color');
    const truncate = this.prop<boolean>('truncate', false);
    const nowrap = this.prop<boolean>('nowrap', false);
    const colorMap: Record<string, string> = { default: 'var(--forge-color-text)', secondary: 'var(--forge-color-text-secondary)', tertiary: 'var(--forge-color-text-tertiary)', primary: 'var(--forge-color-primary)', success: 'var(--forge-color-success)', warning: 'var(--forge-color-warning)', error: 'var(--forge-color-error)', info: 'var(--forge-color-info)' };
    const weightMap: Record<string, string> = { normal: 'var(--forge-weight-normal)', medium: 'var(--forge-weight-medium)', semibold: 'var(--forge-weight-semibold)', bold: 'var(--forge-weight-bold)' };
    const tag = variant === 'heading' ? 'h2' : variant === 'subheading' ? 'h3' : 'p';
    const classes = `text ${variant} ${truncate ? 'truncate' : ''} ${nowrap ? 'nowrap' : ''}`;
    return html`
      <${tag} class="${classes}" style="
        ${align ? `text-align: ${align};` : ''}
        ${weight ? `font-weight: ${weightMap[weight] ?? weight};` : ''}
        ${color ? `color: ${colorMap[color] ?? color};` : ''}
      ">${content}</${tag}>
    `;
  }
}
customElements.define('forge-text', ForgeText);

/** ForgeImage — Responsive image */
export class ForgeImage extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .img-wrap {
        display: inline-block;
        border-radius: var(--img-radius, 0);
        overflow: hidden;
      }
      .img-wrap img {
        display: block;
        width: var(--img-width, 100%);
        height: var(--img-height, auto);
        object-fit: var(--img-fit, cover);
      }
      .caption {
        font-size: var(--forge-text-sm);
        color: var(--forge-color-text-secondary);
        margin-top: var(--forge-space-2xs);
      }
    `,
  ];

  render() {
    const src = this.prop<string>('src', '');
    const alt = this.prop<string>('alt', '');
    const fit = this.prop<string>('fit', 'cover');
    const width = this.prop<string>('width');
    const height = this.prop<string>('height');
    const radius = this.prop<string>('radius', 'none');
    const caption = this.prop<string>('caption');
    const radiusMap: Record<string, string> = { none: '0', sm: 'var(--forge-radius-sm)', md: 'var(--forge-radius-md)', lg: 'var(--forge-radius-lg)', xl: 'var(--forge-radius-xl)', full: 'var(--forge-radius-full)' };
    if (!src) return html`<div class="img-wrap" style="--img-radius: ${radiusMap[radius]}; --img-width: ${width ?? '100%'}; --img-height: ${height ?? 'auto'}; background: var(--forge-color-surface-alt); min-height: 100px; display: flex; align-items: center; justify-content: center; color: var(--forge-color-text-tertiary);">No image</div>`;
    return html`
      <div class="img-wrap" style="--img-radius: ${radiusMap[radius]}; --img-width: ${width ?? '100%'}; --img-height: ${height ?? 'auto'}; --img-fit: ${fit};">
        <img src="${src}" alt="${alt}" loading="lazy" />
      </div>
      ${caption ? html`<div class="caption">${caption}</div>` : nothing}
    `;
  }
}
customElements.define('forge-image', ForgeImage);

/** ForgeIcon — Built-in SVG icon */
export class ForgeIcon extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: inline-flex; align-items: center; justify-content: center; }
      svg { width: var(--icon-size, var(--forge-icon-md)); height: var(--icon-size, var(--forge-icon-md)); }
    `,
  ];

  /** Minimal SVG paths for built-in icons */
  private static ICON_PATHS: Record<string, string> = {
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    x: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z',
    minus: 'M5 13h14v-2H5z',
    'chevron-down': 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z',
    'chevron-up': 'M7.41 15.41L12 10.83l4.59 4.58L18 13l-6-6-6 6z',
    'chevron-left': 'M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z',
    'chevron-right': 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z',
    'arrow-right': 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z',
    'arrow-left': 'M20 11H7.83l5.58-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z',
    search: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    bell: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
    settings: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.61 3.61 0 0112 15.6z',
    user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
    download: 'M5 20h14v-2H5v2zm7-18l-6 6h4v6h4v-6h4l-6-6z',
    upload: 'M5 20h14v-2H5v2zm7-18L5 8h4v6h4V8h4l-6-6z',
    link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
    'external-link': 'M19 19H5V5h7V3H5a2 2 0 00-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
    info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    'alert-triangle': 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    'check-circle': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    'x-circle': 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z',
    clock: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
    filter: 'M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z',
    sort: 'M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z',
  };

  render() {
    const name = this.prop<string>('name', 'check');
    const size = this.prop<string>('size', 'md');
    const color = this.prop<string>('color', 'default');
    const sizeMap: Record<string, string> = { sm: 'var(--forge-icon-sm)', md: 'var(--forge-icon-md)', lg: 'var(--forge-icon-lg)' };
    const colorMap: Record<string, string> = { default: 'var(--forge-color-text)', primary: 'var(--forge-color-primary)', secondary: 'var(--forge-color-text-secondary)', success: 'var(--forge-color-success)', warning: 'var(--forge-color-warning)', error: 'var(--forge-color-error)', info: 'var(--forge-color-info)' };
    const d = ForgeIcon.ICON_PATHS[name] ?? '';
    return html`
      <svg viewBox="0 0 24 24" fill="currentColor" style="
        --icon-size: ${sizeMap[size] ?? size};
        color: ${colorMap[color] ?? color};
      "><path d="${d}"/></svg>
    `;
  }
}
customElements.define('forge-icon', ForgeIcon);

/** ForgeBadge — Small status indicator */
export class ForgeBadge extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: inline-block; }
      .badge {
        display: inline-flex;
        align-items: center;
        padding: var(--forge-space-2xs) var(--forge-space-xs);
        font-size: var(--badge-size, var(--forge-text-xs));
        font-weight: var(--forge-weight-medium);
        border-radius: var(--badge-radius, var(--forge-radius-full));
        line-height: 1;
      }
      .badge.default { background: var(--forge-color-surface-alt); color: var(--forge-color-text); }
      .badge.primary { background: var(--forge-color-primary-subtle); color: var(--forge-color-primary); }
      .badge.success { background: var(--forge-color-success-subtle); color: var(--forge-color-success); }
      .badge.warning { background: var(--forge-color-warning-subtle); color: var(--forge-color-warning); }
      .badge.error { background: var(--forge-color-error-subtle); color: var(--forge-color-error); }
      .badge.info { background: var(--forge-color-info-subtle); color: var(--forge-color-info); }
      .badge.sm { font-size: var(--forge-text-xs); padding: 1px var(--forge-space-2xs); }
    `,
  ];

  render() {
    const label = this.prop<string>('label', '');
    const variant = this.prop<string>('variant', 'default');
    const size = this.prop<string>('size', 'md');
    const pill = this.prop<boolean>('pill', true);
    return html`
      <span class="badge ${variant} ${size}" style="--badge-radius: ${pill ? 'var(--forge-radius-full)' : 'var(--forge-radius-sm)'};">
        ${label}
      </span>
    `;
  }
}
customElements.define('forge-badge', ForgeBadge);

/** ForgeAvatar — User avatar with initials fallback */
export class ForgeAvatar extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: inline-flex; }
      .avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        overflow: hidden;
        font-weight: var(--forge-weight-semibold);
        color: var(--forge-color-text-inverse);
      }
      .avatar img { width: 100%; height: 100%; object-fit: cover; }
      .avatar.sm { width: 1.5rem; height: 1.5rem; font-size: var(--forge-text-xs); }
      .avatar.md { width: 2.5rem; height: 2.5rem; font-size: var(--forge-text-sm); }
      .avatar.lg { width: 3rem; height: 3rem; font-size: var(--forge-text-base); }
      .avatar.xl { width: 4rem; height: 4rem; font-size: var(--forge-text-xl); }
      .avatar.primary { background: var(--forge-color-primary); }
      .avatar.success { background: var(--forge-color-success); }
      .avatar.warning { background: var(--forge-color-warning); }
      .avatar.error { background: var(--forge-color-error); }
      .avatar.info { background: var(--forge-color-info); }
    `,
  ];

  render() {
    const src = this.prop<string>('src');
    const initials = this.prop<string>('initials');
    const name = this.prop<string>('name');
    const size = this.prop<string>('size', 'md');
    const color = this.prop<string>('color', 'primary');
    const displayInitials = initials ?? (name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?');
    return html`
      <div class="avatar ${size} ${color}">
        ${src ? html`<img src="${src}" alt="${name ?? ''}" />` : html`${displayInitials}`}
      </div>
    `;
  }
}
customElements.define('forge-avatar', ForgeAvatar);

/** ForgeEmptyState — Empty/placeholder display */
export class ForgeEmptyState extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: var(--forge-space-2xl) var(--forge-space-lg);
        color: var(--forge-color-text-tertiary);
      }
      .empty-icon { font-size: 2rem; margin-bottom: var(--forge-space-md); }
      .empty-title {
        font-size: var(--forge-text-lg);
        font-weight: var(--forge-weight-semibold);
        color: var(--forge-color-text-secondary);
        margin-bottom: var(--forge-space-xs);
      }
      .empty-desc {
        font-size: var(--forge-text-sm);
        color: var(--forge-color-text-tertiary);
        margin-bottom: var(--forge-space-lg);
      }
      .empty-action {
        cursor: pointer;
        background: var(--forge-color-primary);
        color: var(--forge-color-text-inverse);
        border: none;
        border-radius: var(--forge-radius-md);
        padding: var(--forge-space-sm) var(--forge-space-lg);
        font: inherit;
        font-weight: var(--forge-weight-medium);
        transition: background var(--forge-transition-fast);
      }
      .empty-action:hover { background: var(--forge-color-primary-hover); }
    `,
  ];

  render() {
    const icon = this.prop<string>('icon');
    const title = this.prop<string>('title', 'No data');
    const description = this.prop<string>('description');
    const actionLabel = this.prop<string>('actionLabel');
    return html`
      <div class="empty">
        ${icon ? html`<div class="empty-icon"><forge-icon name="${icon}" size="lg"></forge-icon></div>` : nothing}
        <div class="empty-title">${title}</div>
        ${description ? html`<div class="empty-desc">${description}</div>` : nothing}
        ${actionLabel ? html`<button class="empty-action" @click=${() => this.fireAction('onAction')}>${actionLabel}</button>` : nothing}
      </div>
    `;
  }
}
customElements.define('forge-empty-state', ForgeEmptyState);

// ═══════════════════════════════════════════════════════════════════
// INPUT (9)
// ═══════════════════════════════════════════════════════════════════

/** ForgeTextInput — Text input field */
export class ForgeTextInput extends ForgeElement {
  @state() private _value = '';
  @state() private _focused = false;

  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .field { margin-bottom: var(--forge-space-xs); }
      .label {
        display: block;
        font-size: var(--forge-text-sm);
        font-weight: var(--forge-weight-medium);
        margin-bottom: var(--forge-space-2xs);
        color: var(--forge-color-text);
      }
      .label .req { color: var(--forge-color-error); margin-left: 2px; }
      .input-wrap {
        display: flex;
        align-items: center;
        border: 1px solid var(--forge-color-border);
        border-radius: var(--forge-radius-md);
        background: var(--forge-color-surface);
        transition: border-color var(--forge-transition-fast), box-shadow var(--forge-transition-fast);
        overflow: hidden;
      }
      .input-wrap:focus-within {
        border-color: var(--forge-color-primary);
        box-shadow: 0 0 0 3px var(--forge-color-primary-subtle);
      }
      .input-wrap.has-error { border-color: var(--forge-color-error); }
      .input-wrap.disabled { background: var(--forge-color-surface-alt); opacity: 0.6; cursor: not-allowed; }
      input {
        flex: 1;
        border: none;
        background: none;
        padding: 0 var(--forge-space-sm);
        height: var(--forge-input-height);
        font: inherit;
        color: var(--forge-color-text);
        outline: none;
        width: 100%;
      }
      input::placeholder { color: var(--forge-color-text-tertiary); }
      .hint { font-size: var(--forge-text-xs); color: var(--forge-color-text-secondary); margin-top: var(--forge-space-2xs); }
      .error { font-size: var(--forge-text-xs); color: var(--forge-color-error); margin-top: var(--forge-space-2xs); }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this._value = String(this.prop<string>('value', ''));
  }

  private _onInput(e: Event) {
    this._value = (e.target as HTMLInputElement).value;
    this.fireAction('onChange', { value: this._value });
  }

  render() {
    const label = this.prop<string>('label');
    const placeholder = this.prop<string>('placeholder', '');
    const type = this.prop<string>('type', 'text');
    const required = this.prop<boolean>('required', false);
    const disabled = this.prop<boolean>('disabled', false);
    const readonly = this.prop<boolean>('readonly', false);
    const error = this.prop<string>('error');
    const hint = this.prop<string>('hint');
    const maxLength = this.prop<number>('maxLength');
    return html`
      <div class="field">
        ${label ? html`<label class="label">${label}${required ? html`<span class="req">*</span>` : nothing}</label>` : nothing}
        <div class="input-wrap ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''}">
          <input type="${type}"
                 .value=${this._value}
                 placeholder="${placeholder}"
                 ?disabled=${disabled}
                 ?readonly=${readonly}
                 ?required=${required}
                 maxlength=${maxLength ?? nothing}
                 @input=${this._onInput} />
        </div>
        ${error ? html`<div class="error">${error}</div>` : hint ? html`<div class="hint">${hint}</div>` : nothing}
      </div>
    `;
  }
}
customElements.define('forge-text-input', ForgeTextInput);

/** ForgeNumberInput — Numeric input with step controls */
export class ForgeNumberInput extends ForgeElement {
  @state() private _value = 0;

  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .field { margin-bottom: var(--forge-space-xs); }
      .label {
        display: block; font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium);
        margin-bottom: var(--forge-space-2xs); color: var(--forge-color-text);
      }
      .label .req { color: var(--forge-color-error); margin-left: 2px; }
      .input-wrap {
        display: flex; align-items: center; border: 1px solid var(--forge-color-border);
        border-radius: var(--forge-radius-md); background: var(--forge-color-surface);
        transition: border-color var(--forge-transition-fast); overflow: hidden;
      }
      .input-wrap:focus-within { border-color: var(--forge-color-primary); box-shadow: 0 0 0 3px var(--forge-color-primary-subtle); }
      .input-wrap.has-error { border-color: var(--forge-color-error); }
      .input-wrap.disabled { background: var(--forge-color-surface-alt); opacity: 0.6; }
      input {
        flex: 1; border: none; background: none; padding: 0 var(--forge-space-sm);
        height: var(--forge-input-height); font: inherit; color: var(--forge-color-text); outline: none; width: 100%;
      }
      .step-btn {
        background: none; border: none; padding: 0 var(--forge-space-sm);
        height: var(--forge-input-height); cursor: pointer; color: var(--forge-color-text-secondary);
        font-size: var(--forge-text-lg); transition: background var(--forge-transition-fast);
      }
      .step-btn:hover { background: var(--forge-color-surface-hover); }
      .hint, .error { font-size: var(--forge-text-xs); margin-top: var(--forge-space-2xs); }
      .hint { color: var(--forge-color-text-secondary); }
      .error { color: var(--forge-color-error); }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this._value = Number(this.prop<number>('value', 0));
  }

  private _step(delta: number) {
    const step = this.prop<number>('step', 1);
    const min = this.prop<number>('min');
    const max = this.prop<number>('max');
    let v = this._value + delta * step;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    this._value = v;
    this.fireAction('onChange', { value: v });
  }

  private _onInput(e: Event) {
    this._value = Number((e.target as HTMLInputElement).value);
    this.fireAction('onChange', { value: this._value });
  }

  render() {
    const label = this.prop<string>('label');
    const min = this.prop<number>('min');
    const max = this.prop<number>('max');
    const step = this.prop<number>('step', 1);
    const required = this.prop<boolean>('required', false);
    const disabled = this.prop<boolean>('disabled', false);
    const error = this.prop<string>('error');
    const hint = this.prop<string>('hint');
    return html`
      <div class="field">
        ${label ? html`<label class="label">${label}${required ? html`<span class="req">*</span>` : nothing}</label>` : nothing}
        <div class="input-wrap ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''}">
          <button class="step-btn" ?disabled=${disabled} @click=${() => this._step(-1)}>−</button>
          <input type="number" .value=${String(this._value)} min=${min ?? nothing} max=${max ?? nothing} step=${step}
                 ?disabled=${disabled} ?required=${required} @input=${this._onInput} />
          <button class="step-btn" ?disabled=${disabled} @click=${() => this._step(1)}>+</button>
        </div>
        ${error ? html`<div class="error">${error}</div>` : hint ? html`<div class="hint">${hint}</div>` : nothing}
      </div>
    `;
  }
}
customElements.define('forge-number-input', ForgeNumberInput);

/** ForgeSelect — Dropdown select */
export class ForgeSelect extends ForgeElement {
  @state() private _open = false;
  @state() private _selected = '';

  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; position: relative; }
      .field { margin-bottom: var(--forge-space-xs); }
      .label { display: block; font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); margin-bottom: var(--forge-space-2xs); color: var(--forge-color-text); }
      .select-btn {
        display: flex; align-items: center; justify-content: space-between;
        width: 100%; height: var(--forge-input-height); padding: 0 var(--forge-space-sm);
        border: 1px solid var(--forge-color-border); border-radius: var(--forge-radius-md);
        background: var(--forge-color-surface); cursor: pointer; font: inherit;
        color: var(--forge-color-text); text-align: left; transition: border-color var(--forge-transition-fast);
      }
      .select-btn:hover { border-color: var(--forge-color-border-strong); }
      .select-btn.open { border-color: var(--forge-color-primary); box-shadow: 0 0 0 3px var(--forge-color-primary-subtle); }
      .select-btn.disabled { opacity: 0.6; cursor: not-allowed; }
      .chevron { font-size: var(--forge-text-sm); color: var(--forge-color-text-tertiary); transition: transform var(--forge-transition-fast); }
      .chevron.open { transform: rotate(180deg); }
      .dropdown {
        position: absolute; top: 100%; left: 0; right: 0; z-index: 10;
        background: var(--forge-color-surface); border: 1px solid var(--forge-color-border);
        border-radius: var(--forge-radius-md); box-shadow: var(--forge-shadow-lg);
        max-height: 200px; overflow-y: auto; margin-top: var(--forge-space-2xs);
      }
      .option {
        padding: var(--forge-space-sm) var(--forge-space-md); cursor: pointer;
        transition: background var(--forge-transition-fast); font-size: var(--forge-text-sm);
      }
      .option:hover { background: var(--forge-color-surface-hover); }
      .option.selected { background: var(--forge-color-primary-subtle); color: var(--forge-color-primary); font-weight: var(--forge-weight-medium); }
      .placeholder { color: var(--forge-color-text-tertiary); }
      .error { font-size: var(--forge-text-xs); color: var(--forge-color-error); margin-top: var(--forge-space-2xs); }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this._selected = String(this.prop<string>('value', ''));
  }

  private _toggle() {
    if (this.prop<boolean>('disabled', false)) return;
    this._open = !this._open;
  }

  private _select(val: string) {
    this._selected = val;
    this._open = false;
    this.fireAction('onChange', { value: val });
  }

  render() {
    const label = this.prop<string>('label');
    const options = this.prop<Array<{value: string; label: string}>>('options', []);
    const placeholder = this.prop<string>('placeholder', 'Select…');
    const disabled = this.prop<boolean>('disabled', false);
    const error = this.prop<string>('error');
    const selectedOpt = options.find(o => o.value === this._selected);
    return html`
      <div class="field">
        ${label ? html`<label class="label">${label}</label>` : nothing}
        <button class="select-btn ${this._open ? 'open' : ''} ${disabled ? 'disabled' : ''}" ?disabled=${disabled} @click=${this._toggle}>
          <span class="${!selectedOpt ? 'placeholder' : ''}">${selectedOpt?.label ?? placeholder}</span>
          <span class="chevron ${this._open ? 'open' : ''}">▾</span>
        </button>
        ${this._open ? html`
          <div class="dropdown">
            ${options.map(o => html`
              <div class="option ${o.value === this._selected ? 'selected' : ''}" @click=${() => this._select(o.value)}>
                ${o.label}
              </div>
            `)}
          </div>
        ` : nothing}
        ${error ? html`<div class="error">${error}</div>` : nothing}
      </div>
    `;
  }
}
customElements.define('forge-select', ForgeSelect);

/** ForgeMultiSelect — Multi-value dropdown */
export class ForgeMultiSelect extends ForgeElement {
  @state() private _open = false;
  @state() private _selected: string[] = [];

  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; position: relative; }
      .field { margin-bottom: var(--forge-space-xs); }
      .label { display: block; font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); margin-bottom: var(--forge-space-2xs); }
      .select-btn {
        display: flex; align-items: center; flex-wrap: wrap; gap: var(--forge-space-2xs);
        min-height: var(--forge-input-height); padding: var(--forge-space-2xs) var(--forge-space-sm);
        border: 1px solid var(--forge-color-border); border-radius: var(--forge-radius-md);
        background: var(--forge-color-surface); cursor: pointer; font: inherit;
        color: var(--forge-color-text); width: 100%; text-align: left; transition: border-color var(--forge-transition-fast);
      }
      .select-btn.open { border-color: var(--forge-color-primary); box-shadow: 0 0 0 3px var(--forge-color-primary-subtle); }
      .select-btn.disabled { opacity: 0.6; cursor: not-allowed; }
      .chip {
        display: inline-flex; align-items: center; gap: var(--forge-space-2xs);
        background: var(--forge-color-primary-subtle); color: var(--forge-color-primary);
        padding: 1px var(--forge-space-xs); border-radius: var(--forge-radius-full); font-size: var(--forge-text-xs);
      }
      .chip-x { cursor: pointer; font-size: 0.7em; }
      .placeholder { color: var(--forge-color-text-tertiary); }
      .dropdown {
        position: absolute; top: 100%; left: 0; right: 0; z-index: 10;
        background: var(--forge-color-surface); border: 1px solid var(--forge-color-border);
        border-radius: var(--forge-radius-md); box-shadow: var(--forge-shadow-lg);
        max-height: 200px; overflow-y: auto; margin-top: var(--forge-space-2xs);
      }
      .option { padding: var(--forge-space-sm) var(--forge-space-md); cursor: pointer; transition: background var(--forge-transition-fast); font-size: var(--forge-text-sm); display: flex; align-items: center; gap: var(--forge-space-xs); }
      .option:hover { background: var(--forge-color-surface-hover); }
      .option.selected { background: var(--forge-color-primary-subtle); }
      .check-mark { color: var(--forge-color-primary); }
      .error { font-size: var(--forge-text-xs); color: var(--forge-color-error); margin-top: var(--forge-space-2xs); }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this._selected = [...(this.prop<string[]>('values', []))];
  }

  private _toggle(val: string) {
    const idx = this._selected.indexOf(val);
    if (idx >= 0) this._selected.splice(idx, 1);
    else this._selected.push(val);
    this.requestUpdate();
    this.fireAction('onChange', { values: [...this._selected] });
  }

  private _removeChip(val: string, e: Event) {
    e.stopPropagation();
    this._selected = this._selected.filter(v => v !== val);
    this.fireAction('onChange', { values: [...this._selected] });
  }

  render() {
    const label = this.prop<string>('label');
    const options = this.prop<Array<{value: string; label: string}>>('options', []);
    const placeholder = this.prop<string>('placeholder', 'Select…');
    const disabled = this.prop<boolean>('disabled', false);
    const error = this.prop<string>('error');
    const selectedLabels = options.filter(o => this._selected.includes(o.value));
    return html`
      <div class="field">
        ${label ? html`<label class="label">${label}</label>` : nothing}
        <div class="select-btn ${this._open ? 'open' : ''} ${disabled ? 'disabled' : ''}" @click=${() => { if (!disabled) this._open = !this._open; }}>
          ${selectedLabels.length ? selectedLabels.map(o => html`
            <span class="chip">${o.label}<span class="chip-x" @click=${(e: Event) => this._removeChip(o.value, e)}>×</span></span>
          `) : html`<span class="placeholder">${placeholder}</span>`}
        </div>
        ${this._open ? html`
          <div class="dropdown">
            ${options.map(o => html`
              <div class="option ${this._selected.includes(o.value) ? 'selected' : ''}" @click=${() => this._toggle(o.value)}>
                ${this._selected.includes(o.value) ? html`<span class="check-mark">✓</span>` : html`<span style="width:1em"></span>`}
                ${o.label}
              </div>
            `)}
          </div>
        ` : nothing}
        ${error ? html`<div class="error">${error}</div>` : nothing}
      </div>
    `;
  }
}
customElements.define('forge-multi-select', ForgeMultiSelect);

/** ForgeCheckbox — Checkbox input */
export class ForgeCheckbox extends ForgeElement {
  @state() private _checked = false;

  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .check-wrap {
        display: flex; align-items: center; gap: var(--forge-space-xs);
        cursor: pointer; user-select: none; min-height: var(--forge-touch-target);
      }
      .check-wrap.disabled { opacity: 0.6; cursor: not-allowed; }
      .box {
        width: 1.125rem; height: 1.125rem; border: 2px solid var(--forge-color-border-strong);
        border-radius: var(--forge-radius-sm); display: flex; align-items: center;
        justify-content: center; transition: all var(--forge-transition-fast);
        flex-shrink: 0;
      }
      .box.checked { background: var(--forge-color-primary); border-color: var(--forge-color-primary); }
      .box.indeterminate { background: var(--forge-color-primary); border-color: var(--forge-color-primary); }
      .box svg { color: var(--forge-color-text-inverse); width: 0.875rem; height: 0.875rem; }
      .label { font-size: var(--forge-text-base); color: var(--forge-color-text); }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this._checked = Boolean(this.prop<boolean>('checked', false));
  }

  private _toggle() {
    if (this.prop<boolean>('disabled', false)) return;
    this._checked = !this._checked;
    this.fireAction('onChange', { checked: this._checked });
  }

  render() {
    const label = this.prop<string>('label', '');
    const disabled = this.prop<boolean>('disabled', false);
    const indeterminate = this.prop<boolean>('indeterminate', false);
    return html`
      <label class="check-wrap ${disabled ? 'disabled' : ''}" @click=${this._toggle}>
        <span class="box ${this._checked ? 'checked' : ''} ${indeterminate ? 'indeterminate' : ''}">
          ${indeterminate ? html`<svg viewBox="0 0 24 24"><path d="M5 13h14v-2H5z" fill="currentColor"/></svg>` : this._checked ? html`<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>` : nothing}
        </span>
        ${label ? html`<span class="label">${label}</span>` : nothing}
      </label>
    `;
  }
}
customElements.define('forge-checkbox', ForgeCheckbox);

/** ForgeToggle — Toggle switch */
export class ForgeToggle extends ForgeElement {
  @state() private _checked = false;

  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .toggle-wrap {
        display: flex; align-items: center; gap: var(--forge-space-sm);
        cursor: pointer; user-select: none; min-height: var(--forge-touch-target);
      }
      .toggle-wrap.disabled { opacity: 0.6; cursor: not-allowed; }
      .track {
        width: 2.75rem; height: 1.5rem; border-radius: var(--forge-radius-full);
        background: var(--forge-color-border-strong); position: relative;
        transition: background var(--forge-transition-fast); flex-shrink: 0;
      }
      .track.on { background: var(--forge-color-primary); }
      .thumb {
        position: absolute; top: 2px; left: 2px;
        width: 1.25rem; height: 1.25rem; border-radius: 50%;
        background: var(--forge-color-text-inverse); box-shadow: var(--forge-shadow-sm);
        transition: transform var(--forge-transition-fast);
      }
      .track.on .thumb { transform: translateX(1.25rem); }
      .label { font-size: var(--forge-text-base); color: var(--forge-color-text); }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this._checked = Boolean(this.prop<boolean>('checked', false));
  }

  private _toggle() {
    if (this.prop<boolean>('disabled', false)) return;
    this._checked = !this._checked;
    this.fireAction('onChange', { checked: this._checked });
  }

  render() {
    const label = this.prop<string>('label', '');
    const disabled = this.prop<boolean>('disabled', false);
    return html`
      <label class="toggle-wrap ${disabled ? 'disabled' : ''}" @click=${this._toggle}>
        <span class="track ${this._checked ? 'on' : ''}"><span class="thumb"></span></span>
        ${label ? html`<span class="label">${label}</span>` : nothing}
      </label>
    `;
  }
}
customElements.define('forge-toggle', ForgeToggle);

/** ForgeDatePicker — Date input */
export class ForgeDatePicker extends ForgeElement {
  @state() private _value = '';

  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .field { margin-bottom: var(--forge-space-xs); }
      .label { display: block; font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); margin-bottom: var(--forge-space-2xs); }
      input {
        width: 100%; height: var(--forge-input-height); padding: 0 var(--forge-space-sm);
        border: 1px solid var(--forge-color-border); border-radius: var(--forge-radius-md);
        background: var(--forge-color-surface); font: inherit; color: var(--forge-color-text);
        transition: border-color var(--forge-transition-fast); box-sizing: border-box;
      }
      input:focus { border-color: var(--forge-color-primary); box-shadow: 0 0 0 3px var(--forge-color-primary-subtle); outline: none; }
      input:disabled { opacity: 0.6; cursor: not-allowed; background: var(--forge-color-surface-alt); }
      .error { font-size: var(--forge-text-xs); color: var(--forge-color-error); margin-top: var(--forge-space-2xs); }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this._value = String(this.prop<string>('value', ''));
  }

  private _onInput(e: Event) {
    this._value = (e.target as HTMLInputElement).value;
    this.fireAction('onChange', { value: this._value });
  }

  render() {
    const label = this.prop<string>('label');
    const min = this.prop<string>('min');
    const max = this.prop<string>('max');
    const disabled = this.prop<boolean>('disabled', false);
    const error = this.prop<string>('error');
    return html`
      <div class="field">
        ${label ? html`<label class="label">${label}</label>` : nothing}
        <input type="date" .value=${this._value} min=${min ?? nothing} max=${max ?? nothing}
               ?disabled=${disabled} @input=${this._onInput} />
        ${error ? html`<div class="error">${error}</div>` : nothing}
      </div>
    `;
  }
}
customElements.define('forge-date-picker', ForgeDatePicker);

/** ForgeSlider — Range slider */
export class ForgeSlider extends ForgeElement {
  @state() private _value = 50;

  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .field { margin-bottom: var(--forge-space-xs); }
      .label { display: block; font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); margin-bottom: var(--forge-space-xs); }
      .slider-row { display: flex; align-items: center; gap: var(--forge-space-sm); }
      input[type=range] {
        flex: 1; appearance: none; height: 6px; background: var(--forge-color-border);
        border-radius: var(--forge-radius-full); outline: none; cursor: pointer;
      }
      input[type=range]::-webkit-slider-thumb {
        appearance: none; width: 1.25rem; height: 1.25rem; background: var(--forge-color-primary);
        border-radius: 50%; cursor: pointer; border: 2px solid var(--forge-color-surface);
        box-shadow: var(--forge-shadow-sm);
      }
      input[type=range]:disabled { opacity: 0.6; cursor: not-allowed; }
      .val { font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); color: var(--forge-color-text); min-width: 2.5rem; text-align: right; }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this._value = Number(this.prop<number>('value', 50));
  }

  private _onInput(e: Event) {
    this._value = Number((e.target as HTMLInputElement).value);
    this.fireAction('onChange', { value: this._value });
  }

  render() {
    const label = this.prop<string>('label');
    const min = this.prop<number>('min', 0);
    const max = this.prop<number>('max', 100);
    const step = this.prop<number>('step', 1);
    const disabled = this.prop<boolean>('disabled', false);
    const showValue = this.prop<boolean>('showValue', true);
    return html`
      <div class="field">
        ${label ? html`<label class="label">${label}</label>` : nothing}
        <div class="slider-row">
          <input type="range" .value=${String(this._value)} min=${min} max=${max} step=${step}
                 ?disabled=${disabled} @input=${this._onInput} />
          ${showValue ? html`<span class="val">${this._value}</span>` : nothing}
        </div>
      </div>
    `;
  }
}
customElements.define('forge-slider', ForgeSlider);

/** ForgeFileUpload — File upload area */
export class ForgeFileUpload extends ForgeElement {
  @state() private _dragging = false;
  @state() private _files: File[] = [];

  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .field { margin-bottom: var(--forge-space-xs); }
      .label { display: block; font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); margin-bottom: var(--forge-space-2xs); }
      .drop-zone {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: var(--forge-space-xl); border: 2px dashed var(--forge-color-border);
        border-radius: var(--forge-radius-md); background: var(--forge-color-surface);
        text-align: center; cursor: pointer; transition: all var(--forge-transition-fast);
        color: var(--forge-color-text-secondary);
      }
      .drop-zone.dragging { border-color: var(--forge-color-primary); background: var(--forge-color-primary-subtle); }
      .drop-zone.disabled { opacity: 0.6; cursor: not-allowed; }
      .drop-icon { font-size: 1.5rem; margin-bottom: var(--forge-space-sm); }
      .drop-text { font-size: var(--forge-text-sm); }
      .browse { color: var(--forge-color-primary); text-decoration: underline; cursor: pointer; }
      .file-list { margin-top: var(--forge-space-sm); }
      .file-item { display: flex; align-items: center; gap: var(--forge-space-xs); padding: var(--forge-space-2xs) 0; font-size: var(--forge-text-sm); }
      .file-remove { background: none; border: none; cursor: pointer; color: var(--forge-color-error); padding: 0; font-size: var(--forge-text-lg); line-height: 1; }
      input[type=file] { display: none; }
    `,
  ];

  private _handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const multiple = this.prop<boolean>('multiple', false);
    const maxSize = this.prop<number>('maxSize');
    const newFiles = [...fileList].filter(f => !maxSize || f.size <= maxSize);
    if (multiple) {
      this._files = [...this._files, ...newFiles];
    } else {
      this._files = newFiles.slice(0, 1);
    }
    this.fireAction('onUpload', { files: this._files.map(f => f.name) });
  }

  render() {
    const label = this.prop<string>('label');
    const accept = this.prop<string>('accept');
    const multiple = this.prop<boolean>('multiple', false);
    const disabled = this.prop<boolean>('disabled', false);
    const dragDrop = this.prop<boolean>('dragDrop', true);
    return html`
      <div class="field">
        ${label ? html`<label class="label">${label}</label>` : nothing}
        <div class="drop-zone ${this._dragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}"
             @click=${() => { if (!disabled) (this.shadowRoot?.querySelector('input') as HTMLInputElement)?.click(); }}
             @dragover=${(e: DragEvent) => { e.preventDefault(); if (dragDrop && !disabled) this._dragging = true; }}
             @dragleave=${() => { this._dragging = false; }}
             @drop=${(e: DragEvent) => { e.preventDefault(); this._dragging = false; if (!disabled) this._handleFiles(e.dataTransfer?.files ?? null); }}>
          <div class="drop-icon">📁</div>
          <div class="drop-text">Drag files here or <span class="browse">browse</span></div>
        </div>
        <input type="file" accept=${accept ?? ''} ?multiple=${multiple} ?disabled=${disabled}
               @change=${(e: Event) => this._handleFiles((e.target as HTMLInputElement).files)} />
        ${this._files.length ? html`
          <div class="file-list">
            ${this._files.map((f, i) => html`
              <div class="file-item">
                📄 ${f.name}
                <button class="file-remove" @click=${() => { this._files.splice(i, 1); this.requestUpdate(); }}>×</button>
              </div>
            `)}
          </div>
        ` : nothing}
      </div>
    `;
  }
}
customElements.define('forge-file-upload', ForgeFileUpload);

// ═══════════════════════════════════════════════════════════════════
// ACTION (3)
// ═══════════════════════════════════════════════════════════════════

/** ForgeButton — Clickable button */
export class ForgeButton extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: inline-block; }
      button {
        display: inline-flex; align-items: center; justify-content: center; gap: var(--forge-space-xs);
        height: var(--btn-h, var(--forge-button-height)); padding: 0 var(--forge-space-lg);
        border: none; border-radius: var(--forge-radius-md); font: inherit;
        font-weight: var(--forge-weight-medium); cursor: pointer;
        transition: all var(--forge-transition-fast); white-space: nowrap;
        position: relative; overflow: hidden;
      }
      button:disabled { opacity: 0.6; cursor: not-allowed; }
      button.full { width: 100%; }
      /* Variants */
      .primary { background: var(--forge-color-primary); color: var(--forge-color-text-inverse); }
      .primary:hover:not(:disabled) { background: var(--forge-color-primary-hover); }
      .primary:active:not(:disabled) { background: var(--forge-color-primary-active); }
      .secondary { background: transparent; color: var(--forge-color-primary); border: 1px solid var(--forge-color-primary); }
      .secondary:hover:not(:disabled) { background: var(--forge-color-primary-subtle); }
      .ghost { background: transparent; color: var(--forge-color-primary); }
      .ghost:hover:not(:disabled) { background: var(--forge-color-primary-subtle); }
      .danger { background: var(--forge-color-error); color: var(--forge-color-text-inverse); }
      .danger:hover:not(:disabled) { background: #dc2626; }
      /* Sizes */
      .sm { --btn-h: 2rem; padding: 0 var(--forge-space-sm); font-size: var(--forge-text-sm); }
      .lg { --btn-h: 3rem; padding: 0 var(--forge-space-xl); font-size: var(--forge-text-lg); }
      /* Loading */
      .loading { pointer-events: none; }
      .spinner {
        width: 1em; height: 1em; border: 2px solid currentColor;
        border-top-color: transparent; border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `,
  ];

  render() {
    const label = this.prop<string>('label', 'Button');
    const variant = this.prop<string>('variant', 'primary');
    const size = this.prop<string>('size', 'md');
    const disabled = this.prop<boolean>('disabled', false);
    const loading = this.prop<boolean>('loading', false);
    const fullWidth = this.prop<boolean>('fullWidth', false);
    const icon = this.prop<string>('icon');
    const iconRight = this.prop<string>('iconRight');
    return html`
      <button class="${variant} ${size} ${fullWidth ? 'full' : ''} ${loading ? 'loading' : ''}"
              ?disabled=${disabled || loading}
              @click=${() => this.fireAction('onClick')}>
        ${loading ? html`<span class="spinner"></span>` : nothing}
        ${!loading && icon ? html`<forge-icon name="${icon}" size="sm"></forge-icon>` : nothing}
        ${label}
        ${iconRight ? html`<forge-icon name="${iconRight}" size="sm"></forge-icon>` : nothing}
      </button>
    `;
  }
}
customElements.define('forge-button', ForgeButton);

/** ForgeButtonGroup — Group of buttons */
export class ForgeButtonGroup extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .btn-group {
        display: flex; gap: var(--forge-space-xs);
      }
      .btn-group.column { flex-direction: column; }
    `,
  ];

  render() {
    const buttons = this.prop<Array<{id: string; label: string; variant?: string; icon?: string; disabled?: boolean; onClick?: string}>>('buttons', []);
    const size = this.prop<string>('size', 'md');
    const direction = this.prop<string>('direction', 'row');
    return html`
      <div class="btn-group ${direction === 'column' ? 'column' : ''}">
        ${buttons.map(btn => html`
          <forge-button .props=${{ label: btn.label, variant: btn.variant ?? 'secondary', size, icon: btn.icon, disabled: btn.disabled, onClick: btn.onClick }}></forge-button>
        `)}
      </div>
    `;
  }
}
customElements.define('forge-button-group', ForgeButtonGroup);

/** ForgeLink — Navigation link */
export class ForgeLink extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: inline-block; }
      a, span {
        display: inline-flex; align-items: center; gap: var(--forge-space-2xs);
        color: var(--link-color, var(--forge-color-primary));
        text-decoration: underline; cursor: pointer; font-size: var(--forge-text-base);
        transition: color var(--forge-transition-fast);
      }
      a:hover, span:hover { color: var(--forge-color-primary-hover); }
      .muted { color: var(--forge-color-text-secondary); text-decoration: none; }
      .muted:hover { color: var(--forge-color-text); }
      .disabled { opacity: 0.6; cursor: not-allowed; pointer-events: none; }
    `,
  ];

  render() {
    const label = this.prop<string>('label', '');
    const href = this.prop<string>('href');
    const target = this.prop<string>('target', '_self');
    const variant = this.prop<string>('variant', 'default');
    const disabled = this.prop<boolean>('disabled', false);
    const icon = this.prop<string>('icon');
    const cls = `${variant} ${disabled ? 'disabled' : ''}`;
    const content = html`${icon ? html`<forge-icon name="${icon}" size="sm"></forge-icon>` : nothing}${label}`;
    if (href && !disabled) {
      return html`<a href="${href}" target="${target}" class="${cls}">${content}</a>`;
    }
    return html`<span class="${cls}" @click=${() => this.fireAction('onClick')}>${content}</span>`;
  }
}
customElements.define('forge-link', ForgeLink);

// ═══════════════════════════════════════════════════════════════════
// DATA DISPLAY (4)
// ═══════════════════════════════════════════════════════════════════

/** ForgeTable — Data table with sorting and pagination */
export class ForgeTable extends ForgeElement {
  @state() private _sortKey = '';
  @state() private _sortDir: 'asc' | 'desc' = 'asc';
  @state() private _page = 0;

  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; font-size: var(--forge-text-sm); }
      th {
        text-align: left; padding: var(--forge-space-sm) var(--forge-space-md);
        font-weight: var(--forge-weight-semibold); color: var(--forge-color-text-secondary);
        border-bottom: 2px solid var(--forge-color-border); white-space: nowrap;
      }
      th.sortable { cursor: pointer; user-select: none; }
      th.sortable:hover { color: var(--forge-color-text); }
      th .sort-arrow { margin-left: var(--forge-space-2xs); font-size: 0.75em; }
      td {
        padding: var(--forge-space-sm) var(--forge-space-md);
        border-bottom: 1px solid var(--forge-color-border);
        color: var(--forge-color-text);
      }
      tr.stripe { background: var(--forge-color-surface-alt); }
      .compact th, .compact td { padding: var(--forge-space-xs) var(--forge-space-sm); }
      .bordered th, .bordered td { border: 1px solid var(--forge-color-border); }
      .empty { text-align: center; padding: var(--forge-space-xl); color: var(--forge-color-text-tertiary); }
      .pagination {
        display: flex; align-items: center; justify-content: center; gap: var(--forge-space-xs);
        padding: var(--forge-space-sm); font-size: var(--forge-text-sm);
      }
      .page-btn {
        background: none; border: 1px solid var(--forge-color-border); border-radius: var(--forge-radius-sm);
        padding: var(--forge-space-2xs) var(--forge-space-xs); cursor: pointer; font: inherit;
        color: var(--forge-color-text); transition: all var(--forge-transition-fast);
      }
      .page-btn:hover { background: var(--forge-color-surface-hover); }
      .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .page-btn.active { background: var(--forge-color-primary); color: var(--forge-color-text-inverse); border-color: var(--forge-color-primary); }
    `,
  ];

  private _sort(key: string) {
    if (this._sortKey === key) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortKey = key;
      this._sortDir = 'asc';
    }
  }

  render() {
    const columns = this.prop<Array<{key: string; label: string; align?: string; width?: string; sortable?: boolean}>>('columns', []);
    const rows = this.prop<Array<Record<string, unknown>>>('rows', []);
    const stripe = this.prop<boolean>('stripe', true);
    const border = this.prop<boolean>('border', false);
    const compact = this.prop<boolean>('compact', false);
    const emptyMessage = this.prop<string>('emptyMessage', 'No data');
    const pageSize = this.prop<number>('pageSize');

    let displayRows = [...rows];
    if (this._sortKey) {
      displayRows.sort((a, b) => {
        const va = a[this._sortKey] ?? '';
        const vb = b[this._sortKey] ?? '';
        const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
        return this._sortDir === 'asc' ? cmp : -cmp;
      });
    }

    let totalPages = 1;
    if (pageSize && pageSize > 0) {
      totalPages = Math.max(1, Math.ceil(displayRows.length / pageSize));
      const start = this._page * pageSize;
      displayRows = displayRows.slice(start, start + pageSize);
    }

    return html`
      <div class="table-wrap">
        <table class="${compact ? 'compact' : ''} ${border ? 'bordered' : ''}">
          <thead>
            <tr>
              ${columns.map(col => html`
                <th class="${col.sortable ? 'sortable' : ''}"
                    style="text-align: ${col.align ?? 'left'}; ${col.width ? `width: ${col.width}` : ''}"
                    @click=${() => col.sortable ? this._sort(col.key) : nothing}>
                  ${col.label}
                  ${col.sortable && this._sortKey === col.key ? html`<span class="sort-arrow">${this._sortDir === 'asc' ? '↑' : '↓'}</span>` : nothing}
                </th>
              `)}
            </tr>
          </thead>
          <tbody>
            ${displayRows.length ? displayRows.map((row, i) => html`
              <tr class="${stripe && i % 2 === 1 ? 'stripe' : ''}">
                ${columns.map(col => html`<td style="text-align: ${col.align ?? 'left'}">${row[col.key] ?? ''}</td>`)}
              </tr>
            `) : html`<tr><td colspan="${columns.length}" class="empty">${emptyMessage}</td></tr>`}
          </tbody>
        </table>
      </div>
      ${pageSize && totalPages > 1 ? html`
        <div class="pagination">
          <button class="page-btn" ?disabled=${this._page === 0} @click=${() => { this._page--; this.fireAction('onPageChange', { page: this._page }); }}>←</button>
          ${Array.from({ length: totalPages }, (_, i) => html`
            <button class="page-btn ${this._page === i ? 'active' : ''}" @click=${() => { this._page = i; this.fireAction('onPageChange', { page: i }); }}>${i + 1}</button>
          `)}
          <button class="page-btn" ?disabled=${this._page >= totalPages - 1} @click=${() => { this._page++; this.fireAction('onPageChange', { page: this._page }); }}>→</button>
        </div>
      ` : nothing}
    `;
  }
}
customElements.define('forge-table', ForgeTable);

/** ForgeList — List of items */
export class ForgeList extends ForgeElement {
  @state() private _selected = '';

  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .list { border-radius: var(--forge-radius-md); overflow: hidden; }
      .list-item {
        display: flex; align-items: center; gap: var(--forge-space-sm);
        padding: var(--list-pad, var(--forge-space-md));
        transition: background var(--forge-transition-fast);
        cursor: default;
      }
      .list-item.selectable { cursor: pointer; }
      .list-item.selectable:hover { background: var(--forge-color-surface-hover); }
      .list-item.selected { background: var(--forge-color-primary-subtle); }
      .list-item.divider { border-bottom: 1px solid var(--forge-color-border); }
      .list-item.compact { --list-pad: var(--forge-space-xs) var(--forge-space-md); }
      .list-item.comfortable { --list-pad: var(--forge-space-lg) var(--forge-space-md); }
      .item-avatar { width: 2rem; height: 2rem; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
      .item-icon { color: var(--forge-color-text-tertiary); flex-shrink: 0; }
      .item-content { flex: 1; min-width: 0; }
      .item-title { font-size: var(--forge-text-base); color: var(--forge-color-text); }
      .item-subtitle { font-size: var(--forge-text-sm); color: var(--forge-color-text-secondary); }
    `,
  ];

  render() {
    const items = this.prop<Array<{id: string; title: string; subtitle?: string; icon?: string; avatar?: string}>>('items', []);
    const selectable = this.prop<boolean>('selectable', false);
    const density = this.prop<string>('density', 'normal');
    const dividers = this.prop<boolean>('dividers', true);
    return html`
      <div class="list">
        ${items.map((item, i) => html`
          <div class="list-item ${selectable ? 'selectable' : ''} ${this._selected === item.id ? 'selected' : ''} ${density} ${dividers && i < items.length - 1 ? 'divider' : ''}"
               @click=${() => { if (selectable) { this._selected = item.id; this.fireAction('onSelect', { id: item.id }); } }}>
            ${item.avatar ? html`<img class="item-avatar" src="${item.avatar}" alt="" />` : item.icon ? html`<span class="item-icon"><forge-icon name="${item.icon}" size="sm"></forge-icon></span>` : nothing}
            <div class="item-content">
              <div class="item-title">${item.title}</div>
              ${item.subtitle ? html`<div class="item-subtitle">${item.subtitle}</div>` : nothing}
            </div>
          </div>
        `)}
      </div>
    `;
  }
}
customElements.define('forge-list', ForgeList);

/** ForgeChart — Simple SVG chart (bar, line, donut, area, scatter) */
export class ForgeChart extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .chart-wrap { position: relative; }
      .chart-title { font-size: var(--forge-text-lg); font-weight: var(--forge-weight-semibold); margin-bottom: var(--forge-space-sm); }
      svg { display: block; }
      .legend {
        display: flex; flex-wrap: wrap; gap: var(--forge-space-sm);
        margin-top: var(--forge-space-sm); font-size: var(--forge-text-sm);
      }
      .legend-item { display: flex; align-items: center; gap: var(--forge-space-2xs); }
      .legend-swatch { width: 0.75rem; height: 0.75rem; border-radius: 2px; }
    `,
  ];

  private _colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6'];

  render() {
    const type = this.prop<string>('type', 'bar');
    const data = this.prop<{labels: string[]; datasets: Array<{label?: string; values: number[]; color?: string}>}>('data', { labels: [], datasets: [] });
    const width = this.prop<string>('width', '100%');
    const height = this.prop<string>('height', '200px');
    const showLegend = this.prop<boolean>('showLegend', true);
    const showValues = this.prop<boolean>('showValues', false);
    const title = this.prop<string>('title');

    const W = 400;
    const H = 200;
    const pad = 30;
    const plotW = W - pad * 2;
    const plotH = H - pad * 2;

    if (!data.labels.length || !data.datasets.length) {
      return html`<div class="chart-wrap" style="width: ${width};"><div style="height: ${height}; display: flex; align-items: center; justify-content: center; color: var(--forge-color-text-tertiary);">No data</div></div>`;
    }

    const allValues = data.datasets.flatMap(d => d.values);
    const maxVal = Math.max(...allValues, 1);

    let svgContent: TemplateResult = html``;

    if (type === 'bar') {
      const barGroupWidth = plotW / data.labels.length;
      const barWidth = Math.min(barGroupWidth * 0.6 / data.datasets.length, 40);
      const groupPad = (barGroupWidth - barWidth * data.datasets.length) / 2;
      svgContent = html`
        ${data.datasets.map((ds, di) => {
          const color = ds.color || this._colors[di % this._colors.length];
          return data.values.map((v, li) => {
            const barH = (v / maxVal) * plotH;
            const x = pad + li * barGroupWidth + groupPad + di * barWidth;
            const y = H - pad - barH;
            return html`<rect x=${x} y=${y} width=${barWidth} height=${barH} fill=${color} rx="2" />${showValues ? html`<text x=${x + barWidth / 2} y=${y - 4} text-anchor="middle" font-size="10" fill="var(--forge-color-text-secondary)">${v}</text>` : nothing}`;
          });
        })}
        ${data.labels.map((l, i) => html`<text x=${pad + i * barGroupWidth + barGroupWidth / 2} y=${H - 8} text-anchor="middle" font-size="10" fill="var(--forge-color-text-secondary)">${l}</text>`)}
      `;
    } else if (type === 'line' || type === 'area') {
      svgContent = html`
        ${data.datasets.map((ds, di) => {
          const color = ds.color || this._colors[di % this._colors.length];
          const points = ds.values.map((v, i) => {
            const x = pad + (i / Math.max(ds.values.length - 1, 1)) * plotW;
            const y = H - pad - (v / maxVal) * plotH;
            return `${x},${y}`;
          });
          const pathD = `M${points.join('L')}`;
          const areaD = type === 'area' ? `${pathD}L${pad + plotW},${H - pad}L${pad},${H - pad}Z` : '';
          return html`
            ${type === 'area' ? html`<path d=${areaD} fill=${color} opacity="0.15" />` : nothing}
            <path d=${pathD} fill="none" stroke=${color} stroke-width="2" />
            ${ds.values.map((v, i) => {
              const x = pad + (i / Math.max(ds.values.length - 1, 1)) * plotW;
              const y = H - pad - (v / maxVal) * plotH;
              return html`<circle cx=${x} cy=${y} r="3" fill=${color} />${showValues ? html`<text x=${x} y=${y - 8} text-anchor="middle" font-size="9" fill="var(--forge-color-text-secondary)">${v}</text>` : nothing}`;
            })}
          `;
        })}
        ${data.labels.map((l, i) => html`<text x=${pad + (i / Math.max(data.labels.length - 1, 1)) * plotW} y=${H - 8} text-anchor="middle" font-size="10" fill="var(--forge-color-text-secondary)">${l}</text>`)}
      `;
    } else if (type === 'donut') {
      const ds = data.datasets[0];
      const total = ds.values.reduce((a, b) => a + b, 0) || 1;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(plotW, plotH) / 2 - 10;
      const r = R * 0.55;
      let startAngle = -Math.PI / 2;
      const arcs = ds.values.map((v, i) => {
        const angle = (v / total) * Math.PI * 2;
        const color = ds.color || data.labels[i] ? this._colors[i % this._colors.length] : this._colors[0];
        const x1 = cx + R * Math.cos(startAngle);
        const y1 = cy + R * Math.sin(startAngle);
        const x2 = cx + R * Math.cos(startAngle + angle);
        const y2 = cy + R * Math.sin(startAngle + angle);
        const ix1 = cx + r * Math.cos(startAngle + angle);
        const iy1 = cy + r * Math.sin(startAngle + angle);
        const ix2 = cx + r * Math.cos(startAngle);
        const iy2 = cy + r * Math.sin(startAngle);
        const large = angle > Math.PI ? 1 : 0;
        const d = `M${x1},${y1}A${R},${R}0${large}1${x2},${y2}L${ix1},${iy1}A${r},${r}0${large}0${ix2},${iy2}Z`;
        startAngle += angle;
        return { d, color, label: data.labels[i], value: v };
      });
      svgContent = html`
        ${arcs.map(a => html`<path d=${a.d} fill=${a.color} />`)}
        ${showValues ? arcs.map((a, i) => {
          const midAngle = -Math.PI / 2 + (a.value / total) * Math.PI;
          const tx = cx + (R + r) / 2 * Math.cos(midAngle);
          const ty = cy + (R + r) / 2 * Math.sin(midAngle);
          return html`<text x=${tx} y=${ty} text-anchor="middle" dominant-baseline="central" font-size="10" fill="white" font-weight="600">${a.value}</text>`;
        }) : nothing}
      `;
    } else if (type === 'scatter') {
      svgContent = html`
        ${data.datasets.map((ds, di) => {
          const color = ds.color || this._colors[di % this._colors.length];
          return ds.values.map((v, i) => {
            const x = pad + (i / Math.max(ds.values.length - 1, 1)) * plotW;
            const y = H - pad - (v / maxVal) * plotH;
            return html`<circle cx=${x} cy=${y} r="4" fill=${color} opacity="0.7" />`;
          });
        })}
        ${data.labels.map((l, i) => html`<text x=${pad + (i / Math.max(data.labels.length - 1, 1)) * plotW} y=${H - 8} text-anchor="middle" font-size="10" fill="var(--forge-color-text-secondary)">${l}</text>`)}
      `;
    }

    return html`
      <div class="chart-wrap" style="width: ${width};">
        ${title ? html`<div class="chart-title">${title}</div>` : nothing}
        <svg viewBox="0 0 ${W} ${H}" style="width: 100%; height: ${height};">
          <line x1=${pad} y1=${H - pad} x2=${W - pad} y2=${H - pad} stroke="var(--forge-color-border)" stroke-width="1" />
          <line x1=${pad} y1=${pad} x2=${pad} y2=${H - pad} stroke="var(--forge-color-border)" stroke-width="1" />
          ${svgContent}
        </svg>
        ${showLegend ? html`
          <div class="legend">
            ${data.datasets.map((ds, i) => html`
              <div class="legend-item">
                <span class="legend-swatch" style="background: ${ds.color || this._colors[i % this._colors.length]}"></span>
                ${ds.label || `Series ${i + 1}`}
              </div>
            `)}
          </div>
        ` : nothing}
      </div>
    `;
  }
}
customElements.define('forge-chart', ForgeChart);

/** ForgeMetric — KPI display */
export class ForgeMetric extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .metric { padding: var(--forge-space-md); }
      .metric.sm { padding: var(--forge-space-sm); }
      .metric.lg { padding: var(--forge-space-lg); }
      .metric-label {
        font-size: var(--forge-text-sm); color: var(--forge-color-text-secondary);
        margin-bottom: var(--forge-space-2xs); font-weight: var(--forge-weight-medium);
      }
      .metric-value {
        font-size: var(--metric-size, var(--forge-text-3xl));
        font-weight: var(--forge-weight-bold); color: var(--forge-color-text);
        line-height: var(--forge-leading-tight);
      }
      .metric.sm .metric-value { --metric-size: var(--forge-text-2xl); }
      .metric.lg .metric-value { --metric-size: 2.25rem; }
      .metric-trend {
        display: inline-flex; align-items: center; gap: var(--forge-space-2xs);
        font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium);
        margin-top: var(--forge-space-2xs);
      }
      .trend-up { color: var(--forge-color-success); }
      .trend-down { color: var(--forge-color-error); }
      .trend-flat { color: var(--forge-color-text-tertiary); }
    `,
  ];

  render() {
    const label = this.prop<string>('label', '');
    const value = this.prop<string | number>('value', '—');
    const trend = this.prop<string>('trend');
    const trendValue = this.prop<string>('trendValue');
    const prefix = this.prop<string>('prefix');
    const suffix = this.prop<string>('suffix');
    const size = this.prop<string>('size', 'md');
    const trendClass = trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-flat';
    const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
    return html`
      <div class="metric ${size}">
        ${label ? html`<div class="metric-label">${label}</div>` : nothing}
        <div class="metric-value">${prefix ?? ''}${String(value)}${suffix ?? ''}</div>
        ${trend ? html`
          <div class="metric-trend ${trendClass}">
            <span>${trendIcon}</span>
            ${trendValue ?? ''}
          </div>
        ` : nothing}
      </div>
    `;
  }
}
customElements.define('forge-metric', ForgeMetric);

// ═══════════════════════════════════════════════════════════════════
// FEEDBACK (4)
// ═══════════════════════════════════════════════════════════════════

/** ForgeAlert — Status alert/banner */
export class ForgeAlert extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .alert {
        display: flex; align-items: flex-start; gap: var(--forge-space-sm);
        padding: var(--forge-space-md); border-radius: var(--forge-radius-md);
        border-left: 4px solid var(--alert-color, var(--forge-color-info));
      }
      .alert.info { background: var(--forge-color-info-subtle); --alert-color: var(--forge-color-info); }
      .alert.success { background: var(--forge-color-success-subtle); --alert-color: var(--forge-color-success); }
      .alert.warning { background: var(--forge-color-warning-subtle); --alert-color: var(--forge-color-warning); }
      .alert.error { background: var(--forge-color-error-subtle); --alert-color: var(--forge-color-error); }
      .alert-icon { flex-shrink: 0; color: var(--alert-color, var(--forge-color-info)); }
      .alert-content { flex: 1; min-width: 0; }
      .alert-title { font-weight: var(--forge-weight-semibold); margin-bottom: var(--forge-space-2xs); color: var(--forge-color-text); }
      .alert-message { font-size: var(--forge-text-sm); color: var(--forge-color-text); }
      .dismiss {
        background: none; border: none; padding: 0; cursor: pointer;
        color: var(--forge-color-text-tertiary); font-size: var(--forge-text-lg); line-height: 1;
        flex-shrink: 0;
      }
      .dismiss:hover { color: var(--forge-color-text); }
    `,
  ];

  @state() private _dismissed = false;

  render() {
    if (this._dismissed) return html``;
    const variant = this.prop<string>('variant', 'info');
    const title = this.prop<string>('title');
    const message = this.prop<string>('message', '');
    const dismissible = this.prop<boolean>('dismissible', false);
    const showIcon = this.prop<boolean>('icon', true);
    const iconMap: Record<string, string> = { info: 'info', success: 'check-circle', warning: 'alert-triangle', error: 'x-circle' };
    return html`
      <div class="alert ${variant}" role="alert">
        ${showIcon ? html`<span class="alert-icon"><forge-icon name="${iconMap[variant] ?? 'info'}" size="md"></forge-icon></span>` : nothing}
        <div class="alert-content">
          ${title ? html`<div class="alert-title">${title}</div>` : nothing}
          <div class="alert-message">${message}</div>
        </div>
        ${dismissible ? html`<button class="dismiss" @click=${() => { this._dismissed = true; this.fireAction('onDismiss'); }}>×</button>` : nothing}
      </div>
    `;
  }
}
customElements.define('forge-alert', ForgeAlert);

/** ForgeDialog — Modal dialog overlay */
export class ForgeDialog extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
        z-index: 1000; padding: var(--forge-space-lg);
      }
      .dialog {
        background: var(--forge-color-surface); border-radius: var(--forge-radius-lg);
        box-shadow: var(--forge-shadow-lg); width: var(--dialog-w, 480px);
        max-width: 90vw; max-height: 90vh; overflow: auto;
        padding: var(--forge-space-lg);
      }
      .dialog-header {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: var(--forge-space-md);
      }
      .dialog-title { font-size: var(--forge-text-xl); font-weight: var(--forge-weight-semibold); }
      .dialog-close {
        background: none; border: none; cursor: pointer;
        color: var(--forge-color-text-tertiary); font-size: var(--forge-text-xl); padding: 0;
      }
      .dialog-close:hover { color: var(--forge-color-text); }
      .dialog-body { margin-bottom: var(--forge-space-lg); }
      .dialog-footer { display: flex; justify-content: flex-end; gap: var(--forge-space-sm); }
    `,
  ];

  private _close() {
    this.fireAction('onClose');
  }

  private _onOverlay(e: MouseEvent) {
    if (this.prop<boolean>('closeOnOverlay', true) && e.target === e.currentTarget) {
      this._close();
    }
  }

  render() {
    const open = this.prop<boolean>('open', false);
    const title = this.prop<string>('title', '');
    const width = this.prop<string>('width');
    if (!open) return html``;
    return html`
      <div class="overlay" @click=${this._onOverlay} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Escape' && this.prop<boolean>('closeOnEscape', true)) this._close(); }}>
        <div class="dialog" style="--dialog-w: ${width ?? '480px'}">
          <div class="dialog-header">
            <div class="dialog-title">${title}</div>
            <button class="dialog-close" @click=${this._close}>×</button>
          </div>
          <div class="dialog-body"><slot></slot></div>
          <div class="dialog-footer"><slot name="footer"></slot></div>
        </div>
      </div>
    `;
  }
}
customElements.define('forge-dialog', ForgeDialog);

/** ForgeProgress — Progress bar */
export class ForgeProgress extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .progress-wrap { display: flex; flex-direction: column; gap: var(--forge-space-2xs); }
      .progress-label { font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); color: var(--forge-color-text); }
      .progress-row { display: flex; align-items: center; gap: var(--forge-space-sm); }
      .track {
        flex: 1; height: var(--bar-h, 0.5rem); background: var(--forge-color-surface-alt);
        border-radius: var(--forge-radius-full); overflow: hidden;
      }
      .track.sm { --bar-h: 0.25rem; }
      .track.lg { --bar-h: 0.75rem; }
      .fill {
        height: 100%; background: var(--fill-color, var(--forge-color-primary));
        border-radius: var(--forge-radius-full);
        transition: width var(--forge-transition-normal);
      }
      .fill.success { --fill-color: var(--forge-color-success); }
      .fill.warning { --fill-color: var(--forge-color-warning); }
      .fill.error { --fill-color: var(--forge-color-error); }
      .progress-value { font-size: var(--forge-text-sm); font-weight: var(--forge-weight-medium); color: var(--forge-color-text-secondary); min-width: 3rem; text-align: right; }
      .indeterminate .fill { width: 30% !important; animation: indeterminate 1.5s ease-in-out infinite; }
      @keyframes indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
    `,
  ];

  render() {
    const value = this.prop<number>('value', 0);
    const max = this.prop<number>('max', 100);
    const label = this.prop<string>('label');
    const size = this.prop<string>('size', 'md');
    const variant = this.prop<string>('variant', 'default');
    const showValue = this.prop<boolean>('showValue', true);
    const indeterminate = this.prop<boolean>('indeterminate', false);
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return html`
      <div class="progress-wrap ${indeterminate ? 'indeterminate' : ''}">
        ${label ? html`<div class="progress-label">${label}</div>` : nothing}
        <div class="progress-row">
          <div class="track ${size}">
            <div class="fill ${variant}" style="width: ${indeterminate ? '30%' : pct + '%'}"></div>
          </div>
          ${showValue && !indeterminate ? html`<span class="progress-value">${Math.round(pct)}%</span>` : nothing}
        </div>
      </div>
    `;
  }
}
customElements.define('forge-progress', ForgeProgress);

/** ForgeToast — Auto-dismissing notification */
export class ForgeToast extends ForgeElement {
  @state() private _visible = true;
  private _timer: ReturnType<typeof setTimeout> | null = null;

  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; position: fixed; bottom: var(--forge-space-lg); right: var(--forge-space-lg); z-index: 1100; }
      .toast {
        display: flex; align-items: center; gap: var(--forge-space-sm);
        padding: var(--forge-space-md) var(--forge-space-lg);
        border-radius: var(--forge-radius-md); box-shadow: var(--forge-shadow-lg);
        background: var(--toast-bg, var(--forge-color-surface));
        border-left: 4px solid var(--toast-color, var(--forge-color-info));
        max-width: 360px; animation: slideIn var(--forge-transition-normal);
      }
      .toast.info { --toast-color: var(--forge-color-info); --toast-bg: var(--forge-color-info-subtle); }
      .toast.success { --toast-color: var(--forge-color-success); --toast-bg: var(--forge-color-success-subtle); }
      .toast.warning { --toast-color: var(--forge-color-warning); --toast-bg: var(--forge-color-warning-subtle); }
      .toast.error { --toast-color: var(--forge-color-error); --toast-bg: var(--forge-color-error-subtle); }
      .toast-icon { color: var(--toast-color); flex-shrink: 0; }
      .toast-message { flex: 1; font-size: var(--forge-text-sm); color: var(--forge-color-text); }
      .toast-action {
        background: none; border: none; cursor: pointer; color: var(--toast-color);
        font-weight: var(--forge-weight-medium); font-size: var(--forge-text-sm);
        padding: 0; white-space: nowrap;
      }
      .toast-close {
        background: none; border: none; cursor: pointer;
        color: var(--forge-color-text-tertiary); padding: 0; font-size: var(--forge-text-lg);
      }
      @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: none; opacity: 1; } }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    const duration = this.prop<number>('duration', 4000);
    if (duration > 0) {
      this._timer = setTimeout(() => { this._visible = false; }, duration);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timer) clearTimeout(this._timer);
  }

  render() {
    if (!this._visible) return html``;
    const message = this.prop<string>('message', '');
    const variant = this.prop<string>('variant', 'info');
    const showIcon = this.prop<boolean>('icon', true);
    const actionLabel = this.prop<string>('actionLabel');
    const iconMap: Record<string, string> = { info: 'info', success: 'check-circle', warning: 'alert-triangle', error: 'x-circle' };
    return html`
      <div class="toast ${variant}">
        ${showIcon ? html`<span class="toast-icon"><forge-icon name="${iconMap[variant] ?? 'info'}" size="sm"></forge-icon></span>` : nothing}
        <span class="toast-message">${message}</span>
        ${actionLabel ? html`<button class="toast-action" @click=${() => this.fireAction('onAction')}>${actionLabel}</button>` : nothing}
        <button class="toast-close" @click=${() => { this._visible = false; }}>×</button>
      </div>
    `;
  }
}
customElements.define('forge-toast', ForgeToast);

// ═══════════════════════════════════════════════════════════════════
// NAVIGATION (2)
// ═══════════════════════════════════════════════════════════════════

/** ForgeBreadcrumb — Navigation breadcrumbs */
export class ForgeBreadcrumb extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .breadcrumb { display: flex; align-items: center; flex-wrap: wrap; gap: var(--forge-space-2xs); font-size: var(--forge-text-sm); }
      .crumb { color: var(--forge-color-text-secondary); cursor: pointer; transition: color var(--forge-transition-fast); }
      .crumb:hover { color: var(--forge-color-primary); }
      .crumb.current { color: var(--forge-color-text); font-weight: var(--forge-weight-medium); cursor: default; }
      .sep { color: var(--forge-color-text-tertiary); margin: 0 var(--forge-space-2xs); }
    `,
  ];

  render() {
    const items = this.prop<Array<{label: string; href?: string; onClick?: string}>>('items', []);
    const separator = this.prop<string>('separator', 'chevron');
    const sepMap: Record<string, string> = { slash: '/', chevron: '›', arrow: '→' };
    const sep = sepMap[separator] ?? '›';
    return html`
      <nav class="breadcrumb" aria-label="Breadcrumb">
        ${items.map((item, i) => {
          const isLast = i === items.length - 1;
          return html`
            ${i > 0 ? html`<span class="sep">${sep}</span>` : nothing}
            ${isLast ? html`<span class="crumb current" aria-current="page">${item.label}</span>`
              : item.href ? html`<a class="crumb" href="${item.href}">${item.label}</a>`
              : html`<span class="crumb" @click=${() => item.onClick ? this.dispatchAction(item.onClick) : nothing}>${item.label}</span>`
            }
          `;
        })}
      </nav>
    `;
  }
}
customElements.define('forge-breadcrumb', ForgeBreadcrumb);

/** ForgeStepper — Step-based navigation */
export class ForgeStepper extends ForgeElement {
  static styles = [
    ForgeElement.sharedStyles,
    css`
      :host { display: block; }
      .stepper { display: flex; }
      .stepper.vertical { flex-direction: column; }
      .step {
        display: flex; flex-direction: column; align-items: center; flex: 1;
        position: relative;
      }
      .stepper.vertical .step { flex-direction: row; align-items: flex-start; gap: var(--forge-space-md); flex: none; margin-bottom: var(--forge-space-lg); }
      .step-dot {
        width: 2rem; height: 2rem; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: var(--forge-text-sm); font-weight: var(--forge-weight-semibold);
        background: var(--forge-color-surface-alt); color: var(--forge-color-text-tertiary);
        border: 2px solid var(--forge-color-border); z-index: 1;
      }
      .step.completed .step-dot { background: var(--forge-color-primary); color: var(--forge-color-text-inverse); border-color: var(--forge-color-primary); }
      .step.active .step-dot { background: var(--forge-color-primary-subtle); color: var(--forge-color-primary); border-color: var(--forge-color-primary); }
      .step-line {
        position: absolute; top: 1rem; left: calc(50% + 1rem); right: calc(-50% + 1rem);
        height: 2px; background: var(--forge-color-border);
      }
      .stepper.vertical .step-line { display: none; }
      .step.completed .step-line { background: var(--forge-color-primary); }
      .step:last-child .step-line { display: none; }
      .step-label {
        margin-top: var(--forge-space-xs); font-size: var(--forge-text-sm);
        color: var(--forge-color-text-secondary); text-align: center; max-width: 120px;
      }
      .step.active .step-label { color: var(--forge-color-text); font-weight: var(--forge-weight-medium); }
      .step.completed .step-label { color: var(--forge-color-text-secondary); }
      .step-desc { font-size: var(--forge-text-xs); color: var(--forge-color-text-tertiary); margin-top: var(--forge-space-2xs); text-align: center; max-width: 120px; }
    `,
  ];

  render() {
    const steps = this.prop<Array<{id: string; label: string; description?: string}>>('steps', []);
    const active = this.prop<number>('active', 0);
    const orientation = this.prop<string>('orientation', 'horizontal');
    return html`
      <div class="stepper ${orientation}">
        ${steps.map((step, i) => {
          const state = i < active ? 'completed' : i === active ? 'active' : '';
          return html`
            <div class="step ${state}" @click=${() => { this.fireAction('onChange', { step: i }); }}>
              <div class="step-dot">${i < active ? '✓' : i + 1}</div>
              ${i < steps.length - 1 && orientation === 'horizontal' ? html`<div class="step-line"></div>` : nothing}
              <div>
                <div class="step-label">${step.label}</div>
                ${step.description ? html`<div class="step-desc">${step.description}</div>` : nothing}
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}
customElements.define('forge-stepper', ForgeStepper);

// ═══════════════════════════════════════════════════════════════════
// COMPONENT REGISTRY
// ═══════════════════════════════════════════════════════════════════

/** Map of component type → custom element tag name */
export const componentTagMap: Record<string, string> = {
  Stack: 'forge-stack',
  Grid: 'forge-grid',
  Card: 'forge-card',
  Container: 'forge-container',
  Tabs: 'forge-tabs',
  Accordion: 'forge-accordion',
  Divider: 'forge-divider',
  Spacer: 'forge-spacer',
  Text: 'forge-text',
  Image: 'forge-image',
  Icon: 'forge-icon',
  Badge: 'forge-badge',
  Avatar: 'forge-avatar',
  EmptyState: 'forge-empty-state',
  TextInput: 'forge-text-input',
  NumberInput: 'forge-number-input',
  Select: 'forge-select',
  MultiSelect: 'forge-multi-select',
  Checkbox: 'forge-checkbox',
  Toggle: 'forge-toggle',
  DatePicker: 'forge-date-picker',
  Slider: 'forge-slider',
  FileUpload: 'forge-file-upload',
  Button: 'forge-button',
  ButtonGroup: 'forge-button-group',
  Link: 'forge-link',
  Table: 'forge-table',
  List: 'forge-list',
  Chart: 'forge-chart',
  Metric: 'forge-metric',
  Alert: 'forge-alert',
  Dialog: 'forge-dialog',
  Progress: 'forge-progress',
  Toast: 'forge-toast',
  Breadcrumb: 'forge-breadcrumb',
  Stepper: 'forge-stepper',
};
