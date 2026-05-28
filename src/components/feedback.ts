import { html, css, nothing } from 'lit';
import { ForgeUIElement } from './base.js';

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
