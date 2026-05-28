// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import '../src/components/index.js';

function setFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: files,
  });
}

function dragEvent(type: string, files: File[] = []) {
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', {
    configurable: true,
    value: { files },
  });
  return event;
}

async function renderFileUpload(props: Record<string, unknown>) {
  const element = document.createElement('forgeui-file-upload') as any;
  element.props = props;
  document.body.append(element);
  await element.updateComplete;
  return element;
}

describe('ForgeFileUpload', () => {
  it('dispatches first-file metadata with bind and uuid for compatibility', async () => {
    const element = await renderFileUpload({ bind: '$state:upload', label: 'Upload' });
    const onAction = vi.fn();
    element.onAction = onAction;
    const input = element.shadowRoot!.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain', lastModified: 123 });

    setFiles(input, [file]);
    input.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(onAction).toHaveBeenCalledOnce());

    const [action, payload] = onAction.mock.calls[0];
    expect(action).toBe('change');
    expect(payload).toMatchObject({
      bind: '$state:upload',
      name: 'hello.txt',
      size: 5,
      type: 'text/plain',
      lastModified: 123,
      multiple: false,
    });
    expect(payload.id).toEqual(expect.any(String));
    expect(payload.uuid).toBe(payload.id);
    expect(payload.storageKey).toBe(payload.id);
    expect(payload.value).toMatchObject({ name: 'hello.txt', size: 5, accepted: true, storageKey: payload.id });
    expect(payload.files).toHaveLength(1);
  });

  it('supports multiple files only when declared', async () => {
    const element = await renderFileUpload({ multiple: true });
    const onAction = vi.fn();
    element.onAction = onAction;
    const input = element.shadowRoot!.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.multiple).toBe(true);

    setFiles(input, [
      new File(['a'], 'a.txt', { type: 'text/plain' }),
      new File(['bb'], 'b.txt', { type: 'text/plain' }),
    ]);
    input.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(onAction).toHaveBeenCalledOnce());

    const payload = onAction.mock.calls[0][1];
    expect(payload.value).toHaveLength(2);
    expect(payload.files.map((file: any) => file.name)).toEqual(['a.txt', 'b.txt']);
  });

  it('rejects files larger than maxSize without losing change semantics', async () => {
    const element = await renderFileUpload({ maxSize: '0.003kb' });
    const onAction = vi.fn();
    element.onAction = onAction;
    const input = element.shadowRoot!.querySelector<HTMLInputElement>('input[type="file"]')!;

    setFiles(input, [new File(['toolarge'], 'large.txt', { type: 'text/plain' })]);
    input.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(onAction).toHaveBeenCalledOnce());

    const payload = onAction.mock.calls[0][1];
    expect(payload.name).toBeNull();
    expect(payload.storageKey).toBeNull();
    expect(payload.value).toBeNull();
    expect(payload.rejected).toMatchObject([{ name: 'large.txt', accepted: false, error: 'maxSize', storageKey: null }]);
    expect(payload.maxSize).toBe(3);
  });

  it('uses the first accepted file for compatibility metadata', async () => {
    const element = await renderFileUpload({ multiple: true, maxSize: 3 });
    const onAction = vi.fn();
    element.onAction = onAction;
    const input = element.shadowRoot!.querySelector<HTMLInputElement>('input[type="file"]')!;

    setFiles(input, [
      new File(['toolarge'], 'large.txt', { type: 'text/plain' }),
      new File(['ok'], 'small.txt', { type: 'text/plain', lastModified: 456 }),
    ]);
    input.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(onAction).toHaveBeenCalledOnce());

    const payload = onAction.mock.calls[0][1];
    expect(payload.name).toBe('small.txt');
    expect(payload.size).toBe(2);
    expect(payload.lastModified).toBe(456);
    expect(payload.storageKey).toBe(payload.id);
    expect(payload.value).toHaveLength(1);
    expect(payload.value[0]).toMatchObject({ name: 'small.txt', accepted: true, storageKey: payload.id });
    expect(payload.rejected).toMatchObject([{ name: 'large.txt', accepted: false, storageKey: null }]);
  });

  it('ignores extra selected files when multiple is not declared', async () => {
    const element = await renderFileUpload({});
    const onAction = vi.fn();
    element.onAction = onAction;
    const input = element.shadowRoot!.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.multiple).toBe(false);

    setFiles(input, [
      new File(['a'], 'a.txt', { type: 'text/plain' }),
      new File(['bb'], 'b.txt', { type: 'text/plain' }),
    ]);
    input.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(onAction).toHaveBeenCalledOnce());

    const payload = onAction.mock.calls[0][1];
    expect(payload.files).toHaveLength(1);
    expect(payload.files[0].name).toBe('a.txt');
  });

  it('lets keyboard users open the file picker from the dropzone', async () => {
    const element = await renderFileUpload({ label: 'Documents' });
    const dropzone = element.shadowRoot!.querySelector<HTMLElement>('.dropzone')!;
    const input = element.shadowRoot!.querySelector<HTMLInputElement>('input[type="file"]')!;
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});

    expect(dropzone.getAttribute('role')).toBe('button');
    expect(dropzone.getAttribute('tabindex')).toBe('0');

    dropzone.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    dropzone.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));

    expect(click).toHaveBeenCalledTimes(2);
  });

  it('opens the file picker on pointer activation', async () => {
    const element = await renderFileUpload({});
    const dropzone = element.shadowRoot!.querySelector<HTMLElement>('.dropzone')!;
    const input = element.shadowRoot!.querySelector<HTMLInputElement>('input[type="file"]')!;
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});

    dropzone.click();

    expect(click).toHaveBeenCalledOnce();
  });

  it('dispatches dropped files through the same metadata path', async () => {
    const element = await renderFileUpload({ bind: '$state:upload' });
    const onAction = vi.fn();
    element.onAction = onAction;
    const dropzone = element.shadowRoot!.querySelector<HTMLElement>('.dropzone')!;
    const file = new File(['drop'], 'drop.txt', { type: 'text/plain', lastModified: 789 });

    dropzone.dispatchEvent(dragEvent('drop', [file]));
    await vi.waitFor(() => expect(onAction).toHaveBeenCalledOnce());

    const [action, payload] = onAction.mock.calls[0];
    expect(action).toBe('change');
    expect(payload).toMatchObject({
      bind: '$state:upload',
      name: 'drop.txt',
      size: 4,
      type: 'text/plain',
      lastModified: 789,
      multiple: false,
    });
    expect(payload.value).toMatchObject({ name: 'drop.txt', accepted: true, storageKey: payload.id });
  });

  it('marks the dropzone while a file is dragged over it', async () => {
    const element = await renderFileUpload({});
    const dropzone = element.shadowRoot!.querySelector<HTMLElement>('.dropzone')!;

    dropzone.dispatchEvent(dragEvent('dragover'));
    await element.updateComplete;
    expect(dropzone.classList.contains('dragging')).toBe(true);

    dropzone.dispatchEvent(dragEvent('dragleave'));
    await element.updateComplete;
    expect(dropzone.classList.contains('dragging')).toBe(false);
  });
});
