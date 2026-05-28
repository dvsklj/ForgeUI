/**
 * Manifest JSON Schema definition.
 * Extracted so both the generator (scripts/gen-validator.mjs) and
 * src/validation/index.ts can import it without circular deps.
 */

import { ALL_COMPONENT_TYPES } from '../catalog/registry.js';

export const ACTION_TYPES = ['mutateState', 'navigate', 'openDialog', 'closeDialog', 'callApi', 'toast', 'custom'] as const;
export const MUTATION_OPERATIONS = ['set', 'append', 'update', 'delete', 'increment', 'decrement', 'toggle'] as const;
export const API_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'get', 'post', 'put', 'patch', 'delete'] as const;

export const MANIFEST_SCHEMA = {
  type: 'object',
  required: ['manifest', 'id', 'root', 'elements'],
  additionalProperties: false,
  properties: {
    manifest: { type: 'string', pattern: '^0\\.\\d+\\.\\d+$' },
    id: { type: 'string', minLength: 1, maxLength: 128 },
    root: { type: 'string', minLength: 1 },
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        version: { type: 'integer', minimum: 1 },
        tables: {
          // Open — user-defined table shapes, each table has arbitrary column defs
          type: 'object',
        },
        migrations: { type: 'array' },
        views: {
          // Open — user-defined view shapes
          type: 'object',
        },
      },
    },
    state: {
      // Open — arbitrary nested state tree keyed by user-defined paths
      type: 'object',
    },
    elements: {
      type: 'object',
      minProperties: 1,
      additionalProperties: {
        type: 'object',
        required: ['type'],
        additionalProperties: false,
        properties: {
          type: { type: 'string', enum: ALL_COMPONENT_TYPES },
          props: {
            // Open — component-specific props validated by per-type Zod schemas
            type: 'object',
          },
          children: { type: 'array', items: { type: 'string' } },
          visible: {
            // Open — visibility expression objects
            type: 'object',
          },
        },
      },
    },
    actions: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ACTION_TYPES },
          path: { type: 'string' },
          value: {},
          operation: { type: 'string', enum: MUTATION_OPERATIONS },
          set: { type: 'object' },
          data: { type: 'object' },
          key: { type: 'string' },
          formId: { type: 'string' },
          action: { type: 'string' },
          target: { type: 'string' },
          url: { type: 'string' },
          method: { type: 'string', enum: API_METHODS },
          body: { type: 'object' },
          message: { type: 'string' },
          duration: { type: 'number', minimum: 0 },
        },
      },
    },
    meta: {
      // Open — metadata escape hatch for title, description, version, author, generator, etc.
      type: 'object',
    },
    persistState: { type: 'boolean' },
    skipPersistState: { type: 'boolean' },
    dataAccess: {
      type: 'object',
      additionalProperties: false,
      properties: {
        enabled: { type: 'boolean' },
        readable: { type: 'array', items: { type: 'string' } },
        restricted: { type: 'array', items: { type: 'string' } },
        summaries: { type: 'boolean' },
      },
    },
  },
} as const;
