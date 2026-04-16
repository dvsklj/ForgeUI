import { describe, it, expect } from 'vitest';
import { validateManifestPatch } from '../src/validation/index.js';

function objWithForbiddenKey(key: string, value: unknown): Record<string, unknown> {
  return JSON.parse(`{"${key}": ${JSON.stringify(value)}}`);
}

describe('validateManifestPatch — envelope-level defenses', () => {
  it('rejects non-object patches', () => {
    expect(validateManifestPatch(null).valid).toBe(false);
    expect(validateManifestPatch('string').valid).toBe(false);
    expect(validateManifestPatch(42).valid).toBe(false);
    expect(validateManifestPatch([]).valid).toBe(false);
  });

  it('rejects forbidden keys at top level (__proto__, prototype, constructor)', () => {
    for (const key of ['__proto__', 'prototype', 'constructor']) {
      const r = validateManifestPatch({ [key]: { polluted: true } });
      expect(r.valid).toBe(false);
      expect(r.errors?.some((e) => e.includes(key))).toBe(true);
    }
  });

  it('rejects forbidden keys nested deeply', () => {
    const protoNode = objWithForbiddenKey('__proto__', { polluted: true });
    const patch = { meta: { nested: protoNode } };
    const r = validateManifestPatch(patch);
    expect(r.valid).toBe(false);
    expect(r.errors?.some((e) => e.includes('__proto__'))).toBe(true);
  });

  it('rejects keys that do not match the identifier regex', () => {
    const r = validateManifestPatch({ 'has space': 1 });
    expect(r.valid).toBe(false);
    const r2 = validateManifestPatch({ '1leadingDigit': 1 });
    expect(r2.valid).toBe(false);
    const r3 = validateManifestPatch({ 'has.dot': 1 });
    expect(r3.valid).toBe(false);
  });

  it('rejects patches deeper than MAX_PATCH_DEPTH (8)', () => {
    let deep: any = { leaf: 1 };
    for (let i = 0; i < 10; i++) deep = { inner: deep };
    const r = validateManifestPatch(deep);
    expect(r.valid).toBe(false);
    expect(r.errors?.some((e) => /depth/i.test(e))).toBe(true);
  });

  it('rejects patches larger than MAX_PATCH_SIZE (100_000 bytes)', () => {
    const big = { blob: 'x'.repeat(150_000) };
    const r = validateManifestPatch(big);
    expect(r.valid).toBe(false);
    expect(r.errors?.some((e) => /100000|size|limit/i.test(e))).toBe(true);
  });

  it('accepts a normal patch', () => {
    const r = validateManifestPatch({ meta: { title: 'new title' } });
    expect(r.valid).toBe(true);
  });

  it('accepts a patch with nested arrays', () => {
    const r = validateManifestPatch({ ui: { children: [{ id: 'child1' }, { id: 'child2' }] } });
    expect(r.valid).toBe(true);
  });

  it('walks into arrays and rejects forbidden keys inside array elements', () => {
    const protoElem = objWithForbiddenKey('__proto__', {});
    const r = validateManifestPatch({ ui: { items: [protoElem] } });
    expect(r.valid).toBe(false);
  });
});
