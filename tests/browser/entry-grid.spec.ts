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
  // The first match is highlighted; ArrowDown would move on to "Create “Ca”".
  await page.keyboard.type('Ca');
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

const enterGrid = async (page: Page, query = '') => {
  await page.goto(`/tests/entry-grid.html${query}`);
  await page.getByRole('textbox', { name: 'Reference' }).focus();
  await page.keyboard.press('Tab');
};
const log = (page: Page) => page.evaluate(() => window.log);
const amounts = async (page: Page) => (await rows(page)).map((row: Record<string, string>) => row.amount);
// Every text the status region shows, to tell a repeated announcement from one left in place.
const recordStatus = (page: Page) => page.evaluate(() => {
  const region = document.querySelector('.t98-entry-grid + [role=status]')!;
  const seen: string[] = [];
  new MutationObserver(() => seen.push(region.textContent ?? '')).observe(region, { childList: true, characterData: true, subtree: true });
  (window as unknown as { statusSeen: string[] }).statusSeen = seen;
});
const statusSeen = (page: Page) => page.evaluate(() => (window as unknown as { statusSeen: string[] }).statusSeen);
// Fills line 1 as Cash, Debit, 5.00 and ends on the appended line 2's Date editor.
const fillFirstLine = async (page: Page) => {
  for (const key of ['Enter', 'Enter', 'C', 'a', 'Enter', 'Enter', '5', 'Enter', 'Enter', 'Enter']) await page.keyboard.press(key);
  await expect(editor(page, 'Date', 2)).toBeFocused();
};

test('app commands commit the typed text first; invalid text blocks them, and Escape clears its error', async ({ page }) => {
  await enterGrid(page);
  await recordStatus(page);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  // The first match is highlighted as you type, so Enter picks it without an arrow key.
  await page.keyboard.type('Ca');
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Side', 1)).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.type('500');
  await page.keyboard.press('Control+s');
  expect(await log(page)).toEqual(['save:500.00']);
  await expect(editor(page, 'Amount', 1)).toBeFocused();
  expect((await rows(page))[0]).toMatchObject({ account: 'cash', amount: '500.00' });

  await page.keyboard.press('Control+a');
  await page.keyboard.type('5.555');
  await page.keyboard.press('Control+s');
  await expect(cell(page, 1, 'Amount')).toContainText('Use up to 2 decimal places.');
  expect(await log(page), 'invalid text is not saved').toEqual(['save:500.00']);
  await expect(editor(page, 'Amount', 1)).toBeFocused();
  await expect(editor(page, 'Amount', 1)).toHaveValue('5.555');
  await expect(page.locator('.t98-entry-grid + [role=status]')).toHaveText('Amount, row 1: Use up to 2 decimal places.');
  // The same error again is announced again: the region is emptied before the message returns.
  await page.keyboard.press('Enter');
  const message = 'Amount, row 1: Use up to 2 decimal places.';
  await expect.poll(async () => (await statusSeen(page)).join('|')).toContain(`${message}||${message}`);

  await page.keyboard.press('Escape');
  await expect(cell(page, 1, 'Amount')).toBeFocused();
  await expect(cell(page, 1, 'Amount')).not.toHaveAttribute('aria-invalid');
  await expect(editor(page, 'Amount', 1)).toHaveValue('500.00');

  // Opening the panel commits too.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Control+a');
  await page.keyboard.type('600');
  await page.keyboard.press('Alt+l');
  await expect(page.getByRole('dialog', { name: 'Allocate line 1' })).toBeVisible();
  expect(await amounts(page)).toEqual(['600.00']);
});

test('lookups: a code matches, Tab picks the highlighted option, and closing the list drops partial text', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Ca');
  await page.keyboard.press('Escape');
  await expect(editor(page, 'Account', 1)).toHaveValue('');
  // Nothing is left behind the empty input: Enter reports the empty required cell, not a stale "Ca".
  await page.keyboard.press('Enter');
  await expect(cell(page, 1, 'Account')).toContainText('Required.');
  await expect(cell(page, 1, 'Account')).not.toContainText('Choose from the list.');
  await page.keyboard.type('51');
  await expect(page.getByRole('option', { name: /Rent expense/ })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Side', 1)).toBeFocused();
  await expect(cell(page, 1, 'Account')).toHaveText('Rent expense');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.type('Ba');
  await page.keyboard.press('Tab');
  await expect(editor(page, 'Side', 1)).toBeFocused();
  await expect(cell(page, 1, 'Account')).toHaveText('Bank');
});

test('Tab and Shift+Tab pass through an empty appended row; only Enter stops at a required cell', async ({ page }) => {
  await enterGrid(page);
  const grid = page.getByRole('grid', { name: 'Journal lines' });
  await fillFirstLine(page);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(editor(page, 'Side', 2)).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(editor(page, 'Memo', 1)).toBeFocused();
  await expect(grid.locator('[aria-invalid=true]')).toHaveCount(0);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Account', 2)).toBeFocused();
  await expect(cell(page, 2, 'Account')).toContainText('Required.');
});

test('focus stays in the grid when the only row is removed or the app replaces the rows', async ({ page }) => {
  await enterGrid(page, '?create=0');
  await page.keyboard.press('Control+Delete');
  await expect(page.getByRole('gridcell', { name: 'No rows.' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('gridcell', { name: 'No rows.' })).toBeFocused();

  // Rows that arrive while focus is on the empty-state cell take focus over.
  await page.keyboard.press('Alt+r');
  await expect(cell(page, 1, 'Date')).toBeFocused();

  await enterGrid(page);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Alt+r');
  await expect(cell(page, 1, 'Account')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Alt+r');
  await expect(cell(page, 1, 'Account')).toBeFocused();
});

test('vertical arrows commit line cells, rows insert above and below, and AltGr or an IME starts editing', async ({ page }) => {
  await enterGrid(page);
  const status = page.locator('.t98-entry-grid + [role=status]');
  await page.keyboard.press('Control+Enter');
  await expect(editor(page, 'Date', 2)).toBeFocused();
  await expect(status).toHaveText('Row 2 added.');
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowUp');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.type('7');
  await page.keyboard.press('ArrowDown');
  await expect(editor(page, 'Amount', 2)).toBeFocused();
  await page.keyboard.type('8');
  await page.keyboard.press('ArrowUp');
  await expect(editor(page, 'Amount', 1)).toBeFocused();
  expect(await amounts(page)).toEqual(['7.00', '8.00']);

  await page.keyboard.press('Control+Shift+Enter');
  await expect(editor(page, 'Date', 1)).toBeFocused();
  await expect(status).toHaveText('Row 1 added.');
  expect(await amounts(page)).toEqual([undefined, '7.00', '8.00']);

  await page.keyboard.press('Escape');
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowLeft');
  await expect(cell(page, 1, 'Memo')).toBeFocused();
  const press = (init: { key: string; code: string; ctrlKey?: boolean; altKey?: boolean; modifierAltGraph?: boolean }) => page.evaluate(init => document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })), init);
  await press({ key: '€', code: 'KeyE', ctrlKey: true, altKey: true, modifierAltGraph: true });
  await expect(editor(page, 'Memo', 1)).toBeFocused();
  await page.keyboard.press('Escape');
  await press({ key: 'Process', code: 'KeyA' });
  await expect(editor(page, 'Memo', 1)).toBeFocused();
});

test('app errors are shown and announced like the grid’s own, and focusCell goes to them', async ({ page }) => {
  await enterGrid(page);
  const status = page.locator('.t98-entry-grid + [role=status]');
  await fillFirstLine(page);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Post voucher' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(cell(page, 2, 'Amount')).toBeFocused();
  await expect(cell(page, 2, 'Amount')).toHaveAttribute('aria-invalid', 'true');
  await expect(cell(page, 2, 'Amount')).toHaveAccessibleDescription('Debits and credits differ.');
  await expect(status).toHaveText('Amount, row 2: Debits and credits differ.');
});

test('amounts are parsed by the app, with each row’s decimal places', async ({ page }) => {
  await enterGrid(page, '?currency=KWD');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.type('1.2345');
  await page.keyboard.press('Enter');
  await expect(cell(page, 1, 'Amount')).toContainText('Use up to 3 decimal places.');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Enter');
  await expect(cell(page, 1, 'Amount')).toHaveText('1.234');
  expect((await rows(page))[0]).toMatchObject({ currency: 'KWD', amount: '1.234' });
});

test('leaving a lookup commits text that names one option, and reports other text instead of dropping it', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Cash');
  await page.getByRole('button', { name: 'Post voucher' }).click();
  expect((await rows(page))[0]).toMatchObject({ account: 'cash' });

  await cell(page, 1, 'Account').click();
  await page.keyboard.press('Control+a');
  await page.keyboard.type('1010');
  await page.keyboard.press('Shift+Tab');
  await expect(editor(page, 'Date', 1)).toBeFocused();
  expect((await rows(page))[0]).toMatchObject({ account: 'bank' });

  await page.keyboard.press('Tab');
  await page.keyboard.press('Control+a');
  await page.keyboard.type('Ca');
  await page.keyboard.press('Shift+Tab');
  await expect(cell(page, 1, 'Account')).toContainText('Choose from the list.');
  await expect(cell(page, 1, 'Account')).toContainText('Bank');
  expect((await rows(page))[0]).toMatchObject({ account: 'bank' });
});

test('clicking another cell drops invalid text together with its error', async ({ page }) => {
  await enterGrid(page);
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.type('12.345');
  await page.keyboard.press('Enter');
  await expect(cell(page, 1, 'Amount')).toHaveAttribute('aria-invalid', 'true');
  await cell(page, 1, 'Memo').click();
  await expect(editor(page, 'Memo', 1)).toBeFocused();
  await expect(cell(page, 1, 'Amount')).not.toHaveAttribute('aria-invalid');
  await expect(cell(page, 1, 'Amount')).not.toContainText('Use up to 2 decimal places.');
  expect((await rows(page))[0].amount).toBeUndefined();
});

test('the Enter that ends an IME composition (keyCode 229) does not commit or advance a cell', async ({ page }) => {
  await enterGrid(page);
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.type('Note');
  // Safari ends a composition with an Enter keydown that reports keyCode 229 but isComposing false.
  const imeEnter = (input: HTMLElement) => {
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    Object.defineProperty(event, 'keyCode', { get: () => 229 });
    input.dispatchEvent(event);
  };
  await editor(page, 'Memo', 1).evaluate(imeEnter);
  await expect(editor(page, 'Memo', 1)).toBeFocused();
  expect((await rows(page))[0].memo).toBeUndefined();
  // The same in a lookup cell, which shares the combobox.
  await page.keyboard.press('Escape');
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type('Cash');
  await editor(page, 'Account', 1).evaluate(imeEnter);
  await expect(editor(page, 'Account', 1)).toBeFocused();
  expect((await rows(page))[0].account).toBeUndefined();
  // A real Enter afterwards still commits.
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Side', 1)).toBeFocused();
});

test('a key pressed right after an advance reaches the next cell: select, text, lookup and a created option', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  // No waits between keys, as a fast typist: each one lands in the cell the previous key moved to.
  await page.keyboard.type('Ba');
  await page.keyboard.press('Enter');
  await page.keyboard.press('c');
  await page.keyboard.press('Enter');
  await page.keyboard.type('25');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Fee');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Petty cash');
  await expect(page.getByRole('option', { name: 'Create “Petty cash”' })).toBeVisible();
  // Creating an option moves focus within the key press, before any other task could deliver the next key.
  const focused = await editor(page, 'Account', 2).evaluate(async input => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();
    return document.activeElement?.getAttribute('aria-label');
  });
  expect(focused).toBe('Side, row 2');
  await page.keyboard.press('c');
  await page.keyboard.press('Enter');
  await page.keyboard.type('7');
  await page.keyboard.press('Enter');
  expect((await rows(page)).slice(0, 2)).toEqual([
    { side: 'credit', account: 'bank', amount: '25.00', memo: 'Fee' },
    { side: 'credit', account: 'petty-cash', amount: '7.00' },
  ]);
});

test('a date cell edits, advances and commits on leaving, also where the date input gives the grid no focusin', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Date', 1)).toBeFocused();
  // Enter in the empty optional date advances: the grid knows the editor has focus.
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Account', 1)).toBeFocused();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Home');
  // A date set in the focused editor commits when focus leaves the grid.
  await page.keyboard.press('Enter');
  await editor(page, 'Date', 1).fill('2026-03-15');
  await page.getByRole('textbox', { name: 'Reference' }).click();
  expect((await rows(page))[0].date).toBe('2026-03-15');
});
