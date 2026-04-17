/**
 * Forge Renderer
 * 
 * Takes a validated manifest and renders it as Lit HTML.
 * Uses a static dispatch map instead of dynamic tag names (Lit limitation).
 */

import { html, TemplateResult } from 'lit';
import type { ForgeUIManifest } from '../types/index.js';
import { Store } from 'tinybase';
import { resolveRef, setItemContext } from '../state/index.js';

export interface RenderContext {
  manifest: ForgeUIManifest;
  store: Store;
  activeView: string;
  onAction: (actionId: string, payload?: Record<string, unknown>) => void;
  itemContext?: Record<string, unknown>;
}

export function renderManifest(ctx: RenderContext): TemplateResult {
  return renderElement(ctx.manifest.root, ctx);
}

export function renderElement(elementId: string, ctx: RenderContext): TemplateResult {
  try {
    const element = ctx.manifest.elements[elementId];
    if (!element) return html``;
    if (element.visible && !evaluateVisibility(element.visible, ctx)) return html``;

    const type = element.type;

    // Repeater: iterate over data and render the (first) child template per item.
    if (type === 'Repeater') {
      return renderRepeater(element, ctx);
    }

    const resolvedProps = resolveProps(element.props || {}, ctx);
    const children = (element.children || []).map(id => renderElement(id, ctx));

    // Static dispatch — each type calls the right template literal
    switch (type) {
      case 'Stack':    return html`<forgeui-stack .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction} .itemContext=${ctx.itemContext || null}>${children}</forgeui-stack>`;
      case 'Grid':     return html`<forgeui-grid .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}>${children}</forgeui-grid>`;
      case 'Card':     return html`<forgeui-card .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}>${children}</forgeui-card>`;
      case 'Container':return html`<forgeui-container .props=${resolvedProps} .store=${ctx.store}>${children}</forgeui-container>`;
      case 'Tabs':     return html`<forgeui-tabs .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}>${children}</forgeui-tabs>`;
      case 'Accordion':return html`<forgeui-accordion .props=${resolvedProps} .store=${ctx.store}>${children}</forgeui-accordion>`;
      case 'Divider':  return html`<forgeui-divider .props=${resolvedProps} .store=${ctx.store}></forgeui-divider>`;
      case 'Spacer':   return html`<forgeui-spacer .props=${resolvedProps} .store=${ctx.store}></forgeui-spacer>`;
      case 'Text':     return html`<forgeui-text .props=${resolvedProps} .store=${ctx.store}></forgeui-text>`;
      case 'Image':    return html`<forgeui-image .props=${resolvedProps} .store=${ctx.store}></forgeui-image>`;
      case 'Icon':     return html`<forgeui-icon .props=${resolvedProps} .store=${ctx.store}></forgeui-icon>`;
      case 'Badge':    return html`<forgeui-badge .props=${resolvedProps} .store=${ctx.store}></forgeui-badge>`;
      case 'Avatar':   return html`<forgeui-avatar .props=${resolvedProps} .store=${ctx.store}></forgeui-avatar>`;
      case 'EmptyState':return html`<forgeui-empty-state .props=${resolvedProps} .store=${ctx.store}></forgeui-empty-state>`;
      case 'TextInput':return html`<forgeui-text-input .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forgeui-text-input>`;
      case 'NumberInput':return html`<forgeui-number-input .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forgeui-number-input>`;
      case 'Select':   return html`<forgeui-select .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forgeui-select>`;
      case 'MultiSelect':return html`<forgeui-multi-select .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forgeui-multi-select>`;
      case 'Checkbox': return html`<forgeui-checkbox .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forgeui-checkbox>`;
      case 'Toggle':   return html`<forgeui-toggle .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forgeui-toggle>`;
      case 'DatePicker':return html`<forgeui-date-picker .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forgeui-date-picker>`;
      case 'Slider':   return html`<forgeui-slider .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forgeui-slider>`;
      case 'FileUpload':return html`<forgeui-file-upload .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forgeui-file-upload>`;
      case 'Button':   return html`<forgeui-button .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forgeui-button>`;
      case 'ButtonGroup':return html`<forgeui-button-group .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}>${children}</forgeui-button-group>`;
      case 'Link':     return html`<forgeui-link .props=${resolvedProps} .store=${ctx.store}></forgeui-link>`;
      case 'Table':    return html`<forgeui-table .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forgeui-table>`;
      case 'List':     return html`<forgeui-list .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forgeui-list>`;
      case 'Chart':    return html`<forgeui-chart .props=${resolvedProps} .store=${ctx.store}></forgeui-chart>`;
      case 'Metric':   return html`<forgeui-metric .props=${resolvedProps} .store=${ctx.store}></forgeui-metric>`;
      case 'Alert':    return html`<forgeui-alert .props=${resolvedProps} .store=${ctx.store}>${children}</forgeui-alert>`;
      case 'Dialog':   return html`<forgeui-dialog .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}>${children}</forgeui-dialog>`;
      case 'Progress': return html`<forgeui-progress .props=${resolvedProps} .store=${ctx.store}></forgeui-progress>`;
      case 'Toast':    return html`<forgeui-toast .props=${resolvedProps} .store=${ctx.store}></forgeui-toast>`;
      case 'Breadcrumb':return html`<forgeui-breadcrumb .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forgeui-breadcrumb>`;
      case 'Stepper':  return html`<forgeui-stepper .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}>${children}</forgeui-stepper>`;
      case 'Drawing':  return html`<forgeui-drawing .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forgeui-drawing>`;
      default:         return html`<forgeui-error .props=${({ msg: `Unknown: ${type}` })} .store=${ctx.store}></forgeui-error>`;
    }
  } catch (err: any) {
    console.warn(`[forge] renderElement("${elementId}") threw:`, err?.message || err);
    return html`<forgeui-error .props=${({
      msg: `Element "${elementId}" failed to render: ${err?.message || 'unknown error'}`,
    })} .store=${ctx.store}></forgeui-error>`;
  }
}

/** Render a Repeater element: iterate over `data`, render child template once per item. */
function renderRepeater(element: any, ctx: RenderContext): TemplateResult {
  const resolvedProps = resolveProps(element.props || {}, ctx);
  const dataRaw = resolvedProps.data;
  let items: unknown[] = [];
  if (Array.isArray(dataRaw)) items = dataRaw;
  else if (dataRaw && typeof dataRaw === 'object') items = Object.values(dataRaw as Record<string, unknown>);

  const childIds = element.children || [];
  if (childIds.length === 0) {
    return html`<forgeui-repeater .props=${resolvedProps} .store=${ctx.store}></forgeui-repeater>`;
  }

  // Render each child template once per item, with item context set for resolveRef.
  const rendered: TemplateResult[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemObj = (typeof item === 'object' && item !== null) ? { ...item as Record<string, unknown>, _index: i } : { value: item, _index: i };
    const itemCtx: RenderContext = { ...ctx, itemContext: itemObj };
    // setItemContext is a module-level global used by resolveRef; set it around each child render.
    setItemContext(itemObj);
    try {
      for (const cid of childIds) {
        rendered.push(renderElement(cid, itemCtx));
      }
    } finally {
      setItemContext(null);
    }
  }

  // If empty, let the Repeater component render its empty state.
  if (items.length === 0) {
    return html`<forgeui-repeater .props=${resolvedProps} .store=${ctx.store}></forgeui-repeater>`;
  }
  return html`<forgeui-repeater .props=${resolvedProps} .store=${ctx.store}>${rendered}</forgeui-repeater>`;
}

function resolveProps(props: Record<string, unknown>, ctx: RenderContext): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    resolved[key] = resolveRef(ctx.store, value);
  }
  return resolved;
}

export function evaluateVisibility(condition: any, ctx: RenderContext): boolean {
  if (!condition || typeof condition !== 'object') return true;
  const when = condition.$when ?? condition;
  if (!when || typeof when !== 'object') return true;
  const { path, eq, neq, gt, gte, lt, lte, in: inList, exists } = when;
  if (!path || typeof path !== 'string') return true;
  const actual = resolveRef(ctx.store, `$state:${path}`);
  if (exists !== undefined) return exists ? actual !== undefined : actual === undefined;
  if (eq !== undefined) return actual === eq;
  if (neq !== undefined) return actual !== neq;
  if (gt !== undefined && typeof actual === 'number') return actual > gt;
  if (gte !== undefined && typeof actual === 'number') return actual >= gte;
  if (lt !== undefined && typeof actual === 'number') return actual < lt;
  if (lte !== undefined && typeof actual === 'number') return actual <= lte;
  if (inList !== undefined && Array.isArray(inList)) return inList.includes(actual);
  return true;
}

export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}
