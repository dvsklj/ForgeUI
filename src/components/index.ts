/**
 * Forge Components — All 37 Lit Web Components
 * 
 * Each component extends ForgeUIElement, uses design tokens,
 * dispatches forgeui-action events for declarative bindings.
 */

import { html, css, svg, nothing } from 'lit';
import { ForgeUIElement } from './base.js';

// ═══════════════════════════════════════════════════════════════
// LAYOUT (8)
// ═══════════════════════════════════════════════════════════════

export class ForgeStack extends ForgeUIElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display: flex; flex-direction: column; min-width: 0; }
    :host([direction="row"]) { flex-direction: row; flex-wrap: wrap; }
    :host([direction="column"]) { flex-direction: column; }
    :host([align="start"]) { align-items: flex-start; }
    :host([align="center"]) { align-items: center; }
    :host([align="end"]) { align-items: flex-end; }
    :host([align="stretch"]) { align-items: stretch; }
    :host([justify="start"]) { justify-content: flex-start; }
    :host([justify="center"]) { justify-content: center; }
    :host([justify="end"]) { justify-content: flex-end; }
    :host([justify="between"]) { justify-content: space-between; }
    :host([justify="around"]) { justify-content: space-around; }
    :host([wrap]) { flex-wrap: wrap; }
    :host([nowrap]) { flex-wrap: nowrap; }
  `; }
  render() {
    // Normalize direction tokens (row/column + horizontal/vertical)
    const rawDir = this.getString('direction', 'column');
    const d = (rawDir === 'horizontal' || rawDir === 'row') ? 'row' : 'column';
    const g = this.getString('gap', '') || this.getString('spacing', 'md');
    const p = this.getString('padding', '');
    const a = this.getString('align', '');
    const j = this.getString('justify', '');
    const wrap = this.getBool('wrap');
    const gapCSS = this.gapValue(g);
    const padCSS = p ? this.gapValue(p) : '0';
    this.setAttribute('direction', d);
    if (a) this.setAttribute('align', a);
    if (j) this.setAttribute('justify', j);
    if (wrap) this.setAttribute('wrap', '');
    // Apply layout CSS on the host, not the slot — slot styles don't cascade reliably
    this.style.gap = gapCSS;
    this.style.padding = padCSS;
    return html`<slot></slot>`;
  }
}
customElements.define('forgeui-stack', ForgeStack);

export class ForgeGrid extends ForgeUIElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display: grid; min-width: 0; }
    @media (max-width: 900px) {
      :host([responsive]) { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    }
    @media (max-width: 640px) {
      :host([responsive]) { grid-template-columns: 1fr !important; }
    }
  `; }
  render() {
    const rawCols = this.getProp('columns');
    let cols: string;
    if (typeof rawCols === 'number') cols = String(rawCols);
    else if (typeof rawCols === 'string' && rawCols) cols = rawCols;
    else cols = '1';
    // If cols is a plain integer, generate repeat(n, 1fr); otherwise pass as-is (e.g. "1fr 2fr auto")
    const gridTemplate = /^\d+$/.test(cols) ? `repeat(${cols}, minmax(0, 1fr))` : cols;
    const g = this.getString('gap', 'md');
    const gapCSS = this.gapValue(g);
    const p = this.getString('padding', '');
    const padCSS = p ? this.gapValue(p) : '0';
    this.style.gridTemplateColumns = gridTemplate;
    this.style.gap = gapCSS;
    this.style.padding = padCSS;
    // Mark for responsive collapse on small screens by default when >=2 columns
    if (/^\d+$/.test(cols) && Number(cols) >= 2) this.setAttribute('responsive', '');
    return html`<slot></slot>`;
  }
}
customElements.define('forgeui-grid', ForgeGrid);

export class ForgeCard extends ForgeUIElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display:block; background:var(--forgeui-color-surface); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); padding:var(--forgeui-space-md); min-width:0; }
    :host([variant="elevated"]) { box-shadow:var(--forgeui-shadow-md); border-color:transparent; }
    :host([variant="compact"]) { padding:var(--forgeui-space-sm); border-radius:var(--forgeui-radius-sm); }
    :host([variant="outline"]) { background:transparent; }
    :host([variant="ghost"]) { background:transparent; border-color:transparent; padding:0; }
    .header { margin-bottom:var(--forgeui-space-sm); }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); color:var(--forgeui-color-text); line-height:var(--forgeui-leading-tight); }
    .subtitle { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin-top:var(--forgeui-space-3xs); }
    .body { display:flex; flex-direction:column; gap:var(--forgeui-space-md); min-width:0; }
  `; }
  render() {
    const v = this.getString('variant', '');
    const title = this.getString('title', '');
    const subtitle = this.getString('subtitle', '');
    if (v) this.setAttribute('variant', v);
    return html`
      ${title || subtitle ? html`
        <div class="header">
          ${title ? html`<div class="title">${title}</div>` : nothing}
          ${subtitle ? html`<div class="subtitle">${subtitle}</div>` : nothing}
        </div>
      ` : nothing}
      <div class="body"><slot></slot></div>
    `;
  }
}
customElements.define('forgeui-card', ForgeCard);

export class ForgeContainer extends ForgeUIElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`:host { display:block; margin-inline:auto; width:100%; box-sizing:border-box; }`; }
  render() {
    const mw = this.getString('maxWidth', '');
    // Preset maxWidth values map to sensible widths; plain values (e.g. "800px") pass through
    const widthMap: Record<string, string> = {
      sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px', full: '100%', none: 'none', '': ''
    };
    const resolvedMw = (mw in widthMap) ? widthMap[mw] : mw;
    const p = this.getString('padding', '');
    if (resolvedMw && resolvedMw !== 'none') this.style.maxWidth = resolvedMw;
    else this.style.maxWidth = '';
    this.style.padding = p ? this.gapValue(p) : '';
    return html`<slot></slot>`;
  }
}
customElements.define('forgeui-container', ForgeContainer);

export class ForgeTabs extends ForgeUIElement {
  static get properties() { return {
    props: { type: Object },
  }; }
  declare _active: string;
  constructor() { super(); this._active = ''; }
  static get styles() { return css`
    :host { display:block; }
    .tabs { display:flex; border-bottom:2px solid var(--forgeui-color-border); gap:var(--forgeui-space-xs); overflow-x:auto; }
    .tab { padding:var(--forgeui-space-sm) var(--forgeui-space-md); cursor:pointer; border:none; background:none;
      color:var(--forgeui-color-text-secondary); font:inherit; font-size:var(--forgeui-text-sm);
      border-bottom:2px solid transparent; transition:var(--forgeui-transition-fast); white-space:nowrap;
      border-radius:var(--forgeui-radius-sm) var(--forgeui-radius-sm) 0 0; }
    .tab:hover { color:var(--forgeui-color-text); background:var(--forgeui-color-surface-hover); }
    .tab:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:2px; }
    .tab[active] { color:var(--forgeui-color-primary); border-bottom-color:var(--forgeui-color-primary); font-weight:var(--forgeui-weight-medium); }
    .panel { padding-top:var(--forgeui-space-md); display:flex; flex-direction:column; gap:var(--forgeui-space-md); }
    ::slotted(*) { display:none; }
    ::slotted([data-active]) { display:block; }
    @media (prefers-reduced-motion: reduce) {
      .tab { transition:none; }
    }
  `; }
  _itemKey(item: any): string {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') return String(item.id ?? item.key ?? item.value ?? item.label ?? '');
    return String(item ?? '');
  }
  _itemLabel(item: any): string {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') return String(item.label ?? item.title ?? item.value ?? '');
    return String(item ?? '');
  }
  updated() {
    // Light-DOM slot filtering: mark only the active child as visible
    const kids = Array.from(this.children).filter(c => !(c instanceof HTMLScriptElement)) as HTMLElement[];
    kids.forEach((kid, i) => {
      const childSlot = ((kid as any).props || {}).slot ?? kid.getAttribute('slot');
      const isActive = String(i) === this._active || childSlot === this._active;
      if (isActive) kid.setAttribute('data-active', '');
      else kid.removeAttribute('data-active');
    });
  }
  _moveTo(newIndex: number, arr: any[]) {
    const newKey = this._itemKey(arr[newIndex]) || String(newIndex);
    this._active = newKey;
    this.requestUpdate();
    this.dispatchAction('tab-change', { active: newKey, value: newKey });
    this.updateComplete.then(() => {
      this.shadowRoot?.querySelector<HTMLButtonElement>(`#${this._instanceId}-tab-${newIndex}`)?.focus();
    });
  }
  render() {
    const items: unknown = this.getProp('items') || this.getProp('tabs') || [];
    const arr = Array.isArray(items) ? items : [];
    const bound = this.getBoundProp('activeTab', this.getProp('value'));
    if (bound !== undefined && String(bound) !== this._active) this._active = String(bound);
    if (!this._active && arr.length > 0) this._active = this._itemKey(arr[0]) || '0';
    const activeIndex = arr.findIndex((item: any, i: number) => (this._itemKey(item) || String(i)) === this._active);
    const handleKeydown = (e: KeyboardEvent, i: number) => {
      let newIndex = -1;
      if (e.key === 'ArrowRight') newIndex = (i + 1) % arr.length;
      else if (e.key === 'ArrowLeft') newIndex = (i - 1 + arr.length) % arr.length;
      else if (e.key === 'Home') newIndex = 0;
      else if (e.key === 'End') newIndex = arr.length - 1;
      if (newIndex !== -1) { e.preventDefault(); this._moveTo(newIndex, arr); }
    };
    return html`
      <div class="tabs" role="tablist">${arr.map((item: any, i: number) => {
        const key = this._itemKey(item) || String(i);
        const label = this._itemLabel(item) || String(i + 1);
        const active = key === this._active;
        return html`
          <button class="tab" ?active=${active} role="tab" aria-selected=${active}
            id="${this._instanceId}-tab-${i}"
            aria-controls="${this._instanceId}-panel"
            tabindex="${active ? 0 : -1}"
            @click=${() => { this._active = key; this.requestUpdate(); this.dispatchAction('tab-change', { active: key, value: key }); }}
            @keydown=${(e: KeyboardEvent) => handleKeydown(e, i)}>${label}</button>
        `;
      })}</div>
      <div class="panel" role="tabpanel" id="${this._instanceId}-panel"
        aria-labelledby="${this._instanceId}-tab-${activeIndex >= 0 ? activeIndex : 0}"><slot></slot></div>
    `;
  }
}
customElements.define('forgeui-tabs', ForgeTabs);

export class ForgeAccordion extends ForgeUIElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display:block; }
    details { border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); margin-bottom:var(--forgeui-space-2xs); }
    summary { padding:var(--forgeui-space-sm) var(--forgeui-space-md); cursor:pointer; font-weight:var(--forgeui-weight-medium);
      list-style:none; display:flex; justify-content:space-between; align-items:center; border-radius:var(--forgeui-radius-sm);
      transition:background var(--forgeui-transition-fast); }
    summary:hover { background:var(--forgeui-color-surface-hover); }
    summary:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:-2px; }
    summary::-webkit-details-marker { display:none; }
    summary::after { content:'▸'; transition:transform var(--forgeui-transition-fast); }
    details[open] summary::after { transform:rotate(90deg); }
    .content { padding:var(--forgeui-space-sm) var(--forgeui-space-md); }
  `; }
  render() {
    const title = this.getString('title', 'Section');
    return html`<details><summary>${title}</summary><div class="content"><slot></slot></div></details>`;
  }
}
customElements.define('forgeui-accordion', ForgeAccordion);

export class ForgeDivider extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; }
    hr { border:none; border-top:1px solid var(--forgeui-color-border); margin:var(--forgeui-space-sm) 0; }
  `; }
  render() { return html`<hr>`; }
}
customElements.define('forgeui-divider', ForgeDivider);

export class ForgeSpacer extends ForgeUIElement {
  static get styles() { return css`:host { display:block; }`; }
  render() {
    const size = this.getString('size', 'md');
    const height = this.getString('height', '');
    const width = this.getString('width', '');
    const h = height ? this.gapValue(height) : this.gapValue(size);
    const w = width ? (/^\d+(\.\d+)?%$/.test(width) ? width : this.gapValue(width)) : '';
    return html`<div style="height:${h};${w ? `width:${w}` : ''}"></div>`;
  }
}
customElements.define('forgeui-spacer', ForgeSpacer);

/**
 * Repeater: renders a child element once per item in a data array.
 * The renderer (not this component) handles the iteration — this element
 * exists only so the type validates and so a clear empty state shows when
 * the data is empty. The actual iteration lives in renderer/index.ts.
 */
export class ForgeRepeater extends ForgeUIElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display:flex; flex-direction:column; gap:var(--forgeui-space-md); min-width:0; }
    :host([direction="row"]) { flex-direction:row; flex-wrap:wrap; }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); }
  `; }
  render() {
    const data = this.getArray('data');
    const emptyMsg = this.getString('emptyMessage', '');
    const dir = this.getString('direction', 'column');
    if (dir === 'row' || dir === 'horizontal') this.setAttribute('direction', 'row');
    const g = this.getString('gap', 'md');
    this.style.gap = this.gapValue(g);
    if (data.length === 0 && emptyMsg) {
      return html`<div class="empty">${emptyMsg}</div>`;
    }
    return html`<slot></slot>`;
  }
}
customElements.define('forgeui-repeater', ForgeRepeater);

// ═══════════════════════════════════════════════════════════════
// CONTENT (6)
// ═══════════════════════════════════════════════════════════════

export class ForgeText extends ForgeUIElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display:block; min-width:0; }
    .heading1 { font-size:var(--forgeui-text-3xl); font-weight:var(--forgeui-weight-bold); line-height:var(--forgeui-leading-tight); letter-spacing:-0.02em; margin:0; overflow-wrap:break-word; }
    .heading2 { font-size:var(--forgeui-text-2xl); font-weight:var(--forgeui-weight-bold); line-height:var(--forgeui-leading-tight); letter-spacing:-0.01em; margin:0; overflow-wrap:break-word; }
    .heading3 { font-size:var(--forgeui-text-xl); font-weight:var(--forgeui-weight-semibold); line-height:var(--forgeui-leading-tight); margin:0; overflow-wrap:break-word; }
    .heading { font-size:var(--forgeui-text-2xl); font-weight:var(--forgeui-weight-bold); line-height:var(--forgeui-leading-tight); margin:0; overflow-wrap:break-word; }
    .subheading { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); line-height:var(--forgeui-leading-tight); margin:0; overflow-wrap:break-word; }
    .label { font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); color:var(--forgeui-color-text); margin:0; overflow-wrap:break-word; }
    .body { font-size:var(--forgeui-text-base); line-height:var(--forgeui-leading-normal); margin:0; overflow-wrap:break-word; }
    .caption { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin:0; overflow-wrap:break-word; }
    .muted { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin:0; overflow-wrap:break-word; }
    .code { font-family:var(--forgeui-font-mono); font-size:var(--forgeui-text-sm); background:var(--forgeui-color-surface-alt);
      padding:var(--forgeui-space-2xs) var(--forgeui-space-xs); border-radius:var(--forgeui-radius-sm); display:inline-block; word-break:normal; overflow-wrap:break-word; }
    .align-left { text-align:left; }
    .align-center { text-align:center; }
    .align-right { text-align:right; }
  `; }
  render() {
    const content = this.getString('content', '');
    const variant = this.getString('variant', 'body');
    // Map legacy/alias variants
    const variantMap: Record<string, string> = {
      h1: 'heading1', h2: 'heading2', h3: 'heading3',
      title: 'heading2', subtitle: 'subheading',
      paragraph: 'body', text: 'body', secondary: 'muted', tertiary: 'caption',
    };
    const cls = variantMap[variant] || variant;
    const colorScheme = this.getString('colorScheme', '');
    const align = this.getString('align', '');
    const weight = this.getString('weight', '');
    const colorMap: Record<string, string> = {
      primary: 'var(--forgeui-color-primary)',
      secondary: 'var(--forgeui-color-text-secondary)',
      tertiary: 'var(--forgeui-color-text-tertiary)',
      success: 'var(--forgeui-color-success)',
      warning: 'var(--forgeui-color-warning)',
      error: 'var(--forgeui-color-error)',
      info: 'var(--forgeui-color-info)',
    };
    const weightMap: Record<string, string> = {
      normal: 'var(--forgeui-weight-normal)',
      medium: 'var(--forgeui-weight-medium)',
      semibold: 'var(--forgeui-weight-semibold)',
      bold: 'var(--forgeui-weight-bold)',
    };
    const styles: string[] = [];
    if (colorScheme && colorMap[colorScheme]) styles.push(`color:${colorMap[colorScheme]}`);
    if (weight && weightMap[weight]) styles.push(`font-weight:${weightMap[weight]}`);
    const alignCls = align ? `align-${align}` : '';
    const inner = html`${content}<slot></slot>`;
    if (cls === 'heading1') return html`<h1 class="${cls} ${alignCls}" style="${styles.join(';')}">${inner}</h1>`;
    if (cls === 'heading2') return html`<h2 class="${cls} ${alignCls}" style="${styles.join(';')}">${inner}</h2>`;
    if (cls === 'heading3') return html`<h3 class="${cls} ${alignCls}" style="${styles.join(';')}">${inner}</h3>`;
    return html`<div class="${cls} ${alignCls}" style="${styles.join(';')}">${content}<slot></slot></div>`;
  }
}
customElements.define('forgeui-text', ForgeText);

export class ForgeImage extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; }
    img { max-width:100%; height:auto; display:block; border-radius:var(--forgeui-radius-md); }
  `; }
  render() {
    const src = this.getString('src', '');
    const alt = this.getString('alt', '');
    const fit = this.getString('fit', 'contain');
    if (!src) return html`${nothing}`;
    return html`<img src="${src}" alt="${alt}" style="object-fit:${fit}" loading="lazy">`;
  }
}
customElements.define('forgeui-image', ForgeImage);

export class ForgeIcon extends ForgeUIElement {
  static get styles() { return css`
    :host { display:inline-flex; align-items:center; justify-content:center; }
    svg { width:var(--forgeui-icon-md); height:var(--forgeui-icon-md); fill:currentColor; }
  `; }
  render() {
    const name = this.getString('name', 'circle');
    // Minimal built-in icon set (just paths, no external deps)
    const icons: Record<string, string> = {
      check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      x: 'M6 18L18 6M6 6l12 12',
      plus: 'M12 4v16m8-8H4',
      minus: 'M20 12H4',
      chevron: 'M9 5l7 7-7 7',
      arrow: 'M13 7l5 5m0 0l-5 5m5-5H6',
      star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.063 8.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z',
      circle: 'M12 2a10 10 0 100 20 10 10 0 000-20z',
      alert: 'M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z',
    };
    const path = icons[name] || icons.circle;
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
  }
}
customElements.define('forgeui-icon', ForgeIcon);

export class ForgeBadge extends ForgeUIElement {
  static get styles() { return css`
    :host { display:inline-flex; align-items:center; max-width:100%; }
    .badge { display:inline-flex; align-items:center; min-height:1.5rem; padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      border-radius:var(--forgeui-radius-sm); font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-bold);
      background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); letter-spacing:0.01em;
      max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .badge[variant="success"] { background:var(--forgeui-color-success); color:var(--forgeui-color-text-inverse); }
    .badge[variant="warning"] { background:var(--forgeui-color-warning); color:var(--forgeui-color-text-inverse); }
    .badge[variant="error"] { background:var(--forgeui-color-error); color:var(--forgeui-color-text-inverse); }
  `; }
  render() {
    const label = this.getString('text', '') || this.getString('label', '');
    const v = this.getString('variant', '');
    return html`<span class="badge" variant="${v}">${label}<slot></slot></span>`;
  }
}
customElements.define('forgeui-badge', ForgeBadge);

export class ForgeAvatar extends ForgeUIElement {
  static get styles() { return css`
    :host { display:inline-flex; }
    .avatar { width:2.5rem; height:2.5rem; border-radius:var(--forgeui-radius-full); background:var(--forgeui-color-primary-subtle);
      color:var(--forgeui-color-primary); display:flex; align-items:center; justify-content:center;
      font-weight:var(--forgeui-weight-semibold); font-size:var(--forgeui-text-sm); overflow:hidden; }
    img { width:100%; height:100%; object-fit:cover; }
  `; }
  render() {
    const src = this.getString('src', '');
    const name = this.getString('name', '?');
    const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    return html`<div class="avatar">${src ? html`<img src="${src}" alt="${name}">` : initials}<slot></slot></div>`;
  }
}
customElements.define('forgeui-avatar', ForgeAvatar);

export class ForgeEmptyState extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; text-align:center; padding:var(--forgeui-space-2xl) var(--forgeui-space-lg); }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-xs); overflow-wrap:break-word; }
    .desc { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin-bottom:var(--forgeui-space-md); overflow-wrap:break-word; }
  `; }
  render() {
    const title = this.getString('title', 'Nothing here');
    const desc = this.getString('description', '');
    return html`
      <div class="title">${title}</div>
      ${desc ? html`<div class="desc">${desc}</div>` : nothing}
      <slot></slot>
    `;
  }
}
customElements.define('forgeui-empty-state', ForgeEmptyState);

// ═══════════════════════════════════════════════════════════════
// INPUT (9)
// ═══════════════════════════════════════════════════════════════

export class ForgeTextInput extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); color:var(--forgeui-color-text); overflow-wrap:break-word; }
    input, textarea { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; font-size:var(--forgeui-text-base);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); height:var(--forgeui-input-height);
      transition:border-color var(--forgeui-transition-fast); box-sizing:border-box; min-width:0; }
    input:focus, textarea:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
    input::placeholder { color:var(--forgeui-color-text-tertiary); }
    textarea { height:auto; min-height:5rem; resize:vertical; }
    .hint { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin-top:var(--forgeui-space-2xs); }
    .error { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-error); margin-top:var(--forgeui-space-2xs); }
  `; }
  render() {
    const label = this.getString('label', '');
    const placeholder = this.getString('placeholder', '');
    const hint = this.getString('hint', '');
    const error = this.getString('error', '');
    const type = this.getString('inputType', '') || this.getString('type', 'text');
    const multiline = this.getBool('multiline');
    const val = String(this.getBoundProp('value', '') ?? '');
    const inputId = this._instanceId;
    return html`
      ${label ? html`<label for="${inputId}">${label}</label>` : nothing}
      ${multiline 
        ? html`<textarea id="${inputId}" placeholder="${placeholder}" .value=${val} @input=${(e: any) => this.dispatchAction('change', { value: e.target.value })}></textarea>`
        : html`<input id="${inputId}" type="${type}" placeholder="${placeholder}" .value=${val} @input=${(e: any) => this.dispatchAction('change', { value: e.target.value })}>`
      }
      ${hint && !error ? html`<div class="hint">${hint}</div>` : nothing}
      ${error ? html`<div class="error">${error}</div>` : nothing}
    `;
  }
}
customElements.define('forgeui-text-input', ForgeTextInput);

export class ForgeNumberInput extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `; }
  render() {
    const label = this.getString('label', '');
    const min = this.getProp('min') as number | undefined;
    const max = this.getProp('max') as number | undefined;
    const step = this.getProp('step') as number | undefined;
    const val = this.getBoundProp('value') as number | undefined;
    const inputId = this._instanceId;
    return html`
      ${label ? html`<label for="${inputId}">${label}</label>` : nothing}
      <input id="${inputId}" type="number" min=${min} max=${max} step=${step} .value=${val ?? ''}
        @input=${(e: any) => this.dispatchAction('change', { value: Number(e.target.value) })}>
    `;
  }
}
customElements.define('forgeui-number-input', ForgeNumberInput);

export class ForgeSelect extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    select { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    select:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `; }
  render() {
    const label = this.getString('label', '');
    const options = (this.getProp('options') || []) as any[];
    const val = String(this.getBoundProp('value', '') ?? '');
    const inputId = this._instanceId;
    return html`
      ${label ? html`<label for="${inputId}">${label}</label>` : nothing}
      <select id="${inputId}" .value=${val} @change=${(e: any) => this.dispatchAction('change', { value: e.target.value })}>
        ${options.map((o: any) => html`<option value=${typeof o === 'string' ? o : o.value} ?selected=${(typeof o === 'string' ? o : o.value) === val}>
          ${typeof o === 'string' ? o : (o.label || o.value)}
        </option>`)}
      </select>
    `;
  }
}
customElements.define('forgeui-select', ForgeSelect);

export class ForgeMultiSelect extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    .tags { display:flex; flex-wrap:wrap; gap:var(--forgeui-space-2xs); padding:var(--forgeui-space-xs); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); min-height:var(--forgeui-input-height); }
    .tag { display:inline-flex; align-items:center; gap:var(--forgeui-space-2xs); padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      background:var(--forgeui-color-primary-subtle); color:var(--forgeui-color-primary); border-radius:var(--forgeui-radius-sm);
      font-size:var(--forgeui-text-xs); max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .tag button { background:none; border:none; cursor:pointer; color:inherit; font:inherit; padding:0; border-radius:2px; }
    .tag button:focus-visible { outline:2px solid var(--forgeui-color-focus); outline-offset:1px; }
  `; }
  render() {
    const label = this.getString('label', '');
    const selected = (this.getProp('selected') || []) as any[];
    return html`
      ${label ? html`<label>${label}</label>` : nothing}
      <div class="tags">
        ${selected.map((s: any) => html`<span class="tag">${String(s)}<button @click=${() => this.dispatchAction('remove', { value: s })}>×</button></span>`)}
        <slot></slot>
      </div>
    `;
  }
}
customElements.define('forgeui-multi-select', ForgeMultiSelect);

export class ForgeCheckbox extends ForgeUIElement {
  static get styles() { return css`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-xs); margin-bottom:var(--forgeui-space-xs); cursor:pointer; }
    input { width:1.125rem; height:1.125rem; accent-color:var(--forgeui-color-primary); cursor:pointer; }
    label { font-size:var(--forgeui-text-sm); cursor:pointer; }
    :focus-within label { text-decoration:underline; }
  `; }
  render() {
    const label = this.getString('label', '');
    const checked = !!this.getBoundProp('checked', this.getProp('value') ?? false);
    const inputId = this._instanceId;
    return html`
      <input id="${inputId}" type="checkbox" ?checked=${checked} @change=${(e: any) => this.dispatchAction('change', { checked: e.target.checked })}>
      ${label ? html`<label for="${inputId}">${label}</label>` : nothing}
    `;
  }
}
customElements.define('forgeui-checkbox', ForgeCheckbox);

export class ForgeToggle extends ForgeUIElement {
  static get styles() { return css`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-sm); margin-bottom:var(--forgeui-space-xs); }
    .switch { position:relative; width:2.75rem; height:1.5rem; background:var(--forgeui-color-border-strong);
      border-radius:var(--forgeui-radius-full); cursor:pointer; border:none; padding:0;
      transition:background var(--forgeui-transition-fast); }
    .switch[aria-checked="true"] { background:var(--forgeui-color-primary); }
    .switch::after { content:''; position:absolute; top:2px; left:2px; width:1.25rem; height:1.25rem;
      background:var(--forgeui-color-surface); border-radius:var(--forgeui-radius-full); transition:transform var(--forgeui-transition-fast); }
    .switch[aria-checked="true"]::after { transform:translateX(1.25rem); }
    .switch:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }
    .switch:disabled { opacity:0.5; cursor:not-allowed; }
    .toggle-label { display:inline-flex; align-items:center; gap:var(--forgeui-space-sm); cursor:pointer; }
    .toggle-text { font-size:var(--forgeui-text-sm); }
    @media (prefers-reduced-motion: reduce) {
      .switch, .switch::after { transition:none; }
    }
  `; }
  render() {
    const on = !!this.getBoundProp('on', this.getProp('value') ?? false);
    const label = this.getString('label', '');
    const disabled = this.getBool('disabled');
    const inputId = this._instanceId;
    return html`
      <label for="${inputId}" class="toggle-label">
        <button
          id="${inputId}"
          class="switch"
          role="switch"
          type="button"
          aria-checked="${on ? 'true' : 'false'}"
          ?disabled=${disabled}
          @click="${this._toggle}"
          @keydown="${this._onKeydown}"
        ></button>
        ${label ? html`<span class="toggle-text">${label}</span>` : nothing}
      </label>
    `;
  }

  private _toggle = () => {
    if (this.getBool('disabled')) return;
    const current = !!this.getBoundProp('on', this.getProp('value') ?? false);
    this.dispatchAction('change', { value: !current, checked: !current });
  };

  private _onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      this._toggle();
    }
  };
}
customElements.define('forgeui-toggle', ForgeToggle);

export class ForgeDatePicker extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `; }
  render() {
    const label = this.getString('label', '');
    const val = this.getString('value', '');
    return html`
      ${label ? html`<label>${label}</label>` : nothing}
      <input type="date" .value=${val} @change=${(e: any) => this.dispatchAction('change', { value: e.target.value })}>
    `;
  }
}
customElements.define('forgeui-date-picker', ForgeDatePicker);

export class ForgeSlider extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input[type=range] { width:100%; accent-color:var(--forgeui-color-primary); min-width:0; }
    .value { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); }
  `; }
  render() {
    const label = this.getString('label', '');
    const min = this.getNumber('min', 0);
    const max = this.getNumber('max', 100);
    const step = this.getNumber('step', 1);
    const rawVal = this.getBoundProp('value', min);
    let val = Number(rawVal);
    if (!Number.isFinite(val)) val = min;
    return html`
      ${label ? html`<label>${label}</label>` : nothing}
      <input type="range" min=${min} max=${max} step=${step} .value=${val}
        @input=${(e: any) => this.dispatchAction('change', { value: Number(e.target.value) })}>
      <div class="value">${val}</div>
    `;
  }
}
customElements.define('forgeui-slider', ForgeSlider);

export class ForgeFileUpload extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    .dropzone { border:2px dashed var(--forgeui-color-border-strong); border-radius:var(--forgeui-radius-md);
      padding:var(--forgeui-space-xl); text-align:center; cursor:pointer; transition:border-color var(--forgeui-transition-fast); }
    .dropzone:hover { border-color:var(--forgeui-color-primary); background:var(--forgeui-color-primary-subtle); }
    .dropzone:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:2px; }
    .dropzone p { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); }
  `; }
  render() {
    const label = this.getString('label', 'Upload file');
    const accept = this.getString('accept', '*');
    return html`
      ${label ? html`<label>${label}</label>` : nothing}
      <div class="dropzone" @click=${() => this.shadowRoot?.querySelector('input')?.click()}>
        <p>Click or drop file here</p>
        <input type="file" accept="${accept}" hidden @change=${(e: any) => {
          const file = e.target.files?.[0];
          if (file) this.dispatchAction('change', { name: file.name, size: file.size, type: file.type });
        }}>
      </div>
    `;
  }
}
customElements.define('forgeui-file-upload', ForgeFileUpload);

// ═══════════════════════════════════════════════════════════════
// ACTION (3)
// ═══════════════════════════════════════════════════════════════

export class ForgeButton extends ForgeUIElement {
  static get styles() { return css`
    :host { display:inline-flex; }
    button { display:inline-flex; align-items:center; justify-content:center; gap:var(--forgeui-space-xs);
      padding:0 var(--forgeui-space-md); height:var(--forgeui-button-height); border:1px solid transparent;
      border-radius:var(--forgeui-radius-md); font:inherit; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium);
      cursor:pointer; transition:all var(--forgeui-transition-fast); white-space:nowrap; min-width:var(--forgeui-touch-target); }
    button:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }
    .primary { background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); }
    .primary:hover { background:var(--forgeui-color-primary-hover); }
    .secondary { background:transparent; color:var(--forgeui-color-primary); border-color:var(--forgeui-color-primary); }
    .secondary:hover { background:var(--forgeui-color-primary-subtle); }
    .ghost { background:transparent; color:var(--forgeui-color-text-secondary); }
    .ghost:hover { background:var(--forgeui-color-surface-hover); color:var(--forgeui-color-text); }
    .danger { background:var(--forgeui-color-error); color:var(--forgeui-color-text-inverse); }
    .danger:hover { opacity:0.9; }
    .sm { height:2rem; padding:0 var(--forgeui-space-sm); font-size:var(--forgeui-text-xs); }
    .lg { height:3rem; padding:0 var(--forgeui-space-lg); font-size:var(--forgeui-text-base); }
    button:disabled { opacity:0.5; cursor:not-allowed; }
    button[aria-pressed="true"] { background:var(--forgeui-color-primary-subtle); color:var(--forgeui-color-primary); }
    @media (prefers-reduced-motion: reduce) {
      button { transition:none; }
    }
  `; }
  render() {
    const label = this.getString('label', 'Button');
    const variant = this.getString('variant', 'primary');
    const size = this.getString('size', '');
    const disabled = this.getBool('disabled');
    const pressed = this.getProp('pressed');
    return html`<button class="${variant} ${size}" ?disabled=${disabled}
      aria-pressed=${pressed === undefined || pressed === null ? nothing : String(!!pressed)}
      @click=${(e: Event) => this.handleAction(e)}>${label}<slot></slot></button>`;
  }
}
customElements.define('forgeui-button', ForgeButton);

export class ForgeButtonGroup extends ForgeUIElement {
  static get styles() { return css`
    :host { display:flex; gap:var(--forgeui-space-xs); }
  `; }
  render() { return html`<slot></slot>`; }
}
customElements.define('forgeui-button-group', ForgeButtonGroup);

export class ForgeLink extends ForgeUIElement {
  static get styles() { return css`
    :host { display:inline-flex; }
    a { color:var(--forgeui-color-primary); text-decoration:none; font-size:var(--forgeui-text-sm); cursor:pointer;
      text-decoration-thickness:1px; text-underline-offset:2px; }
    a:hover { text-decoration:underline; }
    a:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:2px; border-radius:2px; }
  `; }
  render() {
    const label = this.getString('label', '');
    const href = this.getString('href', '#');
    return html`<a href="${href}">${label}<slot></slot></a>`;
  }
}
customElements.define('forgeui-link', ForgeLink);

// ═══════════════════════════════════════════════════════════════
// DATA DISPLAY (4)
// ═══════════════════════════════════════════════════════════════

export class ForgeTable extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; overflow-x:auto; min-width:0; width:100%; }
    table { width:100%; min-width:42rem; border-collapse:collapse; font-size:var(--forgeui-text-sm); }
    th { text-align:left; padding:var(--forgeui-space-sm) var(--forgeui-space-md); font-weight:var(--forgeui-weight-semibold);
      color:var(--forgeui-color-text-secondary); border-bottom:2px solid var(--forgeui-color-border-strong); white-space:nowrap;
      text-transform:uppercase; letter-spacing:0.05em; font-size:var(--forgeui-text-xs);
      background:var(--forgeui-color-surface-alt); }
    td { padding:var(--forgeui-space-sm) var(--forgeui-space-md); border-bottom:1px solid var(--forgeui-color-border); vertical-align:middle; overflow-wrap:break-word; word-break:break-word; }
    tr:last-child td { border-bottom:none; }
    tbody tr:hover td { background:var(--forgeui-color-surface-hover); }
    .empty { padding:var(--forgeui-space-xl); text-align:center; color:var(--forgeui-color-text-tertiary); }
    .badge { display:inline-flex; align-items:center; justify-content:center; min-height:1.5rem; padding:var(--forgeui-space-3xs) var(--forgeui-space-xs);
      border-radius:var(--forgeui-radius-sm); font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-bold);
      background:var(--forgeui-color-text-secondary); color:var(--forgeui-color-text-inverse); white-space:nowrap; letter-spacing:0.01em;
      max-width:100%; overflow:hidden; text-overflow:ellipsis; }
    .badge.success { background:var(--forgeui-color-success); color:var(--forgeui-color-text-inverse); }
    .badge.warning { background:var(--forgeui-color-warning); color:var(--forgeui-color-text-inverse); }
    .badge.error { background:var(--forgeui-color-error); color:var(--forgeui-color-text-inverse); }
    .badge.info, .badge.primary { background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); }
    .badge.neutral { background:var(--forgeui-color-text-secondary); color:var(--forgeui-color-text-inverse); }
    .align-right { text-align:right; }
    .align-center { text-align:center; }
    .col-right th, .col-right td { text-align:right; }
    .col-center th, .col-center td { text-align:center; }
    caption { text-align:start; font-size:var(--forgeui-text-sm); caption-side:top; padding-bottom:var(--forgeui-space-sm); color:var(--forgeui-color-text-secondary); }
    .row-action { cursor:pointer; }
    .row-action:hover td { background:var(--forgeui-color-surface-hover); }
    .row-action:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:-2px; }
  `; }
  _statusClass(val: unknown): string {
    const s = String(val ?? '').toLowerCase().trim();
    if (['done', 'complete', 'completed', 'success', 'active', 'ok', 'approved', 'paid'].includes(s)) return 'success';
    if (['in progress', 'in-progress', 'pending', 'warning', 'waiting', 'review'].includes(s)) return 'warning';
    if (['to do', 'to-do', 'todo', 'backlog', 'draft', 'new', 'inactive'].includes(s)) return 'neutral';
    if (['high', 'urgent', 'critical'].includes(s)) return 'error';
    if (['medium', 'med'].includes(s)) return 'warning';
    if (['low'].includes(s)) return 'info';
    if (['failed', 'error', 'rejected', 'blocked', 'overdue'].includes(s)) return 'error';
    return 'neutral';
  }
  _renderCell(col: any, row: any): any {
    const key = typeof col === 'string' ? col : col.key;
    const raw = row[key];
    const type = (col && typeof col === 'object') ? col.type : undefined;
    if (raw === undefined || raw === null || raw === '') return html`<span style="color:var(--forgeui-color-text-tertiary)">—</span>`;
    if (type === 'badge' || type === 'status') {
      const variant = (col.variant && typeof col.variant === 'object' ? col.variant[String(raw).toLowerCase()] : null) || this._statusClass(raw);
      return html`<span class="badge ${variant}">${String(raw)}</span>`;
    }
    if (type === 'number') {
      return typeof raw === 'number' ? raw.toLocaleString() : String(raw);
    }
    if (type === 'date') {
      const d = typeof raw === 'string' || typeof raw === 'number' ? new Date(raw) : raw;
      if (d instanceof Date && !isNaN(d.getTime())) return d.toLocaleDateString();
      return String(raw);
    }
    if (type === 'currency') {
      const n = Number(raw);
      if (!isNaN(n)) return n.toLocaleString(undefined, { style: 'currency', currency: col.currency || 'USD' });
      return String(raw);
    }
    if (type === 'boolean') {
      return raw ? '✓' : '✗';
    }
    return String(raw);
  }
  render() {
    const data = this.getProp('data');
    const columns = (this.getProp('columns') || []) as any[];
    const emptyMsg = this.getString('emptyMessage', 'No data yet');
    const rowAction = this.getString('rowAction', '');
    const caption = this.getString('caption', '');
    if (!Array.isArray(data)) {
      return html`<div class="empty">${emptyMsg}</div>`;
    }
    const cols = columns.length > 0 ? columns : (data.length > 0 ? Object.keys(data[0]) : []);
    if (cols.length === 0) return html`<div class="empty">${emptyMsg}</div>`;
    return html`
      <table>
        ${caption ? html`<caption>${caption}</caption>` : nothing}
        <thead><tr>${cols.map((c: any) => {
          const label = typeof c === 'string' ? c : (c.label || c.key);
          const align = typeof c === 'object' ? c.align : undefined;
          const width = typeof c === 'object' ? c.width : undefined;
          const alignCls = align === 'right' ? 'align-right' : align === 'center' ? 'align-center' : '';
          return html`<th class="${alignCls}" style="${width ? `width:${width}` : ''}">${label}</th>`;
        })}</tr></thead>
        <tbody>${data.length === 0
          ? html`<tr><td colspan=${cols.length} class="empty">${emptyMsg}</td></tr>`
          : data.map((row: any, i: number) => {
              const hasAction = !!rowAction;
              const rowLabel = hasAction ? String(row[typeof cols[0] === 'string' ? cols[0] : cols[0]?.key] ?? `Row ${i + 1}`) : '';
              return html`<tr class="${hasAction ? 'row-action' : ''}"
                tabindex=${hasAction ? 0 : nothing}
                role=${hasAction ? 'button' : nothing}
                aria-label=${hasAction ? rowLabel : nothing}
                @click=${hasAction ? () => this.dispatchAction(rowAction, { row, index: i }) : undefined}
                @keydown=${hasAction ? (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.dispatchAction(rowAction, { row, index: i }); } } : undefined}>
              ${cols.map((c: any) => {
                const align = typeof c === 'object' ? c.align : undefined;
                const alignCls = align === 'right' ? 'align-right' : align === 'center' ? 'align-center' : '';
                return html`<td class="${alignCls}">${this._renderCell(c, row)}</td>`;
              })}</tr>`;
            })
        }</tbody>
      </table>
    `;
  }
}
customElements.define('forgeui-table', ForgeTable);

export class ForgeList extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; }
    .list { display:flex; flex-direction:column; gap:var(--forgeui-space-xs); }
    .item { padding:var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md);
      display:flex; align-items:center; gap:var(--forgeui-space-sm); overflow-wrap:break-word; min-width:0; }
    .item:hover { background:var(--forgeui-color-surface-hover); }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); overflow-wrap:break-word; }
  `; }
  render() {
    let data = this.getProp('data');
    const dataPath = this.getString('dataPath', '');
    if (!('data' in (this.props || {})) && dataPath && this.store?.hasTable(dataPath)) {
      data = Object.values(this.store.getTable(dataPath));
    }
    const emptyMsg = this.getString('emptyMessage', 'No items');
    if (!Array.isArray(data) || data.length === 0) return html`<div class="empty">${emptyMsg}</div>`;
    return html`<div class="list">${data.map((item: any, i: number) => html`
      <div class="item" data-index=${i}><slot name="item" .item=${item} .index=${i}>${JSON.stringify(item)}</slot></div>
    `)}</div>`;
  }
}
customElements.define('forgeui-list', ForgeList);

export class ForgeChart extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; min-width:0; }
    .title { font-weight:var(--forgeui-weight-semibold); font-size:var(--forgeui-text-sm); margin-bottom:var(--forgeui-space-xs); color:var(--forgeui-color-text); }
    .wrap { width:100%; overflow:hidden; }
    svg { width:100%; height:auto; display:block; font-family:var(--forgeui-font-family); }
    .grid { stroke:var(--forgeui-color-border); stroke-width:1; opacity:0.6; }
    .axis { stroke:var(--forgeui-color-border-strong); stroke-width:1; }
    .tick-label { fill:var(--forgeui-color-text-secondary); font-size:11px; }
    .bar { fill:var(--forgeui-color-primary); transition:opacity 0.15s; }
    .bar:hover { opacity:0.8; }
    .line { fill:none; stroke:var(--forgeui-color-primary); stroke-width:2.5; }
    .point { fill:var(--forgeui-color-primary); }
    .area { fill:var(--forgeui-color-primary); opacity:0.12; }
    .slice { stroke:var(--forgeui-color-surface); stroke-width:2; }
    .legend { display:flex; flex-wrap:wrap; gap:var(--forgeui-space-sm); margin-top:var(--forgeui-space-sm); font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); }
    .legend-item { display:inline-flex; align-items:center; gap:var(--forgeui-space-2xs); }
    .swatch { display:inline-block; width:0.75rem; height:0.75rem; border-radius:2px; }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); }
    @media (prefers-reduced-motion: reduce) {
      .bar { transition:none; }
    }
  `; }

  _palette = [
    'var(--forgeui-color-primary)',
    'var(--forgeui-color-success)',
    'var(--forgeui-color-warning)',
    'var(--forgeui-color-error)',
    'var(--forgeui-color-info)',
    'var(--forgeui-color-chart-6)',
    'var(--forgeui-color-chart-7)',
    'var(--forgeui-color-chart-8)',
    'var(--forgeui-color-chart-9)',
    'var(--forgeui-color-chart-10)',
  ];

  _niceMax(v: number): number {
    if (v <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / mag;
    const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return nice * mag;
  }

  render() {
    const chartType = this.getString('chartType', 'bar');
    const data = (this.getProp('data') || []) as any[];
    const title = this.getString('title', '');
    const xKey = this.getString('xKey', 'label') || this.getString('labelKey', 'label');
    const yKey = this.getString('yKey', 'value') || this.getString('valueKey', 'value');
    const colorOverride = this.getString('color', '');

    if (!data || data.length === 0) {
      return html`
        ${title ? html`<div class="title">${title}</div>` : nothing}
        <div class="empty">No data to display</div>
      `;
    }

    const points = data.map((d: any) => {
      if (typeof d === 'number') return { label: '', value: d };
      if (d && typeof d === 'object') {
        return {
          label: String(d[xKey] ?? d.label ?? d.name ?? d.x ?? ''),
          value: Number(d[yKey] ?? d.value ?? d.y ?? 0) || 0,
          color: d.color,
        };
      }
      return { label: String(d), value: 0 };
    });

    const width = 600;
    const height = 260;
    const margin = { top: 8, right: 16, bottom: 36, left: 48 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    let body: any;
    let legend: any = nothing;

    if (chartType === 'pie' || chartType === 'donut') {
      const total = points.reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
      const cx = width / 2, cy = height / 2, r = Math.min(innerW, innerH) / 2 - 8;
      const innerR = chartType === 'donut' ? r * 0.55 : 0;
      let acc = -Math.PI / 2;
      const slices: any[] = [];
      const colors: string[] = [];
      points.forEach((p, i) => {
        const frac = Math.max(0, p.value) / total;
        const a0 = acc;
        const a1 = acc + frac * Math.PI * 2;
        acc = a1;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const color = p.color || this._palette[i % this._palette.length];
        colors.push(color);
        if (innerR > 0) {
          const ix0 = cx + innerR * Math.cos(a0), iy0 = cy + innerR * Math.sin(a0);
          const ix1 = cx + innerR * Math.cos(a1), iy1 = cy + innerR * Math.sin(a1);
          slices.push(svg`<path class="slice" fill="${color}" d="M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix0} ${iy0} Z"/>`);
        } else {
          slices.push(svg`<path class="slice" fill="${color}" d="M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z"/>`);
        }
      });
      body = svg`<g>${slices}</g>`;
      legend = html`<div class="legend">${points.map((p, i) => html`
        <span class="legend-item"><span class="swatch" style="background:${colors[i]}"></span>${p.label} (${p.value})</span>
      `)}</div>`;
    } else {
      const maxRaw = Math.max(...points.map(p => p.value), 0);
      const yMax = this._niceMax(maxRaw);
      const toY = (v: number) => margin.top + innerH - (v / yMax) * innerH;
      const ticks = 4;

      // Gridlines + Y-axis labels (rendered as svg templates to avoid innerHTML injection)
      const gridLines: any[] = [];
      for (let i = 0; i <= ticks; i++) {
        const v = (yMax * i) / ticks;
        const y = toY(v);
        gridLines.push(svg`<line class="grid" x1="${margin.left}" x2="${margin.left + innerW}" y1="${y}" y2="${y}"/>`);
        gridLines.push(svg`<text class="tick-label" x="${margin.left - 6}" y="${y + 3}" text-anchor="end">${v.toLocaleString()}</text>`);
      }

      if (chartType === 'line' || chartType === 'area') {
        const bandW = innerW / Math.max(1, points.length - 1);
        const pathData = points.map((p, i) => {
          const x = margin.left + i * bandW;
          const y = toY(p.value);
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
        const areaData = chartType === 'area'
          ? pathData + ` L ${margin.left + innerW} ${margin.top + innerH} L ${margin.left} ${margin.top + innerH} Z`
          : '';
        const lineColor = colorOverride || 'var(--forgeui-color-primary)';
        body = html`
          <g>${gridLines}</g>
          ${chartType === 'area' ? svg`<path class="area" d="${areaData}" style="fill:${lineColor};opacity:0.15"/>` : nothing}
          ${svg`<path class="line" d="${pathData}" style="stroke:${lineColor}"/>`}
          ${points.map((p, i) => {
            const x = margin.left + i * bandW;
            const y = toY(p.value);
            return svg`<circle class="point" cx="${x}" cy="${y}" r="3" style="fill:${lineColor}"/>
              <text class="tick-label" x="${x}" y="${margin.top + innerH + 14}" text-anchor="middle">${p.label}</text>`;
          })}
        `;
      } else {
        // Bar chart (default)
        const n = points.length;
        const bandW = innerW / n;
        const barW = Math.max(2, bandW * 0.7);
        const barGap = bandW - barW;
        body = html`
          <g>${gridLines}</g>
          ${points.map((p, i) => {
            const x = margin.left + i * bandW + barGap / 2;
            const y = toY(p.value);
            const h = Math.max(0, margin.top + innerH - y);
            const barColor = p.color || colorOverride || 'var(--forgeui-color-primary)';
            return svg`<rect class="bar" x="${x}" y="${y}" width="${barW}" height="${h}" rx="2" style="fill:${barColor}">
                <title>${p.label}: ${p.value}</title>
              </rect>
              <text class="tick-label" x="${x + barW / 2}" y="${margin.top + innerH + 14}" text-anchor="middle">${p.label}</text>`;
          })}
        `;
      }
    }

    return html`
      ${title ? html`<div class="title">${title}</div>` : nothing}
      <div class="wrap">
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${title || chartType + ' chart'}">
          ${body}
        </svg>
        ${legend}
      </div>
    `;
  }
}
customElements.define('forgeui-chart', ForgeChart);

export class ForgeMetric extends ForgeUIElement {
  static get styles() { return css`
    :host { display:flex; flex-direction:column; padding:var(--forgeui-space-md); background:var(--forgeui-color-surface);
      border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); min-width:0; gap:var(--forgeui-space-2xs); }
    :host([variant="plain"]) { background:transparent; border:none; padding:0; }
    .label { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); font-weight:var(--forgeui-weight-medium); overflow-wrap:break-word; }
    .value-row { display:flex; align-items:center; gap:var(--forgeui-space-xs); flex-wrap:wrap; min-width:0; }
    .value { font-size:var(--forgeui-text-3xl); font-weight:var(--forgeui-weight-bold); color:var(--forgeui-color-text); line-height:1.1; letter-spacing:-0.02em; overflow-wrap:break-word; min-width:0; }
    .unit, .suffix { font-size:var(--forgeui-text-base); color:var(--forgeui-color-text-secondary); font-weight:var(--forgeui-weight-medium); overflow-wrap:break-word; }
    .trend { display:inline-flex; align-items:center; justify-content:center; min-width:1.5rem; min-height:1.5rem; gap:var(--forgeui-space-3xs);
      padding:var(--forgeui-space-3xs) var(--forgeui-space-xs); border-radius:var(--forgeui-radius-sm);
      font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-bold); line-height:1; white-space:nowrap; }
    .trend.icon-only { width:1.5rem; padding:0; }
    .trend.up { color:var(--forgeui-color-text-inverse); background:var(--forgeui-color-success); }
    .trend.down { color:var(--forgeui-color-text-inverse); background:var(--forgeui-color-error); }
    .trend.neutral { color:var(--forgeui-color-text-inverse); background:var(--forgeui-color-text-secondary); }
    .subtitle { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); overflow-wrap:break-word; }
    .goal { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); overflow-wrap:break-word; }
  `; }
  _trendMeta(trend: unknown): { dir: 'up' | 'down' | 'neutral'; arrow: string; display: string } | null {
    if (trend === undefined || trend === null || trend === '') return null;
    if (typeof trend === 'number') {
      if (trend > 0) return { dir: 'up', arrow: '↑', display: `${Math.abs(trend)}%` };
      if (trend < 0) return { dir: 'down', arrow: '↓', display: `${Math.abs(trend)}%` };
      return { dir: 'neutral', arrow: '→', display: '0%' };
    }
    if (typeof trend === 'string') {
      const s = trend.toLowerCase();
      // Try to parse "+12%", "-3%", "12.5"
      const m = trend.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*(%?)\s*$/);
      if (m) {
        const n = parseFloat(m[1]);
        const pct = m[2];
        if (n > 0) return { dir: 'up', arrow: '↑', display: `${Math.abs(n)}${pct}` };
        if (n < 0) return { dir: 'down', arrow: '↓', display: `${Math.abs(n)}${pct}` };
        return { dir: 'neutral', arrow: '→', display: `0${pct}` };
      }
      if (s === 'up' || s === 'positive' || s === 'increase') return { dir: 'up', arrow: '↑', display: '' };
      if (s === 'down' || s === 'negative' || s === 'decrease') return { dir: 'down', arrow: '↓', display: '' };
      if (s === 'flat' || s === 'neutral' || s === 'same') return { dir: 'neutral', arrow: '→', display: '' };
      return { dir: 'neutral', arrow: '', display: trend };
    }
    return null;
  }
  render() {
    const label = this.getString('label', '');
    const value = this.getProp('value');
    const trend = this.getProp('trend');
    const trendLabel = this.getString('trendLabel', '');
    const goal = this.getProp('goal');
    const unit = this.getString('unit', '');
    const suffix = this.getString('suffix', '');
    const subtitle = this.getString('subtitle', '');
    const variant = this.getString('variant', '');
    if (variant) this.setAttribute('variant', variant);
    const displayValue = typeof value === 'number' ? value.toLocaleString() : (value === undefined || value === null || value === '' ? '—' : String(value));
    const tm = this._trendMeta(trend);
    return html`
      ${label ? html`<div class="label">${label}</div>` : nothing}
      <div class="value-row">
        <span class="value">${displayValue}</span>
        ${unit ? html`<span class="unit">${unit}</span>` : nothing}
        ${suffix ? html`<span class="suffix">${suffix}</span>` : nothing}
        ${tm ? html`<span class="trend ${tm.dir} ${!tm.display && !trendLabel ? 'icon-only' : ''}">${tm.arrow}${tm.display ? html` ${tm.display}` : nothing}${trendLabel ? html` ${trendLabel}` : nothing}</span>` : nothing}
      </div>
      ${subtitle ? html`<div class="subtitle">${subtitle}</div>` : nothing}
      ${goal !== undefined && goal !== null && goal !== '' ? html`<div class="goal">Goal: ${typeof goal === 'number' ? goal.toLocaleString() : goal}</div>` : nothing}
    `;
  }
}
customElements.define('forgeui-metric', ForgeMetric);

// ═══════════════════════════════════════════════════════════════
// FEEDBACK (4)
// ═══════════════════════════════════════════════════════════════

export class ForgeAlert extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    .alert { padding:var(--forgeui-space-sm) var(--forgeui-space-md); border-radius:var(--forgeui-radius-md);
      border-left:4px solid; font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text); line-height:var(--forgeui-leading-normal); overflow-wrap:break-word; }
    .info { background:var(--forgeui-color-info-subtle); border-color:var(--forgeui-color-info); }
    .info strong { color:var(--forgeui-color-info); }
    .success { background:var(--forgeui-color-success-subtle); border-color:var(--forgeui-color-success); }
    .success strong { color:var(--forgeui-color-success); }
    .warning { background:var(--forgeui-color-warning-subtle); border-color:var(--forgeui-color-warning); }
    .warning strong { color:var(--forgeui-color-warning); }
    .error { background:var(--forgeui-color-error-subtle); border-color:var(--forgeui-color-error); }
    .error strong { color:var(--forgeui-color-error); }
  `; }
  render() {
    const variant = this.getString('variant', 'info');
    const title = this.getString('title', '');
    const message = this.getString('message', '');
    const role = (variant === 'error' || variant === 'warning') ? 'alert' : 'status';
    return html`<div class="alert ${variant}" role=${role}>
      ${title ? html`<strong>${title}</strong> ` : nothing}${message}<slot></slot>
    </div>`;
  }
}
customElements.define('forgeui-alert', ForgeAlert);

export class ForgeDialog extends ForgeUIElement {
  static get styles() { return css`
    :host { display:none; }
    :host([open]) { display:flex; position:fixed; inset:0; z-index:50; align-items:center; justify-content:center; }
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); }
    .dialog { position:relative; background:var(--forgeui-color-surface); border-radius:var(--forgeui-radius-md);
      padding:var(--forgeui-space-lg); min-width:min(20rem, 90vw); max-width:90vw; max-height:90vh; overflow:auto;
      border:1px solid var(--forgeui-color-border);
      box-shadow:var(--forgeui-shadow-lg); z-index:1; word-break:break-word; }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-md); }
    .actions { display:flex; justify-content:flex-end; gap:var(--forgeui-space-xs); margin-top:var(--forgeui-space-lg); }
  `; }

  private _priorFocus: Element | null = null;
  private _keydownHandler = (e: KeyboardEvent) => this._onKeydown(e);

  render() {
    const title = this.getString('title', '');
    const open = this.getBool('open');
    const titleId = `${this._instanceId}-title`;
    if (open) this.setAttribute('open', '');
    else this.removeAttribute('open');
    if (!open) return nothing;
    return html`
      <div class="backdrop" @click=${this._close}></div>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="${title ? titleId : nothing}"
        tabindex="-1"
        @click=${(e: Event) => e.stopPropagation()}
      >
        ${title ? html`<h2 id="${titleId}" class="title">${title}</h2>` : nothing}
        <slot></slot>
      </div>
    `;
  }

  updated(changed: Map<string, unknown>) {
    super.updated?.(changed);
    if (changed.has('props')) {
      const nowOpen = this.getBool('open');
      const prev = changed.get('props') as any;
      const wasOpen = prev?.open ?? false;
      if (nowOpen && !wasOpen) this._onOpen();
      else if (!nowOpen && wasOpen) this._onClose();
    }
  }

  private _onOpen() {
    this._priorFocus = (document.activeElement instanceof HTMLElement) ? document.activeElement : null;
    document.addEventListener('keydown', this._keydownHandler);
    requestAnimationFrame(() => {
      const dialogEl = this.shadowRoot?.querySelector('.dialog') as HTMLElement | null;
      const firstFocusable = this._firstFocusableInDialog();
      (firstFocusable ?? dialogEl)?.focus();
    });
  }

  private _onClose() {
    document.removeEventListener('keydown', this._keydownHandler);
    if (this._priorFocus instanceof HTMLElement) this._priorFocus.focus();
    this._priorFocus = null;
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    document.removeEventListener('keydown', this._keydownHandler);
  }

  private _onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this._close();
      return;
    }
    if (e.key === 'Tab') {
      this._trapFocus(e);
    }
  }

  private _trapFocus(e: KeyboardEvent) {
    const focusables = this._allFocusableInDialog();
    if (focusables.length === 0) { e.preventDefault(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = this.shadowRoot?.activeElement ?? document.activeElement;
    if (e.shiftKey) {
      if (active === first || !this._dialogContains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !this._dialogContains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  private _firstFocusableInDialog(): HTMLElement | null {
    return this._allFocusableInDialog()[0] ?? null;
  }

  private _allFocusableInDialog(): HTMLElement[] {
    const dialog = this.shadowRoot?.querySelector('.dialog');
    if (!dialog) return [];
    const selector = 'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
    const direct = Array.from(dialog.querySelectorAll<HTMLElement>(selector));
    const slot = dialog.querySelector('slot');
    const slotted = (slot instanceof HTMLSlotElement)
      ? slot.assignedElements({ flatten: true }).flatMap((el) => {
          const nodes = [el, ...Array.from(el.querySelectorAll<HTMLElement>(selector))];
          return nodes.filter((n): n is HTMLElement => n instanceof HTMLElement && n.matches(selector));
        })
      : [];
    return [...direct, ...slotted].filter((el) => !(el as HTMLButtonElement).disabled);
  }

  private _dialogContains(node: Element | null): boolean {
    if (!node) return false;
    const dialog = this.shadowRoot?.querySelector('.dialog');
    return dialog?.contains(node) ?? false;
  }

  private _close = () => {
    this.dispatchAction('close');
  };
}
customElements.define('forgeui-dialog', ForgeDialog);

export class ForgeProgress extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; flex:1 1 auto; min-width:8rem; }
    .progress { height:0.625rem; background:var(--forgeui-color-surface-alt); border-radius:var(--forgeui-radius-sm); overflow:hidden; border:1px solid var(--forgeui-color-border); }
    .bar { height:100%; background:var(--forgeui-color-primary); border-radius:var(--forgeui-radius-full); transition:width var(--forgeui-transition-normal); }
    .indeterminate .bar { width:30%; animation:indeterminate 1.5s ease infinite; }
    @keyframes indeterminate { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
    .meta { display:flex; align-items:center; justify-content:space-between; gap:var(--forgeui-space-xs);
      font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); margin-bottom:var(--forgeui-space-2xs); }
    .value { color:var(--forgeui-color-text); font-weight:var(--forgeui-weight-semibold); }
    @media (prefers-reduced-motion: reduce) {
      .bar { transition:none; animation:none; }
    }
  `; }
  render() {
    const rawValue = this.getProp('value');
    const max = this.getNumber('max', 100);
    const indeterminate = rawValue === undefined || rawValue === null;
    const value = indeterminate ? 0 : Math.max(0, Math.min(Number(rawValue), max));
    const pct = indeterminate ? 0 : (value / max) * 100;
    const label = this.getString('label', '');
    const showValue = this.getBool('showValue');
    return html`
      ${label || showValue ? html`
        <div class="meta">
          ${label ? html`<span>${label}</span>` : html`<span></span>`}
          ${showValue ? html`<span class="value">${Math.round(pct)}%</span>` : nothing}
        </div>
      ` : nothing}
      <div
        class="progress ${indeterminate ? 'indeterminate' : ''}"
        role="progressbar"
        aria-label="${label || 'Progress'}"
        aria-valuemin="0"
        aria-valuemax="${max}"
        aria-valuenow="${indeterminate ? nothing : value}"
        aria-valuetext="${indeterminate ? 'Loading' : `${Math.round(pct)}%`}"
      >
        <div class="bar" style=${indeterminate ? '' : `width:${pct}%`}></div>
      </div>
    `;
  }
}
customElements.define('forgeui-progress', ForgeProgress);

export class ForgeToast extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; position:fixed; bottom:var(--forgeui-space-lg); right:var(--forgeui-space-lg); z-index:60; }
    .toast { padding:var(--forgeui-space-sm) var(--forgeui-space-md); border-radius:var(--forgeui-radius-md);
      background:var(--forgeui-color-text); color:var(--forgeui-color-text-inverse); font-size:var(--forgeui-text-sm);
      box-shadow:var(--forgeui-shadow-lg); max-width:20rem; overflow-wrap:break-word; }
  `; }
  render() {
    const message = this.getString('message', '');
    if (!message) return html`${nothing}`;
    return html`<div class="toast">${message}</div>`;
  }
}
customElements.define('forgeui-toast', ForgeToast);

// ═══════════════════════════════════════════════════════════════
// NAVIGATION (2)
// ═══════════════════════════════════════════════════════════════

export class ForgeBreadcrumb extends ForgeUIElement {
  static get styles() { return css`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-xs); font-size:var(--forgeui-text-sm); }
    .sep { color:var(--forgeui-color-text-tertiary); }
    a { color:var(--forgeui-color-primary); text-decoration:none; }
    a:hover { text-decoration:underline; }
    .current { color:var(--forgeui-color-text); font-weight:var(--forgeui-weight-medium); }
  `; }
  render() {
    const items = (this.getProp('items') || []) as any[];
    return html`${items.map((item: any, i: number) => {
      const isLast = i === items.length - 1;
      const label = typeof item === 'string' ? item : item.label;
      const href = typeof item === 'string' ? '#' : item.href;
      return html`
        ${i > 0 ? html`<span class="sep">/</span>` : nothing}
        ${isLast ? html`<span class="current">${label}</span>` : html`<a href="${href}">${label}</a>`}
      `;
    })}`;
  }
}
customElements.define('forgeui-breadcrumb', ForgeBreadcrumb);

export class ForgeStepper extends ForgeUIElement {
  static get styles() { return css`
    :host { display:flex; width:100%; gap:0; }
    .step { flex:1; display:flex; flex-direction:column; align-items:center; position:relative; min-width:0; }
    /* Connector line: starts from after circle midpoint, ends at the next step's circle midpoint */
    .step:not(:last-child)::after { content:''; position:absolute; top:0.75rem;
      left:calc(50% + 0.875rem); right:calc(-50% + 0.875rem); height:2px;
      background:var(--forgeui-color-border); z-index:0; }
    .step:not(:last-child)[completed]::after { background:var(--forgeui-color-primary); }
    .circle { width:1.75rem; height:1.75rem; border-radius:var(--forgeui-radius-full); display:flex; align-items:center;
      justify-content:center; font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-semibold);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text-secondary); border:2px solid var(--forgeui-color-border); z-index:1;
      box-sizing:border-box; position:relative; }
    .step[active] .circle { background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); border-color:var(--forgeui-color-primary); }
    .step[completed] .circle { background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); border-color:var(--forgeui-color-primary); }
    .label { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); margin-top:var(--forgeui-space-xs); text-align:center; padding:0 var(--forgeui-space-2xs); }
    .step[active] .label { color:var(--forgeui-color-text); font-weight:var(--forgeui-weight-semibold); }
    .step[completed] .label { color:var(--forgeui-color-text); }
  `; }
  render() {
    const steps = (this.getProp('steps') || []) as any[];
    const activeValue = this.getBoundProp('active', this.getProp('activeStep') ?? 0);
    const active = Number(activeValue) || 0;
    return html`${steps.map((step: any, i: number) => {
      const label = typeof step === 'string' ? step : (step.label || step.title || `Step ${i + 1}`);
      const isActive = i === active;
      const isCompleted = i < active;
      return html`<div class="step" ?active=${isActive} ?completed=${isCompleted}>
        <div class="circle">${isCompleted ? '✓' : i + 1}</div>
        <div class="label">${label}</div>
      </div>`;
    })}`;
  }
}
customElements.define('forgeui-stepper', ForgeStepper);

// Error component for unknown/missing types
export class ForgeUIError extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; }
    .error { padding:var(--forgeui-space-sm); background:var(--forgeui-color-error-subtle); color:var(--forgeui-color-error);
      border:1px solid var(--forgeui-color-error); border-radius:var(--forgeui-radius-md); font-size:var(--forgeui-text-sm); }
  `; }
  render() {
    const msg = this.getString('msg', 'Unknown error');
    return html`<div class="error" role="alert">⚠ ${msg}</div>`;
  }
}
customElements.define('forgeui-error', ForgeUIError);

// ═══════════════════════════════════════════════════════════════
// DRAWING (1)
// ═══════════════════════════════════════════════════════════════

export class ForgeDrawing extends ForgeUIElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display:block; }
    svg { display:block; }
  `; }
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
    const common = {
      fill: s.fill ?? undefined,
      stroke: s.stroke ?? undefined,
      'stroke-width': s.strokeWidth ?? undefined,
      opacity: s.opacity ?? undefined,
    };
    const handleClick = s.action ? () => { if (this.onAction) this.onAction(s.action); } : undefined;
    const style = s.action ? 'cursor:pointer' : undefined;

    switch (s.type) {
      case 'rect':
        return svg`<rect
          x="${s.x ?? 0}" y="${s.y ?? 0}"
          width="${s.width ?? 0}" height="${s.height ?? 0}"
          rx="${s.rx ?? 0}" ry="${s.ry ?? 0}"
          fill="${common.fill ?? 'none'}"
          stroke="${common.stroke ?? 'none'}"
          stroke-width="${common['stroke-width'] ?? 0}"
          opacity="${common.opacity ?? 1}"
          style="${style}"
          @click=${handleClick}
        />`;
      case 'circle':
        return svg`<circle
          cx="${s.cx ?? 0}" cy="${s.cy ?? 0}" r="${s.r ?? 0}"
          fill="${common.fill ?? 'none'}"
          stroke="${common.stroke ?? 'none'}"
          stroke-width="${common['stroke-width'] ?? 0}"
          opacity="${common.opacity ?? 1}"
          style="${style}"
          @click=${handleClick}
        />`;
      case 'ellipse':
        return svg`<ellipse
          cx="${s.cx ?? s.x ?? 0}" cy="${s.cy ?? s.y ?? 0}"
          rx="${s.rx ?? (s.width ? s.width / 2 : 0)}" ry="${s.ry ?? (s.height ? s.height / 2 : 0)}"
          fill="${common.fill ?? 'none'}"
          stroke="${common.stroke ?? 'none'}"
          stroke-width="${common['stroke-width'] ?? 0}"
          opacity="${common.opacity ?? 1}"
          style="${style}"
          @click=${handleClick}
        />`;
      case 'line':
        return svg`<line
          x1="${s.x1 ?? 0}" y1="${s.y1 ?? 0}"
          x2="${s.x2 ?? 0}" y2="${s.y2 ?? 0}"
          stroke="${common.stroke ?? 'none'}"
          stroke-width="${common['stroke-width'] ?? 1}"
          opacity="${common.opacity ?? 1}"
          style="${style}"
          @click=${handleClick}
        />`;
      case 'text':
        return svg`<text
          x="${s.x ?? 0}" y="${s.y ?? 0}"
          fill="${common.fill ?? 'currentColor'}"
          font-size="${s.fontSize ?? 14}"
          font-weight="${s.fontWeight ?? 'normal'}"
          font-family="${s.fontFamily ?? 'sans-serif'}"
          text-anchor="${s.textAnchor ?? 'start'}"
          opacity="${common.opacity ?? 1}"
          style="${style}"
          @click=${handleClick}
        >${s.content ?? ''}</text>`;
      case 'path':
        return svg`<path
          d="${s.d ?? ''}"
          fill="${common.fill ?? 'none'}"
          stroke="${common.stroke ?? 'none'}"
          stroke-width="${common['stroke-width'] ?? 1}"
          opacity="${common.opacity ?? 1}"
          style="${style}"
          @click=${handleClick}
        />`;
      default:
        return svg``;
    }
  }
}
customElements.define('forgeui-drawing', ForgeDrawing);
