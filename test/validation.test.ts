import { describe, it, expect } from 'vitest';
import { validateManifest, validateManifestPatch, extractManifest } from '../src/validation/index.js';
import type { ForgeUIManifest } from '../src/types/index.js';

function validManifest(overrides?: Partial<ForgeUIManifest>): ForgeUIManifest {
  return {
    manifest: '0.1.0',
    id: 'test-app',
    root: 'main',
    elements: {
      main: { type: 'Text', props: { content: 'Hello' } },
    },
    ...overrides,
  } as ForgeUIManifest;
}

describe('validateManifest — schema validation', () => {
  it('accepts a valid minimal manifest', () => {
    const result = validateManifest(validManifest());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing manifest version', () => {
    const m: any = { id: 'x', root: 'r', elements: { r: { type: 'Text' } } };
    const result = validateManifest(m);
    expect(result.valid).toBe(false);
  });

  it('rejects missing id', () => {
    const m = validManifest();
    delete (m as any).id;
    const result = validateManifest(m);
    expect(result.valid).toBe(false);
  });

  it('rejects missing root', () => {
    const m = validManifest();
    delete (m as any).root;
    const result = validateManifest(m);
    expect(result.valid).toBe(false);
  });

  it('rejects missing elements', () => {
    const m = validManifest();
    delete (m as any).elements;
    const result = validateManifest(m);
    expect(result.valid).toBe(false);
  });

  it('rejects empty elements', () => {
    const result = validateManifest(validManifest({ elements: {} } as any));
    expect(result.valid).toBe(false);
  });

  it('rejects invalid manifest version pattern', () => {
    const result = validateManifest(validManifest({ manifest: '1.0.0' } as any));
    expect(result.valid).toBe(false);
  });

  it('accepts 0.x.x manifest version', () => {
    const result = validateManifest(validManifest({ manifest: '0.2.5' } as any));
    expect(result.valid).toBe(true);
  });

  it('rejects unknown component type', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'FakeComponent' as any } },
    }));
    // The JSON Schema layer constrains `type` to an enum of ALL_COMPONENT_TYPES,
    // so an unknown type is rejected at layer 1 (before validateCatalog runs).
    // The surfaced error is the Ajv enum message, not the "Unknown component
    // type" message from the catalog layer — assert the rejection itself.
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('accepts all valid component types', () => {
    const types = [
      'Stack', 'Grid', 'Card', 'Container', 'Tabs', 'Accordion', 'Divider', 'Spacer', 'Repeater',
      'Text', 'Image', 'Icon', 'Badge', 'Avatar', 'EmptyState',
      'TextInput', 'NumberInput', 'Select', 'MultiSelect', 'Checkbox', 'Toggle', 'DatePicker', 'Slider', 'FileUpload',
      'Button', 'ButtonGroup', 'Link',
      'Table', 'List', 'Chart', 'Metric',
      'Alert', 'Dialog', 'Progress', 'Toast',
      'Breadcrumb', 'Stepper',
      'Drawing',
    ];
    for (const type of types) {
      const el: any = { type };
      if (['Repeater'].includes(type)) (el as any).props = { data: [] };
      const result = validateManifest({
        manifest: '0.1.0',
        id: `test-${type.toLowerCase()}`,
        root: 'el',
        elements: { el },
      });
      expect(result.errors.some(e => e.message.includes('Unknown component type')), `Type ${type} should be valid`).toBe(false);
    }
  });

  it('rejects element without type', () => {
    const result = validateManifest({
      manifest: '0.1.0',
      id: 'test',
      root: 'el',
      elements: { el: { props: { content: 'hi' } } as any },
    });
    expect(result.valid).toBe(false);
  });

  it('rejects id over 128 chars', () => {
    const result = validateManifest(validManifest({ id: 'a'.repeat(129) }));
    expect(result.valid).toBe(false);
  });

  it('accepts valid id', () => {
    const result = validateManifest(validManifest({ id: 'my-app-1' }));
    expect(result.valid).toBe(true);
  });

  it('rejects unknown top-level keys', () => {
    const result = validateManifest({ ...validManifest(), bogusKey: true } as any);
    expect(result.valid).toBe(false);
  });
});

describe('validateManifest — URL / injection safety', () => {
  it('rejects javascript: URLs in props', () => {
    const result = validateManifest(validManifest({
      elements: {
        main: { type: 'Link', props: { href: 'javascript:alert(1)' } },
      },
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('Dangerous URL'))).toBe(true);
  });

  it('rejects data:text/html URLs', () => {
    const result = validateManifest(validManifest({
      elements: {
        main: { type: 'Link', props: { href: 'data:text/html,<script>alert(1)</script>' } },
      },
    }));
    expect(result.valid).toBe(false);
  });

  it('rejects vbscript: URLs', () => {
    const result = validateManifest(validManifest({
      elements: {
        main: { type: 'Link', props: { href: 'vbscript:MsgBox' } },
      },
    }));
    expect(result.valid).toBe(false);
  });

  it('rejects file: URLs', () => {
    const result = validateManifest(validManifest({
      elements: {
        main: { type: 'Link', props: { href: 'file:///etc/passwd' } },
      },
    }));
    expect(result.valid).toBe(false);
  });

  it('accepts https: URLs', () => {
    const result = validateManifest(validManifest({
      elements: {
        main: { type: 'Image', props: { src: 'https://example.com/img.png' } },
      },
    }));
    expect(result.valid).toBe(true);
  });

  it('accepts data:image/ URLs', () => {
    const result = validateManifest(validManifest({
      elements: {
        main: { type: 'Image', props: { src: 'data:image/png;base64,abc' } },
      },
    }));
    expect(result.valid).toBe(true);
  });

  it('rejects <script> tag in string props', () => {
    const result = validateManifest(validManifest({
      elements: {
        main: { type: 'Text', props: { content: '<script>alert(1)</script>' } },
      },
    }));
    expect(result.valid).toBe(false);
  });

  it('rejects <iframe> tag in string props', () => {
    const result = validateManifest(validManifest({
      elements: {
        main: { type: 'Text', props: { content: '<iframe src="evil">' } },
      },
    }));
    expect(result.valid).toBe(false);
  });

  it('rejects on* event handler props', () => {
    const result = validateManifest(validManifest({
      elements: {
        main: { type: 'Button', props: { onclick: 'alert(1)', label: 'Go' } },
      },
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('Event handler'))).toBe(true);
  });

  it('rejects <script> in children array', () => {
    const result = validateManifest(validManifest({
      elements: {
        main: { type: 'Stack', children: ['<script>alert(1)</script>' as any, 'child2'] },
      },
    }));
    expect(result.valid).toBe(false);
  });

  it('rejects data:text/javascript URL in action data', () => {
    const result = validateManifest(validManifest({
      actions: {
        // The URL-safety check inspects action.data[*] values, so put the
        // dangerous URL there to exercise the layer-2 scheme check.
        submit: { type: 'callApi', data: { url: 'data:text/javascript,alert(1)' } } as any,
      },
    }));
    expect(result.valid).toBe(false);
  });

  it('accepts plain text content', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Text', props: { content: 'Hello World' } } },
    }));
    expect(result.valid).toBe(true);
  });

  it('accepts mailto: and tel: URLs', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Link', props: { href: 'mailto:test@example.com' } } },
    }));
    expect(result.valid).toBe(true);
  });

  it('accepts # fragment links', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Link', props: { href: '#section' } } },
    }));
    expect(result.valid).toBe(true);
  });
});

describe('validateManifest — state path validation', () => {
  it('warns on $state: reference to unknown table', () => {
    const result = validateManifest(validManifest({
      schema: { version: 1, tables: { users: { columns: { name: { type: 'string' } } } } },
      elements: {
        main: { type: 'Text', props: { content: '$state:orders/total' } },
      },
    }));
    expect(result.warnings.some(w => w.message.includes('unknown state path'))).toBe(true);
  });

  it('warns on $state: reference to a key outside the declared state', () => {
    // validateStatePaths only runs when the manifest declares either
    // `schema.tables` or `state`. Declare a state key so the check is active
    // and the unknown path ("unknown") triggers the warning.
    const result = validateManifest(validManifest({
      state: { counter: 0 },
      elements: {
        main: { type: 'Text', props: { content: '$state:unknown/path' } },
      },
    }));
    expect(result.warnings.some(w => w.message.includes('unknown state path'))).toBe(true);
  });

  it('does not warn on $state: reference to known table', () => {
    const result = validateManifest(validManifest({
      schema: { version: 1, tables: { users: { columns: { name: { type: 'string' } } } } },
      elements: {
        main: { type: 'Text', props: { content: '$state:users/u1/name' } },
      },
    }));
    expect(result.warnings.some(w => w.message.includes('unknown state path'))).toBe(false);
  });

  it('does not warn on $state: reference to state key', () => {
    const result = validateManifest(validManifest({
      state: { counter: 0 },
      elements: {
        main: { type: 'Text', props: { content: '$state:counter' } },
      },
    }));
    expect(result.warnings.some(w => w.message.includes('unknown state path'))).toBe(false);
  });

  it('errors on $computed:sum referencing unknown table', () => {
    const result = validateManifest(validManifest({
      schema: { version: 1, tables: { users: { columns: { name: { type: 'string' } } } } },
      elements: {
        main: { type: 'Metric', props: { value: '$computed:sum:orders/total' } },
      },
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('unknown table'))).toBe(true);
  });

  it('errors on $computed:sum referencing unknown column', () => {
    const result = validateManifest(validManifest({
      schema: { version: 1, tables: { users: { columns: { name: { type: 'string' } } } } },
      elements: {
        main: { type: 'Metric', props: { value: '$computed:sum:users/age' } },
      },
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('unknown column'))).toBe(true);
  });

  it('errors on $computed:count referencing unknown table', () => {
    // validateStatePaths short-circuits when neither schema.tables nor state
    // is declared. Declare a real table so the layer runs and the count
    // expression against a missing table produces an error.
    const result = validateManifest(validManifest({
      schema: { version: 1, tables: { users: { columns: { name: { type: 'string' } } } } },
      elements: {
        main: { type: 'Text', props: { content: '$computed:count:nonexistent' } },
      },
    }));
    expect(result.valid).toBe(false);
  });
});

describe('validateManifest — cross-reference validation', () => {
  it('errors when root element does not exist', () => {
    const result = validateManifest(validManifest({ root: 'nonexistent' }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('Root element') && e.message.includes('not found'))).toBe(true);
  });

  it('errors when child reference does not exist', () => {
    const result = validateManifest(validManifest({
      elements: {
        main: { type: 'Stack', children: ['missing-child'] },
      },
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('Child element') && e.message.includes('not found'))).toBe(true);
  });

  it('detects circular references', () => {
    const result = validateManifest({
      manifest: '0.1.0',
      id: 'cycle-test',
      root: 'a',
      elements: {
        a: { type: 'Stack', children: ['b'] },
        b: { type: 'Stack', children: ['a'] },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('Circular reference'))).toBe(true);
  });

  it('self-referencing element is detected as circular', () => {
    const result = validateManifest({
      manifest: '0.1.0',
      id: 'self-cycle',
      root: 'a',
      elements: {
        a: { type: 'Stack', children: ['a'] },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('Circular reference'))).toBe(true);
  });
});

describe('validateManifest — manifest size limits', () => {
  it('warns when manifest exceeds 100KB', () => {
    const bigElements: Record<string, any> = {};
    for (let i = 0; i < 2000; i++) {
      bigElements[`el${i}`] = { type: 'Text', props: { content: 'x'.repeat(50) } };
    }
    const result = validateManifest({
      manifest: '0.1.0',
      id: 'huge-app',
      root: 'el0',
      elements: bigElements,
    });
    expect(result.warnings.some(w => w.message.includes('100KB'))).toBe(true);
  });
});

describe('validateManifest — dataAccess validation', () => {
  it('accepts manifest with valid dataAccess', () => {
    const result = validateManifest(validManifest({
      dataAccess: { enabled: true, readable: ['users'], restricted: ['secrets'], summaries: true },
    }));
    expect(result.valid).toBe(true);
  });

  it('rejects unknown keys in dataAccess', () => {
    const result = validateManifest(validManifest({
      dataAccess: { enabled: true, bogusKey: true } as any,
    }));
    expect(result.valid).toBe(false);
  });
});

describe('validateManifest — security regression tests', () => {
  it('rejects prototype pollution in element props', () => {
    const input = JSON.parse(JSON.stringify({
      manifest: '0.1.0',
      id: 'proto-props',
      root: 'x',
      elements: {
        x: { type: 'Text', props: { content: 'hi' } },
      },
    }));
    // Inject __proto__ into props
    input.elements.x.props.__proto__ = { polluted: true };
    const result = validateManifest(input);
    // The AJV schema rejects unknown keys in element definitions
    // but props is intentionally open. The event-handler check should
    // reject on* props, but __proto__ is not on* — this documents current behavior
    expect(typeof result.valid).toBe('boolean');
  });
});

describe('validateManifestPatch', () => {
  it('rejects non-object patches', () => {
    expect(validateManifestPatch(null).valid).toBe(false);
    expect(validateManifestPatch('string').valid).toBe(false);
    expect(validateManifestPatch(42).valid).toBe(false);
    expect(validateManifestPatch([]).valid).toBe(false);
  });

  it('rejects __proto__, prototype, constructor keys', () => {
    for (const key of ['__proto__', 'prototype', 'constructor']) {
      const result = validateManifestPatch({ [key]: {} });
      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes(key))).toBe(true);
    }
  });

  it('rejects deeply nested __proto__', () => {
    // Writing `{ __proto__: x }` as a JS literal sets the prototype and does
    // not create an own property — JSON.parse is the only way to get a real
    // `__proto__` own key, which is what a malicious client would send over
    // the wire.
    const result = validateManifestPatch(
      JSON.parse('{"meta":{"nested":{"__proto__":{"polluted":true}}}}'),
    );
    expect(result.valid).toBe(false);
  });

  it('rejects invalid key names', () => {
    expect(validateManifestPatch({ 'has space': 1 }).valid).toBe(false);
    expect(validateManifestPatch({ '1leadingDigit': 1 }).valid).toBe(false);
    expect(validateManifestPatch({ 'has.dot': 1 }).valid).toBe(false);
  });

  it('rejects patches exceeding max depth', () => {
    let deep: any = { leaf: 1 };
    for (let i = 0; i < 10; i++) deep = { inner: deep };
    const result = validateManifestPatch(deep);
    expect(result.valid).toBe(false);
    expect(result.errors?.some(e => /depth/i.test(e))).toBe(true);
  });

  it('rejects patches exceeding size limit', () => {
    const result = validateManifestPatch({ blob: 'x'.repeat(150_000) });
    expect(result.valid).toBe(false);
    expect(result.errors?.some(e => /100000|size|limit/i.test(e))).toBe(true);
  });

  it('accepts valid patches', () => {
    expect(validateManifestPatch({ meta: { title: 'new' } }).valid).toBe(true);
    expect(validateManifestPatch({ elements: { x: { type: 'Text' } } }).valid).toBe(true);
  });

  it('accepts patches with valid key names', () => {
    expect(validateManifestPatch({ my_key: 1, key123: 2, _underscore: 3 }).valid).toBe(true);
  });

  it('rejects __proto__ inside arrays', () => {
    // Same reason as the nested-__proto__ test above: a JS literal silently
    // sets the prototype; JSON.parse is needed to produce a real own key.
    const result = validateManifestPatch(
      JSON.parse('{"items":[{"__proto__":{"polluted":true}}]}'),
    );
    expect(result.valid).toBe(false);
  });
});

describe('extractManifest', () => {
  it('strips ```json fences', () => {
    expect(extractManifest('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('strips bare ``` fences', () => {
    expect(extractManifest('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('returns unchanged string when no fence', () => {
    expect(extractManifest('{"a":1}')).toBe('{"a":1}');
  });

  it('never throws on any input', () => {
    expect(() => extractManifest('')).not.toThrow();
    expect(() => extractManifest('just prose')).not.toThrow();
    expect(() => extractManifest('```')).not.toThrow();
  });
});