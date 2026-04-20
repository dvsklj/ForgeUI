/**
 * Forge Renderer
 *
 * Takes a validated manifest and renders it as Lit HTML.
 * Uses a static dispatch map instead of dynamic tag names (Lit limitation).
 */

import { html, TemplateResult } from 'lit';
import type { ForgeManifest } from '../types/index.js';
import { Store } from 'tinybase';
import { evaluateExpr, evaluateComputed, resolveStatePath, setItemContext } from '../state/index.js';

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
  const element = ctx.manifest.elements[elementId];
  if (!element) return html``;
  if (element.visible && !evaluateVisibility(element.visible, ctx)) return html``;

  const resolvedProps = resolveProps(element.props || {}, ctx, ctx.itemContext);
  const type = element.type;

  // Tabs: wrap each child in a div with data-tab attribute for CSS show/hide
  if (type === 'Tabs') {
    const tabIds: string[] = (element.children || []) as string[];
    const wrappedChildren = children.map((child, i) => {
      const tabId = tabIds[i] ?? String(i);
      return html`<div class="tab-panel" data-tab-id="${tabId}">${child}</div>`;
    });
    return html`<forge-tabs .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}>${wrappedChildren}</forge-tabs>`;
  }

  const children = (element.children || []).map(id => renderElement(id, ctx));

  // Static dispatch — each type calls the right Lit component
  switch (type) {
    case 'Stack':    return html`<forge-stack .props=${resolvedProps} .store=${ctx.store} .onAction=${ctx.onAction}>${children}</forge-stack>`;
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
    default:         return html`<forge-error .props=${{ msg: `Unknown: ${type}` }} .store=${ctx.store}></forge-error>`;
  }
}

/**
 * Resolve element props, handling:
 * - $state:path → TinyBase reactive value
 * - $expr: → piped expression
 * - $computed: → computed expression
 * - $item:field → repeater item context
 * - {{$state:path}} / {{$item:field}} / {{$computed:...}} → template strings
 */
function resolveProps(
  props: Record<string, unknown>,
  ctx: RenderContext,
  itemCtx?: Record<string, unknown>
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    resolved[key] = resolvePropValue(value, ctx.store, itemCtx);
  }
  return resolved;
}

function resolvePropValue(
  value: unknown,
  store: Store,
  itemCtx?: Record<string, unknown>
): unknown {
  if (value === null || value === undefined) return value;

  // Object — recurse (but not action objects or $expr objects)
  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    // $expr objects: { "$expr": "state.count + 1" }
    if ('$expr' in obj) {
      return evaluateExpr(store, obj['$expr'] as string);
    }
    // Action objects: don't resolve state refs inside them
    if (obj['$action']) return value;
    // Visibility objects: resolve the $when clause
    if ('$when' in obj) {
      return value; // visibility handled separately
    }
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = resolvePropValue(v, store, itemCtx);
    }
    return result;
  }

  // Array — recurse
  if (Array.isArray(value)) {
    return value.map(item => resolvePropValue(item, store, itemCtx));
  }

  // String — check for $state:, $expr:, $computed:, $item:, {{...}}
  if (typeof value === 'string') {
    // Direct $state: reference
    if (value.startsWith('$state:')) {
      return resolveStatePath(store, value.slice(7));
    }
    // $expr: piped expression
    if (value.startsWith('$expr:')) {
      return evaluateExpr(store, value.slice(6));
    }
    // $computed: expression
    if (value.startsWith('$computed:')) {
      return evaluateComputed(store, value.slice(9));
    }
    // $item: repeater field
    if (value.startsWith('$item:') && itemCtx) {
      const field = value.slice(6);
      return field.includes('.')
        ? getNestedPath(itemCtx, field)
        : itemCtx[field];
    }

    // {{...}} template in string — resolve
    if (value.includes('{{')) {
      return resolveTemplateString(value, store, itemCtx);
    }
  }

  return value;
}

/** Resolve {{...}} templates in a string value. */
function resolveTemplateString(
  template: string,
  store: Store,
  itemCtx?: Record<string, unknown>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, inner) => {
    const it = inner.trim();
    if (it.startsWith('$state:')) {
      const val = resolveStatePath(store, it.slice(7));
      return val !== undefined ? String(val) : '';
    }
    if (it.startsWith('$item:') && itemCtx) {
      const field = it.slice(6);
      const val = field.includes('.')
        ? getNestedPath(itemCtx, field)
        : itemCtx[field];
      return val !== undefined ? String(val) : '';
    }
    if (it.startsWith('$computed:')) {
      const val = evaluateComputed(store, it.slice(9));
      return val !== undefined ? String(val) : '';
    }
    return it;
  });
}

function getNestedPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function evaluateVisibility(condition: any, ctx: RenderContext): boolean {
  const { path, eq, neq, gt, gte, lt, lte, in: inList, exists } = condition.$when;
  const actual = path ? resolveStatePath(ctx.store, path) : undefined;
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
