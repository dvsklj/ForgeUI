import { describe, it, expect } from 'vitest';
import { validateManifest } from '../src/validation/index.js';
import type { ForgeManifest } from '../src/types/index.js';
import { createStore } from 'tinybase';
import { resolveRef, createForgeStore } from '../src/state/index.js';

function validManifest(overrides?: Partial<ForgeManifest>): ForgeManifest {
  return {
    manifest: '0.1.0',
    id: 'sec-test',
    root: 'main',
    elements: { main: { type: 'Text', props: { content: 'Hello' } } },
    ...overrides,
  } as ForgeManifest;
}

describe('Security — Injection vectors', () => {
  it('rejects <script> tags in string content', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Text', props: { content: '<script>alert(1)</script>' } } },
    }));
    expect(result.valid).toBe(false);
  });

  it('rejects <iframe> tags in string content', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Text', props: { content: '<iframe src="evil">' } } },
    }));
    expect(result.valid).toBe(false);
  });

  it('rejects <object> tags in string content', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Text', props: { content: '<object data="x">' } } },
    }));
    expect(result.valid).toBe(false);
  });

  it('rejects <embed> tags in string content', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Text', props: { content: '<embed src="x">' } } },
    }));
    expect(result.valid).toBe(false);
  });

  it('rejects expression() in string content', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Text', props: { content: 'expression(alert(1))' } } },
    }));
    expect(result.valid).toBe(false);
  });

  it('rejects javascript: in URL props (case insensitive)', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Link', props: { href: 'JaVaScRiPt:alert(1)' } } },
    }));
    expect(result.valid).toBe(false);
  });

  it('rejects data:text/html URLs', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Image', props: { src: 'data:text/html,<h1>evil</h1>' } } },
    }));
    expect(result.valid).toBe(false);
  });

  it('rejects data:text/javascript URLs', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Link', props: { href: 'data:text/javascript,alert(1)' } } },
    }));
    expect(result.valid).toBe(false);
  });

  it('accepts https: URLs as safe', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Image', props: { src: 'https://example.com/img.png' } } },
    }));
    expect(result.valid).toBe(true);
  });

  it('accepts http: URLs as safe', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Link', props: { href: 'http://example.com' } } },
    }));
    expect(result.valid).toBe(true);
  });

  it('accepts data:image/ URLs as safe', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Image', props: { src: 'data:image/png;base64,abc123' } } },
    }));
    expect(result.valid).toBe(true);
  });

  it('rejects on* event handler props', () => {
    for (const handler of ['onclick', 'onload', 'onerror', 'onmouseover']) {
      const result = validateManifest(validManifest({
        elements: { main: { type: 'Button', props: { [handler]: 'alert(1)', label: 'Go' } } },
      }));
      expect(result.valid).toBe(false);
    }
  });

  it('rejects injection patterns in children array', () => {
    const result = validateManifest(validManifest({
      elements: {
        main: { type: 'Stack', children: ['<script>alert(1)</script>' as any] },
      },
    }));
    expect(result.valid).toBe(false);
  });
});

describe('Security — State path safety', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.setValue('secret', 'classified');
  });

  it('blocks $state:__proto__', () => {
    expect(resolveRef(store, '$state:__proto__')).toBeUndefined();
  });

  it('blocks $state:constructor', () => {
    expect(resolveRef(store, '$state:constructor')).toBeUndefined();
  });

  it('blocks $state:prototype', () => {
    expect(resolveRef(store, '$state:prototype')).toBeUndefined();
  });

  it('blocks $item:__proto__', () => {
    const { setItemContext } = require('../src/state/index.js');
    setItemContext({ name: 'test' });
    expect(resolveRef(store, '$item:__proto__')).toBeUndefined();
    setItemContext(null);
  });

  it('blocks $expr:item.__proto__', () => {
    const { setItemContext } = require('../src/state/index.js');
    setItemContext({ name: 'test' });
    expect(resolveRef(store, '$expr:item.__proto__')).toBeUndefined();
    setItemContext(null);
  });

  it('limits $expr expression length to 1024 chars', () => {
    expect(resolveRef(store, '$expr:' + 'x'.repeat(1025))).toBeUndefined();
  });

  it('limits $computed expression length to 1024 chars', () => {
    expect(resolveRef(store, '$computed:' + 'x'.repeat(1025))).toBeUndefined();
  });

  it('limits $state path length to 256 chars', () => {
    expect(resolveRef(store, '$state:' + 'a'.repeat(257))).toBeUndefined();
  });

  it('limits $item path length to 256 chars', () => {
    const { setItemContext } = require('../src/state/index.js');
    setItemContext({ name: 'test' });
    expect(resolveRef(store, '$item:' + 'a'.repeat(257))).toBeUndefined();
    setItemContext(null);
  });

  it('limits template interpolation to 4096 chars', () => {
    const long = 'a'.repeat(4097);
    expect(resolveRef(store, long)).toBe(long);
  });

  it('limits deep path traversal in $item to 32 levels', () => {
    const { setItemContext } = require('../src/state/index.js');
    setItemContext({ name: 'test' });
    const deepPath = Array(33).fill('a').join('.');
    expect(resolveRef(store, `$item:${deepPath}`)).toBeUndefined();
    setItemContext(null);
  });
});

describe('Security — Manifest size limits', () => {
  it('warns when manifest exceeds 100KB', () => {
    const elements: Record<string, any> = {};
    for (let i = 0; i < 2000; i++) {
      elements[`el${i}`] = { type: 'Text', props: { content: 'x'.repeat(50) } };
    }
    const result = validateManifest({
      manifest: '0.1.0',
      id: 'huge',
      root: 'el0',
      elements,
    });
    expect(result.warnings.some(w => w.message.includes('100KB'))).toBe(true);
  });
});

describe('Security — URL allowlist enforcement', () => {
  it('warns on data: URLs not in allowlist', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Link', props: { href: 'data:application/octet-stream,abc' } } },
    }));
    expect(result.warnings.some(w => w.message.includes('Data URL'))).toBe(true);
  });

  it('does not flag plain text content as URL', () => {
    const result = validateManifest(validManifest({
      elements: { main: { type: 'Text', props: { content: 'Hello World' } } },
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

describe('Security — Cross-reference safety', () => {
  it('rejects circular element references', () => {
    const result = validateManifest({
      manifest: '0.1.0',
      id: 'cycle',
      root: 'a',
      elements: {
        a: { type: 'Stack', children: ['b'] },
        b: { type: 'Stack', children: ['c'] },
        c: { type: 'Stack', children: ['a'] },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('Circular'))).toBe(true);
  });

  it('rejects self-referencing element', () => {
    const result = validateManifest({
      manifest: '0.1.0',
      id: 'self-cycle',
      root: 'a',
      elements: { a: { type: 'Stack', children: ['a'] } },
    });
    expect(result.valid).toBe(false);
  });

  it('rejects missing root element', () => {
    const result = validateManifest({
      manifest: '0.1.0',
      id: 'missing-root',
      root: 'nonexistent',
      elements: { a: { type: 'Text' } },
    });
    expect(result.valid).toBe(false);
  });

  it('rejects missing child reference', () => {
    const result = validateManifest({
      manifest: '0.1.0',
      id: 'missing-child',
      root: 'a',
      elements: { a: { type: 'Stack', children: ['nonexistent'] } },
    });
    expect(result.valid).toBe(false);
  });
});

describe('Security — Manifest validation deep checks', () => {
  it('rejects additional top-level properties', () => {
    const result = validateManifest({
      ...validManifest(),
      sqlInjection: 'DROP TABLES',
    });
    expect(result.valid).toBe(false);
  });

  it('accepts valid dataAccess configuration', () => {
    const result = validateManifest(validManifest({
      dataAccess: { enabled: false, readable: ['users'], restricted: ['secrets'], summaries: false },
    }));
    expect(result.valid).toBe(true);
  });

  it('rejects extra keys in dataAccess', () => {
    const result = validateManifest(validManifest({
      dataAccess: { enabled: false, malicious: true } as any,
    }));
    expect(result.valid).toBe(false);
  });

  it('accepts valid schema configuration', () => {
    const result = validateManifest(validManifest({
      schema: {
        version: 1,
        tables: {
          users: { columns: { name: { type: 'string' }, age: { type: 'number' } } },
        },
      },
    }));
    expect(result.valid).toBe(true);
  });

  it('accepts valid state configuration', () => {
    const result = validateManifest(validManifest({
      state: { counter: 0, name: 'test' },
    }));
    expect(result.valid).toBe(true);
  });

  it('accepts valid actions', () => {
    const result = validateManifest(validManifest({
      actions: {
        increment: { type: 'mutateState', path: 'counter', operation: 'increment' },
      },
    }));
    expect(result.valid).toBe(true);
  });
});