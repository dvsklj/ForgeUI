/**
 * Forge Renderer
 * 
 * Takes a validated manifest and renders it as Lit HTML.
 * Uses a static dispatch map instead of dynamic tag names (Lit limitation).
 */

import { html, TemplateResult } from 'lit';
import type { ForgeManifest } from '../types/index.js';
import { Store } from 'tinybase';
import { resolveRef, setItemContext } from '../state/index.js';

export interface RenderContext {
  manifest: ForgeManifest;
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
      case 'Stack':    return html`<forge-stack .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction} .itemContext=${ctx.itemContext || null}>${children}</forge-stack>`;
      case 'Grid':     return html`<forge-grid .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}>${children}</forge-grid>`;
      case 'Card':     return html`<forge-card .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}>${children}</forge-card>`;
      case 'Container':return html`<forge-container .props=${resolvedProps} .store=${ctx.store}>${children}</forge-container>`;
      case 'Tabs':     return html`<forge-tabs .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}>${children}</forge-tabs>`;
      case 'Accordion':return html`<forge-accordion .props=${resolvedProps} .store=${ctx.store}>${children}</forge-accordion>`;
      case 'Divider':  return html`<forge-divider .props=${resolvedProps} .store=${ctx.store}></forge-divider>`;
      case 'Spacer':   return html`<forge-spacer .props=${resolvedProps} .store=${ctx.store}></forge-spacer>`;
      case 'Text':     return html`<forge-text .props=${resolvedProps} .store=${ctx.store}></forge-text>`;
      case 'Image':    return html`<forge-image .props=${resolvedProps} .store=${ctx.store}></forge-image>`;
      case 'Icon':     return html`<forge-icon .props=${resolvedProps} .store=${ctx.store}></forge-icon>`;
      case 'Badge':    return html`<forge-badge .props=${resolvedProps} .store=${ctx.store}></forge-badge>`;
      case 'Avatar':   return html`<forge-avatar .props=${resolvedProps} .store=${ctx.store}></forge-avatar>`;
      case 'EmptyState':return html`<forge-empty-state .props=${resolvedProps} .store=${ctx.store}></forge-empty-state>`;
      case 'TextInput':return html`<forge-text-input .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forge-text-input>`;
      case 'NumberInput':return html`<forge-number-input .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forge-number-input>`;
      case 'Select':   return html`<forge-select .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forge-select>`;
      case 'MultiSelect':return html`<forge-multi-select .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forge-multi-select>`;
      case 'Checkbox': return html`<forge-checkbox .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forge-checkbox>`;
      case 'Toggle':   return html`<forge-toggle .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forge-toggle>`;
      case 'DatePicker':return html`<forge-date-picker .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forge-date-picker>`;
      case 'Slider':   return html`<forge-slider .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forge-slider>`;
      case 'FileUpload':return html`<forge-file-upload .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forge-file-upload>`;
      case 'Button':   return html`<forge-button .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forge-button>`;
      case 'ButtonGroup':return html`<forge-button-group .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}>${children}</forge-button-group>`;
      case 'Link':     return html`<forge-link .props=${resolvedProps} .store=${ctx.store}></forge-link>`;
      case 'Table':    return html`<forge-table .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forge-table>`;
      case 'List':     return html`<forge-list .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forge-list>`;
      case 'Chart':    return html`<forge-chart .props=${resolvedProps} .store=${ctx.store}></forge-chart>`;
      case 'Metric':   return html`<forge-metric .props=${resolvedProps} .store=${ctx.store}></forge-metric>`;
      case 'Alert':    return html`<forge-alert .props=${resolvedProps} .store=${ctx.store}>${children}</forge-alert>`;
      case 'Dialog':   return html`<forge-dialog .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}>${children}</forge-dialog>`;
      case 'Progress': return html`<forge-progress .props=${resolvedProps} .store=${ctx.store}></forge-progress>`;
      case 'Toast':    return html`<forge-toast .props=${resolvedProps} .store=${ctx.store}></forge-toast>`;
      case 'Breadcrumb':return html`<forge-breadcrumb .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forge-breadcrumb>`;
      case 'Stepper':  return html`<forge-stepper .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}>${children}</forge-stepper>`;
      case 'Drawing':  return html`<forge-drawing .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}></forge-drawing>`;
      default:         return html`<forge-error .props=${({ msg: `Unknown: ${type}` })} .store=${ctx.store}></forge-error>`;
    }
  } catch (err: any) {
    console.warn(`[forge] renderElement("${elementId}") threw:`, err?.message || err);
    return html`<forge-error .props=${({
      msg: `Element "${elementId}" failed to render: ${err?.message || 'unknown error'}`,
    })} .store=${ctx.store}></forge-error>`;
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
    return html`<forge-repeater .props=${resolvedProps} .store=${ctx.store}></forge-repeater>`;
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
    return html`<forge-repeater .props=${resolvedProps} .store=${ctx.store}></forge-repeater>`;
  }
  return html`<forge-repeater .props=${resolvedProps} .store=${ctx.store}>${rendered}</forge-repeater>`;
}

function resolveProps(props: Record<string, unknown>, ctx: RenderContext): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    resolved[key] = resolveRef(ctx.store, value);
  }
  return resolved;
}

function evaluateVisibility(condition: any, ctx: RenderContext): boolean {
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
