import { expect, test, type Page } from '@playwright/test';

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const statusOf = (page: Page, name: string) => page.getByRole('combobox', { name }).locator('xpath=ancestor::div[contains(@class,"t98-combobox")][1]').getByRole('status').last();

for (const theme of ['light', 'dark'] as const) {
  test(`async and multiple-selection comboboxes are operable and reflow in ${theme}`, async ({ page }, info) => {
    const width = info.project.name === 'narrow-dark' ? 320 : 1440;
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(`/tests/combobox.html?theme=${theme}`);

    // Async: typing reports the text, loading keeps old options and is announced, results arrive as supplied.
    const airport = page.getByRole('combobox', { name: 'Airport' });
    const airportList = page.getByRole('listbox', { name: 'Airport' });
    const airportStatus = airport.locator('xpath=ancestor::div[contains(@class,"t98-combobox")][1]').getByRole('status');
    await airport.focus();
    await page.keyboard.type('do');
    expect(await page.evaluate(() => window.searches)).toEqual(['d', 'do']);
    await expect(airportStatus).toHaveText('Loading results');
    await expect(page.getByText('Loading results…')).toBeVisible();
    await expect(airportList.getByRole('option')).toHaveCount(4);
    await page.evaluate(() => window.resolveSearch());
    await expect(airportList.getByRole('option')).toHaveText(['Doha (DOH)']);
    await expect(airportStatus).toHaveText('1 result available');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(airport).toHaveValue('Doha (DOH)');
    expect(await page.locator('input[type=hidden][name=airport]').inputValue()).toBe('DOH');
    expect(await page.evaluate(() => window.searches.at(-1))).toBe('');
    // A failed request is shown and announced; the chosen value keeps its label from valueLabel.
    await page.keyboard.press('Escape');
    await page.keyboard.type('zz');
    await page.evaluate(() => window.resolveSearch());
    await expect(airportStatus).toHaveText('Airports could not load.');
    await expect(page.getByText('Airports could not load.', { exact: true }).first()).toBeVisible();
    await page.keyboard.press('Tab');

    // Multiple: tags, toggling keeps the list open, Backspace removes the last pick, focus returns after removal.
    const destinations = page.getByRole('combobox', { name: 'Destinations' });
    const list = page.getByRole('listbox', { name: 'Destinations', includeHidden: true });
    const tags = page.getByRole('list', { name: 'Selected Destinations' });
    await expect(list).toHaveAttribute('aria-multiselectable', 'true');
    await expect(tags.getByRole('listitem')).toHaveText(['Dubai (DXB)']);
    await destinations.focus();
    await page.keyboard.type('a');
    await expect(list.getByRole('option', { name: 'Dubai (DXB)' })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(destinations).toHaveAttribute('aria-expanded', 'true');
    await expect(destinations).toHaveValue('');
    await expect(tags.getByRole('listitem')).toHaveText(['Dubai (DXB)', 'Doha (DOH)']);
    await expect(statusOf(page, 'Destinations')).toHaveText('Doha (DOH) added');
    await list.getByRole('option', { name: 'Riyadh (RUH)' }).click();
    await expect(tags.getByRole('listitem')).toHaveCount(3);
    await expect(destinations).toBeFocused();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Backspace');
    await expect(tags.getByRole('listitem')).toHaveText(['Dubai (DXB)', 'Doha (DOH)']);
    await expect(statusOf(page, 'Destinations')).toHaveText('Riyadh (RUH) removed');
    const remove = tags.getByRole('button', { name: 'Remove Dubai (DXB)' });
    expect((await remove.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    await remove.click();
    await expect(destinations).toBeFocused();
    await page.getByRole('button', { name: 'Save destinations' }).click();
    await expect(page.locator('#submitted')).toHaveText('DOH');

    expect(await overflow(page), 'no page overflow').toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test('a required MultiCombobox blocks submission only while nothing is picked', async ({ page }) => {
  await page.goto('/tests/combobox.html');
  await page.getByRole('button', { name: 'Remove Dubai (DXB)' }).click();
  await page.getByRole('button', { name: 'Save destinations' }).click();
  await expect(page.locator('#submitted')).toHaveText('');
  expect(await page.getByRole('combobox', { name: 'Destinations' }).evaluate(input => (input as HTMLInputElement).validity.valueMissing)).toBe(true);
});

test('picked options and the highlighted option stay distinguishable in forced colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/tests/combobox.html');
  await page.getByRole('combobox', { name: 'Destinations' }).focus();
  await page.keyboard.press('ArrowDown');
  const options = page.getByRole('listbox', { name: 'Destinations' }).getByRole('option');
  expect(await options.nth(0).locator('svg').evaluate(icon => getComputedStyle(icon).visibility)).toBe('visible');
  expect(await options.nth(1).locator('svg').evaluate(icon => getComputedStyle(icon).visibility)).toBe('hidden');
});

test('MultiCombobox announces only committed picks, enforces its limit and keeps a controlled query', async ({ page }) => {
  await page.goto('/tests/combobox.html');
  const markets = page.getByRole('combobox', { name: 'Markets' });
  const list = page.getByRole('listbox', { name: 'Markets', includeHidden: true });
  const status = markets.locator('xpath=ancestor::div[contains(@class,"t98-combobox")][1]').getByRole('status').last();
  await markets.focus();
  await page.keyboard.type('a');
  await expect(page.locator('#query')).toHaveText('a');
  // The app rejects Abu Dhabi: nothing is added and nothing is announced as added.
  await list.getByRole('option', { name: /Abu Dhabi/ }).click();
  await expect(page.getByText('Abu Dhabi (AUH) is not allowed.')).toBeVisible();
  await expect(status).not.toContainText('added');
  // A disabled option cannot be picked.
  await list.getByRole('option', { name: /Closed market/ }).click({ force: true });
  await expect(page.getByRole('list', { name: 'Selected Markets' })).toHaveCount(0);
  await list.getByRole('option', { name: /Dubai/ }).click();
  await expect(status).toHaveText('Dubai (DXB) added');
  // The controlled query is not cleared by the pick.
  await expect(markets).toHaveValue('a');
  await list.getByRole('option', { name: /Doha/ }).click();
  await expect(page.getByRole('list', { name: 'Selected Markets' }).getByRole('listitem')).toHaveCount(2);
  // At the limit, other options say why they cannot be picked.
  await expect(list.getByRole('option', { name: /Riyadh/ })).toHaveAttribute('aria-disabled', 'true');
  await expect(list.getByRole('option', { name: /Riyadh/ })).toContainText('You can pick up to 2.');
  await list.getByRole('option', { name: /Riyadh/ }).click({ force: true });
  await expect(page.getByRole('list', { name: 'Selected Markets' }).getByRole('listitem')).toHaveCount(2);
});
