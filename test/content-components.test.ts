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

describe('content components', () => {
  it('registers content primitives from the aggregate entrypoint', () => {
    expect(customElements.get('forgeui-text')).toBeDefined();
    expect(customElements.get('forgeui-image')).toBeDefined();
    expect(customElements.get('forgeui-icon')).toBeDefined();
    expect(customElements.get('forgeui-badge')).toBeDefined();
    expect(customElements.get('forgeui-avatar')).toBeDefined();
    expect(customElements.get('forgeui-empty-state')).toBeDefined();
  });

  it('renders text variants after extraction', async () => {
    const el = await mount('forgeui-text', {
      content: 'Quarterly Revenue',
      variant: 'h2',
      colorScheme: 'success',
      weight: 'bold',
      align: 'center',
    });
    const heading = el.shadowRoot!.querySelector('h2')!;

    expect(heading.textContent).toBe('Quarterly Revenue');
    expect(heading.className).toContain('heading2');
    expect(heading.className).toContain('align-center');
    expect(heading.getAttribute('style')).toContain('var(--forgeui-color-success)');
    expect(heading.getAttribute('style')).toContain('var(--forgeui-weight-bold)');
  });

  it('renders image, badge, avatar, and empty state content', async () => {
    const image = await mount('forgeui-image', { src: '/demo.png', alt: 'Demo', fit: 'cover' });
    const badge = await mount('forgeui-badge', { label: 'Live', variant: 'success' });
    const avatar = await mount('forgeui-avatar', { name: 'Ada Lovelace' });
    const empty = await mount('forgeui-empty-state', { title: 'No records', description: 'Try another filter.' });

    expect(image.shadowRoot!.querySelector('img')!.getAttribute('src')).toBe('/demo.png');
    expect(image.shadowRoot!.querySelector('img')!.getAttribute('style')).toBe('object-fit:cover');
    expect(badge.shadowRoot!.querySelector('.badge')!.textContent).toBe('Live');
    expect(avatar.shadowRoot!.querySelector('.avatar')!.textContent).toBe('AL');
    expect(empty.shadowRoot!.querySelector('.title')!.textContent).toBe('No records');
    expect(empty.shadowRoot!.querySelector('.desc')!.textContent).toBe('Try another filter.');
  });
});
