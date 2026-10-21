import { expect, test } from '@playwright/test';

test('an invalid range is reported with its problem so the app can block submission', async ({ page }) => {
  await page.goto('/tests/date-range.html');
  const field = page.getByRole('group', { name: 'Reporting period' });
  const start = field.getByLabel('Start date');
  const last = field.getByLabel('Last day included');
  // The half-open end 8 Oct is shown as the last included day, 7 Oct.
  await expect(last).toHaveValue('2026-10-07');
  await last.fill('2026-10-20');
  await expect(page.locator('#range')).toHaveText('2026-10-01 to 2026-10-21');
  await expect(field.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Apply range' }).click();
  await expect(page.locator('#saved')).toHaveText('2026-10-01/2026-10-21');

  // End before start: reported, explained, both inputs invalid, submission blocked by the app.
  await start.fill('2026-10-25');
  await expect(page.locator('#range')).toHaveText('2026-10-25 to 2026-10-21');
  await expect(field.getByRole('alert')).toHaveText('End date must be on or after the start date.');
  await expect(start).toHaveAttribute('aria-invalid', 'true');
  await expect(last).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('button', { name: 'Apply range' })).toBeDisabled();

  // Longer than 31 days.
  await start.fill('2026-09-01');
  await expect(field.getByRole('alert')).toHaveText('Choose at most 31 days; this range has 50.');
  await expect(page.getByRole('button', { name: 'Apply range' })).toBeDisabled();
  await start.fill('2026-09-21');
  await expect(field.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Apply range' })).toBeEnabled();
});
