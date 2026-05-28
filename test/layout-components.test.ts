// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import '../src/components/index.js';

async function mount(tag: string, props: Record<string, unknown>) {
  const el = document.createElement(tag) as any;
  el.props = props;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

describe('layout components', () => {
  it('registers layout primitives from the aggregate entrypoint', () => {
    expect(customElements.get('forgeui-stack')).toBeDefined();
    expect(customElements.get('forgeui-grid')).toBeDefined();
    expect(customElements.get('forgeui-card')).toBeDefined();
    expect(customElements.get('forgeui-container')).toBeDefined();
    expect(customElements.get('forgeui-page-header')).toBeDefined();
    expect(customElements.get('forgeui-tabs')).toBeDefined();
    expect(customElements.get('forgeui-accordion')).toBeDefined();
    expect(customElements.get('forgeui-divider')).toBeDefined();
    expect(customElements.get('forgeui-spacer')).toBeDefined();
    expect(customElements.get('forgeui-repeater')).toBeDefined();
  });

  it('applies stack layout props to the host', async () => {
    const el = await mount('forgeui-stack', {
      direction: 'horizontal',
      gap: 'lg',
      padding: 'sm',
      align: 'center',
      justify: 'between',
      wrap: true,
    });

    expect(el.getAttribute('direction')).toBe('row');
    expect(el.getAttribute('align')).toBe('center');
    expect(el.getAttribute('justify')).toBe('between');
    expect(el.hasAttribute('wrap')).toBe(true);
    expect(el.style.gap).toBe('var(--forgeui-space-lg)');
    expect(el.style.padding).toBe('var(--forgeui-space-sm)');
  });

  it('renders card header content after extraction', async () => {
    const el = await mount('forgeui-card', { title: 'Revenue', subtitle: 'Trailing month' });

    expect(el.shadowRoot!.querySelector('.title')!.textContent).toBe('Revenue');
    expect(el.shadowRoot!.querySelector('.subtitle')!.textContent).toBe('Trailing month');
  });

  it('renders page header copy and exposes an action slot', async () => {
    const el = await mount('forgeui-page-header', {
      title: 'Issues',
      subtitle: 'Triage queue',
      eyebrow: 'Workspace',
      meta: 'Updated today',
      align: 'center',
      density: 'compact',
    });
    const button = document.createElement('button');
    button.textContent = 'New issue';
    el.appendChild(button);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('h1')!.textContent).toBe('Issues');
    expect(el.shadowRoot!.querySelector('.subtitle')!.textContent).toBe('Triage queue');
    expect(el.shadowRoot!.querySelector('.eyebrow')!.textContent).toBe('Workspace');
    expect(el.shadowRoot!.querySelector('.meta')!.textContent).toBe('Updated today');
    expect(el.getAttribute('align')).toBe('center');
    expect(el.getAttribute('density')).toBe('compact');
    expect(el.shadowRoot!.querySelector('.actions slot')).not.toBeNull();
  });
});
