/**
 * Forge Catalog Registry
 * 
 * Maps component type strings → Lit component classes.
 * Generates LLM system prompts and JSON Schemas from the catalog.
 */

import { z } from 'zod';
import { catalogSchemas as componentSchemas } from '../catalog/schemas/index.js';
import type { ComponentType, ComponentCategory } from '../types/index.js';

/** Category mapping for all 37 components */
export const componentCategories: Record<ComponentType, ComponentCategory> = {
  Stack: 'layout', Grid: 'layout', Card: 'layout', Container: 'layout',
  Tabs: 'layout', Accordion: 'layout', Divider: 'layout', Spacer: 'layout',
  
  Text: 'content', Image: 'content', Icon: 'content', Badge: 'content',
  Avatar: 'content', EmptyState: 'content',
  
  TextInput: 'input', NumberInput: 'input', Select: 'input', MultiSelect: 'input',
  Checkbox: 'input', Toggle: 'input', DatePicker: 'input', Slider: 'input', FileUpload: 'input',
  
  Button: 'action', ButtonGroup: 'action', Link: 'action',
  
  Table: 'data', List: 'data', Chart: 'data', Metric: 'data',
  
  Alert: 'feedback', Dialog: 'feedback', Progress: 'feedback', Toast: 'feedback',
  
  Breadcrumb: 'navigation', Stepper: 'navigation',

  Drawing: 'drawing',
};

/** Components grouped by category */
export const componentsByCategory: Record<ComponentCategory, ComponentType[]> = {
  layout: ['Stack', 'Grid', 'Card', 'Container', 'Tabs', 'Accordion', 'Divider', 'Spacer'],
  content: ['Text', 'Image', 'Icon', 'Badge', 'Avatar', 'EmptyState'],
  input: ['TextInput', 'NumberInput', 'Select', 'MultiSelect', 'Checkbox', 'Toggle', 'DatePicker', 'Slider', 'FileUpload'],
  action: ['Button', 'ButtonGroup', 'Link'],
  data: ['Table', 'List', 'Chart', 'Metric'],
  feedback: ['Alert', 'Dialog', 'Progress', 'Toast'],
  navigation: ['Breadcrumb', 'Stepper'],
  drawing: ['Drawing'],
};

export const CATEGORY_MAP = componentsByCategory;

/** All valid component types */
export const ALL_COMPONENT_TYPES = Object.keys(componentCategories) as ComponentType[];

/** Validate that a component type exists in the catalog */
export function isValidComponentType(type: string): type is ComponentType {
  return type in componentCategories;
}

/** Get the Zod schema for a component type */
export function getComponentSchema(type: ComponentType): z.ZodTypeAny {
  return componentSchemas[type];
}

// Re-export from prompt.ts (authoritative implementation)
export { catalogPrompt, catalogToJsonSchema } from './prompt.js';

/** Convert a Zod schema to JSON Schema (simplified) — kept for backward compat */
export function schemaToJsonSchema(zodSchema: z.ZodTypeAny): object {
  try {
    // @ts-expect-error - zodToJsonSchema may not be available
    if (typeof zodSchema.toJsonSchema === 'function') {
      // @ts-expect-error
      return zodSchema.toJsonSchema();
    }
  } catch {}
  const def = zodSchema._def;
  if (!def) return {};
  if (def.typeName === 'ZodObject') {
    const shape = def.shape();
    const properties: Record<string, object> = {};
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = schemaToJsonSchema(value as z.ZodTypeAny);
    }
    return { type: 'object', properties };
  }
  if (def.typeName === 'ZodString') return { type: 'string' };
  if (def.typeName === 'ZodNumber') return { type: 'number' };
  if (def.typeName === 'ZodBoolean') return { type: 'boolean' };
  if (def.typeName === 'ZodArray') return { type: 'array', items: schemaToJsonSchema(def.type) };
  if (def.typeName === 'ZodEnum') return { type: 'string', enum: def.values };
  if (def.typeName === 'ZodOptional' || def.typeName === 'ZodDefault') return schemaToJsonSchema(def.innerType);
  if (def.typeName === 'ZodUnion') return { oneOf: def.options.map(schemaToJsonSchema) };
  if (def.typeName === 'ZodLiteral') return { const: def.value };
  return {};
}
