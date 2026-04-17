import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderElement, renderManifest } from '../src/renderer/index.js';
import * as stateModule from '../src/state/index.js';
import { createStore } from 'tinybase';
import type { ForgeManifest } from '../src/types/index.js';

describe('renderer robustness', () => {
  const store = createStore();

  function ctx(manifest: ForgeManifest) {
    return {
      manifest,
      store,
      activeView: 'main',
      onAction: () => {},
    };
  }

  it('renderElement catches thrown errors and returns <forgeui-error>', () => {
    const manifest: ForgeManifest = {
      id: 'r1',
      manifest: '0.1.0',
      root: 'bad',
      elements: {
        bad: {
          type: 'Text',
          props: { content: { $expr: 'this is not a valid expression' } as any },
        },
      },
    } as any;

    expect(() => renderElement('bad', ctx(manifest))).not.toThrow();
  });

  it('renderRepeater clears setItemContext even if a child render throws', () => {
    const calls: unknown[] = [];
    const spy = vi.spyOn(stateModule, 'setItemContext').mockImplementation((v: any) => { calls.push(v); });

    const manifest: ForgeManifest = {
      id: 'r2',
      manifest: '0.1.0',
      root: 'rep',
      elements: {
        rep: {
          type: 'Repeater',
          props: { data: [{ a: 1 }, { a: 2 }] },
          children: ['throwing-child'],
        },
        'throwing-child': {
          type: 'Text',
          props: {},
        },
      },
    } as any;

    expect(() => renderManifest(ctx(manifest))).not.toThrow();

    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls[calls.length - 1]).toBeNull();

    spy.mockRestore();
  });

  it('evaluateVisibility fail-visibles on missing $when wrapper', () => {
    const manifest: ForgeManifest = {
      id: 'r3',
      manifest: '0.1.0',
      root: 'e1',
      elements: {
        e1: {
          type: 'Text',
          visible: { path: 'does.not.exist', eq: 'never' } as any,
          props: { content: 'visible' },
        },
      },
    } as any;

    expect(() => renderElement('e1', ctx(manifest))).not.toThrow();
  });

  it('evaluateVisibility returns true for null/undefined/non-object condition', () => {
    const manifest: ForgeManifest = {
      id: 'r4',
      manifest: '0.1.0',
      root: 'e1',
      elements: {
        e1: { type: 'Text', visible: null as any, props: { content: 'x' } },
      },
    } as any;
    expect(() => renderElement('e1', ctx(manifest))).not.toThrow();
  });
});
