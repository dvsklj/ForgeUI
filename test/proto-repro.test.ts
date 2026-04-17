import { describe, it, expect } from 'vitest';
import { validateManifest } from '../src/validation/index.js';

describe('validateManifest __proto__ reproduction', () => {
  it('__proto__ at top level — should reject but currently accepts', () => {
    // Construct an object where __proto__ is an own property (safe from
    // actual prototype pollution since JSON.parse handles this since ~2019,
    // but the validator should still reject unknown keys).
    const input = {
      __proto__: { polluted: true },
      manifest: '0.1.0',
      id: 'test-proto',
      root: 'main',
      elements: {
        main: { type: 'Text', props: { content: 'Hello' } },
      },
    };

    const result = validateManifest(input);

    // REPORT: does the validator accept __proto__ as an additional property?
    console.log('validateManifest result:', JSON.stringify(result, null, 2));
    console.log('valid:', result.valid);
    console.log('errors:', result.errors);

    // This assertion will FAIL if the schema has additionalProperties: true
    // at the top level — because Ajv won't reject __proto__ as an unknown key.
    // The schema in manifest-schema.ts line 12 has additionalProperties: true.
    expect(result.valid).toBe(false);
  });

  it('constructor at top level — should reject but currently accepts', () => {
    const input = {
      constructor: { prototype: { polluted: true } },
      manifest: '0.1.0',
      id: 'test-ctor',
      root: 'main',
      elements: {
        main: { type: 'Text', props: { content: 'Hello' } },
      },
    };

    const result = validateManifest(input);
    console.log('constructor result:', result.valid, result.errors);
    expect(result.valid).toBe(false);
  });

  it('unknown arbitrary key at top level — should reject', () => {
    const input = {
      bogusTopKey: 'should be rejected',
      manifest: '0.1.0',
      id: 'test-bogus',
      root: 'main',
      elements: {
        main: { type: 'Text', props: { content: 'Hello' } },
      },
    };

    const result = validateManifest(input);
    expect(result.valid).toBe(false);
  });

  // ─── Deeper-nested prototype pollution tests ───

  it('__proto__ inside element props — rejected by Zod layer, not AJV', () => {
    // props is intentionally open in the AJV schema (validated by per-type Zod schemas).
    // __proto__ in props passes AJV but would be caught by Zod validation.
    const input = JSON.parse(JSON.stringify({
      manifest: '0.1.0',
      id: 'test-proto-props',
      root: 'x',
      elements: {
        x: {
          type: 'Text',
          props: { content: 'hi' },
        },
      },
    }));
    const protoProps = JSON.parse('{"__proto__":{"polluted":true},"content":"hi"}');
    input.elements.x.props = protoProps;

    const result = validateManifest(input);
    // AJV schema layer: props is open, so schema validation passes.
    // Zod layer (not tested here) rejects unknown props per component type.
    console.log('__proto__ in props (AJV layer):', result.valid, result.errors);
    expect(result.valid).toBe(true);
  });

  it('__proto__ on element definition — should reject', () => {
    // JSON.parse creates __proto__ as an own property (unlike object literals)
    const input = JSON.parse(
      '{"manifest":"0.1.0","id":"test-proto-element","root":"x","elements":{"x":{"__proto__":{},"type":"Text","props":{"content":"hi"}}}}'
    );

    const result = validateManifest(input);
    console.log('__proto__ on element:', result.valid, result.errors);
    expect(result.valid).toBe(false);
  });

  it('bogus key on element definition — should reject', () => {
    const input = {
      manifest: '0.1.0',
      id: 'test-bogus-element',
      root: 'x',
      elements: {
        x: {
          bogusElementKey: 'should be rejected',
          type: 'Text',
          props: { content: 'hi' },
        },
      },
    };

    const result = validateManifest(input);
    expect(result.valid).toBe(false);
  });

  it('__proto__ inside schema — should reject', () => {
    const input = {
      manifest: '0.1.0',
      id: 'test-proto-schema',
      root: 'x',
      schema: {
        version: 1,
        __proto__: { polluted: true },
      },
      elements: {
        x: { type: 'Text', props: { content: 'hi' } },
      },
    };

    const result = validateManifest(input);
    expect(result.valid).toBe(false);
  });

  it('__proto__ inside dataAccess — should reject', () => {
    const input = {
      manifest: '0.1.0',
      id: 'test-proto-data-access',
      root: 'x',
      dataAccess: {
        enabled: true,
        __proto__: { polluted: true },
      },
      elements: {
        x: { type: 'Text', props: { content: 'hi' } },
      },
    };

    const result = validateManifest(input);
    expect(result.valid).toBe(false);
  });

  it('bogus key inside dataAccess — should reject', () => {
    const input = {
      manifest: '0.1.0',
      id: 'test-bogus-data-access',
      root: 'x',
      dataAccess: {
        enabled: true,
        bogusField: 'nope',
      },
      elements: {
        x: { type: 'Text', props: { content: 'hi' } },
      },
    };

    const result = validateManifest(input);
    expect(result.valid).toBe(false);
  });
});
