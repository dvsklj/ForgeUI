// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/runtime/index.js';
import type { ForgeUIApp } from '../src/runtime/index.js';
import type { ForgeUIManifest } from '../src/types/index.js';

function manifest(overrides: Partial<ForgeUIManifest> = {}): ForgeUIManifest {
  return {
    manifest: '0.1.0',
    id: 'runtime-actions',
    root: 'root',
    state: { token: 'abc123' },
    elements: {
      root: { type: 'Stack', children: ['dialog'] },
      dialog: { type: 'Dialog', props: { title: 'Confirm' } },
    },
    actions: {},
    ...overrides,
  } as ForgeUIManifest;
}

async function mountApp(m: ForgeUIManifest): Promise<ForgeUIApp> {
  const app = document.createElement('forgeui-app') as ForgeUIApp;
  app.manifest = m;
  document.body.appendChild(app);
  await app.updateComplete;
  return app;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('runtime declarative actions', () => {
  it('opens and closes dialog elements through manifest props', async () => {
    const app = await mountApp(manifest({
      actions: {
        showDialog: { type: 'openDialog', target: 'dialog' },
        hideDialog: { type: 'closeDialog' },
      },
    }));

    app.dispatchAction('showDialog');
    await app.updateComplete;
    expect(app.getManifest()?.elements.dialog.props?.open).toBe(true);

    app.dispatchAction('hideDialog');
    await app.updateComplete;
    expect(app.getManifest()?.elements.dialog.props?.open).toBe(false);
  });

  it('renders transient toasts from toast actions', async () => {
    vi.useFakeTimers();
    const app = await mountApp(manifest({
      actions: {
        notify: { type: 'toast', data: { message: 'Saved', duration: 100 } } as any,
      },
    }));

    app.dispatchAction('notify');
    await app.updateComplete;
    expect(app.shadowRoot?.querySelectorAll('forgeui-toast')).toHaveLength(1);

    vi.advanceTimersByTime(100);
    await app.updateComplete;
    expect(app.shadowRoot?.querySelectorAll('forgeui-toast')).toHaveLength(0);
  });

  it('calls explicit API actions and dispatches result events', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response(
      JSON.stringify({ ok: true }),
      { status: 201, headers: { 'content-type': 'application/json' } },
    ));
    vi.stubGlobal('fetch', fetchMock);
    const app = await mountApp(manifest({
      actions: {
        save: {
          type: 'callApi',
          url: '/api/save',
          method: 'post',
          body: { token: '$state:token' },
        },
      },
    }));
    const results: any[] = [];
    app.addEventListener('forgeui-api-result', (event: Event) => results.push((event as CustomEvent).detail));

    app.dispatchAction('save');
    await vi.waitFor(() => expect(results).toHaveLength(1));

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'abc123' }),
    });
    expect(results[0]).toMatchObject({ action: 'save', status: 201, ok: true, result: { ok: true } });
  });

  it('omits configured body data for GET API actions', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const app = await mountApp(manifest({
      actions: {
        load: {
          type: 'callApi',
          url: '/api/load',
          body: { token: '$state:token' },
        },
      },
    }));

    app.dispatchAction('load');
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/load', {
      method: 'GET',
      headers: undefined,
      body: undefined,
    });
  });

  it('blocks unsafe API URLs and dispatches error events', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const app = await mountApp(manifest({
      actions: {
        unsafe: { type: 'callApi', url: 'javascript:alert(1)' },
      },
    }));
    const errors: any[] = [];
    app.addEventListener('forgeui-api-error', (event: Event) => errors.push((event as CustomEvent).detail));

    app.dispatchAction('unsafe');
    await vi.waitFor(() => expect(errors).toHaveLength(1));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(errors[0]).toMatchObject({ action: 'unsafe', ok: false });
    expect(errors[0].error).toContain('Blocked unsafe callApi URL');
  });
});
