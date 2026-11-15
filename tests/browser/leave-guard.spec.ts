import { expect, test, type Page } from '@playwright/test';

// Count live beforeunload listeners on window, so the test sees when the guard registers one.
async function open(page: Page) {
  await page.addInitScript(() => {
    const live = new Set<unknown>();
    const add = window.addEventListener.bind(window), remove = window.removeEventListener.bind(window);
    window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => { if (type === 'beforeunload') live.add(listener); add(type, listener, options); }) as typeof window.addEventListener;
    window.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => { if (type === 'beforeunload') live.delete(listener); remove(type, listener, options); }) as typeof window.removeEventListener;
    Object.assign(window, { beforeUnloadListeners: () => live.size });
  });
  await page.goto('/tests/leave-guard.html');
  await expect(page.getByRole('heading', { name: 'Ledger', level: 1 })).toBeVisible();
}
const listeners = (page: Page) => page.evaluate(() => (window as unknown as { beforeUnloadListeners: () => number }).beforeUnloadListeners());
const unloadCancelled = (page: Page) => page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; });

test('a clean screen never prompts and registers no beforeunload listener', async ({ page }) => {
  await open(page);
  expect(await listeners(page)).toBe(0);
  expect(await unloadCancelled(page)).toBe(false);
  await page.getByRole('button', { name: 'Groups' }).click();
  await expect(page.getByRole('heading', { name: 'Groups', level: 1 })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#trail')).toHaveText('went to Groups');
});

test('a dirty screen holds in-app navigation for the prompt: Keep editing stays, Discard changes leaves', async ({ page }) => {
  await open(page);
  const name = page.getByLabel('Ledger name');
  await name.fill('Cash in hand');
  await expect.poll(() => listeners(page)).toBe(1);
  expect(await unloadCancelled(page)).toBe(true);

  const groups = page.getByRole('button', { name: 'Groups' });
  await groups.click();
  const prompt = page.getByRole('dialog', { name: 'Discard unsaved changes?' });
  await expect(prompt).toBeVisible();
  await expect(prompt).toContainText('Your changes have not been saved.');
  await prompt.getByRole('button', { name: 'Keep editing' }).click();
  await expect(prompt).toHaveCount(0);
  await expect(page.locator('#trail')).toHaveText('stayed on Ledger');
  await expect(name).toHaveValue('Cash in hand');
  await expect(groups).toBeFocused();

  // Escape answers Keep editing too.
  await groups.click();
  await expect(prompt).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(prompt).toHaveCount(0);
  await expect(page.locator('#trail')).toHaveText('stayed on Ledger | stayed on Ledger');

  await groups.click();
  await prompt.getByRole('button', { name: 'Discard changes' }).click();
  await expect(page.getByRole('heading', { name: 'Groups', level: 1 })).toBeVisible();
  await expect(page.locator('#trail')).toHaveText('stayed on Ledger | stayed on Ledger | went to Groups');
  await expect.poll(() => listeners(page)).toBe(0);
  expect(await unloadCancelled(page)).toBe(false);
});

test('the screen’s own exit asks once, and a settled exit leaves without asking', async ({ page }) => {
  await open(page);
  await page.getByLabel('Ledger name').fill('Petty cash');
  await page.getByRole('button', { name: 'Cancel' }).click();
  const prompt = page.getByRole('dialog', { name: 'Discard unsaved changes?' });
  await prompt.getByRole('button', { name: 'Keep editing' }).click();
  await expect(page.locator('#trail')).toHaveText('');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await prompt.getByRole('button', { name: 'Discard changes' }).click();
  // leave() asked; the router blocker lets that navigation through instead of asking a second time.
  await expect(page.getByRole('heading', { name: 'Groups', level: 1 })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#trail')).toHaveText('went to Groups');

  await page.getByRole('button', { name: 'Ledger' }).click();
  await page.getByLabel('Ledger name').fill('Bank');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Groups', level: 1 })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#trail')).toHaveText('went to Groups | went to Ledger | went to Groups');
});

test('closing the tab with unsaved work gets the browser’s own warning', async ({ page }) => {
  await open(page);
  await page.getByLabel('Ledger name').fill('Cash in hand');
  const warning = page.waitForEvent('dialog');
  await page.close({ runBeforeUnload: true });
  const dialog = await warning;
  expect(dialog.type()).toBe('beforeunload');
  await dialog.accept();
});
