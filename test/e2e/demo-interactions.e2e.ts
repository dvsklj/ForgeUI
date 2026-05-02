import { test, expect, Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

function manifest(name: string) {
  return JSON.parse(readFileSync(join('examples', `${name}.json`), 'utf8'));
}

async function loadDemo(page: Page, name: string) {
  await page.goto('/test/e2e/harness.html');
  await page.evaluate((m) => {
    (window as any).loadManifest(m);
  }, manifest(name));
  await page.waitForFunction(() => {
    const app = document.getElementById('app') as any;
    return !!app?.getManifest?.() && !!app?.shadowRoot?.querySelector('forgeui-stack, forgeui-card, forgeui-grid');
  });
}

async function stateValue(page: Page, key: string) {
  return page.evaluate((k) => {
    const app = document.getElementById('app') as any;
    return app.getStore().getValue(k);
  }, key);
}

test('feedback form keeps rating, fields, category, and submit status bound', async ({ page }) => {
  await loadDemo(page, '03-feedback-form');

  const slider = page.locator('forgeui-slider input[type="range"]');
  await expect(page.locator('forgeui-slider .value')).toHaveText('3');
  await slider.evaluate((el: HTMLInputElement) => {
    el.value = '5';
    el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
  });
  await expect(page.locator('forgeui-slider .value')).toHaveText('5');
  await expect.poll(() => stateValue(page, 'form/rating')).toBe(5);

  await page.getByLabel('Your Name').fill('Ada Lovelace');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Category').selectOption('support');
  await page.getByLabel('Your Feedback').fill('The component contract feels much better now.');
  await expect.poll(() => stateValue(page, 'form/category')).toBe('support');

  await page.getByRole('button', { name: 'Submit Feedback' }).click();
  await expect(page.getByText('Feedback draft captured locally')).toBeVisible();
});

test('settings panel tabs and controls update Forge state', async ({ page }) => {
  await loadDemo(page, '05-settings-panel');

  await page.getByRole('tab', { name: 'Notifications' }).click();
  await expect.poll(() => stateValue(page, 'settings/tab')).toBe('notifications');
  await expect(page.getByText('Push Notifications')).toBeVisible();

  const push = page.getByRole('switch', { name: 'Push Notifications' });
  await expect(push).toHaveAttribute('aria-checked', 'true');
  await push.click();
  await expect.poll(() => stateValue(page, 'settings/push')).toBe(false);

  await page.getByRole('tab', { name: 'General' }).click();
  const fontSlider = page.locator('forgeui-slider input[type="range"]');
  await fontSlider.evaluate((el: HTMLInputElement) => {
    el.value = '18';
    el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
  });
  await expect.poll(() => stateValue(page, 'settings/fontSize')).toBe(18);
});

test('todo tracker quick add writes through templates into the table-backed list', async ({ page }) => {
  await loadDemo(page, 'todo-tracker');

  await page.getByLabel('New task').fill('Ship a real interactive demo');
  await page.getByRole('button', { name: 'Add' }).click();

  await expect(page.getByText('Ship a real interactive demo')).toBeVisible();
  await expect.poll(async () => {
    return page.evaluate(() => {
      const app = document.getElementById('app') as any;
      return Object.values(app.getStore().getTable('todos')).some((row: any) => row.title === 'Ship a real interactive demo');
    });
  }).toBe(true);
});

test('onboarding wizard fields and stepper are state-bound', async ({ page }) => {
  await loadDemo(page, '04-onboarding-wizard');

  await page.getByLabel('First Name').fill('Grace');
  await page.getByLabel('Last Name').fill('Hopper');
  await expect.poll(() => stateValue(page, 'profile/first')).toBe('Grace');

  await page.getByRole('button', { name: 'Next Step' }).click();
  await expect.poll(() => stateValue(page, 'wizard/step')).toBe(1);
  await expect(page.getByText('Profile captured')).toBeVisible();

  await page.getByRole('button', { name: 'Back' }).click();
  await expect.poll(() => stateValue(page, 'wizard/step')).toBe(0);
});

test('habit tracker checkboxes toggle bound state values', async ({ page }) => {
  await loadDemo(page, '25-habit-tracker');

  const boxes = page.locator('forgeui-checkbox input[type="checkbox"]');
  await expect(boxes.nth(2)).not.toBeChecked();
  await boxes.nth(2).check();
  await expect.poll(() => stateValue(page, 'habits/meditate')).toBe(true);

  await boxes.first().uncheck();
  await expect.poll(() => stateValue(page, 'habits/water')).toBe(false);
});

test('incident command center exercises the tenth demo workflow', async ({ page }) => {
  await loadDemo(page, '06-incident-command-center');

  const severity = page.locator('forgeui-slider input[type="range"]').first();
  await severity.evaluate((el: HTMLInputElement) => {
    el.value = '1';
    el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
  });
  await expect.poll(() => stateValue(page, 'ops/severity')).toBe(1);

  await page.getByLabel('Update channel').selectOption('executive');
  await page.getByRole('button', { name: /post update/i }).click();
  await expect(page.getByText('Update posted for SEV 1 on executive')).toBeVisible();

  await page.getByRole('tab', { name: 'Runbook' }).click();
  await expect.poll(() => stateValue(page, 'ops/view')).toBe('runbook');
  await expect(page.getByText('1. Confirm blast radius')).toBeVisible();
});
