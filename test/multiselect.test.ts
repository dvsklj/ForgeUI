// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import '../src/components/index.js';

async function mount(props: Record<string, unknown>) {
  const el = document.createElement('forgeui-multi-select') as any;
  el.props = props;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

describe('ForgeMultiSelect', () => {
  it('renders a labelled native multi-select with selected tags', async () => {
    const el = await mount({
      label: 'Teams',
      options: [
        { label: 'Design', value: 'design' },
        { label: 'Engineering', value: 'eng' },
      ],
      value: ['eng'],
    });

    const label = el.shadowRoot!.querySelector('label')!;
    const select = el.shadowRoot!.querySelector('select')!;
    const selectedOptions = Array.from(select.selectedOptions).map(option => option.value);

    expect(label.getAttribute('for')).toBe(select.id);
    expect(select.multiple).toBe(true);
    expect(selectedOptions).toEqual(['eng']);
    expect(el.shadowRoot!.querySelector('.tag')!.textContent).toContain('eng');
  });

  it('dispatches selected values when the select changes', async () => {
    const el = await mount({
      options: ['alpha', 'beta', 'gamma'],
      selected: ['alpha'],
    });
    const onAction = vi.fn();
    el.onAction = onAction;

    const select = el.shadowRoot!.querySelector('select')!;
    select.options[1].selected = true;
    select.dispatchEvent(new Event('change'));

    expect(onAction).toHaveBeenCalledWith('change', {
      value: ['alpha', 'beta'],
      selected: ['alpha', 'beta'],
    });
  });

  it('clamps selected values to maxSelections', async () => {
    const el = await mount({
      options: ['alpha', 'beta', 'gamma'],
      selected: ['alpha', 'beta', 'gamma'],
      maxSelections: 2,
    });
    const onAction = vi.fn();
    el.onAction = onAction;
    const select = el.shadowRoot!.querySelector('select')!;

    expect(Array.from(select.selectedOptions).map(option => option.value)).toEqual(['alpha', 'beta']);

    select.options[2].selected = true;
    select.dispatchEvent(new Event('change'));

    expect(onAction).toHaveBeenCalledWith('change', {
      value: ['alpha', 'beta'],
      selected: ['alpha', 'beta'],
    });
  });

  it('dispatches remove and change actions when a tag is removed', async () => {
    const el = await mount({
      options: ['alpha', 'beta'],
      selected: ['alpha', 'beta'],
    });
    const onAction = vi.fn();
    el.onAction = onAction;

    el.shadowRoot!.querySelector<HTMLButtonElement>('.tag button')!.click();

    expect(onAction).toHaveBeenCalledWith('remove', { value: 'alpha' });
    expect(onAction).toHaveBeenCalledWith('change', {
      value: ['beta'],
      selected: ['beta'],
    });
  });
});
