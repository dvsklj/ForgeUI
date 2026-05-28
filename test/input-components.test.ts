// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import '../src/components/index.js';

describe('input components', () => {
  it('registers input primitives from the aggregate entrypoint', () => {
    expect(customElements.get('forgeui-text-input')).toBeDefined();
    expect(customElements.get('forgeui-number-input')).toBeDefined();
    expect(customElements.get('forgeui-select')).toBeDefined();
    expect(customElements.get('forgeui-multi-select')).toBeDefined();
    expect(customElements.get('forgeui-radio-group')).toBeDefined();
    expect(customElements.get('forgeui-checkbox')).toBeDefined();
    expect(customElements.get('forgeui-toggle')).toBeDefined();
    expect(customElements.get('forgeui-date-picker')).toBeDefined();
    expect(customElements.get('forgeui-slider')).toBeDefined();
    expect(customElements.get('forgeui-file-upload')).toBeDefined();
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
