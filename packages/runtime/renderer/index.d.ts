/**
 * Forge Renderer
 *
 * Takes a validated manifest and renders it as Lit HTML.
 * Uses a static dispatch map instead of dynamic tag names (Lit limitation).
 */
import { TemplateResult } from 'lit';
import type { ForgeManifest } from '../types/index.js';
import { Store } from 'tinybase';
export interface RenderContext {
    manifest: ForgeManifest;
    store: Store;
    activeView: string;
    onAction: (actionId: string, payload?: Record<string, unknown>) => void;
    itemContext?: Record<string, unknown>;
}
export declare function renderManifest(ctx: RenderContext): TemplateResult;
export declare function renderElement(elementId: string, ctx: RenderContext): TemplateResult;
export declare function evaluateVisibility(condition: any, ctx: RenderContext): boolean;
export declare function kebabCase(str: string): string;
//# sourceMappingURL=index.d.ts.map