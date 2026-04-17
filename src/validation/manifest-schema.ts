/**
 * Manifest JSON Schema definition.
 * Extracted so both the generator (scripts/gen-validator.mjs) and
 * src/validation/index.ts can import it without circular deps.
 */

import { ALL_COMPONENT_TYPES } from '../catalog/registry.js';

export const MANIFEST_SCHEMA = {
  type: 'object',
  required: ['manifest', 'id', 'root', 'elements'],
  additionalProperties: true,
  properties: {
    manifest: { type: 'string', pattern: '^0\\.\\d+\\.\\d+$' },
    id: { type: 'string', minLength: 1, maxLength: 128 },
    root: { type: 'string', minLength: 1 },
    schema: {
      type: 'object',
      properties: {
        version: { type: 'integer', minimum: 1 },
        tables: { type: 'object' },
        migrations: { type: 'array' },
      },
    },
    state: { type: 'object' },
    elements: {
      type: 'object',
      minProperties: 1,
      additionalProperties: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ALL_COMPONENT_TYPES },
          props: { type: 'object' },
          children: { type: 'array', items: { type: 'string' } },
          visible: { type: 'object' },
        },
      },
    },
    actions: { type: 'object' },
    meta: { type: 'object' },
    persistState: { type: 'boolean' },
    skipPersistState: { type: 'boolean' },
    dataAccess: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        readable: { type: 'array', items: { type: 'string' } },
        restricted: { type: 'array', items: { type: 'string' } },
        summaries: { type: 'boolean' },
      },
    },
  },
} as const;
