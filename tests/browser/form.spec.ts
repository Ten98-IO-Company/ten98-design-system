import { expect, test } from '@playwright/test';

test('Form submits once while pending, locks its controls and returns focus to the submitter', async ({ page }) => {
  await page.goto('/tests/form.html');
  const save = page.getByRole('button', { name: 'Save' });
  await save.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await save.click({ force: true }).catch(() => {});
  await expect(page.locator('#calls')).toHaveText('Spring launch via save');
  await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByLabel('Project name')).toBeDisabled();
  await page.evaluate(() => window.finish());
  await expect(page.getByLabel('Project name')).toBeEnabled();
  await expect(save).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#calls')).toHaveText('Spring launch via save | Spring launch via save');
});

test('the character counter announces near and over the limit once, not on every keystroke', async ({ page }) => {
  await page.goto('/tests/form.html');
  const sms = page.getByLabel('SMS message');
  const status = page.locator('.t98-field').filter({ has: sms }).getByRole('status');
  await sms.fill('x'.repeat(9));
  await expect(status).toHaveText('');
  await sms.fill('x'.repeat(12));
  await expect(status).toHaveText('Approaching the character limit');
  await sms.fill('x'.repeat(23));
  await expect(status).toHaveText('Over the character limit');
  await expect(sms).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('23 / 20 characters, 3 over the limit')).toBeVisible();
});
