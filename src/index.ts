/**
 * Forge — Main Entry Point
 * 
 * Imports the ForgeApp component and re-exports the public API.
 */

// Register the main component
export { ForgeApp } from './runtime/index.js';

// Re-export types
export type {
  ForgeManifest,
  ForgeElement,
  ForgeSchema,
  ForgeAction,
  ForgeMeta,
  ComponentType,
  ComponentCategory,
  SurfaceMode,
  VisibilityCondition,
} from './types/index.js';

// Re-export state utilities
export { createForgeStore, resolveRef, executeAction } from './state/index.js';

// Re-export validation
export { validateManifest } from './validation/index.js';
export type { ValidationResult, ValidationError } from './validation/index.js';

// Re-export catalog utilities
export { catalogPrompt, catalogToJsonSchema, isValidComponentType } from './catalog/registry.js';
