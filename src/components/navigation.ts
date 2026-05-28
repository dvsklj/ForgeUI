import { html, css, nothing } from 'lit';
import { ForgeUIElement } from './base.js';

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

export class ForgeSearchBox extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; min-width:0; }
    .field { display:flex; flex-direction:column; gap:var(--forgeui-space-2xs); min-width:0; }
    label { color:var(--forgeui-color-text); font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); }
    input { width:100%; min-height:var(--forgeui-touch-target); box-sizing:border-box; padding:0 var(--forgeui-space-md);
      border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); background:var(--forgeui-color-surface);
      color:var(--forgeui-color-text); font:inherit; font-size:var(--forgeui-text-sm); }
    input:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }
    input::placeholder { color:var(--forgeui-color-text-tertiary); }
  `; }
  render() {
    const label = this.getString('label', 'Search');
    const placeholder = this.getString('placeholder', 'Search');
    const value = String(this.getBoundProp('value', '') ?? '');
    const disabled = this.getBool('disabled');
    const action = this.getString('action', 'change');
    const id = this._instanceId;
    return html`<div class="field">
      <label for="${id}">${label}</label>
      <input id="${id}" type="search" placeholder="${placeholder}" .value=${value} ?disabled=${disabled}
        @input=${(event: Event) => {
          const next = (event.target as HTMLInputElement).value;
          this.dispatchAction(action, { value: next, query: next });
        }}>
    </div>`;
  }
}
customElements.define('forgeui-search-box', ForgeSearchBox);

export class ForgeSegmentedControl extends ForgeUIElement {
  static get styles() { return css`
    :host { display:inline-flex; min-width:0; max-width:100%; }
    .group { display:inline-flex; align-items:center; flex-wrap:wrap; gap:2px; max-width:100%;
      padding:2px; border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md);
      background:var(--forgeui-color-surface-muted); }
    button { min-height:var(--forgeui-touch-target); max-width:100%; padding:0 var(--forgeui-space-md);
      border:0; border-radius:calc(var(--forgeui-radius-md) - 2px); background:transparent; color:var(--forgeui-color-text-secondary);
      cursor:pointer; font:inherit; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium);
      overflow-wrap:anywhere; }
    button[aria-checked="true"] { background:var(--forgeui-color-surface); color:var(--forgeui-color-text);
      box-shadow:var(--forgeui-shadow-xs); }
    button:hover:not(:disabled) { color:var(--forgeui-color-text); background:var(--forgeui-color-surface-hover); }
    button:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }
    button:disabled { opacity:0.5; cursor:not-allowed; }
  `; }
  render() {
    const options = this.getArray('options');
    const value = String(this.getBoundProp('value', this.getProp('value') ?? this._optionValue(options[0])) ?? '');
    const disabled = this.getBool('disabled');
    const action = this.getString('action', 'change');
    return html`
      <div class="group" role="radiogroup" aria-label=${this.getString('label', 'Options')}>
        ${options.map((option: unknown) => {
          const optionValue = this._optionValue(option);
          const label = this._optionLabel(option, optionValue);
          const selected = optionValue === value;
          return html`<button type="button" role="radio" aria-checked=${selected ? 'true' : 'false'} ?disabled=${disabled}
            @click=${() => this.dispatchAction(action, { value: optionValue, selected: optionValue })}>${label}</button>`;
        })}
      </div>
    `;
  }
  private _optionValue(option: unknown): string {
    if (option && typeof option === 'object') {
      const item = option as Record<string, unknown>;
      return String(item.value ?? item.label ?? '');
    }
    return String(option ?? '');
  }
  private _optionLabel(option: unknown, fallback: string): string {
    if (option && typeof option === 'object') {
      const item = option as Record<string, unknown>;
      return String(item.label ?? item.value ?? fallback);
    }
    return fallback;
  }
}
customElements.define('forgeui-segmented-control', ForgeSegmentedControl);

export class ForgePagination extends ForgeUIElement {
  static get styles() { return css`
    :host { display:flex; align-items:center; justify-content:space-between; gap:var(--forgeui-space-sm); min-width:0; }
    .status { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); overflow-wrap:anywhere; }
    .controls { display:inline-flex; align-items:center; gap:var(--forgeui-space-xs); }
    button { min-width:var(--forgeui-touch-target); min-height:var(--forgeui-touch-target); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); background:var(--forgeui-color-surface); color:var(--forgeui-color-text);
      cursor:pointer; font:inherit; font-size:var(--forgeui-text-sm); }
    button:hover:not(:disabled) { background:var(--forgeui-color-surface-hover); }
    button:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }
    button:disabled { opacity:0.5; cursor:not-allowed; }
  `; }
  render() {
    const page = Math.max(1, Math.floor(Number(this.getBoundProp('page', this.getProp('page') ?? 1)) || 1));
    const totalPages = Math.max(1, Math.floor(this.getNumber('totalPages', 1)));
    const clamped = Math.min(page, totalPages);
    const label = this.getString('label', `Page ${clamped} of ${totalPages}`);
    const action = this.getString('action', 'page-change');
    const setPage = (next: number) => {
      const value = Math.min(totalPages, Math.max(1, next));
      this.dispatchAction(action, { value, page: value, totalPages });
    };
    return html`
      <div class="status" aria-live="polite">${label}</div>
      <div class="controls">
        <button type="button" aria-label="Previous page" ?disabled=${clamped <= 1} @click=${() => setPage(clamped - 1)}>‹</button>
        <button type="button" aria-label="Next page" ?disabled=${clamped >= totalPages} @click=${() => setPage(clamped + 1)}>›</button>
      </div>
    `;
  }
}
customElements.define('forgeui-pagination', ForgePagination);
