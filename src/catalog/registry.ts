/**
 * Forge Catalog Registry
 * 
 * Maps component type strings → Lit component classes.
 * Generates LLM system prompts and JSON Schemas from the catalog.
 */

import { z } from 'zod';
import { catalogSchemas as componentSchemas } from '../catalog/schemas/index.js';
import type { ComponentType, ComponentCategory } from '../types/index.js';

/** Category mapping for all 36 components */
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
};

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

/** Generate the full JSON Schema for LLM structured output */
export function catalogToJsonSchema(): object {
  const elementSchema: Record<string, object> = {};
  
  for (const [type, schema] of Object.entries(componentSchemas)) {
    elementSchema[type] = {
      type: 'object',
      properties: {
        type: { type: 'string', const: type },
        props: schemaToJsonSchema(schema),
        children: { type: 'array', items: { type: 'string' }, description: 'Child element IDs' },
      },
      required: ['type'],
      additionalProperties: false,
    };
  }
  
  return {
    type: 'object',
    properties: {
      manifest: { type: 'string', const: '0.1.0' },
      id: { type: 'string', description: 'Unique app identifier' },
      root: { type: 'string', description: 'Root element ID' },
      schema: {
        type: 'object',
        description: 'Data schema (TinyBase tables)',
        properties: {
          version: { type: 'integer', minimum: 1 },
          tables: { type: 'object', additionalProperties: { type: 'object' } },
        },
      },
      state: { type: 'object', description: 'Initial state values' },
      elements: {
        type: 'object',
        description: 'Flat map of element ID → element definition',
        additionalProperties: {
          oneOf: Object.values(elementSchema),
        },
      },
      actions: {
        type: 'object',
        description: 'Declarative action definitions',
        additionalProperties: { type: 'object' },
      },
    },
    required: ['manifest', 'id', 'root', 'elements'],
    additionalProperties: false,
  };
}

/** Convert a Zod schema to JSON Schema (simplified) */
function schemaToJsonSchema(zodSchema: z.ZodTypeAny): object {
  // Use Zod's built-in JSON Schema conversion (zod v3.23+)
  // For older versions, do a simplified conversion
  try {
    // @ts-expect-error - zodToJsonSchema may not be available
    if (typeof zodSchema.toJsonSchema === 'function') {
      // @ts-expect-error
      return zodSchema.toJsonSchema();
    }
  } catch {}
  
  // Fallback: describe the schema structure
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
  
  if (def.typeName === 'ZodString') {
    const schema: Record<string, unknown> = { type: 'string' };
    if (def.checks) {
      for (const check of def.checks) {
        if (check.kind === 'enum') schema.enum = check.value;
        if (check.kind === 'min') schema.minLength = check.value;
        if (check.kind === 'max') schema.maxLength = check.value;
      }
    }
    return schema;
  }
  
  if (def.typeName === 'ZodNumber') {
    const schema: Record<string, unknown> = { type: 'number' };
    if (def.checks) {
      for (const check of def.checks) {
        if (check.kind === 'min') schema.minimum = check.value;
        if (check.kind === 'max') schema.maximum = check.value;
        if (check.kind === 'int') schema.type = 'integer';
      }
    }
    return schema;
  }
  
  if (def.typeName === 'ZodBoolean') return { type: 'boolean' };
  if (def.typeName === 'ZodArray') return { type: 'array', items: schemaToJsonSchema(def.type) };
  if (def.typeName === 'ZodEnum') return { type: 'string', enum: def.values };
  if (def.typeName === 'ZodOptional' || def.typeName === 'ZodDefault') return schemaToJsonSchema(def.innerType);
  if (def.typeName === 'ZodUnion') return { oneOf: def.options.map(schemaToJsonSchema) };
  if (def.typeName === 'ZodLiteral') return { const: def.value };
  
  return {};
}

/** Generate an LLM system prompt describing the component catalog */
export function catalogPrompt(): string {
  let prompt = `# Forge Component Catalog

You are generating Forge manifests — JSON documents that describe interactive web applications. A manifest has a flat map of elements (keyed by ID), each referencing a component type from this catalog.

## Manifest Structure

\`\`\`json
{
  "manifest": "0.1.0",
  "id": "app-id",
  "root": "element-id",
  "schema": { "version": 1, "tables": { ... } },
  "state": { "key": "value" },
  "elements": {
    "element-id": { "type": "ComponentType", "props": { ... }, "children": ["child-id"] }
  },
  "actions": {
    "action-id": { "type": "mutateState", "path": "...", "operation": "..." }
  }
}
\`\`\`

## State Bindings
- \`$state:path\` — read from store (e.g. \`$state:view/active\`)
- \`$computed:sum:table/column\` — computed value (sum, avg, count)
- \`$computed:count:table\` — row count
- \`$item:field\` — current repeater item field

## Actions
- \`{ "type": "mutateState", "path": "table", "operation": "append", "value": {...} }\`
- \`{ "type": "mutateState", "path": "table", "operation": "delete", "key": "{{id}}" }\`
- \`{ "type": "navigate", "target": "element-id" }\`

## Components

`;

  for (const [category, types] of Object.entries(componentsByCategory)) {
    prompt += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    for (const type of types) {
      const schema = componentSchemas[type];
      const shape = schema._def?.shape?.() || {};
      const props = Object.keys(shape);
      prompt += `**${type}** — ${props.length > 0 ? 'Props: ' + props.join(', ') : 'No required props'}\n`;
    }
    prompt += '\n';
  }

  prompt += `## Rules
- Use semantic design tokens, never raw color values
- Keep manifests under 100KB
- Use flat element references (children are ID strings, not nested objects)
- Every element must have a unique ID and a valid type from this catalog
- Actions are declarative JSON — never JavaScript
`;

  return prompt;
}
