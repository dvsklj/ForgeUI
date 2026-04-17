// @vitest-environment jsdom

import { describe, it, expect, beforeAll } from 'vitest';
import '../src/components/index.js'; // Registers all custom elements

async function mount(tag: string, props: Record<string, unknown> = {}): Promise<HTMLElement> {
  const el = document.createElement(tag) as any;
  el.props = props;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('Core a11y — P0 fixes', () => {
  it('Toggle uses <button role="switch"> and exposes aria-checked', async () => {
    const el = await mount('forge-toggle', { on: false, label: 'Dark mode' });
    const btn = el.shadowRoot!.querySelector('button[role="switch"]');
    expect(btn).not.toBeNull();
    expect(btn!.getAttribute('aria-checked')).toBe('false');
    el.props = { on: true, label: 'Dark mode' };
    await (el as any).updateComplete;
    expect(el.shadowRoot!.querySelector('button[role="switch"]')!.getAttribute('aria-checked')).toBe('true');
  });

  it('Toggle dispatches forge-action on Enter and Space', async () => {
    const el = await mount('forge-toggle', { on: false });
    const btn = el.shadowRoot!.querySelector('button[role="switch"]') as HTMLButtonElement;
    const received: any[] = [];
    el.addEventListener('forge-action', (e: any) => received.push(e.detail));
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(received.length).toBe(2);
  });

  it('Dialog has role="dialog" and aria-modal="true" when open', async () => {
    const el = await mount('forge-dialog', { open: true, title: 'Confirm' });
    const dlg = el.shadowRoot!.querySelector('[role="dialog"]');
    expect(dlg).not.toBeNull();
    expect(dlg!.getAttribute('aria-modal')).toBe('true');
    expect(dlg!.getAttribute('aria-labelledby')).toBeTruthy();
    const titleId = dlg!.getAttribute('aria-labelledby')!;
    expect(el.shadowRoot!.getElementById(titleId)?.textContent).toBe('Confirm');
  });

  it('Dialog dispatches close forge-action on Escape', async () => {
    const el = await mount('forge-dialog', { open: true, title: 'Confirm' });
    const received: any[] = [];
    el.addEventListener('forge-action', (e: any) => received.push(e.detail));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(received.some((r) => r.actionId === 'close' || r.action === 'close')).toBe(true);
  });

  it('Alert has role="alert"', async () => {
    const el = await mount('forge-alert', { variant: 'error', message: 'Oops' });
    expect(el.shadowRoot!.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('Error has role="alert"', async () => {
    const el = await mount('forge-error', { msg: 'Broken' });
    expect(el.shadowRoot!.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('Progress has role="progressbar" with aria-value attributes', async () => {
    const el = await mount('forge-progress', { value: 40, max: 100 });
    const bar = el.shadowRoot!.querySelector('[role="progressbar"]');
    expect(bar).not.toBeNull();
    expect(bar!.getAttribute('aria-valuenow')).toBe('40');
    expect(bar!.getAttribute('aria-valuemin')).toBe('0');
    expect(bar!.getAttribute('aria-valuemax')).toBe('100');
  });

  it('Progress omits aria-valuenow when indeterminate', async () => {
    const el = await mount('forge-progress', { max: 100 });
    const bar = el.shadowRoot!.querySelector('[role="progressbar"]');
    expect(bar).not.toBeNull();
    expect(bar!.hasAttribute('aria-valuenow')).toBe(false);
  });
});

describe('Core a11y — label linkage (P1)', () => {
  it.each([
    ['forge-text-input', 'input'],
    ['forge-number-input', 'input'],
    ['forge-select', 'select'],
    ['forge-checkbox', 'input'],
    ['forge-toggle', 'button'],
  ])('%s label is associated to the %s via for/id', async (tag, innerSel) => {
    const el = await mount(tag, { label: 'Field' });
    const label = el.shadowRoot!.querySelector('label');
    const input = el.shadowRoot!.querySelector(innerSel);
    expect(label).not.toBeNull();
    expect(input).not.toBeNull();
    const forAttr = label!.getAttribute('for');
    const idAttr = input!.getAttribute('id');
    expect(forAttr).toBeTruthy();
    expect(idAttr).toBeTruthy();
    expect(forAttr).toBe(idAttr);
  });
});

describe('Core a11y — prefers-reduced-motion (P1)', () => {
  it.each([
    ['forge-tabs', '.tab'],
    ['forge-button', 'button'],
    ['forge-toggle', '.switch'],
    ['forge-progress', '.bar'],
    ['forge-chart', '.bar'],
  ])('%s respects prefers-reduced-motion for %s', async (tag, sel) => {
    const CompCtor = customElements.get(tag) as any;
    expect(CompCtor).toBeDefined();
    const styles = CompCtor.styles ?? CompCtor.elementStyles ?? [];
    const cssText = Array.isArray(styles)
      ? styles.map((s: any) => s.cssText ?? String(s)).join('\n')
      : (styles.cssText ?? String(styles));
    expect(cssText).toMatch(/@media[^{]*prefers-reduced-motion\s*:\s*reduce/);
    expect(cssText).toContain(sel);
  });
});
