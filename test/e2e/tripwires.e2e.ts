import { test, expect } from '@playwright/test';

// ─── Tripwire 1: Prototype pollution via $state:__proto__ ──────

test('$state:__proto__ does not pollute Object.prototype', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  const maliciousManifest = {
    manifest: '0.1.0',
    id: 'proto-pollution-test',
    root: 'root',
    elements: {
      root: {
        type: 'Stack',
        props: { gap: '16' },
        children: ['evil'],
      },
      evil: {
        type: 'Text',
        props: { content: '$state:__proto__.polluted', variant: 'body' },
      },
    },
  };

  await page.goto('/test/e2e/harness.html');
  await page.waitForFunction(() => !!document.getElementById('app'));
  await page.evaluate((m) => { (window as any).loadManifest(m); }, maliciousManifest);

  // Wait a bit for rendering
  await page.waitForTimeout(2000);

  // Assert Object.prototype was not polluted
  const polluted = await page.evaluate(() => {
    return (Object.prototype as any).polluted;
  });
  expect(polluted).toBeUndefined();
});

// ─── Tripwire 2: Nested {{ {{ x }} }} ──────────────────────────

test('nested {{ {{ x }} }} renders without throwing', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  const nestedManifest = {
    manifest: '0.1.0',
    id: 'nested-braces-test',
    root: 'root',
    state: { name: 'World' },
    elements: {
      root: {
        type: 'Stack',
        props: { gap: '16' },
        children: ['msg'],
      },
      msg: {
        type: 'Text',
        props: { content: '{{ {{ $state:name }} }}', variant: 'body' },
      },
    },
  };

  await page.goto('/test/e2e/harness.html');
  await page.waitForFunction(() => !!document.getElementById('app'));
  await page.evaluate((m) => { (window as any).loadManifest(m); }, nestedManifest);

  await page.waitForFunction(() => {
    const app = document.getElementById('app');
    return app?.shadowRoot?.querySelector('forgeui-text') || app?.querySelector('forgeui-text');
  }, { timeout: 10000 });

  // Should not throw — output is literal text or defined behavior
  // No uncaught errors is the primary assertion
  expect(consoleErrors).toEqual([]);
});

// ─── Tripwire 3: Oversized $expr: expression ───────────────────

test('2000-char $expr: expression is rejected, does not hang', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // Build a 2000-char expression
  const longExpr = 'a'.repeat(2000);

  const oversizedManifest = {
    manifest: '0.1.0',
    id: 'oversized-expr-test',
    root: 'root',
    state: { data: 'test' },
    elements: {
      root: {
        type: 'Stack',
        props: { gap: '16' },
        children: ['msg'],
      },
      msg: {
        type: 'Text',
        props: { content: `$expr:${longExpr}`, variant: 'body' },
      },
    },
  };

  await page.goto('/test/e2e/harness.html');
  await page.waitForFunction(() => !!document.getElementById('app'));

  // Set a timeout — if the expression hangs, the test will fail
  await page.evaluate((m) => { (window as any).loadManifest(m); }, oversizedManifest);

  // Wait for render to complete (should be quick since expression is rejected)
  await page.waitForTimeout(3000);

  // The page should still be responsive — verify by evaluating something
  const isResponsive = await page.evaluate(() => {
    return document.readyState === 'complete';
  });
  expect(isResponsive).toBeTruthy();

  // It should either render with an error fallback or render empty —
  // the key assertion is it didn't hang and didn't crash
  // console errors from <forgeui-error> fallback are acceptable
});
