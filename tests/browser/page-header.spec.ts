import { expect, test } from '@playwright/test';

test('PageHeader takes elements and keeps an unbroken origin inside 320px at 200% text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/tests/page-header.html');
  await expect(page.getByRole('heading', { level: 1, name: 'Analytics for Spring launch microsite' })).toBeVisible();
  await expect(page.locator('.t98-page-description bdi')).toHaveText('https://springlaunchmicrositewithalongunbrokenorigin.example.com');
  // 200% root text, as Discover's containment check does.
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(1);
  const description = page.locator('.t98-page-description');
  expect(await description.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
});
