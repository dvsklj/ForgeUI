// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/runtime/index.js';
import type { ForgeUIApp } from '../src/runtime/index.js';
import type { ForgeUIManifest } from '../src/types/index.js';

function manifest(overrides: Partial<ForgeUIManifest> = {}): ForgeUIManifest {
  return {
    manifest: '0.1.0',
    id: 'runtime-persistence',
    root: 'root',
    state: { count: 0 },
    elements: {
      root: { type: 'Text', props: { content: '$state:count' } },
    },
    ...overrides,
  } as ForgeUIManifest;
}

function mountWithPersistenceEvents(m: ForgeUIManifest): { app: ForgeUIApp; events: any[] } {
  const app = document.createElement('forgeui-app') as ForgeUIApp;
  const events: any[] = [];
  app.addEventListener('forgeui-persistence', (event: Event) => {
    events.push((event as CustomEvent).detail);
  });
  app.manifest = m;
  document.body.appendChild(app);
  return { app, events };
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('runtime persistence lifecycle events', () => {
  it('emits disabled when persistence is skipped', async () => {
    const { app, events } = mountWithPersistenceEvents(manifest({ skipPersistState: true }));
    await app.updateComplete;

    await vi.waitFor(() => {
      expect(events.some((event) => event.state === 'disabled' && event.status === null)).toBe(true);
    });
  });

  it('emits loading then failed when persistence setup fails', async () => {
    const { app, events } = mountWithPersistenceEvents(manifest({
      persistState: true,
      state: { __forgeui_schema_version: 1 },
      schema: {
        version: 2,
        tables: {},
        migrations: [{ from: 1, to: 2 } as any],
      },
    }));
    await app.updateComplete;

    await vi.waitFor(() => {
      expect(events.map((event) => event.state)).toContain('loading');
      expect(events.map((event) => event.state)).toContain('failed');
    });
  });
});
