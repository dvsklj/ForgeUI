// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import '../src/components/index.js';

async function mountTable(props: Record<string, unknown>): Promise<HTMLElement> {
  const el = document.createElement('forgeui-table') as any;
  el.props = props;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('data components', () => {
  it('registers data primitives from the aggregate entrypoint', () => {
    expect(customElements.get('forgeui-table')).toBeDefined();
    expect(customElements.get('forgeui-list')).toBeDefined();
    expect(customElements.get('forgeui-chart')).toBeDefined();
    expect(customElements.get('forgeui-metric')).toBeDefined();
  });

  it('filters searchable tables', async () => {
    const el = await mountTable({
      searchable: true,
      data: [{ name: 'Alpha' }, { name: 'Beta' }],
      columns: ['name'],
    });

    const input = el.shadowRoot!.querySelector('.search-input') as HTMLInputElement;
    input.value = 'bet';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await (el as any).updateComplete;

    expect(el.shadowRoot!.querySelector('tbody')!.textContent).toContain('Beta');
    expect(el.shadowRoot!.querySelector('tbody')!.textContent).not.toContain('Alpha');
  });

  it('sorts sortable columns', async () => {
    const el = await mountTable({
      data: [{ name: 'Beta', count: 2 }, { name: 'Alpha', count: 10 }],
      columns: [{ key: 'name', label: 'Name', sortable: true }, { key: 'count', label: 'Count' }],
    });

    const nameButton = el.shadowRoot!.querySelector('th button') as HTMLButtonElement;
    nameButton.click();
    await (el as any).updateComplete;

    const rows = [...el.shadowRoot!.querySelectorAll('tbody tr')];
    expect(rows[0].textContent).toContain('Alpha');
    expect(el.shadowRoot!.querySelector('th')!.getAttribute('aria-sort')).toBe('ascending');
  });

  it('paginates when pageSize is set', async () => {
    const el = await mountTable({
      pageSize: 2,
      data: [{ name: 'One' }, { name: 'Two' }, { name: 'Three' }],
      columns: ['name'],
    });

    expect(el.shadowRoot!.querySelector('tbody')!.textContent).toContain('One');
    expect(el.shadowRoot!.querySelector('tbody')!.textContent).not.toContain('Three');

    const next = [...el.shadowRoot!.querySelectorAll('.pager button')].find(button => button.textContent === 'Next') as HTMLButtonElement;
    next.click();
    await (el as any).updateComplete;

    expect(el.shadowRoot!.querySelector('tbody')!.textContent).toContain('Three');
  });
});
