import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const exampleFiles = readdirSync('examples').filter(f => f.endsWith('.json'));

for (const file of exampleFiles) {
  const manifest = JSON.parse(readFileSync(join('examples', file), 'utf8'));

  test(`${file} loads without errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto('/test/e2e/harness.html');
    await page.waitForFunction(() => !!document.getElementById('app'));

    await page.evaluate((m) => {
      (window as any).loadManifest(m);
    }, manifest);

    // Wait for the forge-app to render something in its shadow root or light DOM
    await page.waitForFunction(() => {
      const app = document.getElementById('app');
      if (!app) return false;
      // Check shadow root has content
      if (app.shadowRoot && app.shadowRoot.children.length > 0) return true;
      // Or check light DOM children
      if (app.children.length > 0) return true;
      return false;
    }, { timeout: 10000 });

    // Assert root element rendered non-empty content
    const hasContent = await page.evaluate(() => {
      const app = document.getElementById('app');
      if (!app) return false;
      const sr = app.shadowRoot;
      if (sr) {
        return sr.textContent!.trim().length > 0 || sr.querySelectorAll('*').length > 0;
      }
      return app.textContent!.trim().length > 0 || app.querySelectorAll('*').length > 0;
    });
    expect(hasContent).toBeTruthy();

    expect(consoleErrors).toEqual([]);
  });
}
