import { expect, test } from '@playwright/test';

test('a wide table in the settings main column scrolls in place instead of widening the page at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/tests/settings-template.html');
  await expect(page.getByRole('table', { name: 'Members' }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('narrow settings show a one-line "Settings: Team" disclosure instead of the full list; wide ones show the list (#85)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/tests/settings-template.html');
  const summary = page.locator('summary', { hasText: 'Settings: Team' });
  await expect(summary).toBeVisible();
  const visibleLinks = page.getByRole('link', { name: 'Security' }).filter({ visible: true });
  await expect(visibleLinks).toHaveCount(0);
  // The settings content starts right below the disclosure, not a screen down.
  const top = await page.getByRole('table', { name: 'Members' }).first().evaluate(element => element.getBoundingClientRect().top);
  expect(top).toBeLessThan(700);
  await summary.click();
  await expect(visibleLinks).toHaveCount(1);
  await visibleLinks.click();
  await expect(page.locator('details.t98-settings-compact-nav')).not.toHaveAttribute('open');

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(summary).toBeHidden();
  await expect(page.getByRole('link', { name: 'Security' }).filter({ visible: true })).toHaveCount(1);
});
