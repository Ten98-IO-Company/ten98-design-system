import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const table = (page: Page, name: string) => page.getByRole('table', { name });
const bodyRows = (page: Page, name: string) => table(page, name).locator('tbody tr:not(.t98-table-spacer)');
const focusedIndex = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('aria-rowindex'));

test('a print shows the page content as a document: no app chrome or controls, black on white, every table row', async ({ page }) => {
  await page.goto('/tests/print.html?theme=dark');
  await expect(bodyRows(page, 'Balances')).toHaveCount(5);
  await page.emulateMedia({ media: 'print' });

  for (const hidden of ['Ledger navigation', 'Workspace header', 'Tips for this screen.']) await expect(page.getByText(hidden)).toBeHidden();
  // Sort buttons print as plain column headers; no other button prints.
  await expect(page.locator('button:visible:not(.t98-sort-button)')).toHaveCount(0);
  await expect(page.locator('.t98-key-hint')).toBeHidden();
  await expect(page.locator('.t98-table-toolbar').first()).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Reports', level: 1 })).toBeVisible();
  // The report's title, scope, source, applied scope and table print in full; its toolbar's controls do not.
  for (const shown of ['Trial balance', 'All accounts', 'Ledger', 'Applied: all accounts, October']) await expect(page.getByText(shown, { exact: true }).first()).toBeVisible();
  await expect(page.locator('.t98-report-toolbar-controls')).toBeHidden();

  // All twelve rows of the paged table, with the header repeated on each page and no row split across pages.
  await expect(bodyRows(page, 'Balances')).toHaveCount(12);
  expect(await table(page, 'Balances').locator('thead').evaluate(node => getComputedStyle(node).display)).toBe('table-header-group');
  expect(await bodyRows(page, 'Balances').first().evaluate(node => getComputedStyle(node).breakInside)).toBe('avoid');
  // No scroll box clips a table: the sticky table's 24rem cap is gone, and the virtualized table prints every row.
  const accountsBox = table(page, 'Accounts').locator('xpath=..');
  expect(await accountsBox.evaluate(node => [getComputedStyle(node).maxBlockSize, getComputedStyle(node).overflowY])).toEqual(['none', 'visible']);
  await expect(bodyRows(page, 'Statement')).toHaveCount(3000);
  // No row tints, except the current-row bar.
  const current = table(page, 'Accounts').locator('tbody tr[aria-current="true"]');
  expect(await current.evaluate(node => [getComputedStyle(node).backgroundColor, getComputedStyle(node).boxShadow])).toEqual(['rgba(0, 0, 0, 0)', 'rgb(89, 67, 206) 3px 0px 0px 0px inset']);

  // Full width, black text on white in the dark theme.
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  expect(await page.locator('main').evaluate(node => node.getBoundingClientRect().width)).toBeGreaterThanOrEqual(width - 1);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(255, 255, 255)');
  expect(await page.getByRole('heading', { name: 'Reports' }).evaluate(node => getComputedStyle(node).color)).toBe('rgb(0, 0, 0)');

  // Back on screen the tables show their page and window again.
  await page.emulateMedia({ media: 'screen' });
  await expect(bodyRows(page, 'Balances')).toHaveCount(5);
  expect(await bodyRows(page, 'Statement').count()).toBeLessThan(100);
  await expect(page.getByText('Ledger navigation')).toBeVisible();
});

test('a print region prints only itself', async ({ page }) => {
  await page.goto('/tests/print.html?only=1');
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByText('Trial balance')).toBeVisible();
  await expect(bodyRows(page, 'Balances')).toHaveCount(12);
  await expect(page.getByRole('heading', { name: 'Reports' })).toBeHidden();
  await expect(page.locator('#other')).toBeHidden();
  await expect(table(page, 'Accounts')).toBeHidden();
});

test('PageUp and PageDown move ten rows in an activatable table, within its first and last row', async ({ page }) => {
  await page.goto('/tests/print.html');
  const rows = bodyRows(page, 'Accounts');
  await rows.first().focus();
  await page.keyboard.press('PageDown');
  await expect(rows.nth(10)).toBeFocused();
  await page.keyboard.press('PageDown');
  await page.keyboard.press('PageDown');
  await expect(rows.nth(24)).toBeFocused();
  await page.keyboard.press('PageUp');
  await expect(rows.nth(14)).toBeFocused();
  await page.keyboard.press('Home');
  await page.keyboard.press('PageUp');
  await expect(rows.nth(0)).toBeFocused();
  // Roving focus is unchanged: one tab stop, on the last focused row, and Enter still activates it.
  await page.keyboard.press('End');
  await expect(table(page, 'Accounts').locator('tbody tr[tabindex="0"]')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(page.locator('#opened')).toHaveText('a25');
});

test('focusRow turns to a row’s page, and a server-paged table reports its edges so the app can load and refocus', async ({ page }) => {
  await page.goto('/tests/print.html');
  await page.getByRole('button', { name: 'Find a12' }).click();
  await expect(bodyRows(page, 'Balances').filter({ hasText: 'Account 12' })).toBeFocused();

  const ledger = bodyRows(page, 'Ledger');
  await ledger.last().focus();
  await page.keyboard.press('ArrowDown');
  await expect(ledger.first()).toContainText('Account 11');
  await expect(ledger.first()).toBeFocused();
  await page.keyboard.press('PageUp');
  await expect(ledger.last()).toContainText('Account 10');
  await expect(ledger.last()).toBeFocused();
});

test('a virtualized statement renders only the rows in view and keeps keyboard, row count and headers complete', async ({ page }) => {
  await page.goto('/tests/print.html');
  const statement = table(page, 'Statement');
  await expect(statement).toHaveAttribute('aria-rowcount', '3001');
  expect(await bodyRows(page, 'Statement').count()).toBeLessThan(100);
  await expect(statement.locator('thead th[scope="col"]')).toHaveCount(2);
  await expect(statement.locator('thead tr')).toHaveAttribute('aria-rowindex', '1');

  await bodyRows(page, 'Statement').first().focus();
  expect(await focusedIndex(page)).toBe('2');
  await page.keyboard.press('End');
  await expect.poll(() => focusedIndex(page)).toBe('3001');
  await expect(page.locator(':focus')).toContainText('Account 3000');
  await expect(page.locator(':focus')).toBeInViewport();
  // PageUp moves by the rows that fit in the box; arrows still move one row.
  await page.keyboard.press('PageUp');
  const afterPage = Number(await focusedIndex(page));
  expect(afterPage).toBeLessThan(3001 - 3);
  await page.keyboard.press('ArrowUp');
  expect(Number(await focusedIndex(page))).toBe(afterPage - 1);
  await page.keyboard.press('Home');
  await expect.poll(() => focusedIndex(page)).toBe('2');
  // Rendered rows carry consecutive positions; one rendered row is the tab stop.
  const indexes = (await bodyRows(page, 'Statement').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('aria-rowindex')))));
  expect(indexes).toEqual(indexes.map((_, offset) => indexes[0] + offset));
  await expect(statement.locator('tbody tr[tabindex="0"]')).toHaveCount(1);

  await page.getByRole('button', { name: 'Find s2500' }).click();
  await expect.poll(() => focusedIndex(page)).toBe('2501');
  await page.keyboard.press('Enter');
  await expect(page.locator('#opened')).toHaveText('s2500');
});

test('print colours are black on white and otherwise match the light theme, and dialogs print no backdrop', () => {
  const read = (file: string) => readFileSync(new URL(`../../src/lib/${file}`, import.meta.url), 'utf8');
  const tokens = (block: string) => new Map([...block.matchAll(/(--t98-[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
  const light = tokens(/:root, \[data-theme='light'\][^{]*\{([^}]*)\}/.exec(read('tokens.css'))![1]);
  const css = read('print.css');
  const print = tokens(/@media print \{\s*\/\*[^*]*\*\/\s*:root[^{]*\{([^}]*)\}/.exec(css)![1]);
  for (const [name, value] of light) if (!name.startsWith('--t98-shadow') && name !== '--t98-bg' && name !== '--t98-text') assert.equal(print.get(name), value, name);
  assert.equal(print.get('--t98-bg'), '#FFFFFF');
  assert.equal(print.get('--t98-text'), '#000000');
  assert.match(css, /\.t98-dialog::backdrop[^{]*\{ background: none;/);
});
