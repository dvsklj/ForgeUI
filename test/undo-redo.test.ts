import { describe, it, expect } from 'vitest';
import { UndoRedoStack } from '../src/runtime/undo-redo.js';

describe('UndoRedoStack', () => {
  function makeManifest(id: string, title: string) {
    return {
      manifest: '0.1.0' as const,
      id,
      root: 'main',
      elements: { main: { type: 'Text' as const, props: { content: title } } },
    };
  }

  it('starts empty with canUndo/canRedo false', () => {
    const stack = new UndoRedoStack();
    const state = stack.getState();
    expect(state.canUndo).toBe(false);
    expect(state.canRedo).toBe(false);
    expect(state.position).toBe(-1);
    expect(state.total).toBe(0);
  });

  it('push adds to stack and enables undo', () => {
    const stack = new UndoRedoStack();
    const m1 = makeManifest('app1', 'v1');
    stack.push(m1);
    const state = stack.getState();
    expect(state.canUndo).toBe(false);
    expect(state.total).toBe(1);
  });

  it('push twice enables undo', () => {
    const stack = new UndoRedoStack();
    stack.push(makeManifest('app1', 'v1'));
    stack.push(makeManifest('app1', 'v2'));
    const state = stack.getState();
    expect(state.canUndo).toBe(true);
    expect(state.canRedo).toBe(false);
  });

  it('undo returns previous manifest', () => {
    const stack = new UndoRedoStack();
    stack.push(makeManifest('app1', 'v1'));
    stack.push(makeManifest('app1', 'v2'));
    const prev = stack.undo();
    expect(prev).not.toBeNull();
    expect((prev as any).elements.main.props.content).toBe('v1');
  });

  it('undo at beginning returns null', () => {
    const stack = new UndoRedoStack();
    stack.push(makeManifest('app1', 'v1'));
    expect(stack.undo()).toBeNull();
  });

  it('redo after undo returns next manifest', () => {
    const stack = new UndoRedoStack();
    stack.push(makeManifest('app1', 'v1'));
    stack.push(makeManifest('app1', 'v2'));
    stack.undo();
    const next = stack.redo();
    expect(next).not.toBeNull();
    expect((next as any).elements.main.props.content).toBe('v2');
  });

  it('redo at end returns null', () => {
    const stack = new UndoRedoStack();
    stack.push(makeManifest('app1', 'v1'));
    expect(stack.redo()).toBeNull();
  });

  it('push after undo truncates future history', () => {
    const stack = new UndoRedoStack();
    stack.push(makeManifest('app1', 'v1'));
    stack.push(makeManifest('app1', 'v2'));
    stack.push(makeManifest('app1', 'v3'));
    stack.undo(); // back to v2
    stack.undo(); // back to v1
    stack.push(makeManifest('app1', 'v1b'));
    // Redo should no longer be possible
    expect(stack.getState().canRedo).toBe(false);
    expect(stack.getState().total).toBe(2);
  });

  it('does not push duplicate manifests', () => {
    const stack = new UndoRedoStack();
    const m1 = makeManifest('app1', 'v1');
    stack.push(m1);
    stack.push(m1);
    expect(stack.getState().total).toBe(1);
  });

  it('enforces max depth', () => {
    const stack = new UndoRedoStack(3);
    stack.push(makeManifest('app1', 'v1'));
    stack.push(makeManifest('app1', 'v2'));
    stack.push(makeManifest('app1', 'v3'));
    stack.push(makeManifest('app1', 'v4'));
    expect(stack.getState().total).toBeLessThanOrEqual(3);
  });

  it('current() returns current manifest without moving', () => {
    const stack = new UndoRedoStack();
    stack.push(makeManifest('app1', 'v1'));
    stack.push(makeManifest('app1', 'v2'));
    const current = stack.current();
    expect((current as any).elements.main.props.content).toBe('v2');
    expect(stack.getState().canUndo).toBe(true);
  });

  it('current() returns null when empty', () => {
    const stack = new UndoRedoStack();
    expect(stack.current()).toBeNull();
  });

  it('jumpTo moves to specific position', () => {
    const stack = new UndoRedoStack();
    stack.push(makeManifest('app1', 'v1'));
    stack.push(makeManifest('app1', 'v2'));
    stack.push(makeManifest('app1', 'v3'));
    const result = stack.jumpTo(0);
    expect((result as any).elements.main.props.content).toBe('v1');
    expect(stack.getState().canRedo).toBe(true);
  });

  it('jumpTo returns null for out-of-range positions', () => {
    const stack = new UndoRedoStack();
    stack.push(makeManifest('app1', 'v1'));
    expect(stack.jumpTo(-1)).toBeNull();
    expect(stack.jumpTo(5)).toBeNull();
  });

  it('clear() empties the stack', () => {
    const stack = new UndoRedoStack();
    stack.push(makeManifest('app1', 'v1'));
    stack.push(makeManifest('app1', 'v2'));
    stack.clear();
    expect(stack.getState().total).toBe(0);
    expect(stack.getState().canUndo).toBe(false);
    expect(stack.getState().canRedo).toBe(false);
  });

  it('returns clones (not references)', () => {
    const stack = new UndoRedoStack();
    const m1 = makeManifest('app1', 'v1');
    stack.push(m1);
    const current = stack.current()!;
    (current as any).id = 'modified';
    expect(stack.current()!.id).toBe('app1');
  });

  it('addListener receives state updates', () => {
    const stack = new UndoRedoStack();
    const states: any[] = [];
    stack.addListener((state) => states.push({ ...state }));
    stack.push(makeManifest('app1', 'v1'));
    expect(states).toHaveLength(1);
    expect(states[0].total).toBe(1);
  });

  it('addListener unsubscribe works', () => {
    const stack = new UndoRedoStack();
    const states: any[] = [];
    const unsub = stack.addListener((state) => states.push(state));
    unsub();
    stack.push(makeManifest('app1', 'v1'));
    expect(states).toHaveLength(0);
  });

  it('getTimeline returns entries', () => {
    const stack = new UndoRedoStack();
    stack.push(makeManifest('app1', 'v1'));
    stack.push(makeManifest('app1', 'v2'));
    const timeline = stack.getTimeline();
    expect(timeline).toHaveLength(2);
    expect(timeline[0].id).toBe('app1');
  });
});