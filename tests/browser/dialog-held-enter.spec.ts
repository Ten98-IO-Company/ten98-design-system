import { expect, test, type Page } from '@playwright/test';

// One keypress must never both open a dialog and confirm it. A held key reaches the dialog as auto-repeated keydowns
// (Playwright reports a second down() of a pressed key as a repeat) and, for Space, as the keyup that activates a button.
const log = (page: Page) => page.evaluate(() => window.log);
const cases = [
  { name: 'publish', kind: 'ConfirmDialog', opener: 'Publish post', title: 'Publish this post?', confirm: 'Publish', entry: 'publish' },
  { name: 'ads', kind: 'useConfirmDialog', opener: 'Enable paid ads', title: 'Enable paid ads?', confirm: 'Enable ads', entry: 'ads true' },
  { name: 'sms', kind: "useConfirmDialog with initialFocus 'confirm'", opener: 'Send test SMS', title: 'Send a test SMS?', confirm: 'Send SMS', entry: 'sms true' },
  { name: 'apply', kind: "Dialog with initialFocus 'primary'", opener: 'Change budget', title: 'Change budget?', confirm: 'Apply', entry: 'apply' },
];

async function hold(page: Page, key: string, repeats = 6) {
  for (let i = 0; i < repeats; i++) await page.keyboard.down(key);
  await page.keyboard.up(key);
}

for (const item of cases) {
  test(`${item.kind}: holding Enter on its opener opens it without confirming, then a fresh Enter confirms once`, async ({ page }) => {
    await page.goto('/tests/dialog-held-enter.html');
    const dialog = page.getByRole('dialog', { name: item.title });
    await page.getByRole('button', { name: item.opener, exact: true }).focus();
    await page.keyboard.down('Enter');
    await expect(dialog).toBeVisible();
    await hold(page, 'Enter');
    await expect(dialog).toBeVisible();
    expect(await log(page)).toEqual([]);

    const confirm = dialog.getByRole('button', { name: item.confirm, exact: true });
    await confirm.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    expect(await log(page)).toEqual([item.entry]);
  });

  test(`${item.kind}: a held Space neither confirms when it opens the dialog nor when the dialog appears mid-hold`, async ({ page }) => {
    await page.goto('/tests/dialog-held-enter.html');
    const dialog = page.getByRole('dialog', { name: item.title });
    const opener = page.getByRole('button', { name: item.opener, exact: true });

    // Space activates on release, so a held Space on the opener opens the dialog only when it is let go.
    await opener.focus();
    await hold(page, ' ');
    await expect(dialog).toBeVisible();
    expect(await log(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    // The promise-style confirmations log their Escape answer.
    const escaped = item.kind.startsWith('useConfirmDialog') ? [`${item.name} false`] : [];
    expect(await log(page)).toEqual(escaped);

    // A dialog that opens while Space is already held: the repeats and the release land on its focused button.
    await opener.focus();
    await page.keyboard.down(' ');
    await page.evaluate(name => window.openers[name](), item.name);
    await expect(dialog).toBeVisible();
    await hold(page, ' ');
    await expect(dialog).toBeVisible();
    expect(await log(page)).toEqual(escaped);

    const confirm = dialog.getByRole('button', { name: item.confirm, exact: true });
    await confirm.focus();
    await page.keyboard.press(' ');
    await expect(dialog).toBeHidden();
    expect(await log(page)).toEqual([...escaped, item.entry]);
  });
}

test('Enter held from opening is ignored even when the browser does not mark its keydowns as repeats', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Sends raw keydowns through the Chrome DevTools Protocol');
  await page.goto('/tests/dialog-held-enter.html');
  const cdp = await page.context().newCDPSession(page);
  const enter = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' };
  for (const item of cases) {
    const dialog = page.getByRole('dialog', { name: item.title });
    await page.getByRole('button', { name: item.opener, exact: true }).focus();
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...enter });
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 3; i++) await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...enter, autoRepeat: false });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...enter });
    await expect(dialog).toBeVisible();
    expect(await log(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.evaluate(() => { window.log = []; });
  }
});

test('a held Enter does not submit a dialog form from its field; a fresh Enter there submits once', async ({ page }) => {
  await page.goto('/tests/dialog-held-enter.html');
  const dialog = page.getByRole('dialog', { name: 'Add a note' });
  await page.getByRole('button', { name: 'Add note', exact: true }).focus();
  await page.keyboard.down('Enter');
  await expect(dialog.getByRole('textbox', { name: 'Note' })).toBeFocused();
  await hold(page, 'Enter');
  await expect(dialog).toBeVisible();
  expect(await log(page)).toEqual([]);

  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  expect(await log(page)).toEqual(['note Ready']);
});

test('holding Space in a dialog text field types repeated spaces and neither confirms nor submits', async ({ page }) => {
  await page.goto('/tests/dialog-held-enter.html');
  const dialog = page.getByRole('dialog', { name: 'Add a note' });
  await page.getByRole('button', { name: 'Add note', exact: true }).click();
  const note = dialog.getByRole('textbox', { name: 'Note' });
  await expect(note).toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.down(' ');
  await hold(page, ' ');
  await expect(note).toHaveValue(/^Ready {2,}$/);
  await expect(dialog).toBeVisible();
  expect(await log(page)).toEqual([]);
});

test('confirmations start on Cancel, or on the field they wait for; opened by mouse, a deliberate Enter answers at once', async ({ page }) => {
  await page.goto('/tests/dialog-held-enter.html');
  const dialog = page.getByRole('dialog');

  for (const opener of ['Publish post', 'Enable paid ads']) {
    await page.getByRole('button', { name: opener, exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
  }
  expect(await log(page)).toEqual(['ads false']);

  // Typed confirmation, danger or not, focuses its field: confirm stays disabled until the text matches.
  for (const name of ['Rename', 'Delete']) {
    await page.getByRole('button', { name: `${name} project`, exact: true }).click();
    await expect(dialog.getByRole('textbox', { name: 'Type Studio to confirm' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }

  // An explicit initialFocus 'confirm' still starts on confirm; a dialog opened by mouse takes the first Enter.
  await page.getByRole('button', { name: 'Send test SMS', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Send SMS' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Change budget', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Apply' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  expect(await log(page)).toEqual(['ads false', 'sms true', 'apply']);
});
