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
    :host { display: flex; }
    :host([direction="row"]) { flex-direction: row; }
    :host([direction="column"]) { flex-direction: column; }
    :host([align="center"]) { align-items: center; }
    :host([align="end"]) { align-items: flex-end; }
    :host([wrap="true"]) { flex-wrap: wrap; }
  `; }
  render() {
    const d = this.getString('direction', 'column');
    const g = this.getString('gap', 'md');
    const p = this.getString('padding', '');
    const a = this.getString('align', '');
    const gapCSS = this.gapValue(g);
    const padCSS = p ? `var(--forge-space-${p}, 0)` : '0';
    this.setAttribute('direction', d);
    if (a) this.setAttribute('align', a);
    return html`<slot style="gap:${gapCSS};padding:${padCSS}"></slot>`;
  }
}
customElements.define('forge-stack', ForgeStack);

export class ForgeGrid extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`:host { display: grid; }`; }
  render() {
    const cols = this.getString('columns', '1');
    const g = this.getString('gap', 'md');
    const gapCSS = this.gapValue(g);
    return html`<slot style="grid-template-columns:repeat(${cols},1fr);gap:${gapCSS}"></slot>`;
  }
}
customElements.define('forge-grid', ForgeGrid);

export class ForgeCard extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display:block; background:var(--forge-color-surface); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-lg); padding:var(--forge-space-md); }
    :host([variant="elevated"]) { box-shadow:var(--forge-shadow-md); border-color:transparent; }
    :host([variant="compact"]) { padding:var(--forge-space-sm); border-radius:var(--forge-radius-md); }
    :host([variant="outline"]) { background:transparent; }
  `; }
  render() {
    const v = this.getString('variant', '');
    if (v) this.setAttribute('variant', v);
    return html`<slot></slot>`;
  }
}
customElements.define('forge-card', ForgeCard);

export class ForgeContainer extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`:host { display:block; }`; }
  render() {
    const mw = this.getString('maxWidth', 'none');
    const p = this.getString('padding', '');
    return html`<slot style="max-width:${mw};${p ? 'padding:var(--forge-space-'+p+')' : ''}"></slot>`;
  }
}
customElements.define('forge-container', ForgeContainer);

export class ForgeTabs extends ForgeElement {
  static get properties() { return { props: { type: Object } }; 
    // @ts-ignore
    _active: { type: String }
  }
  _active = '';
  static get styles() { return css`
    :host { display:block; }
    .tabs { display:flex; border-bottom:1px solid var(--forge-color-border); gap:var(--forge-space-xs); }
    .tab { padding:var(--forge-space-sm) var(--forge-space-md); cursor:pointer; border:none; background:none;
      color:var(--forge-color-text-secondary); font:inherit; font-size:var(--forge-text-sm);
      border-bottom:2px solid transparent; transition:var(--forge-transition-fast); }
    .tab:hover { color:var(--forge-color-text); background:var(--forge-color-surface-hover); }
    .tab[active] { color:var(--forge-color-primary); border-bottom-color:var(--forge-color-primary); font-weight:var(--forge-weight-medium); }
    .panel { padding:var(--forge-space-md); }
  `; }
  render() {
    const items: unknown = this.getProp('items') || [];
    const arr = Array.isArray(items) ? items : [];
    if (!this._active && arr.length > 0) this._active = String(arr[0]);
    return html`
      <div class="tabs">${arr.map((item: any) => html`
        <button class="tab" ?active=${String(item) === this._active} @click=${() => { this._active = String(item); this.dispatchAction('tab-change', { active: String(item) }); }}>${String(item)}</button>
      `)}</div>
      <div class="panel"><slot></slot></div>
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

// ═══════════════════════════════════════════════════════════════
// CONTENT (6)
// ═══════════════════════════════════════════════════════════════

export class ForgeText extends ForgeElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display:block; }
    .heading { font-size:var(--forge-text-2xl); font-weight:var(--forge-weight-bold); line-height:var(--forge-leading-tight); margin:0 0 var(--forge-space-sm); }
    .subheading { font-size:var(--forge-text-lg); font-weight:var(--forge-weight-semibold); color:var(--forge-color-text-secondary); margin:0 0 var(--forge-space-xs); }
    .body { font-size:var(--forge-text-base); line-height:var(--forge-leading-normal); margin:0; }
    .caption { font-size:var(--forge-text-xs); color:var(--forge-color-text-tertiary); }
    .code { font-family:var(--forge-font-mono); font-size:var(--forge-text-sm); background:var(--forge-color-surface-alt);
      padding:var(--forge-space-2xs) var(--forge-space-xs); border-radius:var(--forge-radius-sm); }
  `; }
  render() {
    const content = this.getString('content', '');
    const variant = this.getString('variant', 'body');
    const colorScheme = this.getString('colorScheme', '');
    const style = colorScheme === 'secondary' ? 'color:var(--forge-color-text-secondary)' : 
                  colorScheme === 'primary' ? 'color:var(--forge-color-primary)' : '';
    return html`<div class="${variant}" style="${style}">${content}<slot></slot></div>`;
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
    :host { display:block; margin-bottom:var(--forge-space-md); overflow-x:auto; }
    table { width:100%; border-collapse:collapse; font-size:var(--forge-text-sm); }
    th { text-align:left; padding:var(--forge-space-xs) var(--forge-space-sm); font-weight:var(--forge-weight-semibold);
      color:var(--forge-color-text-secondary); border-bottom:2px solid var(--forge-color-border); white-space:nowrap; }
    td { padding:var(--forge-space-xs) var(--forge-space-sm); border-bottom:1px solid var(--forge-color-border); }
    tr:hover td { background:var(--forge-color-surface-hover); }
    .empty { padding:var(--forge-space-lg); text-align:center; color:var(--forge-color-text-tertiary); }
    .pagination { display:flex; justify-content:center; gap:var(--forge-space-xs); margin-top:var(--forge-space-sm); }
    .pagination button { padding:var(--forge-space-2xs) var(--forge-space-xs); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-sm); background:var(--forge-color-surface); cursor:pointer; font:inherit; }
    .pagination button[active] { background:var(--forge-color-primary); color:var(--forge-color-text-inverse); border-color:var(--forge-color-primary); }
  `; }
  render() {
    const data = (this.getProp('data') || []) as any[];
    const columns = (this.getProp('columns') || []) as any[];
    const emptyMsg = this.getString('emptyMessage', 'No data');
    if (data.length === 0 && columns.length === 0) return html`<div class="empty">${emptyMsg}</div>`;
    const cols = columns.length > 0 ? columns : (data.length > 0 ? Object.keys(data[0]) : []);
    return html`
      <table>
        <thead><tr>${cols.map((c: any) => html`<th>${typeof c === 'string' ? c : c.label || c.key}</th>`)}</tr></thead>
        <tbody>${data.length === 0 
          ? html`<tr><td colspan=${cols.length} class="empty">${emptyMsg}</td></tr>`
          : data.map((row: any) => html`<tr>${cols.map((c: any) => {
              const key = typeof c === 'string' ? c : c.key;
              return html`<td>${row[key] ?? ''}</td>`;
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
    :host { display:block; }
    canvas { width:100%; height:auto; }
    .fallback { padding:var(--forge-space-md); text-align:center; color:var(--forge-color-text-secondary); font-size:var(--forge-text-sm); }
  `; }
  render() {
    // Phase 1: simple canvas-based chart rendering
    const chartType = this.getString('chartType', 'bar');
    const data = (this.getProp('data') || []) as any[];
    const title = this.getString('title', '');
    return html`
      ${title ? html`<div style="font-weight:var(--forge-weight-semibold);margin-bottom:var(--forge-space-xs)">${title}</div>` : nothing}
      <div class="fallback">Chart: ${chartType} (${data.length} data points)<br><small>Canvas rendering in Phase 2</small></div>
      <slot></slot>
    `;
  }
}
customElements.define('forge-chart', ForgeChart);

export class ForgeMetric extends ForgeElement {
  static get styles() { return css`
    :host { display:block; padding:var(--forge-space-md); background:var(--forge-color-surface);
      border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-lg); text-align:center; }
    .label { font-size:var(--forge-text-sm); color:var(--forge-color-text-secondary); margin-bottom:var(--forge-space-2xs); }
    .value { font-size:var(--forge-text-3xl); font-weight:var(--forge-weight-bold); color:var(--forge-color-text); line-height:1; }
    .trend { display:flex; align-items:center; gap:var(--forge-space-2xs); justify-content:center; margin-top:var(--forge-space-xs); font-size:var(--forge-text-sm); }
    .trend.up { color:var(--forge-color-success); }
    .trend.down { color:var(--forge-color-error); }
    .goal { font-size:var(--forge-text-xs); color:var(--forge-color-text-tertiary); margin-top:var(--forge-space-xs); }
  `; }
  render() {
    const label = this.getString('label', '');
    const value = this.getProp('value');
    const trend = this.getProp('trend') as number | undefined;
    const goal = this.getProp('goal');
    const displayValue = typeof value === 'number' ? value.toLocaleString() : String(value ?? '—');
    return html`
      <div class="label">${label}</div>
      <div class="value">${displayValue}</div>
      ${trend !== undefined ? html`<div class="trend ${trend >= 0 ? 'up' : 'down'}">
        ${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend)}%
      </div>` : nothing}
      ${goal !== undefined ? html`<div class="goal">Goal: ${typeof goal === 'number' ? goal.toLocaleString() : goal}</div>` : nothing}
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
    :host { display:flex; width:100%; }
    .step { flex:1; display:flex; flex-direction:column; align-items:center; position:relative; }
    .step:not(:last-child)::after { content:''; position:absolute; top:0.75rem; left:50%; width:100%; height:2px;
      background:var(--forge-color-border); transform:translateY(-50%); z-index:0; }
    .step:not(:last-child)[completed]::after { background:var(--forge-color-primary); }
    .circle { width:1.5rem; height:1.5rem; border-radius:var(--forge-radius-full); display:flex; align-items:center;
      justify-content:center; font-size:var(--forge-text-xs); font-weight:var(--forge-weight-medium);
      background:var(--forge-color-surface-alt); color:var(--forge-color-text-secondary); border:2px solid var(--forge-color-border); z-index:1; }
    .step[active] .circle { background:var(--forge-color-primary); color:var(--forge-color-text-inverse); border-color:var(--forge-color-primary); }
    .step[completed] .circle { background:var(--forge-color-success); color:white; border-color:var(--forge-color-success); }
    .label { font-size:var(--forge-text-xs); color:var(--forge-color-text-secondary); margin-top:var(--forge-space-xs); text-align:center; }
    .step[active] .label { color:var(--forge-color-text); font-weight:var(--forge-weight-medium); }
  `; }
  render() {
    const steps = (this.getProp('steps') || []) as any[];
    const active = this.getNumber('active', 0);
    return html`${steps.map((step: any, i: number) => {
      const label = typeof step === 'string' ? step : step.label;
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
