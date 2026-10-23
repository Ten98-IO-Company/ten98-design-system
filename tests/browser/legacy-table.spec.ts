import { expect, test } from '@playwright/test';

test('legacy tables stay inside a 320px page: scroll mode scrolls in place, card mode stacks rows', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/tests/legacy-table.html');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 'no page overflow').toBeLessThanOrEqual(1);
  // Scroll mode keeps a wide nowrap table at its content width and scrolls it inside its wrapper.
  const scroller = page.locator('#scroll-table');
  expect(await scroller.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  // A small table is not forced wider than its content (Discover #229/#231): it fits without scrolling.
  expect(await page.locator('#small-table').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
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

for (const direction of ['ltr', 'rtl'] as const) for (const zoom of ['1', '2'] as const) {
  test(`card tables contain long values and chips at 320px, ${direction}, zoom ${zoom}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/tests/legacy-table.html');
    await page.evaluate(({ direction, zoom }) => { document.documentElement.dir = direction; document.body.style.setProperty('zoom', zoom); }, { direction, zoom });
    // Regression for Discover #229: base tables keep cells on one line, which card mode must undo.
    const metrics = await page.evaluate(() => {
      const card = document.querySelector('#chip-table tbody tr')!.getBoundingClientRect();
      const chip = document.querySelector('#chip')!.getBoundingClientRect();
      return { page: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth, cardLeft: card.left, cardRight: card.right, chipLeft: chip.left, chipRight: chip.right, whiteSpace: getComputedStyle(document.querySelector('#chip-table td')!).whiteSpace };
    });
    expect(metrics.page, 'document bounds').toBeLessThanOrEqual(metrics.viewport + 1);
    expect(metrics.whiteSpace).toBe('normal');
    expect(metrics.chipLeft).toBeGreaterThanOrEqual(metrics.cardLeft - 1);
    expect(metrics.chipRight).toBeLessThanOrEqual(metrics.cardRight + 1);
    // The unbreakable domain in a mono span stays inside its card too.
    const mono = await page.locator('#mono-domain').evaluate(element => ({ right: element.getBoundingClientRect().right, whiteSpace: getComputedStyle(element).whiteSpace }));
    expect(mono.whiteSpace).not.toBe('nowrap');
    expect(mono.right).toBeLessThanOrEqual(metrics.cardRight + 1);
  });
}
