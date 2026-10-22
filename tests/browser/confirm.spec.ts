import { expect, test } from '@playwright/test';

test('useConfirmDialog resolves true or false, settles a replaced or unmounted request as false, and returns focus', async ({ page }) => {
  await page.goto('/tests/confirm.html');
  const log = page.locator('#log');
  const revoke = page.getByRole('button', { name: 'Revoke key' });
  await revoke.click();
  const dialog = page.getByRole('dialog', { name: 'Revoke key?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Revoke key' }).click();
  await expect(log).toHaveText('revoke true');
  await expect(revoke).toBeFocused();

  await revoke.click();
  await page.keyboard.press('Escape');
  await expect(log).toHaveText('revoke true | revoke false');
  await expect(revoke).toBeFocused();

  // Type-to-confirm is passed through.
  await page.getByRole('button', { name: 'Delete project' }).click();
  const remove = page.getByRole('dialog', { name: 'Delete project?' });
  await expect(remove.getByRole('button', { name: 'Delete project' })).toBeDisabled();
  await remove.getByLabel('Type Studio to confirm').fill('Studio');
  await remove.getByRole('button', { name: 'Delete project' }).click();
  await expect(log).toHaveText('revoke true | revoke false | delete true');

  // A pending request resolves false when its component unmounts.
  await revoke.click();
  await expect(page.getByRole('dialog', { name: 'Revoke key?' })).toBeVisible();
  await page.evaluate(() => (Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Unmount') as HTMLButtonElement).click());
  await expect(log).toHaveText('revoke true | revoke false | delete true | revoke false');
});

test('a plain Form focuses the first invalid field when field errors arrive', async ({ page }) => {
  await page.goto('/tests/confirm.html');
  await page.getByRole('button', { name: 'Change password' }).click();
  const password = page.getByLabel('New password');
  await expect(password).toBeFocused();
  await expect(password).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Use at least 12 characters.')).toBeVisible();
});
