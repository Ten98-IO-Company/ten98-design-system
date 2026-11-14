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

test('Enter on the amount that balances leaves the grid without appending; unbalanced, the app’s prefilled line opens with its list', async ({ page }) => {
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
  // Unbalanced: createRow saw the rows and prefilled the balancing line, whose account list is open on its value.
  await expect(editor(page, 'Account', 2)).toBeFocused();
  expect((await rows(page))[1]).toEqual({ side: 'credit', account: 'bank', amount: '100.00' });
  await expect(page.getByRole('option', { name: 'Bank' })).toHaveAttribute('aria-selected', 'true');
  // The grid's messages (the added row, the totals) reach the app's status line, and its own region stays silent.
  await expect(statusLine(page)).toHaveText('Debit / credit: Amount 100.00 / 100.00, Memo Balanced');
  await page.waitForTimeout(300);
  expect(await gridStatus(page).textContent(), 'the grid does not speak over the app').toBe('');
  // Enter keeps the highlighted account; the prefilled amount follows.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Amount', 2)).toHaveValue('100.00');
  // Tab is unchanged: it moves on (a credit line's quantity is read-only) rather than leaving.
  await page.keyboard.press('Tab');
  await expect(editor(page, 'Memo', 2)).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(editor(page, 'Amount', 2)).toBeFocused();
  // Enter on the balancing amount leaves within the key press: the next key lands in the narration.
  await page.keyboard.press('Enter');
  await page.keyboard.type('x');
  await expect(page.getByRole('textbox', { name: 'Narration' })).toHaveValue('x');
  expect(await log(page)).toEqual(['end:balanced']);
  expect(await rows(page)).toHaveLength(2);
  // A blank last line ends the list too, from a cell that is not editing, without going to its missing cells.
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Control+Enter');
  await expect(editor(page, 'Account', 3)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(cell(page, 3, 'Account')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox', { name: 'Narration' })).toBeFocused();
  expect(await log(page)).toEqual(['end:balanced', 'end']);
  await expect(cell(page, 3, 'Account')).not.toContainText('Required.');
});

test('on a blank last line the app’s own focusCell wins over the grid, and a message keeps the cell', async ({ page }) => {
  await enterGrid(page, '?voucher=1&prefill=0');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('cash');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('100');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  // A blank line (single entry), its account list open; Enter there while unbalanced: the app sends focus to the amount.
  await expect(editor(page, 'Account', 2)).toBeFocused();
  await expect(options(page)).toHaveText(['Cash1000', 'Bank1010', 'Show all accounts']);
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Amount', 1)).toBeFocused();
  expect(await log(page)).toEqual(['fix:true']);
  // From a cell that is not editing, the app answers with a message and the cell keeps focus.
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(cell(page, 2, 'Account')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(cell(page, 2, 'Account')).toBeFocused();
  await expect(statusLine(page)).toHaveText('Debits and credits differ by 100.00.');
});

test('in an open lookup, Ctrl+Enter, Ctrl+A and F2 reach the app’s commands, which commit the highlighted option', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.keyboard.type('ba');
  await expect(options(page).first()).toHaveAttribute('aria-selected', 'true');
  // Ctrl+Enter is the app's "insert line" here: it commits Bank first instead of the list picking it.
  await page.keyboard.press('Control+Enter');
  await expect(editor(page, 'Account', 2)).toBeFocused();
  expect((await rows(page)).map((row: Record<string, string>) => row.account)).toEqual(['bank', undefined]);
  await page.keyboard.type('ca');
  await page.keyboard.press('Control+a');
  expect(await log(page)).toEqual(['accept:cash']);
  expect((await rows(page))[1].account).toBe('cash');
  // F2 while editing goes to the app's command too.
  await page.keyboard.type('r');
  await page.keyboard.press('F2');
  expect(await log(page)).toEqual(['accept:cash', 'f2']);
});

test('the clear Escape mode empties the cell being edited, and Escape on a focused cell is the app’s', async ({ page }) => {
  await enterGrid(page, '?voucher=1&escape=clear');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.keyboard.type('50');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(editor(page, 'Amount', 1)).toHaveValue('50.00');
  await page.keyboard.press('Escape');
  await expect(cell(page, 1, 'Amount')).toBeFocused();
  expect((await rows(page))[0].amount).toBe('');
  expect(await page.evaluate(() => window.commits)).toContain('amount:50.00>');
  await page.keyboard.press('Escape');
  expect(await log(page)).toEqual(['back']);
});

test('lookups rank options that start with the typed text first, and each row searches its own list', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  // Prefix matches (Cash, Capital) come before a match inside the label (Petty cash), and the first is highlighted.
  await page.keyboard.type('ca');
  await expect(options(page)).toHaveText(['Cash1000', 'Capital3000', 'Petty cash1005', 'Create “ca”']);
  await expect(options(page).first()).toHaveAttribute('aria-selected', 'true');
  // A debit line offers the expense account. (Ctrl+A is the app's accept command here, so clear by Backspace.)
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
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
  // Opened again, the editor keeps the value and the list (now the full set) highlights it; Enter keeps it.
  await page.getByRole('textbox', { name: 'Reference' }).focus();
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Account', 1)).toHaveValue('Capital');
  await expect(page.getByRole('option', { name: 'Capital' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Side', 1)).toBeFocused();
  expect((await rows(page))[0].account).toBe('capital');
  // focusCell says whether it found the cell.
  expect(await page.evaluate(() => window.grid.current?.focusCell('missing', 'account', { open: true }))).toBe(false);
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

test('commit stores the option the list highlights, also after arrowing and for text with a leading space; with none, it reports', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.keyboard.type('ca');
  await page.keyboard.press('ArrowDown');
  await expect(options(page).nth(1)).toHaveAttribute('aria-selected', 'true');
  // The app's accept command reads the highlighted option and commits exactly that one.
  await page.keyboard.press('Control+a');
  expect(await log(page)).toEqual(['accept:capital']);
  expect((await rows(page))[0].account).toBe('capital');
  // The list filters on the text as typed, leading space included, and commit takes what it shows.
  await editor(page, 'Account', 1).fill(' ca');
  await expect(options(page).first()).toHaveText('Petty cash1005');
  await page.keyboard.press('Control+a');
  expect((await rows(page))[0].account).toBe('petty-cash');
  // Only "Create …" is highlighted: the text names no option, so it is reported and nothing is stored.
  await editor(page, 'Account', 1).fill('zz');
  await expect(options(page)).toHaveText(['Create “zz”']);
  await page.keyboard.press('Control+a');
  await expect(cell(page, 1, 'Account')).toContainText('Choose from the list.');
  expect((await rows(page))[0].account).toBe('petty-cash');
  expect(await log(page)).toEqual(['accept:capital', 'accept:petty-cash']);
});

test('reopening the list from an app command commits the highlighted option, then shows the whole list on it', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.keyboard.type('cash');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Shift+Tab');
  await expect(editor(page, 'Account', 1)).toHaveValue('Cash');
  await page.keyboard.type('ba');
  // F2 is the app's command: it calls focusCell(row, 'account', { open: true }) on the cell being edited. focusCell
  // commits first (the highlighted Bank), then the list opens unfiltered, on that value, with no typed text left.
  await page.keyboard.press('F2');
  await expect(editor(page, 'Account', 1)).toHaveValue('Bank');
  await expect(options(page)).toHaveText(['Cash1000', 'Bank1010', 'Show all accounts']);
  await expect(page.getByRole('option', { name: 'Bank' })).toHaveAttribute('aria-selected', 'true');
  await expect(editor(page, 'Account', 1)).toHaveAttribute('aria-activedescendant', /.+/);
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Side', 1)).toBeFocused();
  expect((await rows(page))[0].account).toBe('bank');
});

test('a list opened for an appended line is open before the next key, so Escape closes it instead of clearing the cell', async ({ page }) => {
  await enterGrid(page, '?voucher=1&escape=clear');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('cash');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('100');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  // Enter appends the line; Escape follows one microtask later, before any other task (a fast typist's next key).
  await editor(page, 'Memo', 1).evaluate(async input => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await Promise.resolve();
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  });
  await expect(editor(page, 'Account', 2)).toBeFocused();
  expect((await rows(page))[1].account).toBe('bank');
});

test('onEnd returning true without moving focus leaves it on the cell and appends nothing', async ({ page }) => {
  await enterGrid(page);
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.keyboard.type('stop');
  await page.keyboard.press('Enter');
  await expect(cell(page, 1, 'Memo')).toBeFocused();
  expect(await log(page)).toEqual(['stop']);
  expect(await rows(page)).toEqual([{ side: 'debit', memo: 'stop' }]);
});

test('creating an option reports the commit, with the committed rows', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Zed');
  await expect(page.getByRole('option', { name: 'Create “Zed”' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(editor(page, 'Side', 1)).toBeFocused();
  expect(await page.evaluate(() => window.commits)).toEqual(['account:>zed']);
  expect(await page.evaluate(() => window.committedRows)).toEqual(['1:zed']);
});

test('side letters are left alone while an input method is composing', async ({ page }) => {
  await enterGrid(page);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await cell(page, 1, 'Side').evaluate(node => node.dispatchEvent(new KeyboardEvent('keydown', { key: 't', isComposing: true, bubbles: true, cancelable: true })));
  await expect(cell(page, 1, 'Side')).toBeFocused();
  await expect(editor(page, 'Side', 1)).toHaveValue('debit');
});

test('emptying a stored account stores an empty value on Shift+Tab, a click elsewhere and an app commit; Enter says it is required', async ({ page }) => {
  await enterGrid(page);
  const account = editor(page, 'Account', 1);
  const pickCash = async () => {
    await page.keyboard.type('cash');
    await page.keyboard.press('Enter');
    await expect(editor(page, 'Side', 1)).toBeFocused();
    expect((await rows(page))[0].account).toBe('cash');
    await page.keyboard.press('Shift+Tab');
    await expect(account).toHaveValue('Cash');
    // The text is selected on entry: Backspace empties it.
    await page.keyboard.press('Backspace');
    await expect(account).toHaveValue('');
  };
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await pickCash();
  // Leaving by Shift+Tab.
  await page.keyboard.press('Shift+Tab');
  await expect(editor(page, 'Date', 1)).toBeFocused();
  expect((await rows(page))[0].account).toBe('');
  // Leaving by a click on another cell.
  await page.keyboard.press('Tab');
  await pickCash();
  await cell(page, 1, 'Memo').click();
  expect((await rows(page))[0].account).toBe('');
  // The app's accept command commits it.
  await cell(page, 1, 'Account').click();
  await pickCash();
  await page.keyboard.press('Control+a');
  expect((await rows(page))[0].account).toBe('');
  // Enter on the emptied, required account stays and says so; Tab moves on with it empty.
  await page.keyboard.press('Enter');
  await expect(account).toBeFocused();
  await expect(cell(page, 1, 'Account')).toContainText('Required.');
  await page.keyboard.press('Tab');
  await expect(editor(page, 'Side', 1)).toBeFocused();
  expect((await rows(page))[0].account).toBe('');
});

test('a picked option is stored by its value, even when that value is another option’s code', async ({ page }) => {
  await enterGrid(page, '?voucher=1&codes=1');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  // Suspense's value is 1010, which is Bank's code: picking Suspense stores Suspense.
  await page.keyboard.type('susp');
  await expect(options(page).first()).toHaveText('Suspense9999');
  await page.keyboard.press('Enter');
  expect((await rows(page))[0].account).toBe('1010');
  await expect(cell(page, 1, 'Account')).toHaveText('Suspense');
  // Typing 1010 names Bank by its code: leaving the cell stores Bank, as does the app's commit.
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.type('1010');
  await cell(page, 1, 'Memo').click();
  expect((await rows(page))[0].account).toBe('bank');
  await cell(page, 1, 'Account').click();
  await page.keyboard.type('1010');
  await page.keyboard.press('Control+a');
  expect((await rows(page))[0].account).toBe('bank');
});
