/**
 * Forge Components — All 37 Lit Web Components
 * 
 * Each component extends ForgeElement, uses design tokens,
 * dispatches forge-action events for declarative bindings.
 */

import { html, css, svg, nothing } from 'lit';
import { ForgeElement } from './base.js';

// ═══════════════════════════════════════════════════════════════
// LAYOUT (8)
// ═══════════════════════════════════════════════════════════════

export class ForgeStack extends ForgeElement {
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
    const g = this.getString('gap', 'md');
    const p = this.getString('padding', '');
    const a = this.getString('align', '');
    const j = this.getString('justify', '');
    const wrap = this.getBool('wrap');
    const gapCSS = this.gapValue(g);
    const padCSS = p ? `var(--forge-space-${p}, var(--forge-space-md))` : '0';
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
customElements.define('forge-stack', ForgeStack);

export class ForgeGrid extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display: grid; min-width: 0; }
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
    const padCSS = p ? `var(--forge-space-${p}, var(--forge-space-md))` : '0';
    this.style.gridTemplateColumns = gridTemplate;
    this.style.gap = gapCSS;
    this.style.padding = padCSS;
    // Mark for responsive collapse on small screens by default when >=2 columns
    if (/^\d+$/.test(cols) && Number(cols) >= 2) this.setAttribute('responsive', '');
    return html`<slot></slot>`;
  }
}
customElements.define('forge-grid', ForgeGrid);

export class ForgeCard extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display:block; background:var(--forge-color-surface); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-lg); padding:var(--forge-space-md); min-width:0; }
    :host([variant="elevated"]) { box-shadow:var(--forge-shadow-md); border-color:transparent; }
    :host([variant="compact"]) { padding:var(--forge-space-sm); border-radius:var(--forge-radius-md); }
    :host([variant="outline"]) { background:transparent; }
    :host([variant="ghost"]) { background:transparent; border-color:transparent; padding:0; }
    .header { margin-bottom:var(--forge-space-sm); }
    .title { font-size:var(--forge-text-lg); font-weight:var(--forge-weight-semibold); color:var(--forge-color-text); line-height:var(--forge-leading-tight); }
    .subtitle { font-size:var(--forge-text-sm); color:var(--forge-color-text-secondary); margin-top:var(--forge-space-3xs); }
    .body { display:flex; flex-direction:column; gap:var(--forge-space-md); min-width:0; }
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
customElements.define('forge-card', ForgeCard);

export class ForgeContainer extends ForgeElement {
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
    this.style.padding = p ? `var(--forge-space-${p}, var(--forge-space-md))` : '';
    return html`<slot></slot>`;
  }
}
customElements.define('forge-container', ForgeContainer);

export class ForgeTabs extends ForgeElement {
  static get properties() { return {
    props: { type: Object },
    _active: { state: true },
  }; }
  declare _active: string;
  constructor() { super(); this._active = ''; }
  static get styles() { return css`
    :host { display:block; }
    .tabs { display:flex; border-bottom:1px solid var(--forge-color-border); gap:var(--forge-space-xs); overflow-x:auto; }
    .tab { padding:var(--forge-space-sm) var(--forge-space-md); cursor:pointer; border:none; background:none;
      color:var(--forge-color-text-secondary); font:inherit; font-size:var(--forge-text-sm);
      border-bottom:2px solid transparent; transition:var(--forge-transition-fast); white-space:nowrap; }
    .tab:hover { color:var(--forge-color-text); background:var(--forge-color-surface-hover); }
    .tab[active] { color:var(--forge-color-primary); border-bottom-color:var(--forge-color-primary); font-weight:var(--forge-weight-medium); }
    .panel { padding-top:var(--forge-space-md); display:flex; flex-direction:column; gap:var(--forge-space-md); }
    ::slotted(*) { display:none; }
    ::slotted([data-active]) { display:block; }
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
      const isActive = String(i) === this._active || kid.id === this._active || kid.getAttribute('slot') === this._active;
      if (isActive) kid.setAttribute('data-active', '');
      else kid.removeAttribute('data-active');
    });
  }
  render() {
    const items: unknown = this.getProp('items') || [];
    const arr = Array.isArray(items) ? items : [];
    if (!this._active && arr.length > 0) this._active = this._itemKey(arr[0]) || '0';
    return html`
      <div class="tabs" role="tablist">${arr.map((item: any, i: number) => {
        const key = this._itemKey(item) || String(i);
        const label = this._itemLabel(item) || String(i + 1);
        const active = key === this._active;
        return html`
          <button class="tab" ?active=${active} role="tab" aria-selected=${active}
            @click=${() => { this._active = key; this.requestUpdate(); this.dispatchAction('tab-change', { active: key }); }}>${label}</button>
        `;
      })}</div>
      <div class="panel" role="tabpanel"><slot></slot></div>
    `;
  }
}
customElements.define('forge-tabs', ForgeTabs);

export class ForgeAccordion extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display:block; }
    details { border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-md); margin-bottom:var(--forge-space-2xs); }
    summary { padding:var(--forge-space-sm) var(--forge-space-md); cursor:pointer; font-weight:var(--forge-weight-medium);
      list-style:none; display:flex; justify-content:space-between; align-items:center; }
    summary::-webkit-details-marker { display:none; }
    summary::after { content:'▸'; transition:transform var(--forge-transition-fast); }
    details[open] summary::after { transform:rotate(90deg); }
    .content { padding:var(--forge-space-sm) var(--forge-space-md); }
  `; }
  render() {
    const title = this.getString('title', 'Section');
    return html`<details><summary>${title}</summary><div class="content"><slot></slot></div></details>`;
  }
}
customElements.define('forge-accordion', ForgeAccordion);

export class ForgeDivider extends ForgeElement {
  static get styles() { return css`
    :host { display:block; }
    hr { border:none; border-top:1px solid var(--forge-color-border); margin:var(--forge-space-sm) 0; }
  `; }
  render() { return html`<hr>`; }
}
customElements.define('forge-divider', ForgeDivider);

export class ForgeSpacer extends ForgeElement {
  static get styles() { return css`:host { display:block; }`; }
  render() {
    const s = this.getString('size', 'md');
    const h = `var(--forge-space-${s}, var(--forge-space-md))`;
    return html`<div style="height:${h}"></div>`;
  }
}
customElements.define('forge-spacer', ForgeSpacer);

/**
 * Repeater: renders a child element once per item in a data array.
 * The renderer (not this component) handles the iteration — this element
 * exists only so the type validates and so a clear empty state shows when
 * the data is empty. The actual iteration lives in renderer/index.ts.
 */
export class ForgeRepeater extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display:flex; flex-direction:column; gap:var(--forge-space-md); min-width:0; }
    :host([direction="row"]) { flex-direction:row; flex-wrap:wrap; }
    .empty { padding:var(--forge-space-lg); text-align:center; color:var(--forge-color-text-tertiary); font-size:var(--forge-text-sm); }
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
customElements.define('forge-repeater', ForgeRepeater);

// ═══════════════════════════════════════════════════════════════
// CONTENT (6)
// ═══════════════════════════════════════════════════════════════

export class ForgeText extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display:block; min-width:0; }
    .heading1 { font-size:var(--forge-text-3xl); font-weight:var(--forge-weight-bold); line-height:var(--forge-leading-tight); letter-spacing:-0.02em; margin:0; }
    .heading2 { font-size:var(--forge-text-2xl); font-weight:var(--forge-weight-bold); line-height:var(--forge-leading-tight); letter-spacing:-0.01em; margin:0; }
    .heading3 { font-size:var(--forge-text-xl); font-weight:var(--forge-weight-semibold); line-height:var(--forge-leading-tight); margin:0; }
    .heading { font-size:var(--forge-text-2xl); font-weight:var(--forge-weight-bold); line-height:var(--forge-leading-tight); margin:0; }
    .subheading { font-size:var(--forge-text-lg); font-weight:var(--forge-weight-semibold); line-height:var(--forge-leading-tight); margin:0; }
    .label { font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); color:var(--forge-color-text); margin:0; }
    .body { font-size:var(--forge-text-base); line-height:var(--forge-leading-normal); margin:0; }
    .caption { font-size:var(--forge-text-xs); color:var(--forge-color-text-tertiary); margin:0; }
    .muted { font-size:var(--forge-text-sm); color:var(--forge-color-text-secondary); margin:0; }
    .code { font-family:var(--forge-font-mono); font-size:var(--forge-text-sm); background:var(--forge-color-surface-alt);
      padding:var(--forge-space-2xs) var(--forge-space-xs); border-radius:var(--forge-radius-sm); display:inline-block; }
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
      primary: 'var(--forge-color-primary)',
      secondary: 'var(--forge-color-text-secondary)',
      tertiary: 'var(--forge-color-text-tertiary)',
      success: 'var(--forge-color-success)',
      warning: 'var(--forge-color-warning)',
      error: 'var(--forge-color-error)',
      info: 'var(--forge-color-info)',
    };
    const weightMap: Record<string, string> = {
      normal: 'var(--forge-weight-normal)',
      medium: 'var(--forge-weight-medium)',
      semibold: 'var(--forge-weight-semibold)',
      bold: 'var(--forge-weight-bold)',
    };
    const styles: string[] = [];
    if (colorScheme && colorMap[colorScheme]) styles.push(`color:${colorMap[colorScheme]}`);
    if (weight && weightMap[weight]) styles.push(`font-weight:${weightMap[weight]}`);
    const alignCls = align ? `align-${align}` : '';
    return html`<div class="${cls} ${alignCls}" style="${styles.join(';')}">${content}<slot></slot></div>`;
  }
}
customElements.define('forge-text', ForgeText);

export class ForgeImage extends ForgeElement {
  static get styles() { return css`
    :host { display:block; }
    img { max-width:100%; height:auto; display:block; border-radius:var(--forge-radius-md); }
  `; }
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
  static get styles() { return css`
    :host { display:inline-flex; align-items:center; justify-content:center; }
    svg { width:var(--forge-icon-md); height:var(--forge-icon-md); fill:currentColor; }
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
customElements.define('forge-icon', ForgeIcon);

export class ForgeBadge extends ForgeElement {
  static get styles() { return css`
    :host { display:inline-flex; align-items:center; }
    .badge { display:inline-flex; align-items:center; padding:var(--forge-space-2xs) var(--forge-space-xs);
      border-radius:var(--forge-radius-full); font-size:var(--forge-text-xs); font-weight:var(--forge-weight-medium);
      background:var(--forge-color-primary-subtle); color:var(--forge-color-primary); }
    .badge[variant="success"] { background:var(--forge-color-success-subtle); color:var(--forge-color-success); }
    .badge[variant="warning"] { background:var(--forge-color-warning-subtle); color:var(--forge-color-warning); }
    .badge[variant="error"] { background:var(--forge-color-error-subtle); color:var(--forge-color-error); }
  `; }
  render() {
    const label = this.getString('label', '');
    const v = this.getString('variant', '');
    return html`<span class="badge" variant="${v}">${label}<slot></slot></span>`;
  }
}
customElements.define('forge-badge', ForgeBadge);

export class ForgeAvatar extends ForgeElement {
  static get styles() { return css`
    :host { display:inline-flex; }
    .avatar { width:2.5rem; height:2.5rem; border-radius:var(--forge-radius-full); background:var(--forge-color-primary-subtle);
      color:var(--forge-color-primary); display:flex; align-items:center; justify-content:center;
      font-weight:var(--forge-weight-semibold); font-size:var(--forge-text-sm); overflow:hidden; }
    img { width:100%; height:100%; object-fit:cover; }
  `; }
  render() {
    const src = this.getString('src', '');
    const name = this.getString('name', '?');
    const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    return html`<div class="avatar">${src ? html`<img src="${src}" alt="${name}">` : initials}<slot></slot></div>`;
  }
}
customElements.define('forge-avatar', ForgeAvatar);

export class ForgeEmptyState extends ForgeElement {
  static get styles() { return css`
    :host { display:block; text-align:center; padding:var(--forge-space-2xl) var(--forge-space-lg); }
    .title { font-size:var(--forge-text-lg); font-weight:var(--forge-weight-semibold); margin-bottom:var(--forge-space-xs); }
    .desc { font-size:var(--forge-text-sm); color:var(--forge-color-text-secondary); margin-bottom:var(--forge-space-md); }
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
customElements.define('forge-empty-state', ForgeEmptyState);

// ═══════════════════════════════════════════════════════════════
// INPUT (9)
// ═══════════════════════════════════════════════════════════════

export class ForgeTextInput extends ForgeElement {
  static get styles() { return css`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); color:var(--forge-color-text); }
    input, textarea { width:100%; padding:var(--forge-space-xs) var(--forge-space-sm); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-md); font:inherit; font-size:var(--forge-text-base);
      background:var(--forge-color-surface); color:var(--forge-color-text); height:var(--forge-input-height);
      transition:border-color var(--forge-transition-fast); }
    input:focus, textarea:focus { outline:none; border-color:var(--forge-color-primary); box-shadow:0 0 0 3px var(--forge-color-primary-subtle); }
    input::placeholder { color:var(--forge-color-text-tertiary); }
    textarea { height:auto; min-height:5rem; resize:vertical; }
    .hint { font-size:var(--forge-text-xs); color:var(--forge-color-text-tertiary); margin-top:var(--forge-space-2xs); }
    .error { font-size:var(--forge-text-xs); color:var(--forge-color-error); margin-top:var(--forge-space-2xs); }
  `; }
  render() {
    const label = this.getString('label', '');
    const placeholder = this.getString('placeholder', '');
    const hint = this.getString('hint', '');
    const error = this.getString('error', '');
    const type = this.getString('inputType', 'text');
    const multiline = this.getBool('multiline');
    const val = this.getString('value', '');
    return html`
      ${label ? html`<label>${label}</label>` : nothing}
      ${multiline 
        ? html`<textarea placeholder="${placeholder}" .value=${val} @input=${(e: any) => this.dispatchAction('change', { value: e.target.value })}></textarea>`
        : html`<input type="${type}" placeholder="${placeholder}" .value=${val} @input=${(e: any) => this.dispatchAction('change', { value: e.target.value })}>`
      }
      ${hint && !error ? html`<div class="hint">${hint}</div>` : nothing}
      ${error ? html`<div class="error">${error}</div>` : nothing}
    `;
  }
}
customElements.define('forge-text-input', ForgeTextInput);

export class ForgeNumberInput extends ForgeElement {
  static get styles() { return css`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    input { width:100%; padding:var(--forge-space-xs) var(--forge-space-sm); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-md); font:inherit; height:var(--forge-input-height);
      background:var(--forge-color-surface); color:var(--forge-color-text); }
    input:focus { outline:none; border-color:var(--forge-color-primary); box-shadow:0 0 0 3px var(--forge-color-primary-subtle); }
  `; }
  render() {
    const label = this.getString('label', '');
    const min = this.getProp('min') as number | undefined;
    const max = this.getProp('max') as number | undefined;
    const step = this.getProp('step') as number | undefined;
    const val = this.getProp('value') as number | undefined;
    return html`
      ${label ? html`<label>${label}</label>` : nothing}
      <input type="number" min=${min} max=${max} step=${step} .value=${val ?? ''}
        @input=${(e: any) => this.dispatchAction('change', { value: Number(e.target.value) })}>
    `;
  }
}
customElements.define('forge-number-input', ForgeNumberInput);

export class ForgeSelect extends ForgeElement {
  static get styles() { return css`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    select { width:100%; padding:var(--forge-space-xs) var(--forge-space-sm); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-md); font:inherit; height:var(--forge-input-height);
      background:var(--forge-color-surface); color:var(--forge-color-text); }
    select:focus { outline:none; border-color:var(--forge-color-primary); box-shadow:0 0 0 3px var(--forge-color-primary-subtle); }
  `; }
  render() {
    const label = this.getString('label', '');
    const options = (this.getProp('options') || []) as any[];
    const val = this.getString('value', '');
    return html`
      ${label ? html`<label>${label}</label>` : nothing}
      <select .value=${val} @change=${(e: any) => this.dispatchAction('change', { value: e.target.value })}>
        ${options.map((o: any) => html`<option value=${typeof o === 'string' ? o : o.value} ?selected=${(typeof o === 'string' ? o : o.value) === val}>
          ${typeof o === 'string' ? o : (o.label || o.value)}
        </option>`)}
      </select>
    `;
  }
}
customElements.define('forge-select', ForgeSelect);

export class ForgeMultiSelect extends ForgeElement {
  static get styles() { return css`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    .tags { display:flex; flex-wrap:wrap; gap:var(--forge-space-2xs); padding:var(--forge-space-xs); border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-md); min-height:var(--forge-input-height); }
    .tag { display:inline-flex; align-items:center; gap:var(--forge-space-2xs); padding:var(--forge-space-2xs) var(--forge-space-xs);
      background:var(--forge-color-primary-subtle); color:var(--forge-color-primary); border-radius:var(--forge-radius-full);
      font-size:var(--forge-text-xs); }
    .tag button { background:none; border:none; cursor:pointer; color:inherit; font:inherit; padding:0; }
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
customElements.define('forge-multi-select', ForgeMultiSelect);

export class ForgeCheckbox extends ForgeElement {
  static get styles() { return css`
    :host { display:flex; align-items:center; gap:var(--forge-space-xs); margin-bottom:var(--forge-space-xs); cursor:pointer; }
    input { width:1.125rem; height:1.125rem; accent-color:var(--forge-color-primary); cursor:pointer; }
    label { font-size:var(--forge-text-sm); cursor:pointer; }
  `; }
  render() {
    const label = this.getString('label', '');
    const checked = this.getBool('checked');
    return html`
      <input type="checkbox" ?checked=${checked} @change=${(e: any) => this.dispatchAction('change', { checked: e.target.checked })}>
      ${label ? html`<label>${label}</label>` : nothing}
    `;
  }
}
customElements.define('forge-checkbox', ForgeCheckbox);

export class ForgeToggle extends ForgeElement {
  static get styles() { return css`
    :host { display:flex; align-items:center; gap:var(--forge-space-sm); margin-bottom:var(--forge-space-xs); }
    .switch { position:relative; width:2.75rem; height:1.5rem; background:var(--forge-color-border-strong);
      border-radius:var(--forge-radius-full); cursor:pointer; transition:background var(--forge-transition-fast); }
    .switch[on] { background:var(--forge-color-primary); }
    .switch::after { content:''; position:absolute; top:2px; left:2px; width:1.25rem; height:1.25rem;
      background:white; border-radius:var(--forge-radius-full); transition:transform var(--forge-transition-fast); }
    .switch[on]::after { transform:translateX(1.25rem); }
    label { font-size:var(--forge-text-sm); }
  `; }
  render() {
    const label = this.getString('label', '');
    const on = this.getBool('on');
    return html`
      <div class="switch" ?on=${on} @click=${() => this.dispatchAction('change', { on: !on })}></div>
      ${label ? html`<label>${label}</label>` : nothing}
    `;
  }
}
customElements.define('forge-toggle', ForgeToggle);

export class ForgeDatePicker extends ForgeElement {
  static get styles() { return css`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    input { width:100%; padding:var(--forge-space-xs) var(--forge-space-sm); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-md); font:inherit; height:var(--forge-input-height);
      background:var(--forge-color-surface); color:var(--forge-color-text); }
    input:focus { outline:none; border-color:var(--forge-color-primary); box-shadow:0 0 0 3px var(--forge-color-primary-subtle); }
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
customElements.define('forge-date-picker', ForgeDatePicker);

export class ForgeSlider extends ForgeElement {
  static get styles() { return css`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    input[type=range] { width:100%; accent-color:var(--forge-color-primary); }
    .value { font-size:var(--forge-text-xs); color:var(--forge-color-text-secondary); }
  `; }
  render() {
    const label = this.getString('label', '');
    const min = this.getNumber('min', 0);
    const max = this.getNumber('max', 100);
    const step = this.getNumber('step', 1);
    const val = this.getNumber('value', min);
    return html`
      ${label ? html`<label>${label}</label>` : nothing}
      <input type="range" min=${min} max=${max} step=${step} .value=${val}
        @input=${(e: any) => this.dispatchAction('change', { value: Number(e.target.value) })}>
      <div class="value">${val}</div>
    `;
  }
}
customElements.define('forge-slider', ForgeSlider);

export class ForgeFileUpload extends ForgeElement {
  static get styles() { return css`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    .dropzone { border:2px dashed var(--forge-color-border-strong); border-radius:var(--forge-radius-md);
      padding:var(--forge-space-xl); text-align:center; cursor:pointer; transition:border-color var(--forge-transition-fast); }
    .dropzone:hover { border-color:var(--forge-color-primary); }
    .dropzone p { color:var(--forge-color-text-secondary); font-size:var(--forge-text-sm); }
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
customElements.define('forge-file-upload', ForgeFileUpload);

// ═══════════════════════════════════════════════════════════════
// ACTION (3)
// ═══════════════════════════════════════════════════════════════

export class ForgeButton extends ForgeElement {
  static get styles() { return css`
    :host { display:inline-flex; }
    button { display:inline-flex; align-items:center; justify-content:center; gap:var(--forge-space-xs);
      padding:0 var(--forge-space-md); height:var(--forge-button-height); border:1px solid transparent;
      border-radius:var(--forge-radius-md); font:inherit; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium);
      cursor:pointer; transition:all var(--forge-transition-fast); white-space:nowrap; }
    button:focus-visible { outline:2px solid var(--forge-color-primary); outline-offset:2px; }
    .primary { background:var(--forge-color-primary); color:var(--forge-color-text-inverse); }
    .primary:hover { background:var(--forge-color-primary-hover); }
    .secondary { background:transparent; color:var(--forge-color-primary); border-color:var(--forge-color-primary); }
    .secondary:hover { background:var(--forge-color-primary-subtle); }
    .ghost { background:transparent; color:var(--forge-color-text-secondary); }
    .ghost:hover { background:var(--forge-color-surface-hover); color:var(--forge-color-text); }
    .danger { background:var(--forge-color-error); color:var(--forge-color-text-inverse); }
    .danger:hover { opacity:0.9; }
    .sm { height:2rem; padding:0 var(--forge-space-sm); font-size:var(--forge-text-xs); }
    .lg { height:3rem; padding:0 var(--forge-space-lg); font-size:var(--forge-text-base); }
    button:disabled { opacity:0.5; cursor:not-allowed; }
  `; }
  render() {
    const label = this.getString('label', 'Button');
    const variant = this.getString('variant', 'primary');
    const size = this.getString('size', '');
    const disabled = this.getBool('disabled');
    return html`<button class="${variant} ${size}" ?disabled=${disabled} @click=${(e: Event) => this.handleAction(e)}>${label}<slot></slot></button>`;
  }
}
customElements.define('forge-button', ForgeButton);

export class ForgeButtonGroup extends ForgeElement {
  static get styles() { return css`
    :host { display:flex; gap:var(--forge-space-xs); }
  `; }
  render() { return html`<slot></slot>`; }
}
customElements.define('forge-button-group', ForgeButtonGroup);

export class ForgeLink extends ForgeElement {
  static get styles() { return css`
    :host { display:inline-flex; }
    a { color:var(--forge-color-primary); text-decoration:none; font-size:var(--forge-text-sm); cursor:pointer; }
    a:hover { text-decoration:underline; }
  `; }
  render() {
    const label = this.getString('label', '');
    const href = this.getString('href', '#');
    return html`<a href="${href}">${label}<slot></slot></a>`;
  }
}
customElements.define('forge-link', ForgeLink);

// ═══════════════════════════════════════════════════════════════
// DATA DISPLAY (4)
// ═══════════════════════════════════════════════════════════════

export class ForgeTable extends ForgeElement {
  static get styles() { return css`
    :host { display:block; overflow-x:auto; min-width:0; width:100%; }
    table { width:100%; border-collapse:collapse; font-size:var(--forge-text-sm); }
    th { text-align:left; padding:var(--forge-space-sm); font-weight:var(--forge-weight-semibold);
      color:var(--forge-color-text-secondary); border-bottom:2px solid var(--forge-color-border); white-space:nowrap;
      text-transform:uppercase; letter-spacing:0.03em; font-size:var(--forge-text-xs); }
    td { padding:var(--forge-space-sm); border-bottom:1px solid var(--forge-color-border); vertical-align:middle; }
    tr:last-child td { border-bottom:none; }
    tbody tr:hover td { background:var(--forge-color-surface-hover); }
    .empty { padding:var(--forge-space-xl); text-align:center; color:var(--forge-color-text-tertiary); }
    .badge { display:inline-flex; align-items:center; padding:var(--forge-space-3xs) var(--forge-space-xs);
      border-radius:var(--forge-radius-full); font-size:var(--forge-text-xs); font-weight:var(--forge-weight-medium);
      background:var(--forge-color-surface-alt); color:var(--forge-color-text-secondary); }
    .badge.success { background:var(--forge-color-success-subtle); color:var(--forge-color-success); }
    .badge.warning { background:var(--forge-color-warning-subtle); color:var(--forge-color-warning); }
    .badge.error { background:var(--forge-color-error-subtle); color:var(--forge-color-error); }
    .badge.info, .badge.primary { background:var(--forge-color-primary-subtle); color:var(--forge-color-primary); }
    .badge.neutral { background:var(--forge-color-surface-alt); color:var(--forge-color-text-secondary); }
    .align-right { text-align:right; }
    .align-center { text-align:center; }
    .col-right th, .col-right td { text-align:right; }
    .col-center th, .col-center td { text-align:center; }
    .row-action { cursor:pointer; }
    .row-action:hover td { background:var(--forge-color-surface-hover); }
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
    if (raw === undefined || raw === null || raw === '') return html`<span style="color:var(--forge-color-text-tertiary)">—</span>`;
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
    const data = (this.getProp('data') || []) as any[];
    const columns = (this.getProp('columns') || []) as any[];
    const emptyMsg = this.getString('emptyMessage', 'No data yet');
    const rowAction = this.getString('rowAction', '');
    const cols = columns.length > 0 ? columns : (data.length > 0 ? Object.keys(data[0]) : []);
    if (cols.length === 0) return html`<div class="empty">${emptyMsg}</div>`;
    return html`
      <table>
        <thead><tr>${cols.map((c: any) => {
          const label = typeof c === 'string' ? c : (c.label || c.key);
          const align = typeof c === 'object' ? c.align : undefined;
          const width = typeof c === 'object' ? c.width : undefined;
          const alignCls = align === 'right' ? 'align-right' : align === 'center' ? 'align-center' : '';
          return html`<th class="${alignCls}" style="${width ? `width:${width}` : ''}">${label}</th>`;
        })}</tr></thead>
        <tbody>${data.length === 0
          ? html`<tr><td colspan=${cols.length} class="empty">${emptyMsg}</td></tr>`
          : data.map((row: any, i: number) => html`<tr class="${rowAction ? 'row-action' : ''}"
              @click=${rowAction ? () => this.dispatchAction(rowAction, { row, index: i }) : undefined}>
            ${cols.map((c: any) => {
              const align = typeof c === 'object' ? c.align : undefined;
              const alignCls = align === 'right' ? 'align-right' : align === 'center' ? 'align-center' : '';
              return html`<td class="${alignCls}">${this._renderCell(c, row)}</td>`;
            })}</tr>`)
        }</tbody>
      </table>
    `;
  }
}
customElements.define('forge-table', ForgeTable);

export class ForgeList extends ForgeElement {
  static get styles() { return css`
    :host { display:block; }
    .list { display:flex; flex-direction:column; gap:var(--forge-space-xs); }
    .item { padding:var(--forge-space-sm); border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-md);
      display:flex; align-items:center; gap:var(--forge-space-sm); }
    .item:hover { background:var(--forge-color-surface-hover); }
    .empty { padding:var(--forge-space-lg); text-align:center; color:var(--forge-color-text-tertiary); font-size:var(--forge-text-sm); }
  `; }
  render() {
    const data = (this.getProp('data') || []) as any[];
    const emptyMsg = this.getString('emptyMessage', 'No items');
    if (data.length === 0) return html`<div class="empty">${emptyMsg}</div>`;
    return html`<div class="list">${data.map((item: any, i: number) => html`
      <div class="item" data-index=${i}><slot name="item" .item=${item} .index=${i}>${JSON.stringify(item)}</slot></div>
    `)}</div>`;
  }
}
customElements.define('forge-list', ForgeList);

export class ForgeChart extends ForgeElement {
  static get styles() { return css`
    :host { display:block; min-width:0; }
    .title { font-weight:var(--forge-weight-semibold); font-size:var(--forge-text-sm); margin-bottom:var(--forge-space-xs); color:var(--forge-color-text); }
    .wrap { width:100%; }
    svg { width:100%; height:auto; display:block; font-family:var(--forge-font-family); }
    .grid { stroke:var(--forge-color-border); stroke-width:1; opacity:0.5; }
    .axis { stroke:var(--forge-color-border-strong); stroke-width:1; }
    .tick-label { fill:var(--forge-color-text-tertiary); font-size:10px; }
    .bar { fill:var(--forge-color-primary); transition:opacity 0.15s; }
    .bar:hover { opacity:0.85; }
    .line { fill:none; stroke:var(--forge-color-primary); stroke-width:2; }
    .point { fill:var(--forge-color-primary); }
    .area { fill:var(--forge-color-primary); opacity:0.15; }
    .slice { stroke:var(--forge-color-surface); stroke-width:2; }
    .legend { display:flex; flex-wrap:wrap; gap:var(--forge-space-sm); margin-top:var(--forge-space-xs); font-size:var(--forge-text-xs); color:var(--forge-color-text-secondary); }
    .legend-item { display:inline-flex; align-items:center; gap:var(--forge-space-2xs); }
    .swatch { display:inline-block; width:0.75rem; height:0.75rem; border-radius:2px; }
    .empty { padding:var(--forge-space-lg); text-align:center; color:var(--forge-color-text-tertiary); font-size:var(--forge-text-sm); }
  `; }

  _palette = [
    'var(--forge-color-primary)',
    'var(--forge-color-success)',
    'var(--forge-color-warning)',
    'var(--forge-color-error)',
    'var(--forge-color-info)',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6b7280',
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
      const slices: string[] = [];
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
          slices.push(`<path class="slice" fill="${color}" d="M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix0} ${iy0} Z"/>`);
        } else {
          slices.push(`<path class="slice" fill="${color}" d="M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z"/>`);
        }
      });
      body = html`<g .innerHTML=${slices.join('')}></g>`;
      legend = html`<div class="legend">${points.map((p, i) => html`
        <span class="legend-item"><span class="swatch" style="background:${colors[i]}"></span>${p.label} (${p.value})</span>
      `)}</div>`;
    } else {
      const maxRaw = Math.max(...points.map(p => p.value), 0);
      const yMax = this._niceMax(maxRaw);
      const toY = (v: number) => margin.top + innerH - (v / yMax) * innerH;
      const ticks = 4;

      // Gridlines + Y-axis labels
      const grid: string[] = [];
      for (let i = 0; i <= ticks; i++) {
        const v = (yMax * i) / ticks;
        const y = toY(v);
        grid.push(`<line class="grid" x1="${margin.left}" x2="${margin.left + innerW}" y1="${y}" y2="${y}"/>`);
        grid.push(`<text class="tick-label" x="${margin.left - 6}" y="${y + 3}" text-anchor="end">${v.toLocaleString()}</text>`);
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
        const lineColor = colorOverride || 'var(--forge-color-primary)';
        body = html`
          <g .innerHTML=${grid.join('')}></g>
          ${chartType === 'area' ? html`<path class="area" d="${areaData}" style="fill:${lineColor};opacity:0.15"/>` : nothing}
          <path class="line" d="${pathData}" style="stroke:${lineColor}"/>
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
          <g .innerHTML=${grid.join('')}></g>
          ${points.map((p, i) => {
            const x = margin.left + i * bandW + barGap / 2;
            const y = toY(p.value);
            const h = Math.max(0, margin.top + innerH - y);
            const barColor = p.color || colorOverride || 'var(--forge-color-primary)';
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
customElements.define('forge-chart', ForgeChart);

export class ForgeMetric extends ForgeElement {
  static get styles() { return css`
    :host { display:flex; flex-direction:column; padding:var(--forge-space-md); background:var(--forge-color-surface);
      border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-lg); min-width:0; gap:var(--forge-space-2xs); }
    :host([variant="plain"]) { background:transparent; border:none; padding:0; }
    .label { font-size:var(--forge-text-sm); color:var(--forge-color-text-secondary); font-weight:var(--forge-weight-medium); }
    .value-row { display:flex; align-items:baseline; gap:var(--forge-space-2xs); flex-wrap:wrap; }
    .value { font-size:var(--forge-text-3xl); font-weight:var(--forge-weight-bold); color:var(--forge-color-text); line-height:1.1; letter-spacing:-0.02em; }
    .unit, .suffix { font-size:var(--forge-text-base); color:var(--forge-color-text-secondary); font-weight:var(--forge-weight-medium); }
    .trend { display:inline-flex; align-items:center; gap:var(--forge-space-3xs); font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium);
      padding:var(--forge-space-3xs) var(--forge-space-xs); border-radius:var(--forge-radius-sm); }
    .trend.up { color:var(--forge-color-success); background:var(--forge-color-success-subtle); }
    .trend.down { color:var(--forge-color-error); background:var(--forge-color-error-subtle); }
    .trend.neutral { color:var(--forge-color-text-secondary); background:var(--forge-color-surface-alt); }
    .subtitle { font-size:var(--forge-text-xs); color:var(--forge-color-text-tertiary); }
    .goal { font-size:var(--forge-text-xs); color:var(--forge-color-text-tertiary); }
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
        ${tm ? html`<span class="trend ${tm.dir}">${tm.arrow}${tm.display ? html` ${tm.display}` : nothing}${trendLabel ? html` ${trendLabel}` : nothing}</span>` : nothing}
      </div>
      ${subtitle ? html`<div class="subtitle">${subtitle}</div>` : nothing}
      ${goal !== undefined && goal !== null && goal !== '' ? html`<div class="goal">Goal: ${typeof goal === 'number' ? goal.toLocaleString() : goal}</div>` : nothing}
    `;
  }
}
customElements.define('forge-metric', ForgeMetric);

// ═══════════════════════════════════════════════════════════════
// FEEDBACK (4)
// ═══════════════════════════════════════════════════════════════

export class ForgeAlert extends ForgeElement {
  static get styles() { return css`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    .alert { padding:var(--forge-space-sm) var(--forge-space-md); border-radius:var(--forge-radius-md);
      border-left:4px solid; font-size:var(--forge-text-sm); }
    .info { background:var(--forge-color-info-subtle); border-color:var(--forge-color-info); color:var(--forge-color-info); }
    .success { background:var(--forge-color-success-subtle); border-color:var(--forge-color-success); color:var(--forge-color-success); }
    .warning { background:var(--forge-color-warning-subtle); border-color:var(--forge-color-warning); color:var(--forge-color-warning); }
    .error { background:var(--forge-color-error-subtle); border-color:var(--forge-color-error); color:var(--forge-color-error); }
  `; }
  render() {
    const variant = this.getString('variant', 'info');
    const title = this.getString('title', '');
    const message = this.getString('message', '');
    return html`<div class="alert ${variant}">
      ${title ? html`<strong>${title}</strong> ` : nothing}${message}<slot></slot>
    </div>`;
  }
}
customElements.define('forge-alert', ForgeAlert);

export class ForgeDialog extends ForgeElement {
  static get styles() { return css`
    :host { display:none; }
    :host([open]) { display:flex; position:fixed; inset:0; z-index:50; align-items:center; justify-content:center; }
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); }
    .dialog { position:relative; background:var(--forge-color-surface); border-radius:var(--forge-radius-lg);
      padding:var(--forge-space-lg); min-width:20rem; max-width:90vw; max-height:90vh; overflow:auto;
      box-shadow:var(--forge-shadow-lg); z-index:1; }
    .title { font-size:var(--forge-text-lg); font-weight:var(--forge-weight-semibold); margin-bottom:var(--forge-space-md); }
    .actions { display:flex; justify-content:flex-end; gap:var(--forge-space-xs); margin-top:var(--forge-space-lg); }
  `; }
  render() {
    const title = this.getString('title', '');
    const open = this.getBool('open');
    if (open) this.setAttribute('open', '');
    else this.removeAttribute('open');
    return html`
      <div class="backdrop" @click=${() => this.dispatchAction('close')}></div>
      <div class="dialog">
        ${title ? html`<div class="title">${title}</div>` : nothing}
        <slot></slot>
      </div>
    `;
  }
}
customElements.define('forge-dialog', ForgeDialog);

export class ForgeProgress extends ForgeElement {
  static get styles() { return css`
    :host { display:block; }
    .progress { height:0.5rem; background:var(--forge-color-surface-alt); border-radius:var(--forge-radius-full); overflow:hidden; }
    .bar { height:100%; background:var(--forge-color-primary); border-radius:var(--forge-radius-full); transition:width var(--forge-transition-normal); }
    .indeterminate .bar { width:30%; animation:indeterminate 1.5s ease infinite; }
    @keyframes indeterminate { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
    .label { font-size:var(--forge-text-xs); color:var(--forge-color-text-secondary); margin-top:var(--forge-space-2xs); }
  `; }
  render() {
    const value = this.getProp('value') as number | undefined;
    const indeterminate = value === undefined;
    const pct = typeof value === 'number' ? `${Math.min(100, Math.max(0, value))}%` : '0%';
    return html`
      <div class="progress ${indeterminate ? 'indeterminate' : ''}">
        <div class="bar" style=${indeterminate ? '' : `width:${pct}`}></div>
      </div>
    `;
  }
}
customElements.define('forge-progress', ForgeProgress);

export class ForgeToast extends ForgeElement {
  static get styles() { return css`
    :host { display:block; position:fixed; bottom:var(--forge-space-lg); right:var(--forge-space-lg); z-index:60; }
    .toast { padding:var(--forge-space-sm) var(--forge-space-md); border-radius:var(--forge-radius-md);
      background:var(--forge-color-text); color:var(--forge-color-text-inverse); font-size:var(--forge-text-sm);
      box-shadow:var(--forge-shadow-lg); max-width:20rem; }
  `; }
  render() {
    const message = this.getString('message', '');
    if (!message) return html`${nothing}`;
    return html`<div class="toast">${message}</div>`;
  }
}
customElements.define('forge-toast', ForgeToast);

// ═══════════════════════════════════════════════════════════════
// NAVIGATION (2)
// ═══════════════════════════════════════════════════════════════

export class ForgeBreadcrumb extends ForgeElement {
  static get styles() { return css`
    :host { display:flex; align-items:center; gap:var(--forge-space-xs); font-size:var(--forge-text-sm); }
    .sep { color:var(--forge-color-text-tertiary); }
    a { color:var(--forge-color-primary); text-decoration:none; }
    a:hover { text-decoration:underline; }
    .current { color:var(--forge-color-text); font-weight:var(--forge-weight-medium); }
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
customElements.define('forge-breadcrumb', ForgeBreadcrumb);

export class ForgeStepper extends ForgeElement {
  static get styles() { return css`
    :host { display:flex; width:100%; gap:0; }
    .step { flex:1; display:flex; flex-direction:column; align-items:center; position:relative; min-width:0; }
    /* Connector line: starts from after circle midpoint, ends at the next step's circle midpoint */
    .step:not(:last-child)::after { content:''; position:absolute; top:0.75rem;
      left:calc(50% + 0.875rem); right:calc(-50% + 0.875rem); height:2px;
      background:var(--forge-color-border); z-index:0; }
    .step:not(:last-child)[completed]::after { background:var(--forge-color-primary); }
    .circle { width:1.75rem; height:1.75rem; border-radius:var(--forge-radius-full); display:flex; align-items:center;
      justify-content:center; font-size:var(--forge-text-xs); font-weight:var(--forge-weight-semibold);
      background:var(--forge-color-surface); color:var(--forge-color-text-secondary); border:2px solid var(--forge-color-border); z-index:1;
      box-sizing:border-box; position:relative; }
    .step[active] .circle { background:var(--forge-color-primary); color:var(--forge-color-text-inverse); border-color:var(--forge-color-primary); }
    .step[completed] .circle { background:var(--forge-color-primary); color:var(--forge-color-text-inverse); border-color:var(--forge-color-primary); }
    .label { font-size:var(--forge-text-xs); color:var(--forge-color-text-secondary); margin-top:var(--forge-space-xs); text-align:center; padding:0 var(--forge-space-2xs); }
    .step[active] .label { color:var(--forge-color-text); font-weight:var(--forge-weight-semibold); }
    .step[completed] .label { color:var(--forge-color-text); }
  `; }
  render() {
    const steps = (this.getProp('steps') || []) as any[];
    const active = this.getNumber('active', 0);
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
customElements.define('forge-stepper', ForgeStepper);

// Error component for unknown/missing types
export class ForgeError extends ForgeElement {
  static get styles() { return css`
    :host { display:block; }
    .error { padding:var(--forge-space-sm); background:var(--forge-color-error-subtle); color:var(--forge-color-error);
      border:1px solid var(--forge-color-error); border-radius:var(--forge-radius-md); font-size:var(--forge-text-sm); }
  `; }
  render() {
    const msg = this.getString('msg', 'Unknown error');
    return html`<div class="error">⚠ ${msg}</div>`;
  }
}
customElements.define('forge-error', ForgeError);

// ═══════════════════════════════════════════════════════════════
// DRAWING (1)
// ═══════════════════════════════════════════════════════════════

export class ForgeDrawing extends ForgeElement {
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
customElements.define('forge-drawing', ForgeDrawing);
