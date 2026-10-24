import { expect, test } from '@playwright/test';

test('Form submits once while pending, locks its controls and returns focus to the submitter', async ({ page }) => {
  await page.goto('/tests/form.html');
  const save = page.getByRole('button', { name: 'Save' });
  await save.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await save.click({ force: true }).catch(() => {});
  await expect(page.locator('#calls')).toHaveText('Spring launch via save');
  await expect(page.locator('form.t98-form')).toHaveAttribute('aria-busy', 'true');
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

test('an image that fails to load is replaced by a named fallback, and a decorative one stays hidden', async ({ page }) => {
  await page.goto('/tests/form.html');
  await expect(page.getByRole('img', { name: 'Spring launch hero' })).toContainText('Image unavailable');
  await expect(page.locator('img[src="/tests/missing-image.png"]')).toHaveCount(0);
  await expect(page.locator('.t98-image-fallback[aria-hidden="true"]')).toHaveCount(1);
});

test('a dirty Dialog asks before discarding, Escape keeps editing, and submitting closes it once', async ({ page }) => {
  await page.goto('/tests/form.html');
  await page.getByRole('button', { name: 'Edit placement' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit placement' });
  await expect(dialog.getByText('Outdoor placements')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Edit placement' }).click();
  await dialog.getByLabel('Placement name').fill('Dubai Marina billboard, north face');
  await page.keyboard.press('Escape');
  const prompt = dialog.getByRole('alertdialog', { name: 'Discard unsaved changes?' });
  await expect(prompt).toBeVisible();
  await expect(prompt.getByRole('button', { name: 'Keep editing' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(prompt).toBeHidden();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await prompt.getByRole('button', { name: 'Keep editing' }).click();
  await expect(dialog.getByLabel('Placement name')).toHaveValue('Dubai Marina billboard, north face');
  await dialog.getByLabel('Placement name').press('Enter');
  await dialog.getByLabel('Placement name').press('Enter').catch(() => {});
  await expect(dialog).toBeHidden();
  await expect(page.locator('#saved')).toHaveText('Dubai Marina billboard, north face');
  await page.getByRole('button', { name: 'Edit placement' }).click();
  await dialog.getByLabel('Placement name').fill('Changed');
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  // The prompt is inside the modal dialog; Discard closes it and returns focus to the opener.
  await expect(dialog.getByRole('button', { name: 'Keep editing' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Discard changes' })).toBeFocused();
  // A native modal makes the rest of the page inert: Tab cycles the dialog and the browser's own controls, never page content.
  for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); expect(await dialog.evaluate(element => element.contains(document.activeElement) || document.activeElement === document.body)).toBe(true); }
  await dialog.getByRole('button', { name: 'Keep editing' }).focus();
  await dialog.getByRole('button', { name: 'Discard changes' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Edit placement' })).toBeFocused();
  await expect(page.locator('#saved')).toHaveText('Dubai Marina billboard, north face');
});

test('Form forwards its ref, so an app action can submit it from outside', async ({ page }) => {
  await page.goto('/tests/form.html');
  await page.getByRole('button', { name: 'Submit from outside' }).click();
  await expect(page.locator('#calls')).toHaveText('Spring launch via null');
  await page.evaluate(() => window.finish());
});

test('a busy action keeps or returns focus: loading Buttons stay focused, app-disabled ones get it back (#82)', async ({ page }) => {
  await page.goto('/tests/form.html');
  const sync = page.getByRole('button', { name: 'Sync now' });
  await sync.focus();
  await page.keyboard.press('Enter');
  await expect(sync).toHaveAttribute('aria-busy', 'true');
  await expect(sync).toBeFocused();
  // A second press while loading does nothing.
  await page.keyboard.press('Enter');
  await expect(sync).not.toHaveAttribute('aria-busy', 'true');
  await expect(sync).toBeFocused();

  const exportButton = page.getByRole('button', { name: 'Export report' });
  await exportButton.focus();
  await page.keyboard.press('Enter');
  await expect(exportButton).toBeDisabled();
  await expect(exportButton).toBeEnabled();
  await expect(exportButton).toBeFocused();
});
