import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const balances = (page: import('@playwright/test').Page) => page.getByRole('table', { name: 'Balances' }).locator('tbody tr');

test('a print shows the page content as a document: no app chrome or controls, light colours, every table row', async ({ page }) => {
  await page.goto('/tests/print.html?theme=dark');
  await expect(balances(page)).toHaveCount(5);
  await page.emulateMedia({ media: 'print' });

  for (const hidden of ['Ledger navigation', 'Workspace header', 'Tips for this screen.']) await expect(page.getByText(hidden)).toBeHidden();
  await expect(page.getByRole('button', { name: /Print|Export|Next page/ })).toHaveCount(0);
  await expect(page.locator('.t98-key-hint')).toBeHidden();
  await expect(page.locator('.t98-table-toolbar').first()).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Reports', level: 1 })).toBeVisible();
  await expect(page.getByText('Trial balance')).toBeVisible();

  // All twelve rows of the paged table, with the header repeated on each page and no row split across pages.
  await expect(balances(page)).toHaveCount(12);
  const table = page.getByRole('table', { name: 'Balances' });
  expect(await table.locator('thead').evaluate(node => getComputedStyle(node).display)).toBe('table-header-group');
  expect(await balances(page).first().evaluate(node => getComputedStyle(node).breakInside)).toBe('avoid');

  // Full width, light colours on white in the dark theme.
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  expect(await page.locator('main').evaluate(node => node.getBoundingClientRect().width)).toBeGreaterThanOrEqual(width - 1);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(255, 255, 255)');
  expect(await page.getByRole('heading', { name: 'Reports' }).evaluate(node => getComputedStyle(node).color)).toBe('rgb(28, 29, 33)');

  // Back on screen the table shows its page again.
  await page.emulateMedia({ media: 'screen' });
  await expect(balances(page)).toHaveCount(5);
  await expect(page.getByText('Ledger navigation')).toBeVisible();
});

test('a print region prints only itself', async ({ page }) => {
  await page.goto('/tests/print.html?only=1');
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByText('Trial balance')).toBeVisible();
  await expect(balances(page)).toHaveCount(12);
  await expect(page.getByRole('heading', { name: 'Reports' })).toBeHidden();
  await expect(page.locator('#other')).toBeHidden();
  await expect(page.getByRole('table', { name: 'Accounts' })).toBeHidden();
});

test('PageUp and PageDown move ten rows in an activatable table, within its first and last row', async ({ page }) => {
  await page.goto('/tests/print.html');
  const rows = page.getByRole('table', { name: 'Accounts' }).locator('tbody tr');
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
  await expect(page.getByRole('table', { name: 'Accounts' }).locator('tbody tr[tabindex="0"]')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(page.locator('#opened')).toHaveText('a25');
  expect(await page.evaluate(() => scrollY), 'the page itself did not scroll by a page').toBeLessThan(5000);
});

test('print colours match the light theme', () => {
  const read = (file: string) => readFileSync(new URL(`../../src/lib/${file}`, import.meta.url), 'utf8');
  const tokens = (block: string) => new Map([...block.matchAll(/(--t98-[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
  const light = tokens(/:root, \[data-theme='light'\][^{]*\{([^}]*)\}/.exec(read('tokens.css'))![1]);
  const print = tokens(/@media print \{\s*\/\*[^*]*\*\/\s*:root[^{]*\{([^}]*)\}/.exec(read('print.css'))![1]);
  for (const [name, value] of light) if (!name.startsWith('--t98-shadow') && name !== '--t98-bg') assert.equal(print.get(name), value, name);
  assert.equal(print.get('--t98-bg'), '#FFFFFF');
});
