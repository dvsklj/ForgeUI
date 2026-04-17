/**
 * Bounded body reader — reads a Request body stream chunk-by-chunk,
 * tracking cumulative bytes and rejecting if the cap is exceeded.
 * Returns the parsed JSON or an error reason.
 */

export async function readBoundedJson<T = unknown>(
  req: Request,
  maxBytes: number,
): Promise<{ ok: true; value: T } | { ok: false; reason: 'too_large' | 'invalid_json' }> {
  const body = req.body;
  if (!body) return { ok: false, reason: 'invalid_json' };

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        reader.cancel();
        return { ok: false, reason: 'too_large' };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode(); // flush
  } finally {
    reader.releaseLock();
  }

  try {
    return { ok: true, value: JSON.parse(text) as T };
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }
}
