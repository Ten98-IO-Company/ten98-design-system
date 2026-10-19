import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark']) test(`evidence list labels match numeric evidence at 320px in ${theme}`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto(`/?theme=${theme}#components/visual-evidence-frame?tab=states`);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  const state = (name: string) => page.locator('.reference-state').filter({ has: page.getByRole('heading', { name, exact: true }) });
  const coordinates = state('Coordinate groups');
  const evidence = coordinates.getByRole('region', { name: 'Numeric evidence · synthetic page Coordinate groups and depth bands', exact: true });
  await expect(evidence.getByRole('heading', { name: 'Coordinate groups and depth bands', exact: true })).toBeVisible();
  await expect(evidence).toContainText('x 480–540 px, y 140–180 px · 12 observed clicks');
  await expect(evidence).toContainText('75% document depth · 10 of 20 captured documents reached');
  await expect(coordinates.locator('.t98-visual-frame')).toHaveAttribute('data-alignment', 'unknown');
  await expect(coordinates).toContainText('Alignment unknown');
  await expect(coordinates.locator('.t98-visual-overlay')).toHaveCount(0);
  await expect(evidence.getByRole('heading', { name: 'Ranked elements', exact: true })).toHaveCount(0);
  const defaults = state('Aligned').getByRole('region', { name: 'Click evidence · synthetic page ranked elements', exact: true });
  await expect(defaults.getByRole('heading', { name: 'Ranked elements', exact: true })).toBeVisible();
  await expect(state('Access revoked').locator('.t98-visual-ranked')).toHaveCount(0);
  await coordinates.getByText('View TSX for Coordinate groups', { exact: true }).click();
  await expect(coordinates.locator('code')).toContainText('"rankedListLabel": "Coordinate groups and depth bands"');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
});
