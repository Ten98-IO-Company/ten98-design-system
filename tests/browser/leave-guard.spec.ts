import { expect, test, type Page } from '@playwright/test';

// Count live beforeunload listeners on window, so the test sees when the guard registers one.
async function open(page: Page, query = '') {
  await page.addInitScript(() => {
    const live = new Set<unknown>();
    const add = window.addEventListener.bind(window), remove = window.removeEventListener.bind(window);
    window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => { if (type === 'beforeunload') live.add(listener); add(type, listener, options); }) as typeof window.addEventListener;
    window.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => { if (type === 'beforeunload') live.delete(listener); remove(type, listener, options); }) as typeof window.removeEventListener;
    Object.assign(window, { beforeUnloadListeners: () => live.size });
  });
  await page.goto(`/tests/leave-guard.html${query}`);
  await expect(page.getByRole('heading', { name: 'Ledger', level: 1 })).toBeVisible();
}
type Fixture = { beforeUnloadListeners: () => number; navigate: (to: string) => void; cancelEditor: () => void; blockerRegistrations: number };
const listeners = (page: Page) => page.evaluate(() => (window as unknown as Fixture).beforeUnloadListeners());
const unloadCancelled = (page: Page) => page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; });
const prompt = (page: Page, name = 'Discard unsaved changes?') => page.getByRole('dialog', { name });
const trail = (page: Page) => page.locator('#trail');
const heading = (page: Page, name: string) => page.getByRole('heading', { name, level: 1 });

test('a clean screen never prompts and registers no beforeunload listener', async ({ page }) => {
  await open(page);
  expect(await listeners(page)).toBe(0);
  expect(await unloadCancelled(page)).toBe(false);
  await page.getByRole('button', { name: 'Groups' }).click();
  await expect(heading(page, 'Groups')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trail(page)).toHaveText('went to Groups');
});

test('a dirty screen holds in-app navigation for the prompt: Keep editing stays, Discard changes leaves', async ({ page }) => {
  await open(page);
  const name = page.getByLabel('Ledger name');
  await name.fill('Cash in hand');
  await expect.poll(() => listeners(page)).toBe(1);
  expect(await unloadCancelled(page)).toBe(true);

  const groups = page.getByRole('button', { name: 'Groups' });
  await groups.click();
  await expect(prompt(page)).toBeVisible();
  await expect(prompt(page)).toContainText('Your changes have not been saved.');
  // A danger question starts on Keep editing, so a stray Enter never discards.
  await expect(prompt(page).getByRole('button', { name: 'Keep editing' })).toBeFocused();
  await prompt(page).getByRole('button', { name: 'Keep editing' }).click();
  await expect(prompt(page)).toHaveCount(0);
  await expect(trail(page)).toHaveText('stayed on Ledger');
  await expect(name).toHaveValue('Cash in hand');
  await expect(groups).toBeFocused();

  // Escape answers Keep editing too.
  await groups.click();
  await expect(prompt(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(prompt(page)).toHaveCount(0);
  await expect(trail(page)).toHaveText('stayed on Ledger | stayed on Ledger');

  await groups.click();
  await prompt(page).getByRole('button', { name: 'Discard changes' }).click();
  await expect(heading(page, 'Groups')).toBeVisible();
  await expect(trail(page)).toHaveText('stayed on Ledger | stayed on Ledger | went to Groups');
  await expect.poll(() => listeners(page)).toBe(0);
  expect(await unloadCancelled(page)).toBe(false);
});

test('leave keeps the address while asking, asks once, and moves only after Discard; a settled exit leaves unasked', async ({ page }) => {
  await open(page);
  await page.getByLabel('Ledger name').fill('Petty cash');
  const address = page.url();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(prompt(page)).toBeVisible();
  expect(page.url()).toBe(address);
  await prompt(page).getByRole('button', { name: 'Keep editing' }).click();
  await expect(trail(page)).toHaveText('');
  expect(page.url()).toBe(address);

  await page.getByRole('button', { name: 'Cancel' }).click();
  expect(page.url()).toBe(address);
  await prompt(page).getByRole('button', { name: 'Discard changes' }).click();
  // leave() asked; the router blocker lets that navigation through instead of asking a second time.
  await expect(heading(page, 'Groups')).toBeVisible();
  await expect(page).toHaveURL(/page=Groups/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trail(page)).toHaveText('went to Groups');

  await page.getByRole('button', { name: 'Ledger', exact: true }).click();
  await page.getByLabel('Ledger name').fill('Bank');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(heading(page, 'Groups')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trail(page)).toHaveText('went to Groups | went to Ledger | went to Groups');
});

test('pass lets exactly one asynchronous history step through while still dirty; the next navigation is asked about', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(page).toHaveURL(/step=1/);
  const name = page.getByLabel('Ledger name');
  await name.fill('Petty cash');
  // history.back() lands after pass() has returned, and the screen stays mounted and dirty.
  await page.getByRole('button', { name: 'Save and back', exact: true }).click();
  await expect(page).toHaveURL(/step=0/);
  await expect(trail(page)).toHaveText('went to Ledger 1 | back to Ledger 0');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(name).toHaveValue('Petty cash');

  await page.getByRole('button', { name: 'Groups' }).click();
  await expect(prompt(page)).toBeVisible();
  await prompt(page).getByRole('button', { name: 'Keep editing' }).click();
  await expect(trail(page)).toHaveText('went to Ledger 1 | back to Ledger 0 | stayed on Ledger');
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

test('an unload inside the pass window gets no warning, though the screen is still dirty', async ({ page }) => {
  await open(page);
  const name = page.getByLabel('Ledger name');
  await name.fill('Petty cash');
  const warnings: string[] = [];
  page.on('dialog', dialog => { warnings.push(dialog.type()); void dialog.dismiss(); });
  // Control: an unsettled reload warns, and dismissing the warning stays.
  await page.getByRole('button', { name: 'Reload', exact: true }).click();
  await expect.poll(() => warnings).toEqual(['beforeunload']);
  await expect(name).toHaveValue('Petty cash');

  await page.getByRole('button', { name: 'Save and reload', exact: true }).click();
  await expect(page.getByLabel('Ledger name')).toHaveValue('Cash');
  expect(warnings).toEqual(['beforeunload']);
});

test('overlapping asks share one question, and dirty and confirm are read when a navigation asks', async ({ page }) => {
  await open(page);
  // The router adapter registered shouldBlock once, while the screen was clean; it still asks once the screen is dirty.
  expect(await page.evaluate(() => (window as unknown as Fixture).blockerRegistrations)).toBe(1);
  await page.getByLabel('Ledger name').fill('Petty cash');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(prompt(page)).toBeVisible();
  await expect(page.locator('#pending')).toHaveText('asking');
  // A router navigation while the question is open waits for the same answer.
  await page.evaluate(() => (window as unknown as Fixture).navigate('Groups'));
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(prompt(page)).toBeVisible();
  await expect(trail(page)).toHaveText('');
  await prompt(page).getByRole('button', { name: 'Keep editing' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trail(page)).toHaveText('stayed on Ledger');
  await expect(page.locator('#pending')).toHaveText('idle');
  await expect(heading(page, 'Ledger')).toBeVisible();

  // A confirm supplied after mount is the one used: the screen's own dialog asks, and pending follows it.
  await page.getByLabel("Ask with the screen's dialog").check();
  await page.getByRole('button', { name: 'Groups' }).click();
  await expect(trail(page)).toHaveText('stayed on Ledger | screen dialog asked');
  await expect(page.locator('#pending')).toHaveText('asking');
  await prompt(page).getByRole('button', { name: 'Discard changes' }).click();
  await expect(heading(page, 'Groups')).toBeVisible();
  await expect(trail(page)).toHaveText('stayed on Ledger | screen dialog asked | went to Groups');
});

for (const [label, query, button] of [['the screen’s prompt option', '?voucher=1', 'Groups'], ['a per-exit prompt', '', 'Quit']] as const) {
  test(`a voucher-style question through ${label} starts on its confirm button, so Enter leaves`, async ({ page }) => {
    await open(page, query);
    await page.getByLabel('Ledger name').fill('Petty cash');
    await page.getByRole('button', { name: button, exact: true }).click();
    const quit = prompt(page, 'Quit this voucher?');
    await expect(quit.getByRole('button', { name: 'Quit' })).toBeFocused();
    await expect(quit.getByRole('button', { name: 'Keep editing' })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(heading(page, 'Groups')).toBeVisible();
  });
}

for (const [placement, query] of [['inside the editor', ''], ['beside the editor', '?inside=0']] as const) {
  test(`a prompt ${placement} stacks over a modal Dialog: Escape and Keep editing close only the prompt, cancel() keeps editing, Discard runs the exit`, async ({ page }) => {
    await open(page, query);
    await page.getByRole('button', { name: 'Edit narration' }).click();
    const editor = page.getByRole('dialog', { name: 'Edit narration' });
    const narration = editor.getByLabel('Narration');
    await narration.fill('Closing balance');
    await expect(narration).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(prompt(page)).toBeVisible();
    await expect(trail(page)).toHaveText('editor close escape');
    await page.keyboard.press('Escape');
    await expect(prompt(page)).toHaveCount(0);
    await expect(editor).toBeVisible();
    await expect(narration).toBeFocused();
    await expect(narration).toHaveValue('Closing balance');
    // The prompt's Escape reached neither the editor's close nor its onBeforeClose.
    await expect(trail(page)).toHaveText('editor close escape | editor stayed');

    await page.keyboard.press('Escape');
    await prompt(page).getByRole('button', { name: 'Keep editing' }).click();
    await expect(prompt(page)).toHaveCount(0);
    await expect(editor).toBeVisible();
    await expect(narration).toBeFocused();
    await expect(trail(page)).toHaveText('editor close escape | editor stayed | editor close escape | editor stayed');

    // cancel() from code, as on sign-out: the prompt closes as Keep editing and the exit does not run.
    await page.keyboard.press('Escape');
    await expect(prompt(page)).toBeVisible();
    await expect(editor.locator('#editor-pending')).toHaveText('asking');
    await page.evaluate(() => (window as unknown as Fixture).cancelEditor());
    await expect(prompt(page)).toHaveCount(0);
    await expect(editor).toBeVisible();
    await expect(editor.locator('#editor-pending')).toHaveText('idle');
    await expect(trail(page)).toHaveText(/editor close escape \| editor stayed$/);

    await narration.focus();
    await page.keyboard.press('Escape');
    await prompt(page).getByRole('button', { name: 'Discard changes' }).click();
    await expect(editor).toHaveCount(0);
    await expect(trail(page)).toHaveText(/editor close escape \| editor closed$/);
    await expect(heading(page, 'Ledger')).toBeVisible();
  });
}
