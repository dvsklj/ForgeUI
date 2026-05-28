import { css, svg } from 'lit';
import { ForgeUIElement } from './base.js';

export class ForgeDrawing extends ForgeUIElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display:block; }
    svg { display:block; }
  `; }
  render() {
    const width = this.getNumber('width', 400);
    const height = this.getNumber('height', 300);
    const background = this.getString('background', 'transparent');
    const shapes = (this.getProp('shapes') || []) as any[];

    return svg`
      <svg width="${width}" height="${height}" style="background:${background}" viewBox="0 0 ${width} ${height}">
        ${shapes.map((s: any) => this.renderShape(s))}
      </svg>
    `;
  }

  renderShape(s: any) {
    const common = {
      fill: s.fill ?? undefined,
      stroke: s.stroke ?? undefined,
      'stroke-width': s.strokeWidth ?? undefined,
      opacity: s.opacity ?? undefined,
    };
    const handleClick = s.action ? () => { if (this.onAction) this.onAction(s.action); } : undefined;
    const style = s.action ? 'cursor:pointer' : undefined;

    switch (s.type) {
      case 'rect':
        return svg`<rect
          x="${s.x ?? 0}" y="${s.y ?? 0}"
          width="${s.width ?? 0}" height="${s.height ?? 0}"
          rx="${s.rx ?? 0}" ry="${s.ry ?? 0}"
          fill="${common.fill ?? 'none'}"
          stroke="${common.stroke ?? 'none'}"
          stroke-width="${common['stroke-width'] ?? 0}"
          opacity="${common.opacity ?? 1}"
          style="${style}"
          @click=${handleClick}
        />`;
      case 'circle':
        return svg`<circle
          cx="${s.cx ?? 0}" cy="${s.cy ?? 0}" r="${s.r ?? 0}"
          fill="${common.fill ?? 'none'}"
          stroke="${common.stroke ?? 'none'}"
          stroke-width="${common['stroke-width'] ?? 0}"
          opacity="${common.opacity ?? 1}"
          style="${style}"
          @click=${handleClick}
        />`;
      case 'ellipse':
        return svg`<ellipse
          cx="${s.cx ?? s.x ?? 0}" cy="${s.cy ?? s.y ?? 0}"
          rx="${s.rx ?? (s.width ? s.width / 2 : 0)}" ry="${s.ry ?? (s.height ? s.height / 2 : 0)}"
          fill="${common.fill ?? 'none'}"
          stroke="${common.stroke ?? 'none'}"
          stroke-width="${common['stroke-width'] ?? 0}"
          opacity="${common.opacity ?? 1}"
          style="${style}"
          @click=${handleClick}
        />`;
      case 'line':
        return svg`<line
          x1="${s.x1 ?? 0}" y1="${s.y1 ?? 0}"
          x2="${s.x2 ?? 0}" y2="${s.y2 ?? 0}"
          stroke="${common.stroke ?? 'none'}"
          stroke-width="${common['stroke-width'] ?? 1}"
          opacity="${common.opacity ?? 1}"
          style="${style}"
          @click=${handleClick}
        />`;
      case 'text':
        return svg`<text
          x="${s.x ?? 0}" y="${s.y ?? 0}"
          fill="${common.fill ?? 'currentColor'}"
          font-size="${s.fontSize ?? 14}"
          font-weight="${s.fontWeight ?? 'normal'}"
          font-family="${s.fontFamily ?? 'sans-serif'}"
          text-anchor="${s.textAnchor ?? 'start'}"
          opacity="${common.opacity ?? 1}"
          style="${style}"
          @click=${handleClick}
        >${s.content ?? ''}</text>`;
      case 'path':
        return svg`<path
          d="${s.d ?? ''}"
          fill="${common.fill ?? 'none'}"
          stroke="${common.stroke ?? 'none'}"
          stroke-width="${common['stroke-width'] ?? 1}"
          opacity="${common.opacity ?? 1}"
          style="${style}"
          @click=${handleClick}
        />`;
      default:
        return svg``;
    }
  }
}
customElements.define('forgeui-drawing', ForgeDrawing);
