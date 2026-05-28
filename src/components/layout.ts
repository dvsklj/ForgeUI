import { html, css, nothing } from 'lit';
import { ForgeUIElement } from './base.js';

export class ForgePageHeader extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; min-width:0; }
    header { display:flex; align-items:flex-start; justify-content:space-between; gap:var(--forgeui-space-md);
      min-width:0; padding-block:var(--forgeui-space-sm); border-bottom:1px solid var(--forgeui-color-border); }
    :host([density="compact"]) header { padding-block:var(--forgeui-space-xs); }
    :host([align="center"]) header { align-items:center; }
    .copy { min-width:0; display:flex; flex-direction:column; gap:var(--forgeui-space-2xs); }
    .eyebrow { color:var(--forgeui-color-primary); font-size:var(--forgeui-text-xs);
      font-weight:var(--forgeui-weight-semibold); text-transform:uppercase; overflow-wrap:anywhere; }
    h1 { margin:0; color:var(--forgeui-color-text); font-size:var(--forgeui-text-2xl);
      line-height:var(--forgeui-leading-tight); font-weight:var(--forgeui-weight-semibold); overflow-wrap:anywhere; }
    :host([density="compact"]) h1 { font-size:var(--forgeui-text-xl); }
    .subtitle { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm);
      line-height:var(--forgeui-leading-normal); overflow-wrap:anywhere; }
    .meta { color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-xs); overflow-wrap:anywhere; }
    .actions { display:flex; align-items:center; justify-content:flex-end; gap:var(--forgeui-space-xs);
      flex-wrap:wrap; min-width:0; }
    @media (max-width: 640px) {
      header { flex-direction:column; align-items:stretch; }
      .actions { justify-content:flex-start; }
    }
  `; }
  render() {
    const title = this.getString('title', 'Untitled');
    const subtitle = this.getString('subtitle', '');
    const eyebrow = this.getString('eyebrow', '');
    const meta = this.getString('meta', '');
    const density = this.getString('density', '');
    const align = this.getString('align', '');
    if (density) this.setAttribute('density', density);
    else this.removeAttribute('density');
    if (align) this.setAttribute('align', align);
    else this.removeAttribute('align');
    return html`
      <header>
        <div class="copy">
          ${eyebrow ? html`<div class="eyebrow">${eyebrow}</div>` : nothing}
          <h1>${title}</h1>
          ${subtitle ? html`<div class="subtitle">${subtitle}</div>` : nothing}
          ${meta ? html`<div class="meta">${meta}</div>` : nothing}
        </div>
        <div class="actions"><slot></slot></div>
      </header>
    `;
  }
}
customElements.define('forgeui-page-header', ForgePageHeader);

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
    const gridTemplate = /^\d+$/.test(cols) ? `repeat(${cols}, minmax(0, 1fr))` : cols;
    const g = this.getString('gap', 'md');
    const gapCSS = this.gapValue(g);
    const p = this.getString('padding', '');
    const padCSS = p ? this.gapValue(p) : '0';
    this.style.gridTemplateColumns = gridTemplate;
    this.style.gap = gapCSS;
    this.style.padding = padCSS;
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
