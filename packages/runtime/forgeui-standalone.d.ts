/**
 * Forge — Main Entry Point
 *
 * Imports the ForgeApp component and re-exports the public API.
 */
export { ForgeApp } from './runtime/index.js';
export type { ForgeManifest, ForgeElement, ForgeSchema, ForgeAction, ForgeMeta, ComponentType, ComponentCategory, SurfaceMode, VisibilityCondition, } from './types/index.js';
export { createForgeStore, resolveRef, executeAction } from './state/index.js';
export { validateManifest, extractManifest } from './validation/index.js';
export type { ValidationResult, ValidationError } from './validation/index.js';
export { catalogPrompt, catalogToJsonSchema } from './catalog/prompt.js';
export { isValidComponentType } from './catalog/registry.js';
export { isA2UIPayload, ingestPayload } from './a2ui/index.js';
//# sourceMappingURL=index.d.ts.map