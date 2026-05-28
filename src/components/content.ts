import { html, css, nothing } from 'lit';
import { ForgeUIElement } from './base.js';

export class ForgeText extends ForgeUIElement {
  static get properties() { return { props: { type: Object } }; }
  static get styles() { return css`
    :host { display:block; min-width:0; }
    .heading1 { font-size:var(--forgeui-text-3xl); font-weight:var(--forgeui-weight-bold); line-height:var(--forgeui-leading-tight); letter-spacing:-0.02em; margin:0; overflow-wrap:break-word; }
    .heading2 { font-size:var(--forgeui-text-2xl); font-weight:var(--forgeui-weight-bold); line-height:var(--forgeui-leading-tight); letter-spacing:-0.01em; margin:0; overflow-wrap:break-word; }
    .heading3 { font-size:var(--forgeui-text-xl); font-weight:var(--forgeui-weight-semibold); line-height:var(--forgeui-leading-tight); margin:0; overflow-wrap:break-word; }
    .heading { font-size:var(--forgeui-text-2xl); font-weight:var(--forgeui-weight-bold); line-height:var(--forgeui-leading-tight); margin:0; overflow-wrap:break-word; }
    .subheading { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); line-height:var(--forgeui-leading-tight); margin:0; overflow-wrap:break-word; }
    .label { font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); color:var(--forgeui-color-text); margin:0; overflow-wrap:break-word; }
    .body { font-size:var(--forgeui-text-base); line-height:var(--forgeui-leading-normal); margin:0; overflow-wrap:break-word; }
    .caption { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin:0; overflow-wrap:break-word; }
    .muted { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin:0; overflow-wrap:break-word; }
    .code { font-family:var(--forgeui-font-mono); font-size:var(--forgeui-text-sm); background:var(--forgeui-color-surface-alt);
      padding:var(--forgeui-space-2xs) var(--forgeui-space-xs); border-radius:var(--forgeui-radius-sm); display:inline-block; word-break:normal; overflow-wrap:break-word; }
    .align-left { text-align:left; }
    .align-center { text-align:center; }
    .align-right { text-align:right; }
  `; }
  render() {
    const content = this.getString('content', '');
    const variant = this.getString('variant', 'body');
    const variantMap: Record<string, string> = {
      h1: 'heading1', h2: 'heading2', h3: 'heading3',
      title: 'heading2', subtitle: 'subheading',
      paragraph: 'body', text: 'body', secondary: 'muted', tertiary: 'caption',
    };
    const cls = variantMap[variant] || variant;
    const colorScheme = this.getString('colorScheme', '');
    const align = this.getString('align', '');
    const weight = this.getString('weight', '');
    const colorMap: Record<string, string> = {
      primary: 'var(--forgeui-color-primary)',
      secondary: 'var(--forgeui-color-text-secondary)',
      tertiary: 'var(--forgeui-color-text-tertiary)',
      success: 'var(--forgeui-color-success)',
      warning: 'var(--forgeui-color-warning)',
      error: 'var(--forgeui-color-error)',
      info: 'var(--forgeui-color-info)',
    };
    const weightMap: Record<string, string> = {
      normal: 'var(--forgeui-weight-normal)',
      medium: 'var(--forgeui-weight-medium)',
      semibold: 'var(--forgeui-weight-semibold)',
      bold: 'var(--forgeui-weight-bold)',
    };
    const styles: string[] = [];
    if (colorScheme && colorMap[colorScheme]) styles.push(`color:${colorMap[colorScheme]}`);
    if (weight && weightMap[weight]) styles.push(`font-weight:${weightMap[weight]}`);
    const alignCls = align ? `align-${align}` : '';
    const inner = html`${content}<slot></slot>`;
    if (cls === 'heading1') return html`<h1 class="${cls} ${alignCls}" style="${styles.join(';')}">${inner}</h1>`;
    if (cls === 'heading2') return html`<h2 class="${cls} ${alignCls}" style="${styles.join(';')}">${inner}</h2>`;
    if (cls === 'heading3') return html`<h3 class="${cls} ${alignCls}" style="${styles.join(';')}">${inner}</h3>`;
    return html`<div class="${cls} ${alignCls}" style="${styles.join(';')}">${content}<slot></slot></div>`;
  }
}
customElements.define('forgeui-text', ForgeText);

export class ForgeImage extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; }
    img { max-width:100%; height:auto; display:block; border-radius:var(--forgeui-radius-md); }
  `; }
  render() {
    const src = this.getString('src', '');
    const alt = this.getString('alt', '');
    const fit = this.getString('fit', 'contain');
    if (!src) return html`${nothing}`;
    return html`<img src="${src}" alt="${alt}" style="object-fit:${fit}" loading="lazy">`;
  }
}
customElements.define('forgeui-image', ForgeImage);

export class ForgeIcon extends ForgeUIElement {
  static get styles() { return css`
    :host { display:inline-flex; align-items:center; justify-content:center; }
    svg { width:var(--forgeui-icon-md); height:var(--forgeui-icon-md); fill:currentColor; }
  `; }
  render() {
    const name = this.getString('name', 'circle');
    const icons: Record<string, string> = {
      check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      x: 'M6 18L18 6M6 6l12 12',
      plus: 'M12 4v16m8-8H4',
      minus: 'M20 12H4',
      chevron: 'M9 5l7 7-7 7',
      arrow: 'M13 7l5 5m0 0l-5 5m5-5H6',
      star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.063 8.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z',
      circle: 'M12 2a10 10 0 100 20 10 10 0 000-20z',
      alert: 'M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z',
    };
    const path = icons[name] || icons.circle;
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
  }
}
customElements.define('forgeui-icon', ForgeIcon);

export class ForgeBadge extends ForgeUIElement {
  static get styles() { return css`
    :host { display:inline-flex; align-items:center; max-width:100%; }
    .badge { display:inline-flex; align-items:center; min-height:1.5rem; padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      border-radius:var(--forgeui-radius-sm); font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-bold);
      background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); letter-spacing:0.01em;
      max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .badge[variant="success"] { background:var(--forgeui-color-success); color:var(--forgeui-color-text-inverse); }
    .badge[variant="warning"] { background:var(--forgeui-color-warning); color:var(--forgeui-color-text-inverse); }
    .badge[variant="error"] { background:var(--forgeui-color-error); color:var(--forgeui-color-text-inverse); }
  `; }
  render() {
    const label = this.getString('text', '') || this.getString('label', '');
    const v = this.getString('variant', '');
    return html`<span class="badge" variant="${v}">${label}<slot></slot></span>`;
  }
}
customElements.define('forgeui-badge', ForgeBadge);

export class ForgeAvatar extends ForgeUIElement {
  static get styles() { return css`
    :host { display:inline-flex; }
    .avatar { width:2.5rem; height:2.5rem; border-radius:var(--forgeui-radius-full); background:var(--forgeui-color-primary-subtle);
      color:var(--forgeui-color-primary); display:flex; align-items:center; justify-content:center;
      font-weight:var(--forgeui-weight-semibold); font-size:var(--forgeui-text-sm); overflow:hidden; }
    img { width:100%; height:100%; object-fit:cover; }
  `; }
  render() {
    const src = this.getString('src', '');
    const name = this.getString('name', '?');
    const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    return html`<div class="avatar">${src ? html`<img src="${src}" alt="${name}">` : initials}<slot></slot></div>`;
  }
}
customElements.define('forgeui-avatar', ForgeAvatar);

export class ForgeEmptyState extends ForgeUIElement {
  static get styles() { return css`
    :host { display:block; text-align:center; padding:var(--forgeui-space-2xl) var(--forgeui-space-lg); }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-xs); overflow-wrap:break-word; }
    .desc { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin-bottom:var(--forgeui-space-md); overflow-wrap:break-word; }
  `; }
  render() {
    const title = this.getString('title', 'Nothing here');
    const desc = this.getString('description', '');
    return html`
      <div class="title">${title}</div>
      ${desc ? html`<div class="desc">${desc}</div>` : nothing}
      <slot></slot>
    `;
  }
}
customElements.define('forgeui-empty-state', ForgeEmptyState);
