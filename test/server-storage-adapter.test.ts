import { describe, it, expect, afterEach } from 'vitest';
import type { ForgeUIManifest } from '../src/types/index.js';
import type { AppStorage, StoredApp } from '../src/server/db.js';
import { closeDatabase, createApp, getApp, listApps, setAppStorage } from '../src/server/db.js';
import { createForgeUIServer } from '../src/server/index.js';

function manifest(id: string): ForgeUIManifest {
  return {
    manifest: '0.1.0',
    id,
    root: 'main',
    elements: { main: { type: 'Text', props: { content: id } } },
    meta: { title: id },
  };
}

class MemoryStorage implements AppStorage {
  closed = false;
  private apps = new Map<string, StoredApp>();

  create(appManifest: ForgeUIManifest): StoredApp {
    const now = new Date().toISOString();
    const id = appManifest.id;
    const app = {
      id,
      title: appManifest.meta?.title || id,
      manifest: appManifest,
      created_at: now,
      updated_at: now,
    };
    this.apps.set(id, app);
    return app;
  }

  get(id: string): StoredApp | null {
    return this.apps.get(id) ?? null;
  }

  list(limit = 50, offset = 0): { apps: StoredApp[]; total: number } {
    const apps = [...this.apps.values()];
    return { apps: apps.slice(offset, offset + limit), total: apps.length };
  }

  update(id: string, appManifest: ForgeUIManifest): StoredApp | null {
    const existing = this.apps.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      title: appManifest.meta?.title || id,
      manifest: appManifest,
      updated_at: new Date().toISOString(),
    };
    this.apps.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.apps.delete(id);
  }

  close(): void {
    this.closed = true;
  }
}

afterEach(() => {
  closeDatabase();
  delete process.env.FORGEUI_RATE_LIMIT_DISABLE;
});

describe('server storage adapter', () => {
  it('routes db helpers through the configured storage adapter', () => {
    const storage = new MemoryStorage();
    setAppStorage(storage);

    createApp(manifest('memory-app'));
    const generated = createApp({ ...manifest(''), id: '' });

    expect(getApp('memory-app')?.title).toBe('memory-app');
    expect(generated.id).toMatch(/^[a-f0-9]{8}$/);
    expect(listApps().total).toBe(2);

    closeDatabase();
    expect(storage.closed).toBe(true);
  });

  it('lets createForgeUIServer use a supplied storage adapter', async () => {
    process.env.FORGEUI_RATE_LIMIT_DISABLE = '1';
    const storage = new MemoryStorage();
    const server = createForgeUIServer({
      storage,
      baseUrl: 'http://forge.test',
    });

    const create = await server.app.request('/api/apps', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(manifest('adapter-app')),
    });
    const createBody = await create.json() as { url: string };

    expect(create.status).toBe(201);
    expect(createBody.url).toBe('http://forge.test/apps/adapter-app');

    const get = await server.app.request('/api/apps/adapter-app');
    const getBody = await get.json() as { manifest: ForgeUIManifest };
    expect(get.status).toBe(200);
    expect(getBody.manifest.id).toBe('adapter-app');
  });
});
