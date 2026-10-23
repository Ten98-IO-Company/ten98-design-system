import { expect, test } from '@playwright/test';

test('SelectableList moves focus with arrows without selecting, selects on Enter, skips disabled items and reflows', async ({ page }, info) => {
  await page.goto(`/tests/selectable.html${info.project.name === 'narrow-dark' ? '?theme=dark' : ''}`);
  const list = page.getByRole('listbox', { name: 'Conversations' });
  await page.keyboard.press('Tab');
  await expect(list.getByRole('option', { name: /Omar Saleh/ })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(list.getByRole('option', { name: /Sara Odeh/ })).toBeFocused();
  await expect(page.locator('#selected')).toHaveText('b');
  await page.keyboard.press('Home');
  await expect(list.getByRole('option', { name: /Lina Haddad/ })).toBeFocused();
  await expect(list.getByRole('option', { name: /Lina Haddad/ })).toHaveAccessibleName(/3 unread/);
  await page.keyboard.press('Enter');
  await expect(page.locator('#selected')).toHaveText('a');
  await expect(list.getByRole('option', { name: /Lina Haddad/ })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(list.getByRole('option', { name: /Sara Odeh/ })).toBeFocused();
  await list.getByRole('option', { name: /Archived/ }).click({ force: true });
  await expect(page.locator('#selected')).toHaveText('a');
  const box = await list.getByRole('option', { name: /Omar/ }).boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(43.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
