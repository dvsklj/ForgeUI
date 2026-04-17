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

  it('unknown arbitrary key at top level — documents additionalProperties: true', () => {
    const input = {
      totallyBogusKey: 'should this be allowed?',
      manifest: '0.1.0',
      id: 'test-bogus',
      root: 'main',
      elements: {
        main: { type: 'Text', props: { content: 'Hello' } },
      },
    };

    const result = validateManifest(input);
    console.log('bogus key result:', result.valid, result.errors);
    // If this is valid, the top-level schema allows any extra keys.
    // That's the root cause — additionalProperties should be false.
  });
});
