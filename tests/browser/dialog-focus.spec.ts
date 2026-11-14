import { expect, test, type Page } from '@playwright/test';

const log = (page: Page) => page.evaluate(() => window.log);
const open = async (page: Page, button: string) => {
  await page.getByRole('button', { name: button, exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
};

test('a dialog starts focus where the caller chose, keeps focus inside and returns it on close', async ({ page }) => {
  await page.goto('/tests/dialog-focus.html');
  const dialog = page.getByRole('dialog');

  // Unchanged default: the browser focuses the first focusable element, the close button.
  await open(page, 'Open default');
  await expect(dialog.getByRole('button', { name: 'Close dialog' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open default' })).toBeFocused();

  await open(page, 'Open field');
  await expect(dialog.getByRole('textbox', { name: 'From' })).toBeFocused();
  await page.keyboard.press('Escape');

  // primary: Enter accepts at once.
  await open(page, 'Open primary');
  await expect(dialog.getByRole('button', { name: 'Apply' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  expect(await log(page)).toEqual(['apply primary']);
  await expect(page.getByRole('button', { name: 'Open primary' })).toBeFocused();

  await open(page, 'Open close');
  await expect(dialog.getByRole('button', { name: 'Close dialog' })).toBeFocused();
  await page.keyboard.press('Escape');

  await open(page, 'Open ref');
  await expect(dialog.getByRole('textbox', { name: 'Note' })).toBeFocused();
  // Focus stays trapped in the modal dialog.
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open ref' })).toBeFocused();
});

test('a confirmation focuses confirm, or cancel when it is destructive, so Enter takes the expected choice', async ({ page }) => {
  await page.goto('/tests/dialog-focus.html');
  const dialog = page.getByRole('dialog');

  await open(page, 'Confirm post');
  await expect(dialog.getByRole('button', { name: 'Go ahead' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();

  await open(page, 'Confirm delete');
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();

  await open(page, 'Confirm purge');
  await expect(dialog.getByRole('button', { name: 'Go ahead' })).toBeFocused();
  await page.keyboard.press('Escape');

  // Confirm waits for typed text, so the field takes focus.
  await open(page, 'Confirm rename');
  await expect(dialog.getByRole('textbox', { name: 'Type Studio to confirm' })).toBeFocused();
  await page.keyboard.type('Studio');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();

  expect(await log(page)).toEqual(['confirm post', 'close post', 'close delete', 'close purge', 'confirm rename', 'close rename']);
  await expect(page.getByRole('button', { name: 'Confirm rename' })).toBeFocused();
});
