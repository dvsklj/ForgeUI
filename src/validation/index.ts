/**
 * Forge Validation Pipeline
 * 
 * Four layers:
 * 1. JSON Schema validation (Ajv)
 * 2. URL allowlisting
 * 3. State path validation
 * 4. Component catalog enforcement
 */

import Ajv, { ValidateFunction } from 'ajv';
import type { ForgeManifest, ForgeElement, ComponentType } from '../types/index.js';
import { isValidComponentType, ALL_COMPONENT_TYPES } from '../catalog/registry.js';

/** Dangerous URL schemes that must be rejected */
const DANGEROUS_SCHEMES = ['javascript:', 'data:text/html', 'vbscript:', 'file:'];

/** Event handler patterns that must be stripped */
const EVENT_HANDLER_RE = /^on[a-z]+$/i;

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

/** Create the Ajv instance with strict validation */
function createAjv(): Ajv {
  return new Ajv({
    strict: true,
    allErrors: true,
    removeAdditional: false,
    useDefaults: false,
  });
}

/** Manifest JSON Schema for Ajv validation */
const MANIFEST_SCHEMA = {
  type: 'object',
  required: ['manifest', 'id', 'root', 'elements'],
  additionalProperties: false,
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
  },
};

/**
 * Validate a Forge manifest through all four layers.
 * Reject — never repair — invalid manifests.
 */
export function validateManifest(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  
  // ─── Layer 1: JSON Schema validation ───
  const ajv = createAjv();
  const validate = ajv.compile(MANIFEST_SCHEMA);
  const schemaValid = validate(data);
  
  if (!schemaValid && validate.errors) {
    for (const err of validate.errors) {
      errors.push({
        path: err.instancePath || '/',
        message: err.message || 'Schema validation error',
        severity: 'error',
      });
    }
    // If schema validation fails, don't bother with deeper checks
    return { valid: false, errors };
  }
  
  const manifest = data as ForgeManifest;
  
  // ─── Layer 2: URL and value sanitization ───
  validateUrls(manifest, errors);
  
  // ─── Layer 3: State path validation ───
  validateStatePaths(manifest, errors);
  
  // ─── Layer 4: Component catalog enforcement ───
  validateCatalog(manifest, errors);
  
  // ─── Cross-reference validation ───
  validateReferences(manifest, errors);
  
  // ─── Size limits ───
  const manifestSize = JSON.stringify(manifest).length;
  if (manifestSize > 100_000) {
    errors.push({
      path: '/',
      message: `Manifest size (${(manifestSize / 1024).toFixed(1)}KB) exceeds 100KB limit`,
      severity: 'warning',
    });
  }
  
  return {
    valid: !errors.some(e => e.severity === 'error'),
    errors,
  };
}

/** Check all URL values for dangerous schemes */
function validateUrls(manifest: ForgeManifest, errors: ValidationError[]) {
  for (const [id, element] of Object.entries(manifest.elements)) {
    if (!element.props) continue;
    for (const [key, value] of Object.entries(element.props)) {
      if (typeof value === 'string' && looksLikeUrl(value)) {
        const lower = value.toLowerCase().trim();
        for (const scheme of DANGEROUS_SCHEMES) {
          if (lower.startsWith(scheme)) {
            errors.push({
              path: `/elements/${id}/props/${key}`,
              message: `Dangerous URL scheme: ${scheme}`,
              severity: 'error',
            });
          }
        }
      }
      // Strip event handler patterns
      if (EVENT_HANDLER_RE.test(key)) {
        errors.push({
          path: `/elements/${id}/props/${key}`,
          message: `Event handler property not allowed: ${key}`,
          severity: 'error',
        });
      }
    }
  }
}

/** Check if a string looks like a URL */
function looksLikeUrl(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(value);
}

/** Validate $state and $computed references against schema */
function validateStatePaths(manifest: ForgeManifest, errors: ValidationError[]) {
  if (!manifest.schema?.tables) return;
  
  const tables = Object.keys(manifest.schema.tables);
  
  for (const [id, element] of Object.entries(manifest.elements)) {
    if (!element.props) continue;
    for (const [key, value] of Object.entries(element.props)) {
      if (typeof value === 'string' && value.startsWith('$computed:')) {
        const expr = value.slice(10);
        if (expr.startsWith('sum:') || expr.startsWith('avg:')) {
          const [_, rest] = expr.split(':');
          const [table, column] = rest.split('/');
          if (!tables.includes(table)) {
            errors.push({
              path: `/elements/${id}/props/${key}`,
              message: `$computed references unknown table: ${table}`,
              severity: 'error',
            });
          } else if (column && manifest.schema.tables[table]) {
            const columns = Object.keys(manifest.schema.tables[table].columns);
            if (!columns.includes(column)) {
              errors.push({
                path: `/elements/${id}/props/${key}`,
                message: `$computed references unknown column: ${table}/${column}`,
                severity: 'error',
              });
            }
          }
        } else if (expr.startsWith('count:')) {
          const table = expr.slice(6);
          if (!tables.includes(table)) {
            errors.push({
              path: `/elements/${id}/props/${key}`,
              message: `$computed:count references unknown table: ${table}`,
              severity: 'error',
            });
          }
        }
      }
    }
  }
}

/** Validate that all component types exist in the catalog */
function validateCatalog(manifest: ForgeManifest, errors: ValidationError[]) {
  for (const [id, element] of Object.entries(manifest.elements)) {
    if (!isValidComponentType(element.type)) {
      errors.push({
        path: `/elements/${id}/type`,
        message: `Unknown component type: ${element.type}`,
        severity: 'error',
      });
    }
  }
}

/** Validate element cross-references (root exists, children exist) */
function validateReferences(manifest: ForgeManifest, errors: ValidationError[]) {
  const elementIds = new Set(Object.keys(manifest.elements));
  
  // Root must exist
  if (!elementIds.has(manifest.root)) {
    errors.push({
      path: '/root',
      message: `Root element "${manifest.root}" not found in elements`,
      severity: 'error',
    });
  }
  
  // Children must exist
  for (const [id, element] of Object.entries(manifest.elements)) {
    if (element.children) {
      for (const childId of element.children) {
        if (!elementIds.has(childId)) {
          errors.push({
            path: `/elements/${id}/children`,
            message: `Child element "${childId}" not found in elements`,
            severity: 'error',
          });
        }
      }
    }
  }
  
  // Detect circular references
  detectCycles(manifest, errors);
}

/** Detect cycles in the element tree */
function detectCycles(manifest: ForgeManifest, errors: ValidationError[]) {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  
  function dfs(elementId: string, path: string[]): boolean {
    if (inStack.has(elementId)) {
      errors.push({
        path: `/elements/${elementId}`,
        message: `Circular reference detected: ${[...path, elementId].join(' → ')}`,
        severity: 'error',
      });
      return true;
    }
    if (visited.has(elementId)) return false;
    
    visited.add(elementId);
    inStack.add(elementId);
    
    const element = manifest.elements[elementId];
    if (element?.children) {
      for (const childId of element.children) {
        if (dfs(childId, [...path, elementId])) return true;
      }
    }
    
    inStack.delete(elementId);
    return false;
  }
  
  dfs(manifest.root, []);
}
