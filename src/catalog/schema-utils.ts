/**
 * Zod-dependent catalog utilities.
 *
 * These are separated from registry.ts to keep Zod out of the IIFE bundle.
 * Only Node-side consumers (CLI, connect, server) should import this file.
 */

import { z } from 'zod';
import { catalogSchemas as componentSchemas } from './schemas/index.js';
import type { ComponentType } from '../types/index.js';

/** Get the Zod schema for a component type */
export function getComponentSchema(type: ComponentType): z.ZodTypeAny {
  return componentSchemas[type];
}

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
