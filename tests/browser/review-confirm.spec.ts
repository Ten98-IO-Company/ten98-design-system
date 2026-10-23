import { expect, test, type Page } from '@playwright/test';

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('ReviewConfirm needs every acknowledgement, resets them when the target changes, and confirms once', async ({ page }, info) => {
  await page.goto(`/tests/review-confirm.html${info.project.name === 'narrow-dark' ? '?theme=dark' : ''}`);
  const panel = page.getByRole('region', { name: /^Send to/ });
  const send = panel.getByRole('button', { name: 'Send now' });
  await expect(send).toHaveAttribute('aria-disabled', 'true');
  await expect(send).toHaveAccessibleDescription('Check all 2 items above to continue.');
  await send.click({ force: true });
  await expect(page.locator('#sent')).toHaveText('');
  await panel.getByLabel('I reviewed the recipient list').check();
  await expect(send).toHaveAccessibleDescription('Check the remaining item above to continue.');
  await panel.getByLabel('I understand sends cannot be undone').check();
  await expect(send).not.toHaveAttribute('aria-disabled', 'true');

  // Changing what is reviewed clears every check and says so.
  await page.getByRole('button', { name: 'Change audience' }).click();
  await expect(panel.getByRole('heading')).toHaveText('Send to Lapsed customers');
  await expect(panel.getByLabel('I reviewed the recipient list')).not.toBeChecked();
  await expect(send).toHaveAttribute('aria-disabled', 'true');
  await expect(panel.getByRole('status')).toHaveText('What you are reviewing changed. Check each item again.');

  await panel.getByLabel('I reviewed the recipient list').check();
  await panel.getByLabel('I understand sends cannot be undone').check();
  await send.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.locator('#sent')).toHaveText('Lapsed customers');
  await expect(send).toBeFocused();
  await expect(panel.getByLabel('I reviewed the recipient list')).toBeDisabled();
  await page.evaluate(() => window.finish());
  await expect(panel.getByLabel('I reviewed the recipient list')).toBeEnabled();
  expect(await overflow(page)).toBeLessThanOrEqual(1);
  const rule = await panel.evaluate(element => getComputedStyle(element).borderInlineStartWidth);
  expect(parseFloat(rule)).toBeGreaterThanOrEqual(3);
});
