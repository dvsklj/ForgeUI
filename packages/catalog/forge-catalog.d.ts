/**
 * Forge Catalog Registry
 *
 * Maps component type strings → Lit component classes.
 * Generates LLM system prompts and JSON Schemas from the catalog.
 */
import type { ComponentType, ComponentCategory } from '../types/index.js';
/** Category mapping for all 39 components */
export declare const componentCategories: Record<ComponentType, ComponentCategory>;
/** Components grouped by category */
export declare const componentsByCategory: Record<ComponentCategory, ComponentType[]>;
export declare const CATEGORY_MAP: Record<ComponentCategory, ComponentType[]>;
/** All valid component types */
export declare const ALL_COMPONENT_TYPES: ComponentType[];
/** Validate that a component type exists in the catalog */
export declare function isValidComponentType(type: string): type is ComponentType;
//# sourceMappingURL=registry.d.ts.map