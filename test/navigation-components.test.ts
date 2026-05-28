// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import '../src/components/index.js';

async function mount(tag: string, props: Record<string, unknown>) {
  const el = document.createElement(tag) as any;
  el.props = props;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

describe('navigation components', () => {
  it('registers Breadcrumb and renders linked items', async () => {
    expect(customElements.get('forgeui-breadcrumb')).toBeDefined();
    const el = await mount('forgeui-breadcrumb', {
      items: [{ label: 'Home', href: '/home' }, { label: 'Current' }],
    });

    expect(el.shadowRoot!.querySelector('a')!.getAttribute('href')).toBe('/home');
    expect(el.shadowRoot!.querySelector('.current')!.textContent).toBe('Current');
  });

  it('registers Stepper and marks active and completed steps', async () => {
    expect(customElements.get('forgeui-stepper')).toBeDefined();
    const el = await mount('forgeui-stepper', {
      steps: ['Plan', 'Build', 'Ship'],
      activeStep: 1,
    });

    expect(el.shadowRoot!.querySelectorAll('.step')).toHaveLength(3);
    expect(el.shadowRoot!.querySelectorAll('.step[completed]')).toHaveLength(1);
    expect(el.shadowRoot!.querySelectorAll('.step[active]')).toHaveLength(1);
  });

  it('registers SearchBox and dispatches query changes', async () => {
    expect(customElements.get('forgeui-search-box')).toBeDefined();
    const el = await mount('forgeui-search-box', {
      label: 'Search issues',
      placeholder: 'Find by title',
      action: 'search',
    });
    const onAction = vi.fn();
    el.onAction = onAction;

    const input = el.shadowRoot!.querySelector('input')!;
    input.value = 'billing';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));

    expect(el.shadowRoot!.querySelector('label')!.textContent).toBe('Search issues');
    expect(onAction).toHaveBeenCalledWith('search', { value: 'billing', query: 'billing' });
  });

  it('registers Pagination and dispatches page changes', async () => {
    expect(customElements.get('forgeui-pagination')).toBeDefined();
    const el = await mount('forgeui-pagination', { page: 2, totalPages: 4 });
    const onAction = vi.fn();
    el.onAction = onAction;

    const buttons = el.shadowRoot!.querySelectorAll('button');
    buttons[1].click();

    expect(el.shadowRoot!.textContent).toContain('Page 2 of 4');
    expect(onAction).toHaveBeenCalledWith('page-change', { value: 3, page: 3, totalPages: 4 });
  });

  it('registers SegmentedControl and dispatches selected values', async () => {
    expect(customElements.get('forgeui-segmented-control')).toBeDefined();
    const el = await mount('forgeui-segmented-control', {
      label: 'Status',
      value: 'open',
      options: [{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }],
    });
    const onAction = vi.fn();
    el.onAction = onAction;

    const buttons = el.shadowRoot!.querySelectorAll('button');
    expect(buttons[0].getAttribute('aria-checked')).toBe('true');

    buttons[1].click();

    expect(onAction).toHaveBeenCalledWith('change', { value: 'closed', selected: 'closed' });
  });

  it('disables pagination at range edges', async () => {
    const el = await mount('forgeui-pagination', { page: 1, totalPages: 1 });
    const buttons = el.shadowRoot!.querySelectorAll('button');

    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
  });
});
