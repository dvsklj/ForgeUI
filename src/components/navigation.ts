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
