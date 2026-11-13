import { expect, test, type Page } from '@playwright/test';

const ran = (page: Page) => page.evaluate(() => window.ran.splice(0));

test('commands resolve by scope, keymap and override, and leave typing and widgets alone', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tests/shortcuts.html');
  await expect(page.locator('[data-command="voucher.save"]')).toHaveCount(2);

  // Focus on the page body: application and mounted screen scopes are active, the focus-only entry scope is not.
  await page.keyboard.press('F1');
  await page.keyboard.press('F5');
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Alt+c');
  await page.keyboard.press('/');
  expect(await ran(page)).toEqual(['app.help', 'voucher.payment', 'voucher.save', 'voucher.copy']);

  // Inside the entry scope the innermost Save wins, Enter advances from a text field, and "/" types instead of running.
  const narration = page.getByRole('textbox', { name: 'Narration' });
  await narration.focus();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Enter');
  await page.keyboard.type('a/b');
  expect(await ran(page)).toEqual(['voucher.save', 'entry.next']);
  expect(await page.locator('[data-command="voucher.save"]').allTextContents()).toEqual(['Save voucher · Voucher · Ctrl+A', 'Save entry · Entry · Ctrl+A']);
  await expect(narration).toHaveValue('a/b');
  await page.getByRole('button', { name: 'Entry button' }).focus();
  await page.keyboard.press('/');
  await page.keyboard.press('Enter');
  expect(await ran(page)).toEqual(['entry.find', 'entry.button']);

  // An open list keeps Enter and Escape; with the list closed Enter advances again.
  const city = page.getByRole('combobox', { name: 'City' });
  await city.focus();
  await page.keyboard.type('Do');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(city).toHaveValue('Doha');
  await page.keyboard.press('Enter');
  expect(await ran(page)).toEqual(['entry.next']);

  // Escape stays with text fields, so a global Escape command never discards typing.
  await narration.focus();
  await page.keyboard.press('Escape');
  await city.focus();
  await page.keyboard.press('Escape');
  expect(await ran(page)).toEqual([]);
  await expect(narration).toHaveValue('a/b');

  // A disabled inner command claims its chord: the outer Save does not run in its place.
  await page.getByRole('button', { name: 'Disable save' }).click();
  await narration.focus();
  await page.keyboard.press('Control+a');
  expect(await ran(page)).toEqual([]);
  expect(await narration.evaluate(input => (input as HTMLInputElement).selectionEnd! - (input as HTMLInputElement).selectionStart!)).toBe(3);
  await page.getByRole('button', { name: 'Enable save' }).click();

  // Keymaps are data: switching keymaps and overriding one command change what runs and what the hints show.
  await page.getByRole('button', { name: 'Web-safe' }).click();
  await expect(page.getByRole('button', { name: /^Save/ })).toHaveText('Save CtrlEnterControl+Enter');
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  await page.keyboard.press('F5');
  await page.keyboard.press('Alt+F5');
  expect(await ran(page)).toEqual(['voucher.payment']);
  await expect(page.locator('#reserved')).toHaveText('none');
  await page.getByRole('button', { name: 'Classic' }).click();
  await expect(page.locator('#reserved')).toHaveText('app.help:F1:browser, voucher.payment:F5:browser, voucher.receipt:F6:browser, voucher.new:Ctrl+N:reserved');
  await page.getByRole('button', { name: 'Move payment to F9' }).click();
  await expect(page.locator('#payment-hint')).toHaveText('Payment F9F9');
  await page.keyboard.press('F5');
  await page.keyboard.press('F9');
  expect(await ran(page)).toEqual(['voucher.payment']);

  // A dialog scopes shortcuts to itself; focus returns and outer commands work again after it closes.
  await page.getByRole('button', { name: 'Open dialog' }).click();
  const dialog = page.getByRole('dialog', { name: 'Confirm posting' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('F1');
  await page.keyboard.press('Control+Enter');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open dialog' })).toBeFocused();
  await page.keyboard.press('F1');
  await page.keyboard.press('Escape');
  expect(await ran(page)).toEqual(['dialog.confirm', 'app.help', 'voucher.close']);
  expect(errors).toEqual([]);
});

test('key hints use Apple symbols, read left to right in RTL and stay inside narrow screens', async ({ page }) => {
  await page.goto('/tests/shortcuts.html?dir=rtl&platform=apple');
  const hint = page.getByRole('button', { name: /^Save/ }).locator('.t98-key-hint');
  await expect(hint.locator('.t98-key-hint__key')).toHaveText(['⌃', 'A']);
  await expect(hint.locator('.t98-visually-hidden')).toHaveText('Control+A');
  expect(await hint.evaluate(element => getComputedStyle(element).direction)).toBe('ltr');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await page.keyboard.press('F1');
  expect(await ran(page)).toEqual(['app.help']);
});

test('a hot letter that opts in matches its key position on an Arabic layout, only inside its focused scope', async ({ page }) => {
  await page.goto('/tests/shortcuts.html');
  const button = page.getByRole('button', { name: /^New entry/ });
  await expect(button.locator('.t98-key-hint__key')).toHaveText(['N']);
  // The Arabic layout types "ى" on the key in the N position.
  const arabicN = (selector: string) => page.locator(selector).evaluate(element => element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ى', code: 'KeyN', bubbles: true, cancelable: true })));
  await button.focus();
  expect(await arabicN('button:has-text("New entry")'), 'the key is cancelled when the command runs').toBe(false);
  await page.keyboard.press('n');
  expect(await ran(page)).toEqual(['menu.new', 'menu.new']);
  // Elsewhere the key types: outside the focused menu scope nothing runs and nothing is cancelled.
  await page.getByRole('textbox', { name: 'Narration' }).focus();
  expect(await arabicN('input[name=narration]')).toBe(true);
  await page.getByRole('button', { name: 'Entry button' }).focus();
  expect(await arabicN('button:has-text("Entry button")')).toBe(true);
  expect(await ran(page)).toEqual([]);
});

test('a keymap entry can give each platform its own chord, and hints show the one that runs', async ({ page }) => {
  for (const [platform, hint, runs, other] of [['other', ['Alt', 'P'], 'Alt+p', 'Control+Shift+p'], ['apple', ['⌃', '⇧', 'P'], 'Control+Shift+p', 'Alt+p']] as const) {
    await page.goto(`/tests/shortcuts.html?platform=${platform === 'apple' ? 'apple' : ''}`);
    const print = page.locator('#print-hint');
    await expect(print.locator('.t98-key-hint__key')).toHaveText([...hint]);
    await expect(page.locator('[data-command="voucher.print"]')).toHaveText(`Print voucher · Voucher · ${platform === 'apple' ? 'Ctrl+Shift+P' : 'Alt+P'}`);
    await page.keyboard.press(other);
    await page.keyboard.press(runs);
    expect(await ran(page), platform).toEqual(['voucher.print']);
    // Command defaults can differ by platform too: web-safe does not bind print, so its keys apply.
    await page.getByRole('button', { name: 'Web-safe' }).click();
    await expect(print.locator('.t98-key-hint__key')).toHaveText([platform === 'apple' ? 'F9' : 'F8']);
  }
});
