import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { expect, test, type Page } from '@playwright/test';

const table = (page: Page, name: string) => page.getByRole('table', { name });
const bodyRows = (page: Page, name: string) => table(page, name).locator('tbody tr:not(.t98-table-spacer)');

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

/** The text of each page of a Chromium PDF: content streams decoded through each font's ToUnicode map. */
function pdfPageTexts(pdf: Buffer): string[] {
  const source = pdf.toString('latin1');
  const objects = new Map<string, { dict: string; stream?: string }>();
  for (const match of source.matchAll(/(\d+) 0 obj([\s\S]*?)endobj/g)) {
    const [, number, body] = match;
    const streamAt = body.search(/stream\r?\n/);
    if (streamAt < 0) { objects.set(number, { dict: body }); continue; }
    const dict = body.slice(0, streamAt);
    const raw = Buffer.from(body.slice(body.indexOf('\n', streamAt) + 1, body.lastIndexOf('endstream')), 'latin1');
    let stream: string | undefined;
    try { stream = (dict.includes('/FlateDecode') ? inflateSync(raw) : raw).toString('latin1'); } catch { stream = undefined; }
    objects.set(number, { dict, stream });
  }
  // Each font's glyph codes are one byte (Type3 fonts) or two (CID fonts), as its code space range says.
  const unicode = new Map<string, { width: number; map: Map<string, string> }>();
  const mapFor = (font: string) => {
    if (unicode.has(font)) return unicode.get(font)!;
    const map = new Map<string, string>();
    const cmap = objects.get(/\/ToUnicode (\d+) 0 R/.exec(objects.get(font)?.dict ?? '')?.[1] ?? '')?.stream ?? '';
    const width = /begincodespacerange\s*<(\w+)>/.exec(cmap)?.[1].length ?? 4;
    const hex = (value: string) => String.fromCodePoint(...(value.match(/.{4}/g) ?? []).map(code => parseInt(code, 16)));
    for (const [, block] of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) for (const [, from, to] of block.matchAll(/<(\w+)>\s*<(\w+)>/g)) map.set(from.toUpperCase().padStart(width, '0'), hex(to));
    for (const [, block] of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) for (const [, low, high, to] of block.matchAll(/<(\w+)>\s*<(\w+)>\s*<(\w+)>/g)) {
      for (let code = parseInt(low, 16); code <= parseInt(high, 16); code++) map.set(code.toString(16).toUpperCase().padStart(width, '0'), String.fromCodePoint(parseInt(to, 16) + code - parseInt(low, 16)));
    }
    unicode.set(font, { width, map });
    return unicode.get(font)!;
  };
  const pages = [...objects.values()].filter(object => /\/Type \/Page\b(?!s)/.test(object.dict));
  return pages.map(page => {
    const fonts = new Map([...(/\/Font <<([^>]*)>>/.exec(page.dict)?.[1] ?? '').matchAll(/\/(\w+) (\d+) 0 R/g)].map(([, name, number]) => [name, number]));
    const contents = [...(/\/Contents (\[[^\]]*\]|\d+ 0 R)/.exec(page.dict)?.[1] ?? '').matchAll(/(\d+) 0 R/g)].map(([, number]) => objects.get(number)?.stream ?? '').join('\n');
    let font = '';
    let text = '';
    for (const [, name, glyphs] of contents.matchAll(/\/(\w+) [\d.]+ Tf|<([0-9A-Fa-f]+)>/g)) {
      if (name) font = fonts.get(name) ?? '';
      else { const { width, map } = mapFor(font); text += (glyphs.match(new RegExp(`.{${width}}`, 'g')) ?? []).map(code => map.get(code.toUpperCase()) ?? '').join(''); }
    }
    return text;
  });
}

test('a printed PDF repeats the table header on every page, sortable columns included', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'page.pdf is Chromium only');
  await page.goto('/tests/print.html?pdf=1');
  await expect(page.getByRole('button', { name: 'Balance' })).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  const pages = pdfPageTexts(await page.pdf({ format: 'A4' }));
  expect(pages.length).toBeGreaterThan(4);
  expect(pages.filter(text => text.includes('Balance')).length, 'pages with the header').toBe(pages.length);
  expect(pages.at(-1)).toContain('Account 300');
});

test('an open dialog is left out of the print', async ({ page }) => {
  await page.goto('/tests/print.html');
  await page.getByRole('button', { name: 'Find s2500' }).focus();
  await page.evaluate(() => {
    const dialog = document.createElement('dialog');
    dialog.className = 't98-dialog';
    dialog.textContent = 'Open dialog';
    document.body.append(dialog);
    dialog.showModal();
  });
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByText('Open dialog')).toBeHidden();
  await expect(page.getByText('Trial balance')).toBeVisible();
});

test('a virtualized table over its print limit prints a notice to use the export instead of its rows', async ({ page }) => {
  await page.goto('/tests/print.html?rows=6000');
  await page.emulateMedia({ media: 'print' });
  const statement = page.getByRole('table', { name: 'Statement' });
  await expect(statement.locator('tbody tr')).toHaveCount(1);
  await expect(statement.locator('tbody')).toHaveText('This table has 6,000 rows, more than the 5,000 that print from the page. Use the export to print it in full.');
  // The other tables still print all their rows, and the screen is unchanged afterwards.
  await expect(bodyRows(page, 'Balances')).toHaveCount(12);
  await page.emulateMedia({ media: 'screen' });
  await expect(statement.locator('tbody tr[aria-rowindex]').first()).toHaveAttribute('aria-rowindex', '2');
  // The app can replace the notice, for example to translate it or name its export.
  await page.goto('/tests/print.html?rows=6000&notice=1');
  await page.emulateMedia({ media: 'print' });
  await expect(statement.locator('tbody')).toHaveText('Statement of 6000 lines: export it, printing stops at 5000.');
});
