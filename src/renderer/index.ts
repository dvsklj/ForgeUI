/**
 * Forge Renderer
 * 
 * Takes a validated manifest and renders it as Lit HTML.
 * Recursively walks the flat element map, resolving references.
 */

import { html, TemplateResult, nothing } from 'lit';
import type { ForgeManifest, ForgeElement, VisibilityCondition } from '../types/index.js';
import { isStateRef, isComputedRef, isItemRef } from '../types/index.js';
import { Store } from 'tinybase';
import { resolveRef, setItemContext } from '../state/index.js';
import { isValidComponentType } from '../catalog/registry.js';

/** Context passed through the render tree */
export interface RenderContext {
  manifest: ForgeManifest;
  store: Store;
  /** Current active view (for navigate actions) */
  activeView: string;
  /** Callback when user triggers an action */
  onAction: (actionId: string, payload?: Record<string, unknown>) => void;
  /** Item context for Repeater ($item: bindings) */
  itemContext?: Record<string, unknown>;
}

/** Render the entire manifest */
export function renderManifest(ctx: RenderContext): TemplateResult {
  return renderElement(ctx.manifest.root, ctx);
}

/** Render a single element by ID */
export function renderElement(elementId: string, ctx: RenderContext): TemplateResult {
  const element = ctx.manifest.elements[elementId];
  
  if (!element) {
    return html`<forge-error msg="Element not found: ${elementId}"></forge-error>`;
  }
  
  // Check visibility condition
  if (element.visible && !evaluateVisibility(element.visible, ctx)) {
    return html`${nothing}`;
  }
  
  // Validate component type
  if (!isValidComponentType(element.type)) {
    return html`<forge-error msg="Unknown component: ${element.type}"></forge-error>`;
  }
  
  // Resolve props (replace $state:, $computed:, $item: references)
  const resolvedProps = resolveProps(element.props || {}, ctx);
  
  // Render children
  const children = (element.children || []).map(childId => renderElement(childId, ctx));
  
  // Dispatch to component renderer
  const tagName = `forge-${kebabCase(element.type)}`;
  
  // Build props as element attributes/properties
  return html`
    <${tagName}
      .props=${resolvedProps}
      .store=${ctx.store}
      .onAction=${ctx.onAction}
      .itemContext=${ctx.itemContext || null}
    >${children}</${tagName}>
  `;
}

/** Resolve all reference strings in a props object */
function resolveProps(props: Record<string, unknown>, ctx: RenderContext): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    resolved[key] = resolveRef(ctx.store, value);
  }
  return resolved;
}

/** Evaluate a visibility condition */
function evaluateVisibility(condition: VisibilityCondition, ctx: RenderContext): boolean {
  const { path, eq, neq, gt, gte, lt, lte, in: inList, exists } = condition.$when;
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

/** Convert PascalCase to kebab-case */
function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}
