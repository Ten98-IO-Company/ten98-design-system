import { expect, test, type Page } from '@playwright/test';

// The voucher screen's additions to EntryGrid (tests/fixtures/entry-grid.tsx with ?voucher=1). Runs in Chromium and WebKit.
const cell = (page: Page, row: number, column: string) => page.getByRole('grid', { name: 'Journal lines' }).getByRole('row').nth(row).getByRole('gridcell').nth(['Date', 'Account', 'Side', 'Amount', 'Quantity', 'Memo', 'Line'].indexOf(column));
const editor = (page: Page, column: string, row: number) => page.getByLabel(`${column}, row ${row}`, { exact: true });
const rows = async (page: Page) => JSON.parse(await page.locator('#rows').textContent() ?? '[]');
const log = (page: Page) => page.evaluate(() => window.log);
const gridStatus = (page: Page) => page.locator('.t98-entry-grid + [role=status]');
const statusLine = (page: Page) => page.locator('#status-line');
const options = (page: Page) => page.getByRole('listbox').getByRole('option');

async function enterGrid(page: Page, query = '?voucher=1') {
  await page.goto(`/tests/entry-grid.html${query}`);
  await page.getByRole('textbox', { name: 'Reference' }).focus();
  await page.keyboard.press('Tab');
}

test('Enter leaves the grid from the empty last line of a balanced entry; unbalanced, it stays and says why', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('cash');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('100');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  // A complete last row still appends the next one; createRow saw the rows and gave it the balancing side.
  await expect(editor(page, 'Date', 2)).toBeFocused();
  expect((await rows(page))[1].side).toBe('credit');
  // Enter on the empty last line of an unbalanced entry stays, and the app's status line says why.
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Date', 2)).toBeFocused();
  await expect(statusLine(page)).toHaveText('Debits and credits differ by 100.00.');
  await expect(gridStatus(page), 'the grid does not speak over the app').toHaveText('');
  // Tab is unchanged: it moves on through the empty line.
  await page.keyboard.press('Tab');
  await expect(editor(page, 'Account', 2)).toBeFocused();
  await page.keyboard.type('bank');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('100');
  // The balancing amount does not leave: entry goes on (a credit line's quantity is read-only) and appends a line.
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Memo', 2)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Date', 3)).toBeFocused();
  // Enter on that empty line leaves: the app removes it and moves focus past the grid.
  await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox', { name: 'Narration' })).toBeFocused();
  expect(await log(page)).toEqual(['end']);
  expect(await rows(page)).toEqual([
    { side: 'debit', account: 'cash', amount: '100.00' },
    { side: 'credit', account: 'bank', amount: '100.00' },
  ]);
});

test('lookups rank options that start with the typed text first, and each row searches its own list', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  // Prefix matches (Cash, Capital) come before a match inside the label (Petty cash), and the first is highlighted.
  await page.keyboard.type('ca');
  await expect(options(page)).toHaveText(['Cash1000', 'Capital3000', 'Petty cash1005', 'Create “ca”']);
  await expect(options(page).first()).toHaveAttribute('aria-selected', 'true');
  // A debit line offers the expense account.
  await page.keyboard.press('Control+a');
  await page.keyboard.type('rent');
  await expect(page.getByRole('option', { name: 'Rent expense' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  // A credit line does not, in the list or for the cell's label.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('t');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await page.keyboard.type('rent');
  await expect(options(page)).toHaveText(['Create “rent”']);
});

test('side cells take the app’s letters as well as each label’s first letter', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  // From the cell: T picks credit and starts editing; B picks debit; C (the label's letter) still picks credit.
  await page.keyboard.press('t');
  await expect(editor(page, 'Side', 1)).toBeFocused();
  await expect(editor(page, 'Side', 1)).toHaveValue('credit');
  await page.keyboard.press('b');
  await expect(editor(page, 'Side', 1)).toHaveValue('debit');
  await page.keyboard.press('c');
  await expect(editor(page, 'Side', 1)).toHaveValue('credit');
  await page.keyboard.press('Shift+B');
  await expect(editor(page, 'Side', 1)).toHaveValue('debit');
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Amount', 1)).toBeFocused();
  expect((await rows(page))[0].side).toBe('debit');
});

test('commit picks the option the list highlights for partly typed text', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.keyboard.type('ba');
  await expect(options(page).first()).toHaveText('Bank1010');
  // Save commits first: the highlighted Bank is stored instead of reporting the text as not listed.
  await page.keyboard.press('Control+s');
  expect(await log(page)).toEqual(['save:']);
  expect((await rows(page))[0].account).toBe('bank');
  await expect(cell(page, 1, 'Account')).not.toContainText('Choose from the list.');
});

test('each commit is reported with the previous and new value, also for Enter on an unchanged cell', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('cash');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('100');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => window.commits)).toEqual(['date:> unchanged', 'account:>cash', 'side:debit>debit unchanged', 'amount:>100.00']);
});

test('a column can be read-only for some rows', async ({ page }) => {
  await enterGrid(page);
  // A debit line's quantity is editable.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.keyboard.type('5');
  await page.keyboard.press('Tab');
  await expect(editor(page, 'Quantity', 1)).toBeFocused();
  // On a credit line it is read-only: Tab skips it and the cell says so.
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(editor(page, 'Side', 1)).toBeFocused();
  await page.keyboard.press('t');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(editor(page, 'Memo', 1)).toBeFocused();
  await expect(cell(page, 1, 'Quantity')).toHaveAttribute('aria-readonly', 'true');
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(cell(page, 1, 'Quantity')).toBeFocused();
});

test('focusCell can open a lookup with its default list, which can switch to the full list', async ({ page }) => {
  await page.goto('/tests/entry-grid.html?voucher=1');
  // Enter in the header field moves into the first line's account with its list shown.
  await page.getByRole('textbox', { name: 'Reference' }).focus();
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Account', 1)).toBeFocused();
  await expect(options(page)).toHaveText(['Cash1000', 'Bank1010', 'Show all accounts']);
  // The last row shows every account, and the list stays open.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(options(page)).toHaveText(['Petty cash1005', 'Cash1000', 'Bank1010', 'Rent expense5100', 'Capital3000']);
  await expect(editor(page, 'Account', 1)).toBeFocused();
  await page.keyboard.type('cap');
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Side', 1)).toBeFocused();
  expect((await rows(page))[0].account).toBe('capital');
  // A stored value from the full list keeps its label.
  await expect(cell(page, 1, 'Account')).toHaveText('Capital');
});

test('editKey null leaves F2 to the app’s command on a focused cell', async ({ page }) => {
  await enterGrid(page);
  await expect(cell(page, 1, 'Date')).toBeFocused();
  await page.keyboard.press('F2');
  expect(await log(page)).toEqual(['f2']);
  await expect(cell(page, 1, 'Date')).toBeFocused();
  // Enter still edits.
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Date', 1)).toBeFocused();
});

test('footer amounts keep left-to-right order on right-to-left pages', async ({ page }) => {
  await enterGrid(page, '?dir=rtl');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await page.keyboard.type('300');
  await page.keyboard.press('Enter');
  const total = page.locator('tfoot .t98-entry-grid--amount');
  await expect(total).toHaveText('300.00 / 0.00');
  expect(await total.evaluate(node => getComputedStyle(node).direction)).toBe('ltr');
  // The debit total is drawn left of the credit total, as typed.
  const [debit, credit] = await total.evaluate(node => {
    const text = node.firstChild!, range = document.createRange();
    const box = (start: number, end: number) => { range.setStart(text, start); range.setEnd(text, end); return range.getBoundingClientRect().left; };
    return [box(0, 6), box(9, 13)];
  });
  expect(debit).toBeLessThan(credit);
});
