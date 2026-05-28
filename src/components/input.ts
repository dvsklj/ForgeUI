import { html, css, nothing } from 'lit';
import { ForgeUIElement } from './base.js';
import { storeFileBlobs } from '../runtime/persister.js';

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

export class ForgeTextarea extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); color:var(--forgeui-color-text); overflow-wrap:break-word; }
    textarea { width:100%; min-height:5rem; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; font-size:var(--forgeui-text-base); background:var(--forgeui-color-surface);
      color:var(--forgeui-color-text); transition:border-color var(--forgeui-transition-fast); box-sizing:border-box; min-width:0; resize:vertical; }
    textarea:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
    textarea::placeholder { color:var(--forgeui-color-text-tertiary); }
    .hint { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin-top:var(--forgeui-space-2xs); }
    .error { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-error); margin-top:var(--forgeui-space-2xs); }
  `; }
  render() {
    const label = this.getString('label', '');
    const placeholder = this.getString('placeholder', '');
    const hint = this.getString('hint', '');
    const error = this.getString('error', '');
    const rows = Math.max(1, Math.floor(this.getNumber('rows', 4)));
    const maxLength = this.getProp('maxLength') as number | undefined;
    const required = this.getBool('required');
    const disabled = this.getBool('disabled');
    const val = String(this.getBoundProp('value', '') ?? '');
    const inputId = this._instanceId;
    return html`
      ${label ? html`<label for="${inputId}">${label}</label>` : nothing}
      <textarea id="${inputId}" rows=${rows} placeholder="${placeholder}" maxlength=${maxLength ?? nothing}
        ?required=${required} ?disabled=${disabled} .value=${val}
        @input=${(e: any) => this.dispatchAction('change', { value: e.target.value })}></textarea>
      ${hint && !error ? html`<div class="hint">${hint}</div>` : nothing}
      ${error ? html`<div class="error">${error}</div>` : nothing}
    `;
  }
}
customElements.define('forgeui-textarea', ForgeTextarea);

export class ForgeForm extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; min-width:0; }
    form { display:flex; flex-direction:column; gap:var(--forgeui-space-md); min-width:0; }
  `; }
  render() {
    const action = this.getString('action', '');
    return html`<form @submit=${(event: SubmitEvent) => {
      event.preventDefault();
      const payload = { submitted: true };
      if (action) this.dispatchAction(action, payload);
      this.dispatchEvent(new CustomEvent('forgeui-submit', { detail: payload, bubbles: true, composed: true }));
    }}><slot></slot></form>`;
  }
}
customElements.define('forgeui-form', ForgeForm);

export class ForgeFieldGroup extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; min-width:0; }
    fieldset { border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); padding:var(--forgeui-space-md); margin:0; min-width:0; }
    legend { padding:0 var(--forgeui-space-2xs); color:var(--forgeui-color-text); font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-semibold); }
    .body { display:flex; flex-direction:column; gap:var(--forgeui-space-sm); }
    .description { color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-xs); margin-bottom:var(--forgeui-space-sm); }
    .error { color:var(--forgeui-color-error); font-size:var(--forgeui-text-xs); margin-top:var(--forgeui-space-sm); }
  `; }
  render() {
    const label = this.getString('label', '');
    const description = this.getString('description', '');
    const error = this.getString('error', '');
    return html`<fieldset>
      ${label ? html`<legend>${label}</legend>` : nothing}
      ${description ? html`<div class="description">${description}</div>` : nothing}
      <div class="body"><slot></slot></div>
      ${error ? html`<div class="error">${error}</div>` : nothing}
    </fieldset>`;
  }
}
customElements.define('forgeui-field-group', ForgeFieldGroup);

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
    :host { display:block; min-width:0; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    select { width:100%; min-height:calc(var(--forgeui-input-height) * 2); padding:var(--forgeui-space-xs) var(--forgeui-space-sm);
      border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); font:inherit;
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; }
    select:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
    .tags { display:flex; flex-wrap:wrap; gap:var(--forgeui-space-2xs); margin-top:var(--forgeui-space-xs); padding:var(--forgeui-space-xs); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); min-height:var(--forgeui-input-height); }
    .tag { display:inline-flex; align-items:center; gap:var(--forgeui-space-2xs); padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      background:var(--forgeui-color-primary-subtle); color:var(--forgeui-color-primary); border-radius:var(--forgeui-radius-sm);
      font-size:var(--forgeui-text-xs); max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .tag button { background:none; border:none; cursor:pointer; color:inherit; font:inherit; padding:0; border-radius:2px; }
    .tag button:focus-visible { outline:2px solid var(--forgeui-color-focus); outline-offset:1px; }
  `; }
  render() {
    const label = this.getString('label', '');
    const options = (this.getProp('options') || []) as any[];
    const rawSelected = this.getBoundProp('value', this.getProp('selected') ?? []);
    const rawMax = Number(this.getProp('maxSelections'));
    const limit = Number.isFinite(rawMax) && rawMax >= 0 ? rawMax : Infinity;
    const selected = (Array.isArray(rawSelected) ? rawSelected.map((value: any) => String(value)) : []).slice(0, limit);
    const disabled = this.getBool('disabled');
    const inputId = this._instanceId;
    const remove = (value: string) => {
      const next = selected.filter(item => item !== value);
      this.dispatchAction('remove', { value });
      this.dispatchAction('change', { value: next, selected: next });
    };
    return html`
      ${label ? html`<label for="${inputId}">${label}</label>` : nothing}
      <select id="${inputId}" multiple ?disabled=${disabled}
        @change=${(event: Event) => {
          const values = Array.from((event.target as HTMLSelectElement).selectedOptions).map(option => option.value).slice(0, limit);
          this.dispatchAction('change', { value: values, selected: values });
        }}>
        ${options.map((option: any) => {
          const value = String(typeof option === 'string' ? option : option?.value ?? option?.label ?? '');
          return html`<option value=${value} ?selected=${selected.includes(value)}>
            ${typeof option === 'string' ? option : option?.label ?? value}
          </option>`;
        })}
      </select>
      <div class="tags">
        ${selected.map((value: string) => html`<span class="tag">${value}<button type="button" aria-label=${`Remove ${value}`} @click=${() => remove(value)}>×</button></span>`)}
        <slot></slot>
      </div>
    `;
  }
}
customElements.define('forgeui-multi-select', ForgeMultiSelect);

export class ForgeRadioGroup extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    fieldset { border:0; padding:0; margin:0; min-width:0; }
    legend { font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); color:var(--forgeui-color-text); }
    .options { display:flex; flex-direction:column; gap:var(--forgeui-space-xs); }
    label { display:flex; align-items:center; gap:var(--forgeui-space-xs); font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text); cursor:pointer; overflow-wrap:anywhere; }
    input { width:1.125rem; height:1.125rem; accent-color:var(--forgeui-color-primary); flex:0 0 auto; }
    .hint { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin-top:var(--forgeui-space-2xs); }
  `; }
  render() {
    const label = this.getString('label', '');
    const hint = this.getString('hint', '');
    const options = (this.getProp('options') || []) as any[];
    const val = String(this.getBoundProp('value', '') ?? '');
    const disabled = this.getBool('disabled');
    const name = this._instanceId;
    return html`
      <fieldset ?disabled=${disabled}>
        ${label ? html`<legend>${label}</legend>` : nothing}
        <div class="options">
          ${options.map((option: any, i: number) => {
            const value = String(typeof option === 'string' ? option : option?.value ?? option?.label ?? '');
            const text = String(typeof option === 'string' ? option : option?.label ?? value);
            const id = `${name}-${i}`;
            return html`<label for=${id}>
              <input id=${id} type="radio" name=${name} value=${value} ?checked=${value === val}
                @change=${(e: Event) => this.dispatchAction('change', { value: (e.target as HTMLInputElement).value })}>
              <span>${text}</span>
            </label>`;
          })}
        </div>
      </fieldset>
      ${hint ? html`<div class="hint">${hint}</div>` : nothing}
    `;
  }
}
customElements.define('forgeui-radio-group', ForgeRadioGroup);

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
    const inputId = this._instanceId;
    return html`
      ${label ? html`<label for="${inputId}">${label}</label>` : nothing}
      <input id="${inputId}" type="date" .value=${val} @change=${(e: any) => this.dispatchAction('change', { value: e.target.value })}>
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
    const inputId = this._instanceId;
    return html`
      ${label ? html`<label for="${inputId}">${label}</label>` : nothing}
      <input id="${inputId}" type="range" min=${min} max=${max} step=${step} .value=${val}
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
    .dropzone:hover, .dropzone.dragging { border-color:var(--forgeui-color-primary); background:var(--forgeui-color-primary-subtle); }
    .dropzone:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:2px; }
    .dropzone p { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); }
  `; }
  private _dragging = false;

  private _maxSizeBytes(): number | null {
    const raw = this.getProp('maxSize');
    if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) return Math.floor(raw);
    if (typeof raw !== 'string') return null;
    const match = raw.trim().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i);
    if (!match) return null;
    const value = Number(match[1]);
    const unit = (match[2] || 'b').toLowerCase();
    const multiplier = unit === 'gb' ? 1 << 30 : unit === 'mb' ? 1 << 20 : unit === 'kb' ? 1 << 10 : 1;
    const bytes = value * multiplier;
    return Number.isFinite(bytes) ? Math.floor(bytes) : null;
  }

  private _newFileId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  private _openFilePicker = () => {
    this.shadowRoot?.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  };

  private _onDropzoneKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this._openFilePicker();
  };

  private _onFileChange = (event: Event) => {
    const selected = Array.from((event.target as HTMLInputElement).files ?? []);
    this._processFiles(selected);
  };

  private _onDragOver = (event: DragEvent) => {
    event.preventDefault();
    if (this._dragging) return;
    this._dragging = true;
    this.requestUpdate();
  };

  private _onDragLeave = (event: DragEvent) => {
    if (event.currentTarget !== event.target) return;
    this._dragging = false;
    this.requestUpdate();
  };

  private _onDrop = (event: DragEvent) => {
    event.preventDefault();
    this._dragging = false;
    this.requestUpdate();
    this._processFiles(Array.from(event.dataTransfer?.files ?? []));
  };

  private _processFiles(selected: File[]) {
    const multiple = this.getBool('multiple');
    const maxSize = this._maxSizeBytes();
    const files = (multiple ? selected : selected.slice(0, 1)).map((file) => {
      const id = this._newFileId();
      const accepted = maxSize == null || file.size <= maxSize;
      const payload = {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        accepted,
        storageKey: accepted ? id : null,
      };
      if (!accepted) (payload as { error?: string }).error = 'maxSize';
      return [file, payload] as const;
    });

    const accepted = files.filter(([, payload]) => payload.accepted);
    const payloadFiles = files.map(([, payload]) => payload);
    const acceptedPayloads = accepted.map(([, payload]) => payload);
    const value = multiple ? acceptedPayloads : (acceptedPayloads[0] ?? null);
    const first = acceptedPayloads[0] ?? null;

    this.dispatchAction('change', {
      id: first?.id ?? null,
      uuid: first?.id ?? null,
      name: first?.name ?? null,
      size: first?.size ?? null,
      type: first?.type ?? null,
      lastModified: first?.lastModified ?? null,
      storageKey: first?.storageKey ?? null,
      value,
      files: payloadFiles,
      rejected: payloadFiles.filter((file) => !file.accepted),
      multiple,
      maxSize,
    });

    void storeFileBlobs(accepted.map(([file, payload]) => ({ file, id: payload.id })));
  }

  render() {
    const label = this.getString('label', 'Upload file');
    const accept = this.getString('accept', '*');
    const multiple = this.getBool('multiple');
    return html`
      ${label ? html`<label>${label}</label>` : nothing}
      <div class="dropzone ${this._dragging ? 'dragging' : ''}" role="button" tabindex="0"
        @click=${this._openFilePicker} @keydown=${this._onDropzoneKeydown}
        @dragover=${this._onDragOver} @dragleave=${this._onDragLeave} @drop=${this._onDrop}>
        <p>Drop</p>
        <input type="file" accept="${accept}" ?multiple=${multiple} hidden @change=${this._onFileChange}>
      </div>
    `;
  }
}
customElements.define('forgeui-file-upload', ForgeFileUpload);
