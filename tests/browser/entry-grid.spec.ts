import { expect, test, type Page } from '@playwright/test';

const cell = (page: Page, row: number, column: string) => page.getByRole('grid', { name: 'Journal lines' }).getByRole('row').nth(row).getByRole('gridcell').nth(['Date', 'Account', 'Side', 'Amount', 'Quantity', 'Memo', 'Line'].indexOf(column));
const editor = (page: Page, column: string, row: number) => page.getByLabel(`${column}, row ${row}`, { exact: true });
const rows = async (page: Page) => JSON.parse(await page.locator('#rows').textContent() ?? '[]');
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('three journal lines are entered by keyboard alone, with a created account, a validation error and an allocation panel', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tests/entry-grid.html');
  const grid = page.getByRole('grid', { name: 'Journal lines' });
  const status = page.locator('.t98-entry-grid + [role=status]');
  // One tab stop: Tab from the field before the grid lands on its first cell.
  await page.getByRole('textbox', { name: 'Reference' }).focus();
  await page.keyboard.press('Tab');
  await expect(cell(page, 1, 'Date')).toBeFocused();
  await expect(grid.locator('[role=gridcell][tabindex="0"]')).toHaveCount(1);

  // Line 1: Enter edits, an empty optional date advances, the lookup picks Cash, the side keeps Debit.
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Date', 1)).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.type('Ca');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Side', 1)).toBeFocused();
  await page.keyboard.press('Enter');
  // Too many decimal places: the cell keeps the text, shows and announces why, and does not advance.
  await page.keyboard.type('12.345');
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Amount', 1)).toBeFocused();
  await expect(editor(page, 'Amount', 1)).toHaveValue('12.345');
  await expect(cell(page, 1, 'Amount')).toContainText('Use up to 2 decimal places.');
  await expect(editor(page, 'Amount', 1)).toHaveAccessibleDescription('Use up to 2 decimal places.');
  await expect(status).toHaveText('Amount, row 1: Use up to 2 decimal places.');
  await page.keyboard.press('Control+a');
  await page.keyboard.type('1,250');
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Quantity', 1)).toBeFocused();
  await expect(cell(page, 1, 'Amount')).toHaveText('1250.00');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Opening balance');
  // The read-only Line column is skipped; a complete last row appends the next one.
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Date', 2)).toBeFocused();
  await expect(status).toHaveText('Row 2 added.');

  // Line 2: an unknown account is created in place through the app's callback.
  await page.keyboard.press('Tab');
  await page.keyboard.type('Petty cash');
  await expect(page.getByRole('option', { name: 'Create “Petty cash”' })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Side', 2)).toBeFocused();
  expect(await page.evaluate(() => window.log)).toEqual(['create:Petty cash']);
  await page.keyboard.press('c');
  await page.keyboard.press('Tab');
  await page.keyboard.type('1000');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  // Line 3.
  await expect(editor(page, 'Date', 3)).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.type('Ba');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.keyboard.press('c');
  await page.keyboard.press('Enter');
  await page.keyboard.type('250');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Date', 4)).toBeFocused();
  await expect(grid.locator('tfoot')).toContainText('1250.00 / 1250.00');
  expect((await rows(page)).slice(0, 3)).toEqual([
    { side: 'debit', account: 'cash', amount: '1250.00', memo: 'Opening balance' },
    { side: 'credit', account: 'petty-cash', amount: '1000.00' },
    { side: 'credit', account: 'bank', amount: '250.00' },
  ]);

  // Backspace in an empty cell and Shift+Tab move back; Escape stops editing and keeps the cell.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Backspace');
  await expect(editor(page, 'Date', 4)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(cell(page, 4, 'Date')).toBeFocused();

  // A sub-panel opened by an app command returns focus to the originating cell.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowRight');
  await expect(cell(page, 3, 'Account')).toBeFocused();
  await page.keyboard.press('Alt+l');
  const panel = page.getByRole('dialog', { name: 'Allocate line 3' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('textbox', { name: 'Cost centre' })).toBeFocused();
  await page.keyboard.type('CC-7');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(panel).toBeHidden();
  await expect(cell(page, 3, 'Account')).toBeFocused();
  expect(Object.values(JSON.parse(await page.locator('#allocations').textContent() ?? '{}'))).toEqual(['CC-7']);

  // An app command removes the empty fourth row; Escape outside editing is the app's: it leaves the grid.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Control+Delete');
  await expect(grid.locator('tbody [role=row]')).toHaveCount(3);
  await expect(status).toHaveText('Row 4 removed.');
  await expect(cell(page, 3, 'Account')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Post voucher' })).toBeFocused();
  expect(await page.evaluate(() => window.log)).toEqual(['create:Petty cash', 'back']);
  expect(await overflow(page), 'the grid scrolls inside its box').toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('arrow keys follow the reading direction in right-to-left pages and amounts stay left to right', async ({ page }) => {
  await page.goto('/tests/entry-grid.html?dir=rtl');
  await page.getByRole('textbox', { name: 'Reference' }).focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowLeft');
  await expect(cell(page, 1, 'Account')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(cell(page, 1, 'Date')).toBeFocused();
  await page.keyboard.press('End');
  await expect(cell(page, 1, 'Line')).toBeFocused();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(cell(page, 1, 'Amount')).toBeFocused();
  // Arabic-Indic digits are normalised to a decimal string. (Playwright inserts them as text, so edit first.)
  await page.keyboard.press('Enter');
  await page.keyboard.type('٣٠٠');
  await page.keyboard.press('Enter');
  await expect(cell(page, 1, 'Amount')).toHaveText('300.00');
  expect(await cell(page, 1, 'Amount').locator('.t98-entry-grid__value').evaluate(node => getComputedStyle(node).direction)).toBe('ltr');
  expect(await overflow(page)).toBeLessThanOrEqual(1);
});
