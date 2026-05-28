// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import '../src/components/index.js';

describe('input components', () => {
  it('registers input primitives from the aggregate entrypoint', () => {
    expect(customElements.get('forgeui-text-input')).toBeDefined();
    expect(customElements.get('forgeui-number-input')).toBeDefined();
    expect(customElements.get('forgeui-select')).toBeDefined();
    expect(customElements.get('forgeui-multi-select')).toBeDefined();
    expect(customElements.get('forgeui-checkbox')).toBeDefined();
    expect(customElements.get('forgeui-toggle')).toBeDefined();
    expect(customElements.get('forgeui-date-picker')).toBeDefined();
    expect(customElements.get('forgeui-slider')).toBeDefined();
    expect(customElements.get('forgeui-file-upload')).toBeDefined();
  });
});
