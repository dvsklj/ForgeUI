/**
 * Forge Validation Pipeline
 * 
 * Four layers:
 * 1. JSON Schema validation (Ajv)
 * 2. URL allowlisting
 * 3. State path validation
 * 4. Component catalog enforcement
 */

import type { ErrorObject, ValidateFunction } from 'ajv';
import type { ComponentType, ForgeUIManifest } from '../types/index.js';
import { isValidComponentType } from '../catalog/registry.js';
import { COMPONENT_PROP_ALLOWLIST } from './component-props.js';
import _validate from './manifest-validator.generated.js';

const validate = _validate as ValidateFunction;

/** Dangerous URL schemes that must be rejected */
const DANGEROUS_SCHEMES = ['javascript:', 'data:text/html', 'data:text/javascript', 'data:application/javascript', 'vbscript:', 'file:'];

const IMAGE_URLS = ['https:', 'http:', 'data:image/', 'blob:'];
const LINK_URLS = ['https:', 'http:', 'mailto:', 'tel:', '#'];
const API_URLS = ['https:', 'http:'];

/** Event handler patterns that must be stripped */
const EVENT_HANDLER_RE = /^on[a-z]+$/i;

/** Dangerous text patterns that might indicate injection attempts */
const INJECTION_PATTERNS = [
  /<\s*script/i,
  /<\s*iframe/i,
  /<\s*object/i,
  /<\s*embed/i,
  /javascript\s*:/i,
  /data\s*:\s*text\/html/i,
  /expression\s*\(/i,
  /url\s*\(\s*javascript/i,
];

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validate a Forge manifest through all four layers.
 * Reject — never repair — invalid manifests.
 */
export function validateManifest(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  
  // ─── Layer 1: JSON Schema validation ───
  const schemaValid = validate(data);
  
  if (!schemaValid && validate.errors) {
    for (const err of validate.errors as ErrorObject[]) {
      errors.push({
        path: err.instancePath || '/',
        message: err.message || 'Schema validation error',
        severity: 'error',
      });
    }
    // If schema validation fails, don't bother with deeper checks
    return { valid: false, errors, warnings: [] };
  }
  
  const manifest = data as ForgeUIManifest;
  
  // ─── Layer 2: URL and value sanitization ───
  validateUrls(manifest, errors);
  
  // ─── Layer 3: State path validation ───
  validateStatePaths(manifest, errors);
  
  // ─── Layer 4: Component catalog enforcement ───
  validateCatalog(manifest, errors);

  // ─── Layer 5: Per-component prop validation ───
  validateComponentProps(manifest, errors);
  
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
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity !== 'error'),
  };
}

/** Check all URL values for dangerous schemes and allowlist enforcement */
function validateUrls(manifest: ForgeUIManifest, errors: ValidationError[]) {
  for (const [id, element] of Object.entries(manifest.elements)) {
    if (!element.props) continue;
    for (const [key, value] of Object.entries(element.props)) {
      if (typeof value !== 'string') continue;

      // Check for injection patterns in any string prop
      for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(value)) {
          errors.push({
            path: `/elements/${id}/props/${key}`,
            message: `Potentially dangerous content detected (matches ${pattern.source})`,
            severity: 'error',
          });
        }
      }

      validateUrlValue(value, `/elements/${id}/props/${key}`, errors, urlPolicy(element.type, key));

      // Event handler property names
      if (EVENT_HANDLER_RE.test(key)) {
        errors.push({
          path: `/elements/${id}/props/${key}`,
          message: `Event handler property not allowed: ${key}`,
          severity: 'error',
        });
      }
    }
    if (element.type === 'Breadcrumb' && Array.isArray(element.props.items)) {
      element.props.items.forEach((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return;
        validateUrlValue(
          (item as Record<string, unknown>).href,
          `/elements/${id}/props/items/${index}/href`,
          errors,
          LINK_URLS,
        );
      });
    }

    // Check children array for injected content
    if (element.children) {
      for (const child of element.children) {
        if (typeof child === 'string') {
          for (const pattern of INJECTION_PATTERNS) {
            if (pattern.test(child)) {
              errors.push({
                path: `/elements/${id}/children`,
                message: `Potentially dangerous content in children: ${pattern.source}`,
                severity: 'error',
              });
            }
          }
        }
      }
    }
  }

  // Also check action definitions for URL safety
  if (manifest.actions) {
    for (const [actionId, action] of Object.entries(manifest.actions)) {
      validateUrlValue(action.url, `/actions/${actionId}/url`, errors, action.type === 'callApi' ? API_URLS : undefined);
    }
  }
}

function urlPolicy(type: ComponentType, prop: string): readonly string[] | undefined {
  if (prop === 'src' && (type === 'Image' || type === 'Avatar')) return IMAGE_URLS;
  if (prop === 'href' && type === 'Link') return LINK_URLS;
}

function validateUrlValue(value: unknown, path: string, errors: ValidationError[], allowedSchemes?: readonly string[]) {
  if (typeof value !== 'string' || !looksLikeUrl(value)) return;
  const lower = value.toLowerCase().trim();

  for (const scheme of DANGEROUS_SCHEMES) {
    if (lower.startsWith(scheme)) {
      errors.push({
        path,
        message: `Dangerous URL scheme rejected: ${scheme}`,
        severity: 'error',
      });
      return;
    }
  }

  if (allowedSchemes && !allowedSchemes.some(s => lower.startsWith(s))) {
    errors.push({
      path,
      message: 'URL not allowed',
      severity: 'error',
    });
  }
}

/** Check if a string looks like a URL */
function looksLikeUrl(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(value);
}

/** Validate $state and $computed references against schema */
function validateStatePaths(manifest: ForgeUIManifest, errors: ValidationError[]) {
  const tables = manifest.schema?.tables ? Object.keys(manifest.schema.tables) : [];
  // Collect known state value keys for $state: path validation (P2-7)
  const stateKeys = new Set<string>();
  if (manifest.state) {
    for (const key of Object.keys(manifest.state)) stateKeys.add(key);
  }
  // Nothing to validate against
  if (tables.length === 0 && stateKeys.size === 0) return;
  
  for (const [id, element] of Object.entries(manifest.elements)) {
    if (!element.props) continue;
    for (const [key, value] of Object.entries(element.props)) {
      // $state:<path> validation — warn-level
      if (typeof value === 'string' && value.startsWith('$state:')) {
        const path = value.slice(7);
        const root = path.split('/')[0].split('.')[0];
        if (root && !stateKeys.has(root) && !tables.includes(root)) {
          errors.push({
            path: `/elements/${id}/props/${key}`,
            message: `$state:${path} references unknown state path`,
            severity: 'warning',
          });
        }
      }
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
          } else if (column && manifest.schema?.tables[table]) {
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
function validateCatalog(manifest: ForgeUIManifest, errors: ValidationError[]) {
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
function validateReferences(manifest: ForgeUIManifest, errors: ValidationError[]) {
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

const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const KEY_RE = /^[a-zA-Z_][a-zA-Z0-9_\-]*$/;
const MAX_PATCH_DEPTH = 8;
const MAX_PATCH_SIZE = 100_000;

/**
 * Validate a JSON Merge Patch envelope before it is merged into the stored manifest.
 * This is NOT a full manifest schema check — it guards the patch shape only.
 */
export function validateManifestPatch(patch: unknown): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    return { valid: false, errors: ['Patch must be a plain object'] };
  }

  try {
    if (JSON.stringify(patch).length > MAX_PATCH_SIZE) {
      return { valid: false, errors: [`Patch exceeds ${MAX_PATCH_SIZE} byte limit`] };
    }
  } catch {
    return { valid: false, errors: ['Patch is not serializable'] };
  }

  function walk(node: unknown, depth: number, path: string): void {
    if (depth > MAX_PATCH_DEPTH) {
      errors.push(`Patch nesting exceeds max depth of ${MAX_PATCH_DEPTH} at ${path || '/'}`);
      return;
    }

    if (node === null || typeof node !== 'object') return;

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        walk(node[i], depth + 1, `${path}[${i}]`);
      }
      return;
    }

    for (const key of Object.keys(node)) {
      if (FORBIDDEN_KEYS.has(key)) {
        errors.push(`Forbidden key "${key}" at ${path || '/'}`);
        continue;
      }
      if (!KEY_RE.test(key)) {
        errors.push(`Invalid key "${key}" at ${path || '/'}`);
        continue;
      }
      walk((node as Record<string, unknown>)[key], depth + 1, `${path}/${key}`);
    }
  }

  walk(patch, 0, '');

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

/** Detect cycles in the element tree */
function detectCycles(manifest: ForgeUIManifest, errors: ValidationError[]) {
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

/**
 * Strip Markdown code fences from LLM output.
 *
 * LLMs routinely wrap JSON in ```json ... ``` fences.
 * This helper returns the unfenced string so callers can
 * pipe directly into JSON.parse → validateManifest.
 *
 * Never throws. Returns input unchanged if no fence is found.
 */
export function extractManifest(rawText: string): string {
  const trimmed = rawText.trim();

  // Match ```json\n...\n``` or ```\n...\n```
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenced) return fenced[1].trim();

  return trimmed;
}
function validateComponentProps(manifest: ForgeUIManifest, errors: ValidationError[]) {
  for (const [id, element] of Object.entries(manifest.elements)) {
    if (!element.props) continue;
    const allowed = COMPONENT_PROP_ALLOWLIST[element.type];
    if (!allowed) continue;

    for (const key of Object.keys(element.props)) {
      if (!allowed.has(key)) {
        errors.push({
          path: `/elements/${id}/props/${key}`,
          message: `Unknown prop "${key}" for component type ${element.type}`,
          severity: 'error',
        });
      }
    }
  }
}
