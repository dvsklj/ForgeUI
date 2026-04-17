/**
 * Forge — Main Entry Point
 *
 * Imports the ForgeUIApp component and re-exports the public API.
 */
export { ForgeUIApp } from './runtime/index.js';
export type { ForgeUIManifest, ForgeUIElement, ForgeUISchema, ForgeUIAction, ForgeUIMeta, ComponentType, ComponentCategory, SurfaceMode, VisibilityCondition, } from './types/index.js';
export { createForgeUIStore, resolveRef, executeAction } from './state/index.js';
export { validateManifest, extractManifest } from './validation/index.js';
export type { ValidationResult, ValidationError } from './validation/index.js';
export { catalogPrompt, catalogToJsonSchema } from './catalog/prompt.js';
export { isValidComponentType } from './catalog/registry.js';
export { isA2UIPayload, ingestPayload } from './a2ui/index.js';
//# sourceMappingURL=index.d.ts.map