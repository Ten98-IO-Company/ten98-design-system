import { expect, test, type Locator } from '@playwright/test';

// A command can decline a key press, so the key does what it would do with nothing bound. Runs in Chromium and WebKit.
const press = (field: Locator, init: { key: string; repeat?: boolean; ctrlKey?: boolean }) => field.evaluate((node, { key, repeat = false, ctrlKey = false }) => {
  const event = new KeyboardEvent('keydown', { key, repeat, ctrlKey, bubbles: true, cancelable: true });
  // A listener that throws is reported as a page error; dispatchEvent itself returns normally.
  node.dispatchEvent(event);
  return event.defaultPrevented;
}, init);

test('a command bound to Backspace acts in an empty field and declines elsewhere, so typing still deletes', async ({ page }) => {
  await page.goto('/tests/shortcut-decline.html');
  const first = page.getByRole('textbox', { name: 'First' }), second = page.getByRole('textbox', { name: 'Second' });
  await second.focus();
  await page.keyboard.type('ab');
  // Declined: the browser deletes a character and the command does nothing.
  await page.keyboard.press('Backspace');
  await expect(second).toHaveValue('a');
  // A held repeat of a declined press is left alone too.
  expect(await press(second, { key: 'Backspace', repeat: true })).toBe(false);
  await page.keyboard.press('Backspace');
  await expect(second).toHaveValue('');
  expect(await page.evaluate(() => window.ran)).toEqual([]);
  // Empty: the command runs and the key's default is prevented.
  await page.keyboard.press('Backspace');
  await expect(first).toBeFocused();
  await expect(first).toHaveValue('kept');
  expect(await page.evaluate(() => window.ran)).toEqual(['back']);
});

test('a held repeat of a handled press stays prevented, and a disabled command leaves its key alone', async ({ page }) => {
  await page.goto('/tests/shortcut-decline.html');
  const second = page.getByRole('textbox', { name: 'Second' });
  await second.focus();
  expect(await press(second, { key: 'Backspace' })).toBe(true);
  // The handled press moved focus to First; its held repeat is still the command's.
  const first = page.getByRole('textbox', { name: 'First' });
  expect(await press(first, { key: 'Backspace', repeat: true })).toBe(true);
  await expect(first).toHaveValue('kept');
  expect(await press(first, { key: 'k', ctrlKey: true })).toBe(false);
  expect(await page.evaluate(() => window.ran)).toEqual(['back']);
});

test('a command that throws still cancels its key, and declining after run has returned is ignored', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tests/shortcut-decline.html');
  const second = page.getByRole('textbox', { name: 'Second' });
  await second.focus();
  // Ctrl+S runs a command that throws: the browser's save must not open.
  expect(await press(second, { key: 's', ctrlKey: true })).toBe(true);
  // Ctrl+P declines from a microtask, after run returned: still cancelled.
  expect(await press(second, { key: 'p', ctrlKey: true })).toBe(true);
  expect(await page.evaluate(() => window.ran)).toEqual(['fail', 'late']);
  // The failure is not swallowed: it surfaces as the page's error.
  await expect.poll(() => errors).toEqual(['command failed']);
});
