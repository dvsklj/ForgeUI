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
});
