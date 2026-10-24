import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const evidence = resolve('.qa/data-table');

async function doubleText(page: Page) {
  // Snapshot first: changing a parent before measuring its child would compound inheritance.
  const snapshot = await page.evaluateHandle(() => {
    const sizes = [...document.body.querySelectorAll('*')].filter((element): element is HTMLElement => element instanceof HTMLElement).map(element => {
      const style = getComputedStyle(element);
      return { element, original: element.style.cssText, size: parseFloat(style.fontSize), height: parseFloat(style.lineHeight) };
    });
    for (const { element, size, height } of sizes) {
      element.style.setProperty('font-size', `${size * 2}px`, 'important');
      if (Number.isFinite(height)) element.style.setProperty('line-height', `${height * 2}px`, 'important');
    }
    return sizes;
  });
  return async () => {
    await snapshot.evaluate(sizes => { for (const { element, original } of sizes) element.style.cssText = original; });
    await snapshot.dispose();
  };
}
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const theme of ['light', 'dark'] as const) {
  test(`data tables scroll, stack, stick and report server state in ${theme}`, async ({ page }, info) => {
    const width = info.project.name === 'narrow-dark' ? 320 : 1440;
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto(`/tests/data-table.html?theme=${theme}`);
    const screen = page.locator('#data-table');
    await expect(screen.getByRole('heading', { level: 1, name: 'Data tables' })).toBeVisible();
    expect(await overflow(page), 'no page overflow').toBeLessThanOrEqual(1);

    // Metrics: the unavailable value is text, not zero, and the grid is a labelled list.
    const summary = screen.getByRole('list', { name: 'Summary' });
    await expect(summary.getByRole('listitem')).toHaveCount(3);
    await expect(summary.getByRole('listitem').nth(1)).toContainText('Unavailable');
    await expect(summary.getByRole('listitem').nth(1)).not.toContainText(/\b0\b/);

    // A wide table scrolls inside a focusable region without widening the page.
    const wide = screen.getByRole('region', { name: 'Wide table table' });
    await expect(wide).toHaveAttribute('tabindex', '0');
    const sizes = await wide.evaluate(node => ({ visible: node.clientWidth, content: node.scrollWidth }));
    if (width === 320) expect(sizes.content).toBeGreaterThan(sizes.visible);
    await wide.focus();
    await page.keyboard.press('ArrowRight');
    if (width === 320) await expect.poll(() => wide.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
    expect(await overflow(page), 'a wide table does not widen the page').toBeLessThanOrEqual(1);
    await expect(wide.getByRole('rowheader').first()).toContainText('Campaign 1');
    await expect(wide.getByRole('columnheader', { name: 'Spend' })).toHaveCSS('text-align', 'end');
    await expect(wide.getByRole('cell', { name: 'Not available' })).toHaveCount(1);

    // Stacked rows show label/value pairs at narrow widths and a normal table at wide widths.
    const stacked = screen.getByRole('table', { name: 'Stacked table' });
    const cell = stacked.getByRole('cell').first();
    const labelled = await cell.evaluate(node => ({ label: node.getAttribute('data-label'), display: getComputedStyle(node).display, before: getComputedStyle(node, '::before').content }));
    expect(labelled.label).toBe('Status');
    if (width === 320) {
      expect(labelled.display).toBe('block');
      expect(labelled.before).toBe('"Status"');
      await expect(stacked.getByRole('rowheader').first()).toContainText('Campaign 1');
    } else {
      expect(labelled.display).toBe('table-cell');
      expect(labelled.before).toBe('none');
      expect(await stacked.evaluate(node => getComputedStyle(node).display)).toBe('table');
    }

    // The sticky header stays visible while the body scrolls inside the region.
    const sticky = screen.getByRole('region', { name: 'Sticky table table' });
    const header = sticky.getByRole('columnheader', { name: 'Campaign' });
    await sticky.evaluate(node => { node.scrollTop = 400; });
    await expect.poll(() => sticky.evaluate(node => node.scrollTop)).toBeGreaterThan(100);
    const [region, head] = await Promise.all([sticky.boundingBox(), header.boundingBox()]);
    expect(Math.abs(head!.y - region!.y), 'header pinned to the top of the region').toBeLessThanOrEqual(2);
    await sticky.evaluate(node => { node.scrollTop = 0; });

    // Server table: sort and pager callbacks are reported and the app owns the rows.
    const server = screen.getByRole('table', { name: 'Server table' });
    const status = screen.getByText(/^Last callback:/);
    const clicks = server.getByRole('button', { name: 'Clicks' });
    await clicks.click();
    await expect(status).toHaveText('Last callback: sort clicks asc');
    await expect(server.getByRole('columnheader', { name: 'Clicks' })).toHaveAttribute('aria-sort', 'ascending');
    await clicks.click();
    await expect(status).toHaveText('Last callback: sort clicks desc');
    await expect(server.getByRole('columnheader', { name: 'Clicks' })).toHaveAttribute('aria-sort', 'descending');
    const spend = server.getByRole('button', { name: 'Spend' });
    await spend.focus();
    await page.keyboard.press('Enter');
    await expect(status).toHaveText('Last callback: sort spend asc');
    await page.keyboard.press('Space');
    await expect(status).toHaveText('Last callback: sort spend desc');
    const pager = screen.getByRole('navigation', { name: 'Server table pages' });
    await expect(pager.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await expect(server.getByRole('row')).toHaveCount(3);
    await pager.getByRole('button', { name: 'Next' }).click();
    await expect(status).toHaveText('Last callback: page next 1');
    await expect(pager.getByRole('status')).toHaveText('3–4 of 6');
    await pager.getByRole('button', { name: 'Next' }).click();
    await expect(status).toHaveText('Last callback: page next 2');
    await expect(pager.getByRole('button', { name: 'Next' })).toBeDisabled();
    await pager.getByRole('button', { name: 'Previous' }).click();
    await expect(status).toHaveText('Last callback: page previous 1');

    // Loading and unavailable states are distinct.
    await expect(screen.getByRole('table', { name: 'Loading table' })).toHaveAttribute('aria-busy', 'true');
    await expect(screen.getByRole('status').filter({ hasText: 'Loading records' })).toHaveAttribute('aria-busy', 'true');
    await expect(screen.getByRole('table', { name: 'Loading table' })).not.toContainText('No records found');
    await expect(screen.getByRole('table', { name: 'Unavailable table' })).toContainText('Campaigns could not be loaded.');
    await expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible();

    await mkdir(evidence, { recursive: true });
    await page.screenshot({ path: resolve(evidence, `data-table-${theme}-${width}.png`), fullPage: true, animations: 'disabled' });

    // Doubled text wraps where allowed and never widens the page.
    const restore = await doubleText(page);
    try {
      expect.soft(await overflow(page), 'no page overflow at 200% text').toBeLessThanOrEqual(1);
      await page.screenshot({ path: resolve(evidence, `data-table-${theme}-${width}-2x.png`), fullPage: true, animations: 'disabled' });
    } finally { await restore(); }
    expect(errors).toEqual([]);
  });
}

test('row action buttons keep their label on one line, so rows stay one line tall', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/tests/data-table.html');
  const button = page.locator('.t98-table-actions .t98-button').first();
  await button.waitFor();
  const [buttonHeight, cellHeight] = await button.evaluate(element => [element.getBoundingClientRect().height, element.closest('td')!.getBoundingClientRect().height]);
  expect(buttonHeight).toBeLessThan(48);
  expect(cellHeight).toBeLessThan(72);
});

test('server paging keeps a selection made on an earlier page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/tests/data-table.html');
  const table = page.locator('.t98-data-table').filter({ has: page.getByText('Server table') });
  await table.locator('tbody input[type=checkbox]').first().check();
  const selection = page.locator('#server-selection');
  const before = await selection.textContent();
  expect(before).not.toBe('Selected: none');
  await table.getByRole('button', { name: /next/i }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Last callback: page' })).toBeVisible();
  await expect(selection).toHaveText(before!);
});

for (const width of [1440, 320]) {
  test(`list-detail rows activate, move focus and expand at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/tests/data-table.html');
    const inbox = page.getByRole('table', { name: 'Inbox table' });
    const state = page.locator('#inbox-state');
    await expect(state).toHaveText('Active: none Picked: c2');
    const rows = inbox.locator('tbody tr[tabindex]');
    await expect(rows.nth(1).getByRole('checkbox')).toBeChecked();
    await expect(rows.locator('xpath=self::*[@tabindex="0"]')).toHaveCount(1);

    // A click on a cell activates; checkbox, disclosure and action clicks do not.
    await rows.nth(2).locator('td').nth(3).click();
    await expect(state).toHaveText('Active: c3 Picked: c2');
    await expect(rows.nth(2)).toHaveAttribute('aria-current', 'true');
    await rows.nth(0).getByRole('checkbox').check();
    await rows.nth(0).getByRole('button', { name: 'Reply' }).click();
    await rows.nth(0).getByRole('button', { name: /Details for row 1/ }).click();
    await expect(state).toHaveText('Active: c3 Picked: c2,c1');

    // Keyboard: roving focus, Home/End, Enter and Space.
    await rows.nth(2).focus();
    await page.keyboard.press('ArrowDown');
    await expect(rows.nth(3)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(rows.nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(rows.nth(3)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(rows.nth(0)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(state).toHaveText('Active: c1 Picked: c2,c1');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(state).toHaveText('Active: c2 Picked: c2,c1');

    // Expand and collapse through the disclosure button.
    const toggle = inbox.getByRole('button', { name: /Details for row 1/ });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const detail = inbox.getByText(/Detail for Campaign 1 with/);
    await expect(detail).toBeVisible();
    await expect(inbox.locator(`#${await toggle.getAttribute('aria-controls')}`)).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(detail).toHaveCount(0);
    expect(await overflow(page)).toBeLessThanOrEqual(1);

    // Stacked layout keeps the disclosure and the detail row.
    const stacked = page.getByRole('table', { name: 'Stacked detail table' });
    await stacked.getByRole('button', { name: /Details for row 1/ }).click();
    await expect(stacked.getByText('Stacked detail for c1')).toBeVisible();
    expect(await overflow(page)).toBeLessThanOrEqual(1);
  });
}

test('a large DataTable sorts once per sort change, not again when a row is selected', async ({ page }) => {
  await page.goto('/tests/data-table.html');
  const table = page.getByRole('table', { name: 'Large table' });
  await table.getByRole('button', { name: /Spend/ }).click();
  const afterSort = await page.evaluate(() => window.sortCalls);
  expect(afterSort).toBeGreaterThan(0);
  await table.getByRole('checkbox').nth(1).check();
  await table.getByRole('checkbox').nth(2).check();
  // Visible cells read the same accessor when they re-render (10 rows), but re-sorting 2,000 rows would call it tens of
  // thousands of times (about 68,000 for two selections before the memo).
  expect(await page.evaluate(() => window.sortCalls) - afterSort, 'selecting rows reuses the memoized sort').toBeLessThan(100);
});

test('a filter cell is a named button that applies its filter and stays inside a stacked card at 320px and 200% text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/tests/data-table.html');
  const stacked = page.getByRole('table', { name: 'Stacked table' });
  const chip = stacked.getByRole('button', { name: 'Filter by /campaigns/c1/landingpagewithalongunbrokenpathsegment' });
  await chip.click();
  expect(await page.evaluate(() => window.filterApplied)).toBe('c1');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; } * { font-size: inherit; }' });
  const fit = await chip.evaluate(element => {
    const card = element.closest('tr')!.getBoundingClientRect(), box = element.getBoundingClientRect();
    return { left: box.left - card.left, right: card.right - box.right, page: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  expect(fit.left).toBeGreaterThanOrEqual(-1);
  expect(fit.right).toBeGreaterThanOrEqual(-1);
  expect(fit.page).toBeLessThanOrEqual(1);
});

test('wrapping columns keep their longest word at 320px instead of one letter per line (#76)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/tests/data-table.html');
  const table = page.getByRole('table', { name: 'Wrapped table' });
  // Squeeze the table to its minimum, as wide neighbouring columns do in Campaign: a wrap column must not
  // shrink below its longest word ("deliberately"), or it breaks inside words.
  const fit = await table.evaluate(element => {
    (element as HTMLElement).style.width = '1px';
    const cell = element.querySelector('.t98-table-cell--wrap')!;
    const probe = document.createElement('span'); probe.textContent = 'deliberately'; probe.style.whiteSpace = 'nowrap';
    cell.append(probe); const word = probe.getBoundingClientRect().width; probe.remove();
    const padding = parseFloat(getComputedStyle(cell).paddingInlineStart) + parseFloat(getComputedStyle(cell).paddingInlineEnd);
    return { content: cell.getBoundingClientRect().width - padding, word };
  });
  expect(fit.content).toBeGreaterThanOrEqual(fit.word - 1);
});

test('in right-to-left layouts, headers and plain cells align to the start (right) side', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/tests/data-table.html');
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  const table = page.getByRole('table', { name: 'Wrapped table' });
  for (const cell of [table.getByRole('columnheader').first(), table.getByRole('rowheader').first()]) {
    const placed = await cell.evaluate(element => {
      const box = element.getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(element);
      const text = range.getBoundingClientRect(), style = getComputedStyle(element);
      // Text hugs the start (right) edge: its gap to the right padding edge is smaller than to the left one.
      return { right: box.right - parseFloat(style.paddingRight) - text.right, left: text.left - box.left - parseFloat(style.paddingLeft) };
    });
    expect(placed.right).toBeLessThan(placed.left);
  }
});
