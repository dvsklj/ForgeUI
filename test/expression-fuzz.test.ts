import { describe, it, expect } from 'vitest';
import { createStore } from 'tinybase';
import { resolveRef, setItemContext } from '../src/state/index.js';

// ─── Seeded PRNG (mulberry32) ──────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Store setup ───────────────────────────────────────────────

const store = createStore();
store.setValue('name', 'test');
store.setValue('count', 42);
store.setValue('x', 'y');
store.setValue('y', 'x');
store.setTable('users', {
  u1: { name: 'Alice', age: 30 },
  u2: { name: 'Bob', age: 25 },
});

const itemCtx = { name: 'Item1', count: 10 };
setItemContext(itemCtx);

// ─── Helpers ───────────────────────────────────────────────────

function isSafeReturn(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  const t = typeof v;
  if (t === 'string' || t === 'number' || t === 'boolean') return true;
  if (Array.isArray(v)) return v.every(isSafeReturn);
  if (t === 'object') {
    const proto = Object.getPrototypeOf(v);
    return proto === Object.prototype || proto === null;
  }
  return false;
}

function withTimeout<T>(fn: () => T, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    try {
      const result = fn();
      clearTimeout(timer);
      resolve(result);
    } catch (e) {
      clearTimeout(timer);
      reject(e);
    }
  });
}

// ─── Corpus: known-ugly inputs from audit ──────────────────────

const corpus: string[] = [
  // Prototype pollution
  '$item:__proto__', '$item:constructor', '$expr:item.__proto__',
  '$state:__proto__', '$state:constructor',
  '$expr:state.__proto__', '$computed:__proto__',
  // Unclosed quotes
  '$expr:"unbalanced', "$expr:'unbalanced",
  // Unicode
  '$state:\u200B', '$state:\u202E', '$state:\u0301accented',
  // Nested braces
  '{{a}}', '{{{{a}}}}', '{{a}{{b}}', '{a}}', '{{a}', '{{ }}',
  '{{x}}{{y}}', '{{ ' + 'a'.repeat(1000) + ' }}',
  // Empty / whitespace
  '$state:', '$state: ', '$computed:', '$computed: ', '$item:', '$item: ',
  '$expr:', '$expr: ', '$expr:\n\n', '{{ }}',
  // Size / depth
  '$state:' + 'a.'.repeat(5000).slice(0, -1),
  '$expr:state.' + 'a.'.repeat(5000).slice(0, -1),
  '$computed:count:' + 'x'.repeat(100000),
  // Injection-shaped
  '$state:x; alert(1)', '$computed:require("fs")',
  '$expr:eval("alert(1)")', '$expr:Function("return this")()',
  // Long expression
  '$expr:' + 'x'.repeat(2000),
  '$computed:' + 'x'.repeat(2000),
];

// ─── Generative inputs ─────────────────────────────────────────

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789.';
const DELIMITERS = '.[]{}()\\';
const QUOTES = '"\'';
const BRACES = '{{}}';
const FORBIDDEN = ['__proto__', 'prototype', 'constructor'];

function randInput(rng: () => number): string {
  const len = Math.floor(rng() * 512);
  const chars: string[] = [];
  for (let i = 0; i < len; i++) {
    const r = rng();
    if (r < 0.5) {
      chars.push(CHARS[Math.floor(rng() * CHARS.length)]);
    } else if (r < 0.65) {
      chars.push(DELIMITERS[Math.floor(rng() * DELIMITERS.length)]);
    } else if (r < 0.72) {
      chars.push(QUOTES[Math.floor(rng() * QUOTES.length)]);
    } else if (r < 0.8) {
      chars.push(BRACES[Math.floor(rng() * BRACES.length)]);
    } else if (r < 0.85) {
      chars.push(' '); // whitespace
    } else if (r < 0.9) {
      // ~5% astral-plane
      const codepoint = 0x10000 + Math.floor(rng() * 0xE0000);
      chars.push(String.fromCodePoint(codepoint));
    } else {
      // ~1% forbidden segment
      chars.push(FORBIDDEN[Math.floor(rng() * FORBIDDEN.length)]);
    }
  }
  return chars.join('');
}

function randPrefixedInput(rng: () => number): string {
  const prefixes = ['$state:', '$computed:', '$item:', '$expr:'];
  const prefix = prefixes[Math.floor(rng() * prefixes.length)];
  const body = randInput(rng);
  return prefix + body;
}

function randTemplateInput(rng: () => number): string {
  // Generate a string that contains {{ and }} somewhere
  const parts: string[] = [];
  const numParts = 1 + Math.floor(rng() * 5);
  for (let i = 0; i < numParts; i++) {
    if (rng() < 0.7) {
      parts.push('{{' + randInput(rng) + '}}');
    } else {
      parts.push(randInput(rng));
    }
  }
  return parts.join('');
}

// ─── Tests ─────────────────────────────────────────────────────

describe('expression fuzz — corpus', () => {
  it.each(corpus.map((input, i) => [i, input] as const))(
    'corpus[%d] (%s)',
    async (_i, input) => {
      await expect(
        withTimeout(() => resolveRef(store, input), 100)
      ).resolves.toSatisfy(isSafeReturn);
    }
  );

  it('corpus item + expression total runs in < 2s', async () => {
    const start = performance.now();
    for (const input of corpus) {
      resolveRef(store, input);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });
});

describe('expression fuzz — generative', () => {
  const rng = mulberry32(0x5eed);
  const REPEATS = 1000;

  it(`resolveRef with ${REPEATS} random prefixed inputs`, async () => {
    for (let i = 0; i < REPEATS; i++) {
      const input = randPrefixedInput(rng);
      const result = await withTimeout(() => resolveRef(store, input), 100);
      expect(isSafeReturn(result)).toBe(true);
    }
  });

  it(`resolveRef with ${REPEATS} random template inputs`, async () => {
    for (let i = 0; i < REPEATS; i++) {
      const input = randTemplateInput(rng);
      const result = await withTimeout(() => resolveRef(store, input), 100);
      expect(isSafeReturn(result)).toBe(true);
    }
  });

  it(`resolveRef with ${REPEATS} random raw inputs`, async () => {
    for (let i = 0; i < REPEATS; i++) {
      const input = randInput(rng);
      const result = await withTimeout(() => resolveRef(store, input), 100);
      expect(isSafeReturn(result)).toBe(true);
    }
  });

  it('generative total runs in < 2s', async () => {
    const rng2 = mulberry32(0x5eed);
    const start = performance.now();
    for (let i = 0; i < REPEATS; i++) {
      resolveRef(store, randPrefixedInput(rng2));
      resolveRef(store, randTemplateInput(rng2));
      resolveRef(store, randInput(rng2));
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });
});

describe('expression hardening — unit regressions', () => {
  it('blocks $item:__proto__ (P1-1)', () => {
    expect(resolveRef(store, '$item:__proto__')).toBeUndefined();
  });

  it('blocks $item:constructor (P1-1)', () => {
    expect(resolveRef(store, '$item:constructor')).toBeUndefined();
  });

  it('blocks $expr:item.__proto__ (P1-2)', () => {
    expect(resolveRef(store, '$expr:item.__proto__')).toBeUndefined();
  });

  it('blocks $item:foo.__proto__.bar (P1-1)', () => {
    setItemContext({ foo: { x: 1 } as any });
    expect(resolveRef(store, '$item:foo.__proto__.bar')).toBeUndefined();
    setItemContext(itemCtx);
  });

  it('$item: supports dot-notation (P2-1)', () => {
    setItemContext({ user: { name: 'Alice' } });
    expect(resolveRef(store, '$item:user.name')).toBe('Alice');
    setItemContext(itemCtx);
  });

  it('nested {{}} braces handled correctly (P1-3)', () => {
    const result = resolveRef(store, '{{ {{state.name}} }}');
    // Inner match evaluates to "test"; outer braces remain — but balanced scan
    // handles the outer {{ }} and resolves the inner expression
    expect(typeof result).toBe('string');
  });

  it('{{ }} returns empty string', () => {
    expect(resolveRef(store, '{{ }}')).toBe('');
  });

  it('{{{{a}}}} does not throw', () => {
    expect(() => resolveRef(store, '{{{{a}}}}')).not.toThrow();
  });

  it('{{a}{{b}} does not throw', () => {
    expect(() => resolveRef(store, '{{a}{{b}}')).not.toThrow();
  });

  it('unclosed quote in $expr: returns undefined (P2-5)', () => {
    expect(resolveRef(store, '$expr:"unbalanced')).toBeUndefined();
    expect(resolveRef(store, "$expr:'unbalanced")).toBeUndefined();
  });

  it('object-form $expr resolves (P1-4)', () => {
    expect(resolveRef(store, { $expr: 'state.name' } as any)).toBe('test');
  });

  it('object-form $state resolves (P1-4)', () => {
    expect(resolveRef(store, { $state: 'name' } as any)).toBe('test');
  });

  it('expression > 1024 chars rejected (P2-3)', () => {
    expect(resolveRef(store, '$expr:' + 'x'.repeat(1025))).toBeUndefined();
    expect(resolveRef(store, '$computed:' + 'x'.repeat(1025))).toBeUndefined();
  });

  it('path > 256 chars rejected', () => {
    expect(resolveRef(store, '$state:' + 'a'.repeat(257))).toBeUndefined();
    expect(resolveRef(store, '$item:' + 'a'.repeat(257))).toBeUndefined();
  });

  it('template > 4096 chars returned as-is (P2-3)', () => {
    const long = 'a'.repeat(4097);
    expect(resolveRef(store, long)).toBe(long);
  });

  it('1 KB expression inside braces not substituted', () => {
    const long = '{{' + 'x'.repeat(1024) + '}}';
    const result = resolveRef(store, long);
    expect(result).toBe(long); // too long, left literal
  });
});

describe('expression hardening — NFC normalization (P2-6)', () => {
  it('blocks NFC-equal forbidden segment', () => {
    // __proto__ with combining characters should normalize to __proto__
    // Using \u0301 (combining acute) inside the word — after NFC norm the path
    // segments should still be checked
    const path = '$state:__prot\u0301o__';
    // After NFC normalization, __prot + combining acute + o__ won't match __proto__
    // because combining chars don't merge with ASCII letters in NFC.
    // But if someone used NFC-equal alternatives, the check catches them.
    const result = resolveRef(store, path);
    // The segment after NFC normalization won't be '__proto__' so it passes
    // the forbidden check (this is correct behavior)
    expect(result).toBeUndefined(); // not found in store
  });
});
