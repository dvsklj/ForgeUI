import { describe, it, expect, afterEach } from 'vitest';
import { renderElement, renderManifest, kebabCase, evaluateVisibility } from '../src/renderer/index.js';
import { createStore } from 'tinybase';
import type { ForgeManifest } from '../src/types/index.js';

describe('kebabCase', () => {
  it('converts camelCase to kebab-case', () => {
    expect(kebabCase('camelCase')).toBe('camel-case');
    expect(kebabCase('FooBar')).toBe('foo-bar');
    expect(kebabCase('HTMLParser')).toBe('html-parser');
    expect(kebabCase('already-kebab')).toBe('already-kebab');
    expect(kebabCase('lower')).toBe('lower');
    expect(kebabCase('ABC')).toBe('abc');
  });
});

describe('evaluateVisibility', () => {
  const store = createStore();
  store.setValue('active', true);
  store.setValue('count', 5);
  store.setValue('name', 'Alice');
  store.setTable('items', { i1: { done: true } });

  function ctx(manifest: ForgeManifest) {
    return {
      manifest,
      store,
      activeView: 'main',
      onAction: () => {},
    };
  }

  it('returns true for undefined/null condition', () => {
    const manifest: ForgeManifest = {
      manifest: '0.1.0', id: 't', root: 'r',
      elements: { r: { type: 'Text', props: { content: 'hi' }, visible: undefined as any } },
    };
    expect(evaluateVisibility(undefined, ctx(manifest))).toBe(true);
    expect(evaluateVisibility(null, ctx(manifest))).toBe(true);
  });

  it('returns true when $when.eq matches', () => {
    expect(evaluateVisibility(
      { $when: { path: 'active', eq: true } },
      ctx({ manifest: '0.1.0', id: 't', root: 'r', elements: { r: { type: 'Text' } } })
    )).toBe(true);
  });

  it('returns false when $when.eq does not match', () => {
    expect(evaluateVisibility(
      { $when: { path: 'active', eq: false } },
      ctx({ manifest: '0.1.0', id: 't', root: 'r', elements: { r: { type: 'Text' } } })
    )).toBe(false);
  });

  it('returns true when $when.gt matches', () => {
    expect(evaluateVisibility(
      { $when: { path: 'count', gt: 3 } },
      ctx({ manifest: '0.1.0', id: 't', root: 'r', elements: { r: { type: 'Text' } } })
    )).toBe(true);
  });

  it('returns false when $wait.gt does not match', () => {
    expect(evaluateVisibility(
      { $when: { path: 'count', gt: 10 } },
      ctx({ manifest: '0.1.0', id: 't', root: 'r', elements: { r: { type: 'Text' } } })
    )).toBe(false);
  });

  it('handles $when.neq', () => {
    expect(evaluateVisibility(
      { $when: { path: 'name', neq: 'Bob' } },
      ctx({ manifest: '0.1.0', id: 't', root: 'r', elements: { r: { type: 'Text' } } })
    )).toBe(true);
  });

  it('handles $when.exists true', () => {
    expect(evaluateVisibility(
      { $when: { path: 'name', exists: true } },
      ctx({ manifest: '0.1.0', id: 't', root: 'r', elements: { r: { type: 'Text' } } })
    )).toBe(true);
  });

  it('handles $when.exists false (value is undefined)', () => {
    expect(evaluateVisibility(
      { $when: { path: 'nonexistent', exists: false } },
      ctx({ manifest: '0.1.0', id: 't', root: 'r', elements: { r: { type: 'Text' } } })
    )).toBe(true);
  });

  it('handles $when.in', () => {
    expect(evaluateVisibility(
      { $when: { path: 'name', 'in': ['Alice', 'Bob'] } },
      ctx({ manifest: '0.1.0', id: 't', root: 'r', elements: { r: { type: 'Text' } } })
    )).toBe(true);
  });

  it('handles $when.lte', () => {
    expect(evaluateVisibility(
      { $when: { path: 'count', lte: 5 } },
      ctx({ manifest: '0.1.0', id: 't', root: 'r', elements: { r: { type: 'Text' } } })
    )).toBe(true);
  });

  it('handles $when.gte', () => {
    expect(evaluateVisibility(
      { $when: { path: 'count', gte: 5 } },
      ctx({ manifest: '0.1.0', id: 't', root: 'r', elements: { r: { type: 'Text' } } })
    )).toBe(true);
  });

  it('handles $when.lt', () => {
    expect(evaluateVisibility(
      { $when: { path: 'count', lt: 10 } },
      ctx({ manifest: '0.1.0', id: 't', root: 'r', elements: { r: { type: 'Text' } } })
    )).toBe(true);
  });
});

describe('renderElement', () => {
  const store = createStore();

  function ctx(manifest: ForgeManifest) {
    return {
      manifest,
      store,
      activeView: 'main',
      onAction: () => {},
    };
  }

  it('returns empty template for non-existent element', () => {
    const manifest: ForgeManifest = {
      manifest: '0.1.0', id: 't', root: 'missing',
      elements: {},
    };
    const result = renderElement('missing', ctx(manifest));
    expect(result).toBeDefined();
  });

  it('renders all component types without throwing', () => {
    const types = [
      'Stack', 'Grid', 'Card', 'Container', 'Tabs', 'Accordion', 'Divider', 'Spacer',
      'Text', 'Image', 'Icon', 'Badge', 'Avatar', 'EmptyState',
      'TextInput', 'NumberInput', 'Select', 'MultiSelect', 'Checkbox', 'Toggle', 'DatePicker', 'Slider', 'FileUpload',
      'Button', 'ButtonGroup', 'Link',
      'Table', 'List', 'Chart', 'Metric',
      'Alert', 'Dialog', 'Progress', 'Toast',
      'Breadcrumb', 'Stepper',
      'Drawing',
    ];
    for (const type of types) {
      const elements: Record<string, any> = {};
      elements['el'] = { type, props: {} };
      const manifest: ForgeManifest = {
        manifest: '0.1.0', id: 't', root: 'el', elements,
      };
      expect(() => renderElement('el', ctx(manifest))).not.toThrow();
    }
  });

  it('renders unknown component type as forge-error', () => {
    const manifest: ForgeManifest = {
      manifest: '0.1.0', id: 't', root: 'el',
      elements: { el: { type: 'UnknownType' as any } },
    };
    const result = renderElement('el', ctx(manifest));
    expect(result).toBeDefined();
  });

  it('handles Repeater with data', () => {
    const manifest: ForgeManifest = {
      manifest: '0.1.0', id: 't', root: 'rep',
      elements: {
        rep: { type: 'Repeater', props: { data: [{ name: 'A' }, { name: 'B' }] }, children: ['item'] },
        item: { type: 'Text', props: { content: '$item:name' } },
      },
    };
    expect(() => renderManifest(ctx(manifest))).not.toThrow();
  });

  it('handles Repeater with empty data', () => {
    const manifest: ForgeManifest = {
      manifest: '0.1.0', id: 't', root: 'rep',
      elements: {
        rep: { type: 'Repeater', props: { data: [], emptyMessage: 'No items' } },
      },
    };
    expect(() => renderManifest(ctx(manifest))).not.toThrow();
  });

  it('handles element with visibility condition', () => {
    const manifest: ForgeManifest = {
      manifest: '0.1.0', id: 't', root: 'el',
      elements: {
        el: { type: 'Text', props: { content: 'visible' }, visible: { $when: { path: 'shown', eq: true } } },
      },
    };
    expect(() => renderElement('el', ctx(manifest))).not.toThrow();
  });
});