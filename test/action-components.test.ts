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

describe('action components', () => {
  it('registers Button and dispatches its action', async () => {
    expect(customElements.get('forgeui-button')).toBeDefined();
    const el = await mount('forgeui-button', { label: 'Save', action: 'save' });
    const onAction = vi.fn();
    el.onAction = onAction;

    el.shadowRoot!.querySelector('button')!.click();

    expect(onAction).toHaveBeenCalledWith('save', expect.objectContaining({ label: 'Save' }));
  });

  it('registers ButtonGroup and Link', async () => {
    expect(customElements.get('forgeui-button-group')).toBeDefined();
    expect(customElements.get('forgeui-link')).toBeDefined();
    const link = await mount('forgeui-link', { label: 'Docs', href: '/docs' });

    expect(link.shadowRoot!.querySelector('a')!.getAttribute('href')).toBe('/docs');
    expect(link.shadowRoot!.querySelector('a')!.textContent).toBe('Docs');
  });
});
