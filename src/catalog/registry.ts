/**
 * Forge Catalog Registry
 * 
 * Maps component type strings → Lit component classes.
 * Generates LLM system prompts and JSON Schemas from the catalog.
 */

import type { ComponentType, ComponentCategory } from '../types/index.js';

/** Category mapping for all 39 components */
export const componentCategories: Record<ComponentType, ComponentCategory> = {
  Stack: 'layout', Grid: 'layout', Card: 'layout', Container: 'layout',
  Tabs: 'layout', Accordion: 'layout', Divider: 'layout', Spacer: 'layout', Repeater: 'layout',
  
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
  layout: ['Stack', 'Grid', 'Card', 'Container', 'Tabs', 'Accordion', 'Divider', 'Spacer', 'Repeater'],
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

// Zod-dependent utilities (getComponentSchema, schemaToJsonSchema) live in ./schema-utils.js
// Re-export from prompt.ts removed — consumers import from prompt.ts directly.
