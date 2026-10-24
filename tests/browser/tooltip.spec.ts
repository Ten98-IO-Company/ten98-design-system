import { expect, test } from '@playwright/test';

test('a hidden tooltip takes no layout space, so a right-edge trigger does not widen the page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto('/tests/tooltip.html');
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow(), 'hidden').toBeLessThanOrEqual(1);
  // Shown on focus, the bubble stays inside the window too.
  await page.getByRole('button', { name: 'Send' }).focus();
  await expect(page.locator('.t98-tooltip-content')).toBeVisible();
  expect(await overflow(), 'shown').toBeLessThanOrEqual(1);
});
