import { html, css, svg, nothing } from 'lit';
import { ForgeUIElement } from './base.js';

export class ForgeTable extends ForgeUIElement {
  private _query = '';
  private _sortKey = '';
  private _sortDir: 'asc' | 'desc' = 'asc';
  private _page = 0;

  static get styles() { return css`
    :host { display:block; overflow-x:auto; min-width:0; width:100%; }
    .search-input { width:100%; max-width:18rem; border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-sm); margin-bottom:var(--forgeui-space-sm);
      padding:var(--forgeui-space-xs) var(--forgeui-space-sm);
      font:inherit; }
    table { width:100%; min-width:42rem; border-collapse:collapse; font-size:var(--forgeui-text-sm); }
    th { text-align:left; padding:var(--forgeui-space-sm) var(--forgeui-space-md); font-weight:var(--forgeui-weight-semibold);
      color:var(--forgeui-color-text-secondary); border-bottom:2px solid var(--forgeui-color-border-strong); white-space:nowrap;
      text-transform:uppercase; letter-spacing:0.05em; font-size:var(--forgeui-text-xs);
      background:var(--forgeui-color-surface-alt); }
    th button { all:unset; display:inline-flex; align-items:center; gap:var(--forgeui-space-2xs); cursor:pointer; border-radius:var(--forgeui-radius-sm); }
    th button:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }
    td { padding:var(--forgeui-space-sm) var(--forgeui-space-md); border-bottom:1px solid var(--forgeui-color-border); vertical-align:middle; overflow-wrap:break-word; word-break:break-word; }
    tr:last-child td { border-bottom:none; }
    tbody tr:hover td { background:var(--forgeui-color-surface-hover); }
    .empty { padding:var(--forgeui-space-xl); text-align:center; color:var(--forgeui-color-text-tertiary); }
    .badge { display:inline-flex; align-items:center; justify-content:center; min-height:1.5rem; padding:var(--forgeui-space-3xs) var(--forgeui-space-xs);
      border-radius:var(--forgeui-radius-sm); font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-bold);
      background:var(--forgeui-color-text-secondary); color:var(--forgeui-color-text-inverse); white-space:nowrap; letter-spacing:0.01em;
      max-width:100%; overflow:hidden; text-overflow:ellipsis; }
    .badge.success { background:var(--forgeui-color-success); color:var(--forgeui-color-text-inverse); }
    .badge.warning { background:var(--forgeui-color-warning); color:var(--forgeui-color-text-inverse); }
    .badge.error { background:var(--forgeui-color-error); color:var(--forgeui-color-text-inverse); }
    .badge.info, .badge.primary { background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); }
    .badge.neutral { background:var(--forgeui-color-text-secondary); color:var(--forgeui-color-text-inverse); }
    .align-right { text-align:right; }
    .align-center { text-align:center; }
    .col-right th, .col-right td { text-align:right; }
    .col-center th, .col-center td { text-align:center; }
    caption { text-align:start; font-size:var(--forgeui-text-sm); caption-side:top; padding-bottom:var(--forgeui-space-sm); color:var(--forgeui-color-text-secondary); }
    .row-action { cursor:pointer; }
    .row-action:hover td { background:var(--forgeui-color-surface-hover); }
    .row-action:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:-2px; }
    .pager { display:flex; align-items:center; justify-content:flex-end; gap:var(--forgeui-space-sm); margin-top:var(--forgeui-space-sm);
      color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); flex-wrap:wrap; }
    .pager button { border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-sm);
      padding:var(--forgeui-space-2xs) var(--forgeui-space-sm); cursor:pointer; }
    .pager button:disabled { opacity:0.5; cursor:not-allowed; }
  `; }
  private _colKey(col: any): string {
    return typeof col === 'string' ? col : String(col?.key ?? '');
  }
  private _colLabel(col: any): string {
    return typeof col === 'string' ? col : String(col?.label ?? col?.key ?? '');
  }
  _statusClass(val: unknown): string {
    const s = String(val ?? '').toLowerCase().trim();
    if (['done', 'complete', 'completed', 'success', 'active', 'ok', 'approved', 'paid'].includes(s)) return 'success';
    if (['in progress', 'in-progress', 'pending', 'warning', 'waiting', 'review'].includes(s)) return 'warning';
    if (['to do', 'to-do', 'todo', 'backlog', 'draft', 'new', 'inactive'].includes(s)) return 'neutral';
    if (['high', 'urgent', 'critical'].includes(s)) return 'error';
    if (['medium', 'med'].includes(s)) return 'warning';
    if (['low'].includes(s)) return 'info';
    if (['failed', 'error', 'rejected', 'blocked', 'overdue'].includes(s)) return 'error';
    return 'neutral';
  }
  _renderCell(col: any, row: any): any {
    const key = this._colKey(col);
    const raw = row[key];
    const type = (col && typeof col === 'object') ? col.type : undefined;
    if (raw === undefined || raw === null || raw === '') return html`<span style="color:var(--forgeui-color-text-tertiary)">—</span>`;
    if (type === 'badge' || type === 'status') {
      const variant = (col.variant && typeof col.variant === 'object' ? col.variant[String(raw).toLowerCase()] : null) || this._statusClass(raw);
      return html`<span class="badge ${variant}">${String(raw)}</span>`;
    }
    if (type === 'number') {
      return typeof raw === 'number' ? raw.toLocaleString() : String(raw);
    }
    if (type === 'date') {
      const d = typeof raw === 'string' || typeof raw === 'number' ? new Date(raw) : raw;
      if (d instanceof Date && !isNaN(d.getTime())) return d.toLocaleDateString();
      return String(raw);
    }
    if (type === 'currency') {
      const n = Number(raw);
      if (!isNaN(n)) return n.toLocaleString(undefined, { style: 'currency', currency: col.currency || 'USD' });
      return String(raw);
    }
    if (type === 'boolean') {
      return raw ? '✓' : '✗';
    }
    return String(raw);
  }
  private _sortBy(key: string) {
    if (!key) return;
    if (this._sortKey === key) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortKey = key;
      this._sortDir = 'asc';
    }
    this._page = 0;
    this.requestUpdate();
  }
  private _setQuery(value: string) {
    this._query = value;
    this._page = 0;
    this.requestUpdate();
  }
  private _filteredRows(rows: any[], cols: any[]): any[] {
    const q = this._query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(row => cols.some(col => String(row[this._colKey(col)] ?? '').toLowerCase().includes(q)));
  }
  private _sortedRows(rows: any[]): any[] {
    if (!this._sortKey) return rows;
    const dir = this._sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a?.[this._sortKey];
      const bv = b?.[this._sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      const as = String(av ?? '').toLowerCase();
      const bs = String(bv ?? '').toLowerCase();
      return (as > bs ? 1 : as < bs ? -1 : 0) * dir;
    });
  }
  private _setPage(page: number, pageCount: number) {
    this._page = Math.max(0, Math.min(page, Math.max(0, pageCount - 1)));
    this.requestUpdate();
  }
  render() {
    const data = this.getProp('data');
    const columns = (this.getProp('columns') || []) as any[];
    const emptyMsg = this.getString('emptyMessage', 'No data yet');
    const rowAction = this.getString('rowAction', '');
    const caption = this.getString('caption', '');
    const searchable = this.getBool('searchable', false);
    const pageSize = Math.max(0, Math.floor(this.getNumber('pageSize', 0)));
    if (!Array.isArray(data)) {
      return html`<div class="empty">${emptyMsg}</div>`;
    }
    const cols = columns.length > 0 ? columns : (data.length > 0 ? Object.keys(data[0]) : []);
    if (cols.length === 0) return html`<div class="empty">${emptyMsg}</div>`;
    const filteredRows = this._filteredRows(data, cols);
    const sortedRows = this._sortedRows(filteredRows);
    const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1;
    const page = Math.min(this._page, pageCount - 1);
    if (page !== this._page) this._page = page;
    const visibleRows = pageSize > 0 ? sortedRows.slice(page * pageSize, page * pageSize + pageSize) : sortedRows;
    return html`
      ${searchable ? html`
        <input class="search-input" .value=${this._query} aria-label="Search"
          @input=${(e: InputEvent) => this._setQuery((e.target as HTMLInputElement).value)} />
      ` : nothing}
      <table>
        ${caption ? html`<caption>${caption}</caption>` : nothing}
        <thead><tr>${cols.map((c: any) => {
          const label = this._colLabel(c);
          const key = this._colKey(c);
          const align = typeof c === 'object' ? c.align : undefined;
          const width = typeof c === 'object' ? c.width : undefined;
          const alignCls = align === 'right' ? 'align-right' : align === 'center' ? 'align-center' : '';
          const sortable = typeof c === 'object' && c.sortable === true;
          const active = this._sortKey === key;
          return html`<th class="${alignCls}" style="${width ? `width:${width}` : ''}" aria-sort=${active ? (this._sortDir === 'asc' ? 'ascending' : 'descending') : nothing}>
            ${sortable ? html`
              <button type="button" @click=${() => this._sortBy(key)}>
                <span>${label}</span>${active ? html`<span class="sort" aria-hidden="true">${this._sortDir === 'asc' ? '▲' : '▼'}</span>` : nothing}
              </button>
            ` : label}
          </th>`;
        })}</tr></thead>
        <tbody>${visibleRows.length === 0
          ? html`<tr><td colspan=${cols.length} class="empty">${emptyMsg}</td></tr>`
          : visibleRows.map((row: any, i: number) => {
              const absoluteIndex = pageSize > 0 ? page * pageSize + i : i;
              const hasAction = !!rowAction;
              const rowLabel = hasAction ? String(row[typeof cols[0] === 'string' ? cols[0] : cols[0]?.key] ?? `Row ${i + 1}`) : '';
              return html`<tr class="${hasAction ? 'row-action' : ''}"
                tabindex=${hasAction ? 0 : nothing}
                role=${hasAction ? 'button' : nothing}
                aria-label=${hasAction ? rowLabel : nothing}
                @click=${hasAction ? () => this.dispatchAction(rowAction, { row, index: absoluteIndex }) : undefined}
                @keydown=${hasAction ? (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.dispatchAction(rowAction, { row, index: absoluteIndex }); } } : undefined}>
              ${cols.map((c: any) => {
                const align = typeof c === 'object' ? c.align : undefined;
                const alignCls = align === 'right' ? 'align-right' : align === 'center' ? 'align-center' : '';
                return html`<td class="${alignCls}">${this._renderCell(c, row)}</td>`;
              })}</tr>`;
            })
        }</tbody>
      </table>
      ${pageSize > 0 && sortedRows.length > 0 ? html`
        <nav class="pager">
          <button type="button" ?disabled=${page === 0} @click=${() => this._setPage(page - 1, pageCount)}>Prev</button>
          <span>${page + 1} / ${pageCount}</span>
          <button type="button" ?disabled=${page >= pageCount - 1} @click=${() => this._setPage(page + 1, pageCount)}>Next</button>
        </nav>
      ` : nothing}
    `;
  }
}
customElements.define('forgeui-table', ForgeTable);

export class ForgeList extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; }
    .list { display:flex; flex-direction:column; gap:var(--forgeui-space-xs); }
    .item { padding:var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md);
      display:flex; align-items:center; gap:var(--forgeui-space-sm); overflow-wrap:break-word; min-width:0; }
    .item:hover { background:var(--forgeui-color-surface-hover); }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); overflow-wrap:break-word; }
  `; }
  render() {
    let data = this.getProp('data');
    const dataPath = this.getString('dataPath', '');
    if (!('data' in (this.props || {})) && dataPath && this.store?.hasTable(dataPath)) {
      data = Object.values(this.store.getTable(dataPath));
    }
    const emptyMsg = this.getString('emptyMessage', 'No items');
    if (!Array.isArray(data) || data.length === 0) return html`<div class="empty">${emptyMsg}</div>`;
    return html`<div class="list">${data.map((item: any, i: number) => html`
      <div class="item" data-index=${i}><slot name="item" .item=${item} .index=${i}>${JSON.stringify(item)}</slot></div>
    `)}</div>`;
  }
}
customElements.define('forgeui-list', ForgeList);

export class ForgeChart extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; min-width:0; }
    .title { font-weight:var(--forgeui-weight-semibold); font-size:var(--forgeui-text-sm); margin-bottom:var(--forgeui-space-xs); color:var(--forgeui-color-text); }
    .wrap { width:100%; overflow:hidden; }
    svg { width:100%; height:auto; display:block; font-family:var(--forgeui-font-family); }
    .grid { stroke:var(--forgeui-color-border); stroke-width:1; opacity:0.6; }
    .axis { stroke:var(--forgeui-color-border-strong); stroke-width:1; }
    .tick-label { fill:var(--forgeui-color-text-secondary); font-size:11px; }
    .bar { fill:var(--forgeui-color-primary); transition:opacity 0.15s; }
    .bar:hover { opacity:0.8; }
    .line { fill:none; stroke:var(--forgeui-color-primary); stroke-width:2.5; }
    .point { fill:var(--forgeui-color-primary); }
    .area { fill:var(--forgeui-color-primary); opacity:0.12; }
    .slice { stroke:var(--forgeui-color-surface); stroke-width:2; }
    .legend { display:flex; flex-wrap:wrap; gap:var(--forgeui-space-sm); margin-top:var(--forgeui-space-sm); font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); }
    .legend-item { display:inline-flex; align-items:center; gap:var(--forgeui-space-2xs); }
    .swatch { display:inline-block; width:0.75rem; height:0.75rem; border-radius:2px; }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); }
    @media (prefers-reduced-motion: reduce) {
      .bar { transition:none; }
    }
  `; }

  _palette = [
    'var(--forgeui-color-primary)',
    'var(--forgeui-color-success)',
    'var(--forgeui-color-warning)',
    'var(--forgeui-color-error)',
    'var(--forgeui-color-info)',
    'var(--forgeui-color-chart-6)',
    'var(--forgeui-color-chart-7)',
    'var(--forgeui-color-chart-8)',
    'var(--forgeui-color-chart-9)',
    'var(--forgeui-color-chart-10)',
  ];

  _niceMax(v: number): number {
    if (v <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / mag;
    const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return nice * mag;
  }

  render() {
    const chartType = this.getString('chartType', 'bar');
    const data = (this.getProp('data') || []) as any[];
    const title = this.getString('title', '');
    const xKey = this.getString('xKey', 'label') || this.getString('labelKey', 'label');
    const yKey = this.getString('yKey', 'value') || this.getString('valueKey', 'value');
    const colorOverride = this.getString('color', '');

    if (!data || data.length === 0) {
      return html`
        ${title ? html`<div class="title">${title}</div>` : nothing}
        <div class="empty">No data to display</div>
      `;
    }

    const points = data.map((d: any) => {
      if (typeof d === 'number') return { label: '', value: d };
      if (d && typeof d === 'object') {
        return {
          label: String(d[xKey] ?? d.label ?? d.name ?? d.x ?? ''),
          value: Number(d[yKey] ?? d.value ?? d.y ?? 0) || 0,
          color: d.color,
        };
      }
      return { label: String(d), value: 0 };
    });

    const width = 600;
    const height = 260;
    const margin = { top: 8, right: 16, bottom: 36, left: 48 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    let body: any;
    let legend: any = nothing;

    if (chartType === 'pie' || chartType === 'donut') {
      const total = points.reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
      const cx = width / 2, cy = height / 2, r = Math.min(innerW, innerH) / 2 - 8;
      const innerR = chartType === 'donut' ? r * 0.55 : 0;
      let acc = -Math.PI / 2;
      const slices: any[] = [];
      const colors: string[] = [];
      points.forEach((p, i) => {
        const frac = Math.max(0, p.value) / total;
        const a0 = acc;
        const a1 = acc + frac * Math.PI * 2;
        acc = a1;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const color = p.color || this._palette[i % this._palette.length];
        colors.push(color);
        if (innerR > 0) {
          const ix0 = cx + innerR * Math.cos(a0), iy0 = cy + innerR * Math.sin(a0);
          const ix1 = cx + innerR * Math.cos(a1), iy1 = cy + innerR * Math.sin(a1);
          slices.push(svg`<path class="slice" fill="${color}" d="M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix0} ${iy0} Z"/>`);
        } else {
          slices.push(svg`<path class="slice" fill="${color}" d="M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z"/>`);
        }
      });
      body = svg`<g>${slices}</g>`;
      legend = html`<div class="legend">${points.map((p, i) => html`
        <span class="legend-item"><span class="swatch" style="background:${colors[i]}"></span>${p.label} (${p.value})</span>
      `)}</div>`;
    } else {
      const maxRaw = Math.max(...points.map(p => p.value), 0);
      const yMax = this._niceMax(maxRaw);
      const toY = (v: number) => margin.top + innerH - (v / yMax) * innerH;
      const ticks = 4;

      // Gridlines + Y-axis labels (rendered as svg templates to avoid innerHTML injection)
      const gridLines: any[] = [];
      for (let i = 0; i <= ticks; i++) {
        const v = (yMax * i) / ticks;
        const y = toY(v);
        gridLines.push(svg`<line class="grid" x1="${margin.left}" x2="${margin.left + innerW}" y1="${y}" y2="${y}"/>`);
        gridLines.push(svg`<text class="tick-label" x="${margin.left - 6}" y="${y + 3}" text-anchor="end">${v.toLocaleString()}</text>`);
      }

      if (chartType === 'line' || chartType === 'area') {
        const bandW = innerW / Math.max(1, points.length - 1);
        const pathData = points.map((p, i) => {
          const x = margin.left + i * bandW;
          const y = toY(p.value);
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
        const areaData = chartType === 'area'
          ? pathData + ` L ${margin.left + innerW} ${margin.top + innerH} L ${margin.left} ${margin.top + innerH} Z`
          : '';
        const lineColor = colorOverride || 'var(--forgeui-color-primary)';
        body = html`
          <g>${gridLines}</g>
          ${chartType === 'area' ? svg`<path class="area" d="${areaData}" style="fill:${lineColor};opacity:0.15"/>` : nothing}
          ${svg`<path class="line" d="${pathData}" style="stroke:${lineColor}"/>`}
          ${points.map((p, i) => {
            const x = margin.left + i * bandW;
            const y = toY(p.value);
            return svg`<circle class="point" cx="${x}" cy="${y}" r="3" style="fill:${lineColor}"/>
              <text class="tick-label" x="${x}" y="${margin.top + innerH + 14}" text-anchor="middle">${p.label}</text>`;
          })}
        `;
      } else {
        // Bar chart (default)
        const n = points.length;
        const bandW = innerW / n;
        const barW = Math.max(2, bandW * 0.7);
        const barGap = bandW - barW;
        body = html`
          <g>${gridLines}</g>
          ${points.map((p, i) => {
            const x = margin.left + i * bandW + barGap / 2;
            const y = toY(p.value);
            const h = Math.max(0, margin.top + innerH - y);
            const barColor = p.color || colorOverride || 'var(--forgeui-color-primary)';
            return svg`<rect class="bar" x="${x}" y="${y}" width="${barW}" height="${h}" rx="2" style="fill:${barColor}">
                <title>${p.label}: ${p.value}</title>
              </rect>
              <text class="tick-label" x="${x + barW / 2}" y="${margin.top + innerH + 14}" text-anchor="middle">${p.label}</text>`;
          })}
        `;
      }
    }

    return html`
      ${title ? html`<div class="title">${title}</div>` : nothing}
      <div class="wrap">
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${title || chartType + ' chart'}">
          ${body}
        </svg>
        ${legend}
      </div>
    `;
  }
}
customElements.define('forgeui-chart', ForgeChart);

export class ForgeStatCard extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; min-width:0; }
    .card { display:flex; flex-direction:column; gap:var(--forgeui-space-xs); min-width:0; padding:var(--forgeui-space-md);
      border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); background:var(--forgeui-color-surface); }
    .top { display:flex; align-items:flex-start; justify-content:space-between; gap:var(--forgeui-space-sm); }
    .label { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); overflow-wrap:anywhere; }
    .value { color:var(--forgeui-color-text); font-size:var(--forgeui-text-3xl); font-weight:var(--forgeui-weight-bold); line-height:1.1; overflow-wrap:anywhere; }
    .meta { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-xs); overflow-wrap:anywhere; }
    .trend { display:inline-flex; align-items:center; gap:var(--forgeui-space-3xs); border-radius:var(--forgeui-radius-sm);
      padding:var(--forgeui-space-3xs) var(--forgeui-space-xs); color:var(--forgeui-color-text-inverse); background:var(--forgeui-color-text-secondary);
      font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-bold); white-space:nowrap; }
    .trend.up { background:var(--forgeui-color-success); }
    .trend.down { background:var(--forgeui-color-error); }
  `; }
  private _trendClass(trend: unknown): string {
    const value = String(trend ?? '').toLowerCase();
    if (value === 'up' || value === 'positive' || value.startsWith('+')) return 'up';
    if (value === 'down' || value === 'negative' || value.startsWith('-')) return 'down';
    return 'neutral';
  }
  render() {
    const label = this.getString('label', '');
    const value = this.getProp('value');
    const trend = this.getProp('trend');
    const trendLabel = this.getString('trendLabel', '');
    const subtitle = this.getString('subtitle', '');
    const unit = this.getString('unit', '');
    const display = typeof value === 'number' ? value.toLocaleString() : (value === undefined || value === null || value === '' ? '—' : String(value));
    const trendText = trendLabel || (trend === undefined || trend === null ? '' : String(trend));
    const trendClass = this._trendClass(trend);
    return html`<div class="card">
      <div class="top">
        ${label ? html`<div class="label">${label}</div>` : nothing}
        ${trendText ? html`<span class="trend ${trendClass}">${trendClass === 'up' ? '↑' : trendClass === 'down' ? '↓' : '→'} ${trendText}</span>` : nothing}
      </div>
      <div class="value">${display}${unit ? html` <span class="meta">${unit}</span>` : nothing}</div>
      ${subtitle ? html`<div class="meta">${subtitle}</div>` : nothing}
    </div>`;
  }
}
customElements.define('forgeui-stat-card', ForgeStatCard);

export class ForgeKpiGrid extends ForgeUIElement {
  static get styles() { return css`
    :host { display:grid; min-width:0; gap:var(--forgeui-space-md); grid-template-columns:repeat(auto-fit,minmax(min(12rem,100%),1fr)); }
  `; }
  render() {
    const columns = Math.max(0, Math.floor(this.getNumber('columns', 0)));
    const gap = this.gapValue(this.getString('gap', 'md'));
    this.style.gap = gap;
    this.style.gridTemplateColumns = columns > 0 ? `repeat(${columns}, minmax(0, 1fr))` : '';
    return html`<slot></slot>`;
  }
}
customElements.define('forgeui-kpi-grid', ForgeKpiGrid);

export class ForgeMetric extends ForgeUIElement {
  static get styles() { return css`
    :host { display:flex; flex-direction:column; padding:var(--forgeui-space-md); background:var(--forgeui-color-surface);
      border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); min-width:0; gap:var(--forgeui-space-2xs); }
    :host([variant="plain"]) { background:transparent; border:none; padding:0; }
    .label { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); font-weight:var(--forgeui-weight-medium); overflow-wrap:break-word; }
    .value-row { display:flex; align-items:center; gap:var(--forgeui-space-xs); flex-wrap:wrap; min-width:0; }
    .value { font-size:var(--forgeui-text-3xl); font-weight:var(--forgeui-weight-bold); color:var(--forgeui-color-text); line-height:1.1; letter-spacing:-0.02em; overflow-wrap:break-word; min-width:0; }
    .unit, .suffix { font-size:var(--forgeui-text-base); color:var(--forgeui-color-text-secondary); font-weight:var(--forgeui-weight-medium); overflow-wrap:break-word; }
    .trend { display:inline-flex; align-items:center; justify-content:center; min-width:1.5rem; min-height:1.5rem; gap:var(--forgeui-space-3xs);
      padding:var(--forgeui-space-3xs) var(--forgeui-space-xs); border-radius:var(--forgeui-radius-sm);
      font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-bold); line-height:1; white-space:nowrap; }
    .trend.icon-only { width:1.5rem; padding:0; }
    .trend.up { color:var(--forgeui-color-text-inverse); background:var(--forgeui-color-success); }
    .trend.down { color:var(--forgeui-color-text-inverse); background:var(--forgeui-color-error); }
    .trend.neutral { color:var(--forgeui-color-text-inverse); background:var(--forgeui-color-text-secondary); }
    .subtitle { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); overflow-wrap:break-word; }
    .goal { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); overflow-wrap:break-word; }
  `; }
  _trendMeta(trend: unknown): { dir: 'up' | 'down' | 'neutral'; arrow: string; display: string } | null {
    if (trend === undefined || trend === null || trend === '') return null;
    if (typeof trend === 'number') {
      if (trend > 0) return { dir: 'up', arrow: '↑', display: `${Math.abs(trend)}%` };
      if (trend < 0) return { dir: 'down', arrow: '↓', display: `${Math.abs(trend)}%` };
      return { dir: 'neutral', arrow: '→', display: '0%' };
    }
    if (typeof trend === 'string') {
      const s = trend.toLowerCase();
      // Try to parse "+12%", "-3%", "12.5"
      const m = trend.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*(%?)\s*$/);
      if (m) {
        const n = parseFloat(m[1]);
        const pct = m[2];
        if (n > 0) return { dir: 'up', arrow: '↑', display: `${Math.abs(n)}${pct}` };
        if (n < 0) return { dir: 'down', arrow: '↓', display: `${Math.abs(n)}${pct}` };
        return { dir: 'neutral', arrow: '→', display: `0${pct}` };
      }
      if (s === 'up' || s === 'positive' || s === 'increase') return { dir: 'up', arrow: '↑', display: '' };
      if (s === 'down' || s === 'negative' || s === 'decrease') return { dir: 'down', arrow: '↓', display: '' };
      if (s === 'flat' || s === 'neutral' || s === 'same') return { dir: 'neutral', arrow: '→', display: '' };
      return { dir: 'neutral', arrow: '', display: trend };
    }
    return null;
  }
  render() {
    const label = this.getString('label', '');
    const value = this.getProp('value');
    const trend = this.getProp('trend');
    const trendLabel = this.getString('trendLabel', '');
    const goal = this.getProp('goal');
    const unit = this.getString('unit', '');
    const suffix = this.getString('suffix', '');
    const subtitle = this.getString('subtitle', '');
    const variant = this.getString('variant', '');
    if (variant) this.setAttribute('variant', variant);
    const displayValue = typeof value === 'number' ? value.toLocaleString() : (value === undefined || value === null || value === '' ? '—' : String(value));
    const tm = this._trendMeta(trend);
    return html`
      ${label ? html`<div class="label">${label}</div>` : nothing}
      <div class="value-row">
        <span class="value">${displayValue}</span>
        ${unit ? html`<span class="unit">${unit}</span>` : nothing}
        ${suffix ? html`<span class="suffix">${suffix}</span>` : nothing}
        ${tm ? html`<span class="trend ${tm.dir} ${!tm.display && !trendLabel ? 'icon-only' : ''}">${tm.arrow}${tm.display ? html` ${tm.display}` : nothing}${trendLabel ? html` ${trendLabel}` : nothing}</span>` : nothing}
      </div>
      ${subtitle ? html`<div class="subtitle">${subtitle}</div>` : nothing}
      ${goal !== undefined && goal !== null && goal !== '' ? html`<div class="goal">Goal: ${typeof goal === 'number' ? goal.toLocaleString() : goal}</div>` : nothing}
    `;
  }
}
customElements.define('forgeui-metric', ForgeMetric);
