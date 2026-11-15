import { expect, test, type Page } from '@playwright/test';

// A virtualized DataTable (tests/fixtures/print.tsx: a 3,000-row statement). Runs in Chromium and WebKit.
const table = (page: Page, name: string) => page.getByRole('table', { name });
const bodyRows = (page: Page, name: string) => table(page, name).locator('tbody tr:not(.t98-table-spacer)');
const focusedIndex = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('aria-rowindex'));
const watchErrors = (page: Page) => { const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); return errors; };

test('a virtualized statement renders only the rows in view and keeps keyboard, row count and headers complete', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/tests/print.html');
  const statement = table(page, 'Statement');
  await expect(statement).toHaveAttribute('aria-rowcount', '3002');
  await expect(statement.locator('tfoot tr')).toHaveAttribute('aria-rowindex', '3002');
  expect(await bodyRows(page, 'Statement').count()).toBeLessThan(100);
  await expect(statement.locator('thead th[scope="col"]')).toHaveCount(2);
  await expect(statement.locator('thead tr')).toHaveAttribute('aria-rowindex', '1');

  await bodyRows(page, 'Statement').first().focus();
  expect(await focusedIndex(page)).toBe('2');
  await page.keyboard.press('End');
  await expect.poll(() => focusedIndex(page)).toBe('3001');
  await expect(page.locator(':focus')).toContainText('Account 3000');
  // PageUp moves by the rows that fit in the box; arrows still move one row.
  await page.keyboard.press('PageUp');
  const afterPage = Number(await focusedIndex(page));
  expect(afterPage).toBeLessThan(3001 - 3);
  await page.keyboard.press('ArrowUp');
  expect(Number(await focusedIndex(page))).toBe(afterPage - 1);
  await page.keyboard.press('Home');
  await expect.poll(() => focusedIndex(page)).toBe('2');
  // Once the scroll that brought row 2 into view has arrived, the window is back at the top: consecutive positions from
  // row 2. (Until then the focused row is rendered on its own ahead of the old window, by design.)
  const rendered = () => bodyRows(page, 'Statement').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('aria-rowindex'))));
  await expect.poll(async () => { const indexes = await rendered(); return indexes[0] === 2 && indexes.every((index, offset) => index === 2 + offset); }).toBe(true);
  await expect(statement.locator('tbody tr[tabindex="0"]')).toHaveCount(1);

  await page.getByRole('button', { name: 'Find s2500' }).click();
  await expect.poll(() => focusedIndex(page)).toBe('2501');
  await page.keyboard.press('Enter');
  await expect(page.locator('#opened')).toHaveText('s2500');
  expect(errors).toEqual([]);
});

test('PageDown leaves the focused row fully inside the box, below the sticky header', async ({ page }) => {
  await page.goto('/tests/print.html');
  await bodyRows(page, 'Statement').first().focus();
  const box = table(page, 'Statement').locator('xpath=..');
  for (let press = 0; press < 3; press++) {
    await page.keyboard.press('PageDown');
    const [row, frame, header] = await Promise.all([page.locator(':focus').boundingBox(), box.boundingBox(), table(page, 'Statement').locator('thead').boundingBox()]);
    expect(row!.y).toBeGreaterThanOrEqual(frame!.y + header!.height - 1);
    expect(row!.y + row!.height).toBeLessThanOrEqual(frame!.y + frame!.height + 1);
  }
});

test('wheel scrolling and setting scrollTop move the window without errors, and the focused row keeps focus', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/tests/print.html');
  const box = table(page, 'Statement').locator('xpath=..');
  await bodyRows(page, 'Statement').first().focus();
  await box.hover();
  for (let step = 0; step < 30; step++) await page.mouse.wheel(0, 100);
  await expect.poll(() => box.evaluate(node => node.scrollTop)).toBeGreaterThan(2000);
  await expect.poll(async () => Number(await bodyRows(page, 'Statement').nth(2).getAttribute('aria-rowindex'))).toBeGreaterThan(20);
  // The focused first row, scrolled far out of the window, is still rendered and focused.
  expect(await focusedIndex(page)).toBe('2');
  await box.evaluate(node => { node.scrollTop = 5000; });
  await expect.poll(async () => Number(await bodyRows(page, 'Statement').nth(2).getAttribute('aria-rowindex'))).toBeGreaterThan(100);
  await box.evaluate(node => { node.scrollTop = node.scrollHeight; });
  await expect(bodyRows(page, 'Statement').last()).toContainText('Account 3000');
  expect(await bodyRows(page, 'Statement').count()).toBeLessThan(100);
  expect(errors).toEqual([]);
});

test('rows of different heights turn windowing off instead of losing focus', async ({ page }) => {
  // Development builds also warn; this fixture is a production build, so only the fallback is visible here.
  await page.goto('/tests/print.html');
  await expect(bodyRows(page, 'Uneven')).toHaveCount(200);
  await expect(table(page, 'Uneven')).not.toHaveAttribute('aria-rowcount');
  await bodyRows(page, 'Uneven').first().focus();
});

test('a page edge is reported once per key press, not for a held key or while loading', async ({ page }) => {
  await page.goto('/tests/print.html');
  const ledger = bodyRows(page, 'Ledger');
  await ledger.last().focus();
  await page.keyboard.down('ArrowDown');
  await page.keyboard.down('ArrowDown');
  await page.keyboard.down('ArrowDown');
  await page.keyboard.up('ArrowDown');
  expect(await page.evaluate(() => window.edges)).toEqual(['next']);

  await page.goto('/tests/print.html?ledgerLoading=1');
  await bodyRows(page, 'Ledger').last().focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('PageDown');
  expect(await page.evaluate(() => window.edges)).toEqual([]);
});

for (const rows of [5000, 50000]) for (const pause of [30, 0]) {
  test(`wheeling 100px sixty times, ${pause ? `${pause}ms apart` : 'with no wait'}, through ${rows} rows keeps the table mounted`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(`/tests/print.html?rows=${rows}`);
    const box = table(page, 'Statement').locator('xpath=..');
    await box.hover();
    for (let step = 0; step < 60; step++) {
      await page.mouse.wheel(0, 100);
      if (pause) await page.waitForTimeout(pause);
    }
    await expect.poll(() => box.evaluate(node => node.scrollTop)).toBeGreaterThan(3000);
    await expect.poll(async () => Number(await bodyRows(page, 'Statement').first().getAttribute('aria-rowindex'))).toBeGreaterThan(40);
    await expect(table(page, 'Statement')).toHaveAttribute('aria-rowcount', String(rows + 2));
    expect(await bodyRows(page, 'Statement').count()).toBeLessThan(100);
    expect(errors).toEqual([]);
  });
}

test('with CSS zoom on an ancestor, the rendered rows still fill a tall box', async ({ page }) => {
  await page.goto('/tests/print.html');
  const box = table(page, 'Statement').locator('xpath=..');
  await box.evaluate(node => {
    (node.parentElement as HTMLElement).style.zoom = '1.5';
    node.style.maxBlockSize = node.style.blockSize = '48rem';
  });
  // Uncovered screen height at the top and bottom of the box, below the sticky header.
  const gaps = () => box.evaluate(node => {
    const frame = node.getBoundingClientRect(), head = node.querySelector('thead th')!.getBoundingClientRect();
    const rows = [...node.querySelectorAll('tbody tr:not(.t98-table-spacer)')].map(row => row.getBoundingClientRect());
    return [Math.max(0, Math.min(...rows.map(row => row.top)) - head.bottom), Math.max(0, frame.bottom - Math.max(...rows.map(row => row.bottom)))].map(Math.round);
  });
  for (const top of [0, 20_000, 60_000]) {
    await box.evaluate((node, value) => { node.scrollTop = value; }, top);
    // A pixel of rounding where the zoomed header meets the first row.
    await expect.poll(async () => Math.max(...await gaps())).toBeLessThanOrEqual(2);
  }
});
