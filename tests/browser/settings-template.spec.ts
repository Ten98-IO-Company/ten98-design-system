import { expect, test } from '@playwright/test';

test('a wide table in the settings main column scrolls in place instead of widening the page at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/tests/settings-template.html');
  await expect(page.getByRole('table', { name: 'Members' }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
