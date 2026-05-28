// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import '../src/components/index.js';

describe('feedback components', () => {
  it('registers feedback primitives from the aggregate entrypoint', () => {
    expect(customElements.get('forgeui-alert')).toBeDefined();
    expect(customElements.get('forgeui-dialog')).toBeDefined();
    expect(customElements.get('forgeui-progress')).toBeDefined();
    expect(customElements.get('forgeui-toast')).toBeDefined();
    expect(customElements.get('forgeui-error')).toBeDefined();
  });
});
