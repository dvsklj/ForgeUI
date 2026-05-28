// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import '../src/components/index.js';

describe('input components', () => {
  it('registers input primitives from the aggregate entrypoint', () => {
    expect(customElements.get('forgeui-form')).toBeDefined();
    expect(customElements.get('forgeui-field-group')).toBeDefined();
    expect(customElements.get('forgeui-text-input')).toBeDefined();
    expect(customElements.get('forgeui-textarea')).toBeDefined();
    expect(customElements.get('forgeui-number-input')).toBeDefined();
    expect(customElements.get('forgeui-select')).toBeDefined();
    expect(customElements.get('forgeui-combobox')).toBeDefined();
    expect(customElements.get('forgeui-multi-select')).toBeDefined();
    expect(customElements.get('forgeui-radio-group')).toBeDefined();
    expect(customElements.get('forgeui-checkbox')).toBeDefined();
    expect(customElements.get('forgeui-toggle')).toBeDefined();
    expect(customElements.get('forgeui-date-picker')).toBeDefined();
    expect(customElements.get('forgeui-slider')).toBeDefined();
    expect(customElements.get('forgeui-file-upload')).toBeDefined();
  });

  it('dispatches form submit actions', async () => {
    const el = document.createElement('forgeui-form') as any;
    const events: any[] = [];
    el.props = { action: 'save' };
    el.onAction = (action: string, payload: Record<string, unknown>) => events.push({ action, payload });
    document.body.appendChild(el);
    await el.updateComplete;

    el.shadowRoot!.querySelector('form')!.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    expect(events).toEqual([{ action: 'save', payload: { submitted: true } }]);
  });

  it('renders field group label and description', async () => {
    const el = document.createElement('forgeui-field-group') as any;
    el.props = { label: 'Contact', description: 'How should we reach you?' };
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('legend')!.textContent).toBe('Contact');
    expect(el.shadowRoot!.querySelector('.description')!.textContent).toBe('How should we reach you?');
  });

  it('dispatches textarea value changes', async () => {
    const el = document.createElement('forgeui-textarea') as any;
    const events: any[] = [];
    el.props = { label: 'Notes', value: '', rows: 3 };
    el.onAction = (action: string, payload: Record<string, unknown>) => events.push({ action, payload });
    document.body.appendChild(el);
    await el.updateComplete;

    const textarea = el.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Ship it';
    textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));

    expect(events).toEqual([{ action: 'change', payload: { value: 'Ship it' } }]);
  });

  it('dispatches combobox value changes', async () => {
    const el = document.createElement('forgeui-combobox') as any;
    const events: any[] = [];
    el.props = { label: 'Assignee', value: '', options: ['Ari', 'Sam'] };
    el.onAction = (action: string, payload: Record<string, unknown>) => events.push({ action, payload });
    document.body.appendChild(el);
    await el.updateComplete;

    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    input.value = 'Sam';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));

    expect(events).toEqual([{ action: 'change', payload: { value: 'Sam' } }]);
    expect(el.shadowRoot!.querySelectorAll('datalist option')).toHaveLength(2);
  });

  it('dispatches selected radio value', async () => {
    const el = document.createElement('forgeui-radio-group') as any;
    const events: any[] = [];
    el.props = {
      label: 'Priority',
      value: 'low',
      options: [{ value: 'low', label: 'Low' }, { value: 'high', label: 'High' }],
    };
    el.onAction = (action: string, payload: Record<string, unknown>) => events.push({ action, payload });
    document.body.appendChild(el);
    await el.updateComplete;

    const high = el.shadowRoot!.querySelector('input[value="high"]') as HTMLInputElement;
    high.click();

    expect(events).toEqual([{ action: 'change', payload: { value: 'high' } }]);
  });
});
