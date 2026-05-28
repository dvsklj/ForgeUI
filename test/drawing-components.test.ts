// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import '../src/components/index.js';

describe('drawing component', () => {
  it('registers Drawing from the aggregate entrypoint', () => {
    expect(customElements.get('forgeui-drawing')).toBeDefined();
  });
});
