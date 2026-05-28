// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import '../src/components/index.js';

describe('data components', () => {
  it('registers data primitives from the aggregate entrypoint', () => {
    expect(customElements.get('forgeui-table')).toBeDefined();
    expect(customElements.get('forgeui-list')).toBeDefined();
    expect(customElements.get('forgeui-chart')).toBeDefined();
    expect(customElements.get('forgeui-metric')).toBeDefined();
  });
});
