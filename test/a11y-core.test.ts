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

describe('Core a11y — Tabs (P1)', () => {
  it('aria-controls/labelledby linkage', async () => {
    const el = await mount('forge-tabs', { items: ['One', 'Two'] });
    const panel = el.shadowRoot!.querySelector('[role="tabpanel"]')!;
    const panelId = panel.id;
    const firstTab = el.shadowRoot!.querySelector('[role="tab"]:first-of-type')!;
    expect(firstTab.getAttribute('aria-controls')).toBe(panelId);
    const activeTabId = el.shadowRoot!.querySelector('[aria-selected="true"]')!.id;
    expect(panel.getAttribute('aria-labelledby')).toBe(activeTabId);
  });

  it('ArrowRight moves focus and active state', async () => {
    const el = await mount('forge-tabs', { items: ['One', 'Two'] });
    const tabs = Array.from(el.shadowRoot!.querySelectorAll('[role="tab"]')) as HTMLButtonElement[];
    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    await new Promise(r => queueMicrotask(r));
    expect((el as any)._active).toBe('Two');
    expect(tabs[1].getAttribute('tabindex')).toBe('0');
    expect(tabs[0].getAttribute('tabindex')).toBe('-1');
  });

  it('ArrowLeft from first wraps to last', async () => {
    const el = await mount('forge-tabs', { items: ['One', 'Two'] });
    const tabs = Array.from(el.shadowRoot!.querySelectorAll('[role="tab"]')) as HTMLButtonElement[];
    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await el.updateComplete;
    await new Promise(r => queueMicrotask(r));
    expect((el as any)._active).toBe('Two');
  });
});

describe('Core a11y — Button aria-pressed (P1)', () => {
  it('aria-pressed set when pressed prop is boolean', async () => {
    const el1 = await mount('forge-button', { pressed: true });
    expect(el1.shadowRoot!.querySelector('button')!.getAttribute('aria-pressed')).toBe('true');
    const el2 = await mount('forge-button', { pressed: false });
    expect(el2.shadowRoot!.querySelector('button')!.getAttribute('aria-pressed')).toBe('false');
    const el3 = await mount('forge-button', {});
    expect(el3.shadowRoot!.querySelector('button')!.getAttribute('aria-pressed')).toBeNull();
  });
});

describe('Core a11y — Text heading elements (P1)', () => {
  it('heading variants render heading elements', async () => {
    const el1 = await mount('forge-text', { variant: 'h1', content: 'Title' });
    expect(el1.shadowRoot!.querySelector('h1')).not.toBeNull();
    expect(el1.shadowRoot!.querySelector('h1')!.textContent).toContain('Title');
    const el2 = await mount('forge-text', { variant: 'h2', content: 'Sub' });
    expect(el2.shadowRoot!.querySelector('h2')).not.toBeNull();
    const el3 = await mount('forge-text', { variant: 'h3', content: 'Sec' });
    expect(el3.shadowRoot!.querySelector('h3')).not.toBeNull();
    const el4 = await mount('forge-text', { variant: 'title', content: 'T' });
    expect(el4.shadowRoot!.querySelector('h2')).not.toBeNull();
    const el5 = await mount('forge-text', { variant: 'body', content: 'B' });
    expect(el5.shadowRoot!.querySelector('div')).not.toBeNull();
  });
});

describe('Core a11y — Table row keyboard (P1)', () => {
  it('row with rowAction is keyboard-activatable', async () => {
    const el = await mount('forge-table', {
      data: [{ name: 'A' }, { name: 'B' }],
      columns: ['name'],
      rowAction: 'select',
    });
    const row = el.shadowRoot!.querySelector('tbody tr') as HTMLTableRowElement;
    expect(row.getAttribute('tabindex')).toBe('0');
    expect(row.getAttribute('role')).toBe('button');
    const received: any[] = [];
    el.addEventListener('forge-action', (e: any) => received.push(e.detail));
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(received.length).toBe(1);
    expect(received[0].action).toBe('select');
    expect(received[0].payload.index).toBe(0);
  });

  it('row without rowAction is not focusable', async () => {
    const el = await mount('forge-table', {
      data: [{ name: 'A' }],
      columns: ['name'],
    });
    const row = el.shadowRoot!.querySelector('tbody tr') as HTMLTableRowElement;
    expect(row.hasAttribute('tabindex')).toBe(false);
  });
});

describe('Core a11y — Alert role by variant (P1)', () => {
  it('info variant uses role="status"', async () => {
    const el = await mount('forge-alert', { variant: 'info', message: 'FYI' });
    expect(el.shadowRoot!.querySelector('[role="status"]')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('[role="alert"]')).toBeNull();
  });

  it('error variant uses role="alert"', async () => {
    const el = await mount('forge-alert', { variant: 'error', message: 'Oops' });
    expect(el.shadowRoot!.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('warning variant uses role="alert"', async () => {
    const el = await mount('forge-alert', { variant: 'warning', message: 'Watch' });
    expect(el.shadowRoot!.querySelector('[role="alert"]')).not.toBeNull();
  });
});
