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
    expect(customElements.get('forgeui-chart-legend')).toBeDefined();
    expect(customElements.get('forgeui-metric')).toBeDefined();
    expect(customElements.get('forgeui-stat-card')).toBeDefined();
    expect(customElements.get('forgeui-kpi-grid')).toBeDefined();
  });

  it('renders stat cards with values and trends', async () => {
    const el = document.createElement('forgeui-stat-card') as any;
    el.props = { label: 'Revenue', value: 299000, trend: 'up', trendLabel: '+12%', subtitle: 'vs last period' };
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.shadowRoot!.textContent).toContain('Revenue');
    expect(el.shadowRoot!.textContent).toContain('299,000');
    expect(el.shadowRoot!.querySelector('.trend.up')!.textContent).toContain('+12%');
  });

  it('renders KPI grid slots with configured columns', async () => {
    const el = document.createElement('forgeui-kpi-grid') as any;
    el.props = { columns: 3, gap: 'sm' };
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
  });

  it('renders chart legends from item data', async () => {
    const el = document.createElement('forgeui-chart-legend') as any;
    el.props = {
      title: 'Channels',
      items: [
        { label: 'Web', value: 42, color: 'var(--forgeui-color-primary)' },
        { label: 'Sales', value: 17, color: 'var(--forgeui-color-success)' },
      ],
      orientation: 'vertical',
    };
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('.title')!.textContent).toBe('Channels');
    expect(el.shadowRoot!.textContent).toContain('Web');
    expect(el.shadowRoot!.textContent).toContain('42');
    expect(el.shadowRoot!.textContent).toContain('Sales');
    expect(el.getAttribute('orientation')).toBe('vertical');
    expect(el.shadowRoot!.querySelectorAll('.swatch')).toHaveLength(2);
  });

  it('renders chart legend empty state', async () => {
    const el = document.createElement('forgeui-chart-legend') as any;
    el.props = { emptyMessage: 'No channels' };
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('.empty')!.textContent).toBe('No channels');
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
