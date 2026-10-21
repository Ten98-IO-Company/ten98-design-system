import { expect, test } from '@playwright/test';

test('legacy tables stay inside a 320px page: scroll mode scrolls in place, card mode stacks rows', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/tests/legacy-table.html');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 'no page overflow').toBeLessThanOrEqual(1);
  // Scroll mode keeps the 600px table and scrolls inside its wrapper.
  const scroller = page.locator('#scroll-table');
  expect(await scroller.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  // Card mode fits its table to the viewport and labels each value.
  const cards = page.locator('#card-table');
  expect(await cards.locator('table').evaluate(element => element.getBoundingClientRect().width)).toBeLessThanOrEqual(320);
  expect(await cards.locator('td').first().evaluate(element => getComputedStyle(element, '::before').content)).toBe('"Domain"');
});

test('card mode keeps the normal table layout on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/tests/legacy-table.html');
  expect(await page.locator('#card-table td').first().evaluate(element => getComputedStyle(element).display)).toBe('table-cell');
});
