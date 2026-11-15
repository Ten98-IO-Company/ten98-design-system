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

test('when the app changes the selection, focus on a row follows it; focus elsewhere stays put', async ({ page }) => {
  await page.goto('/tests/selectable.html');
  const list = page.getByRole('listbox', { name: 'Conversations' });
  const omar = list.getByRole('option', { name: /Omar Saleh/ });
  const sara = list.getByRole('option', { name: /Sara Odeh/ });
  await omar.click();
  await expect(omar).toBeFocused();
  // j selects the next enabled conversation (skipping Archived); focus and selection agree.
  await page.keyboard.press('j');
  await expect(page.locator('#selected')).toHaveText('d');
  await expect(sara).toBeFocused();
  await expect(sara).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('k');
  await expect(page.locator('#selected')).toHaveText('b');
  await expect(omar).toBeFocused();
  // Focus outside the list is never taken.
  const elsewhere = page.getByRole('button', { name: 'Elsewhere' });
  await elsewhere.focus();
  await page.keyboard.press('j');
  await expect(page.locator('#selected')).toHaveText('d');
  await expect(elsewhere).toBeFocused();
  // Arrow keys still move focus without selecting.
  await sara.focus();
  await page.keyboard.press('Home');
  await expect(list.getByRole('option', { name: /Lina Haddad/ })).toBeFocused();
  await expect(page.locator('#selected')).toHaveText('d');
});

test('a selection the app changes in the background leaves focus on the row the user is arrowing through', async ({ page }) => {
  await page.goto('/tests/selectable.html');
  const list = page.getByRole('listbox', { name: 'Conversations' });
  const lina = list.getByRole('option', { name: /Lina Haddad/ });
  const omar = list.getByRole('option', { name: /Omar Saleh/ });
  await page.keyboard.press('Tab');
  await expect(omar).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(lina).toBeFocused();
  // A timer, like a data refresh, selects Sara while the user is on Lina's row.
  await page.evaluate(() => window.selectLater('d', 100));
  await expect(page.locator('#selected')).toHaveText('d');
  await expect(list.getByRole('option', { name: /Sara Odeh/ })).toHaveAttribute('aria-selected', 'true');
  await page.waitForTimeout(100);
  await expect(lina).toBeFocused();
  // A command the user gives from the row still brings focus along.
  await page.keyboard.press('k');
  await expect(page.locator('#selected')).toHaveText('b');
  await expect(omar).toBeFocused();
});
