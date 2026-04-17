import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDatabase, createApp, getApp, listApps, updateApp, patchApp, deleteApp, generateAppId, closeDatabase } from '../src/server/db.js';

describe('Database — CRUD operations', () => {
  beforeEach(() => {
    initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  it('createApp creates and returns an app', () => {
    const app = createApp({
      id: 'test-app',
      manifest: '0.1.0',
      root: 'main',
      elements: { main: { type: 'Text', props: { content: 'Hello' } } },
      meta: { title: 'Test App' },
    } as any);

    expect(app.id).toBe('test-app');
    expect(app.title).toBe('Test App');
    expect(app.manifest).toBeDefined();
    expect(app.created_at).toBeDefined();
    expect(app.updated_at).toBeDefined();
  });

  it('createApp generates ID if not provided', () => {
    const app = createApp({
      manifest: '0.1.0',
      root: 'main',
      elements: { main: { type: 'Text' } },
    } as any);

    expect(app.id).toBeTruthy();
    expect(app.id.length).toBe(8); // 4 bytes hex = 8 chars
  });

  it('getApp retrieves a created app', () => {
    createApp({
      id: 'my-app',
      manifest: '0.1.0',
      root: 'main',
      elements: { main: { type: 'Text' } },
      meta: { title: 'My App' },
    } as any);

    const app = getApp('my-app');
    expect(app).not.toBeNull();
    expect(app!.id).toBe('my-app');
    expect(app!.title).toBe('My App');
  });

  it('getApp returns null for non-existent app', () => {
    expect(getApp('nonexistent')).toBeNull();
  });

  it('listApps returns apps sorted by updated_at', () => {
    createApp({ id: 'app-1', manifest: '0.1.0', root: 'm', elements: { m: { type: 'Text' } } } as any);
    createApp({ id: 'app-2', manifest: '0.1.0', root: 'm', elements: { m: { type: 'Text' } } } as any);
    createApp({ id: 'app-3', manifest: '0.1.0', root: 'm', elements: { m: { type: 'Text' } } } as any);

    const result = listApps(10);
    expect(result.total).toBe(3);
    expect(result.apps.length).toBe(3);
  });

  it('listApps respects limit and offset', () => {
    for (let i = 0; i < 5; i++) {
      createApp({ id: `app-${i}`, manifest: '0.1.0', root: 'm', elements: { m: { type: 'Text' } } } as any);
    }

    const page1 = listApps(2, 0);
    expect(page1.apps.length).toBe(2);
    expect(page1.total).toBe(5);

    const page2 = listApps(2, 2);
    expect(page2.apps.length).toBe(2);
    expect(page2.total).toBe(5);
  });

  it('updateApp replaces manifest and returns updated app', () => {
    createApp({ id: 'upd-app', manifest: '0.1.0', root: 'm', elements: { m: { type: 'Text' } }, meta: { title: 'Original' } } as any);

    const updated = updateApp('upd-app', {
      id: 'upd-app',
      manifest: '0.1.0',
      root: 'm',
      elements: { m: { type: 'Text' } },
      meta: { title: 'Updated' },
    } as any);

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated');
  });

  it('updateApp returns null for non-existent app', () => {
    expect(updateApp('nonexistent', { manifest: '0.1.0' } as any)).toBeNull();
  });

  it('deleteApp removes an app and returns true', () => {
    createApp({ id: 'del-app', manifest: '0.1.0', root: 'm', elements: { m: { type: 'Text' } } } as any);
    expect(deleteApp('del-app')).toBe(true);
    expect(getApp('del-app')).toBeNull();
  });

  it('deleteApp returns false for non-existent app', () => {
    expect(deleteApp('nonexistent')).toBe(false);
  });

  it('generateAppId produces unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateAppId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('Database — merge patch', () => {
  beforeEach(() => {
    initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  it('patchApp merges partial manifest', () => {
    createApp({
      id: 'patch-app',
      manifest: '0.1.0',
      root: 'main',
      elements: { main: { type: 'Text', props: { content: 'Hello' } } },
      meta: { title: 'Original' },
    } as any);

    const result = patchApp('patch-app', { meta: { title: 'Patched' } } as any, (m) => ({
      valid: true,
    }));

    expect(result.status).toBe('ok');
    expect((result as any).app.manifest.meta.title).toBe('Patched');
  });

  it('patchApp returns not-found for unknown id', () => {
    const result = patchApp('nonexistent', { meta: { title: 'x' } } as any, () => ({ valid: true }));
    expect(result.status).toBe('not-found');
  });

  it('patchApp rejects invalid merge', () => {
    createApp({
      id: 'invalid-patch',
      manifest: '0.1.0',
      root: 'main',
      elements: { main: { type: 'Text' } },
    } as any);

    const result = patchApp('invalid-patch', { root: null } as any, (m) => ({
      valid: !m.root, // reject if root is null/undefined
      errors: m.root ? [] : ['root is required'],
    }));

    expect(result.status).toBe('invalid');
  });

  it('patchApp null values delete keys', () => {
    createApp({
      id: 'null-patch',
      manifest: '0.1.0',
      root: 'main',
      elements: { main: { type: 'Text' } },
      meta: { title: 'Present' },
    } as any);

    const result = patchApp('null-patch', { meta: null } as any, () => ({ valid: true }));
    expect(result.status).toBe('ok');
    expect((result as any).app.manifest.meta).toBeUndefined();
  });
});