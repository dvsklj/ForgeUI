import { html, css, nothing } from 'lit';
import { ForgeUIElement } from './base.js';

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
