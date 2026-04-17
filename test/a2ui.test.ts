import { describe, it, expect } from 'vitest';
import { isA2UIPayload, ingestPayload } from '../src/a2ui/index.js';

describe('isA2UIPayload', () => {
  it('detects A2UI payload with components array', () => {
    expect(isA2UIPayload({ components: [{ type: 'text' }] })).toBe(true);
  });

  it('detects A2UI payload with content array', () => {
    expect(isA2UIPayload({ content: [{ type: 'text' }] })).toBe(true);
  });

  it('detects A2UI payload with adaptive-card type', () => {
    expect(isA2UIPayload({ type: 'adaptive-card' })).toBe(true);
  });

  it('detects A2UI payload with a2ui version', () => {
    expect(isA2UIPayload({ version: 'a2ui/v0.8' })).toBe(true);
  });

  it('detects A2UI payload by type starting with a2ui', () => {
    expect(isA2UIPayload({ type: 'a2ui-card' })).toBe(true);
  });

  it('does not detect Forge manifest as A2UI', () => {
    expect(isA2UIPayload({ manifest: '0.1.0', id: 'x', elements: {} })).toBe(false);
  });

  it('does not detect null/undefined as A2UI', () => {
    expect(isA2UIPayload(null)).toBe(false);
    expect(isA2UIPayload(undefined)).toBe(false);
  });

  it('does not detect empty object as A2UI', () => {
    expect(isA2UIPayload({})).toBe(false);
  });

  it('does not detect primitives as A2UI', () => {
    expect(isA2UIPayload('string')).toBe(false);
    expect(isA2UIPayload(42)).toBe(false);
  });

  it('detects content array without manifest as A2UI', () => {
    expect(isA2UIPayload({ content: [{ type: 'button' }] })).toBe(true);
  });
});

describe('ingestPayload', () => {
  it('passes through valid Forge manifest unchanged', () => {
    const forgeManifest = {
      manifest: '0.1.0',
      id: 'test',
      root: 'main',
      elements: { main: { type: 'Text', props: { content: 'Hi' } } },
    };
    const result = ingestPayload(forgeManifest);
    expect(result.id).toBe('test');
    expect(result.manifest).toBe('0.1.0');
  });

  it('converts A2UI text component', () => {
    const a2ui = { components: [{ type: 'text', props: { text: 'Hello' } }] };
    const result = ingestPayload(a2ui);
    expect(result.manifest).toBe('0.1.0');
    expect(result.root).toBeDefined();
    const rootEl = result.elements[result.root];
    expect(rootEl).toBeDefined();
  });

  it('converts A2UI heading to Forge Text', () => {
    const a2ui = { components: [{ type: 'heading', props: { text: 'Title' } }] };
    const result = ingestPayload(a2ui);
    const rootEl = result.elements[result.root];
    expect(rootEl.type).toBe('Text');
  });

  it('converts A2UI button component', () => {
    const a2ui = { components: [{ type: 'button', props: { text: 'Click' } }] };
    const result = ingestPayload(a2ui);
    const rootEl = result.elements[result.root];
    expect(rootEl.type).toBe('Button');
  });

  it('converts A2UI container with children', () => {
    const a2ui = {
      components: [{
        type: 'container',
        props: { gap: 'md' },
        children: [
          { type: 'text', props: { text: 'Child 1' } },
          { type: 'button', props: { text: 'Child 2' } },
        ],
      }],
    };
    const result = ingestPayload(a2ui);
    const rootEl = result.elements[result.root];
    expect(rootEl.children).toBeDefined();
    expect(rootEl.children!.length).toBe(2);
  });

  it('handles multiple top-level components by wrapping in Stack', () => {
    const a2ui = {
      components: [
        { type: 'text', props: { text: 'First' } },
        { type: 'text', props: { text: 'Second' } },
      ],
    };
    const result = ingestPayload(a2ui);
    const rootEl = result.elements[result.root];
    expect(rootEl.type).toBe('Stack');
    expect(rootEl.children).toBeDefined();
    expect(rootEl.children!.length).toBe(2);
  });

  it('handles single top-level component without wrapper', () => {
    const a2ui = { components: [{ type: 'text', props: { text: 'Solo' } }] };
    const result = ingestPayload(a2ui);
    expect(result.root).not.toBe('a2ui-root');
  });

  it('handles unsupported A2UI type gracefully', () => {
    const a2ui = { components: [{ type: 'fancy-widget', props: {} }] };
    const result = ingestPayload(a2ui);
    const rootEl = result.elements[result.root];
    expect(rootEl.type).toBe('Text');
    expect((rootEl.props as any).content).toContain('Unsupported');
  });

  it('converts A2UI image component with url prop to src', () => {
    const a2ui = { components: [{ type: 'image', props: { url: 'https://example.com/img.png' } }] };
    const result = ingestPayload(a2ui);
    const rootEl = result.elements[result.root];
    expect(rootEl.type).toBe('Image');
    expect((rootEl.props as any).src).toBe('https://example.com/img.png');
  });

  it('converts A2UI alert type/info to variant', () => {
    const a2ui = { components: [{ type: 'alert', props: { type: 'error', message: 'Oops' } }] };
    const result = ingestPayload(a2ui);
    const rootEl = result.elements[result.root];
    expect(rootEl.type).toBe('Alert');
    expect((rootEl.props as any).variant).toBe('error');
  });

  it('generates unique IDs for A2UI components', () => {
    const a2ui = { components: [
      { type: 'text', props: { text: 'A' } },
      { type: 'text', props: { text: 'B' } },
    ]};
    const result = ingestPayload(a2ui);
    const elementIds = Object.keys(result.elements);
    const uniqueIds = new Set(elementIds);
    expect(uniqueIds.size).toBe(elementIds.length);
  });

  it('handles A2UI row/column direction mapping', () => {
    const row = { components: [{ type: 'row', props: { gap: 'sm' } }] };
    const result1 = ingestPayload(row);
    const rowEl = result1.elements[Object.keys(result1.elements)[0]];
    expect(rowEl.props).toHaveProperty('direction', 'row');

    const col = { components: [{ type: 'column', props: { spacing: 'lg' } }] };
    const result2 = ingestPayload(col);
    const colEl = result2.elements[Object.keys(result2.elements)[0]];
    expect(colEl.props).toHaveProperty('direction', 'column');
  });

  it('handles A2UI select with string options', () => {
    const a2ui = { components: [{ type: 'select', props: { options: ['a', 'b', 'c'] } }] };
    const result = ingestPayload(a2ui);
    const rootEl = result.elements[result.root];
    expect(rootEl.type).toBe('Select');
    const options = (rootEl.props as any).options;
    expect(options).toEqual([{ value: 'a', label: 'a' }, { value: 'b', label: 'b' }, { value: 'c', label: 'c' }]);
  });
});