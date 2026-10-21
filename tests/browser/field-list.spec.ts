import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const evidence = resolve('.qa/field-list');

async function doubleText(page: Page) {
  // Snapshot first: changing a parent before measuring its child would compound inheritance.
  const snapshot = await page.evaluateHandle(() => {
    const sizes = [...document.body.querySelectorAll('*')].filter((element): element is HTMLElement => element instanceof HTMLElement).map(element => {
      const style = getComputedStyle(element);
      return { element, original: element.style.cssText, size: parseFloat(style.fontSize), height: parseFloat(style.lineHeight) };
    });
    for (const { element, size, height } of sizes) {
      element.style.setProperty('font-size', `${size * 2}px`, 'important');
      if (Number.isFinite(height)) element.style.setProperty('line-height', `${height * 2}px`, 'important');
    }
    return sizes;
  });
  return async () => {
    await snapshot.evaluate(sizes => { for (const { element, original } of sizes) element.style.cssText = original; });
    await snapshot.dispose();
  };
}
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const theme of ['light', 'dark'] as const) {
  test(`field list and account picker work by keyboard and reflow in ${theme}`, async ({ page }, info) => {
    const width = info.project.name === 'narrow-dark' ? 320 : 1440;
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto(`/tests/field-list.html?theme=${theme}`);
    const screen = page.locator('#field-list');
    await expect(screen.getByRole('heading', { level: 1, name: 'Field list' })).toBeVisible();
    expect(await overflow(page), 'no page overflow').toBeLessThanOrEqual(1);

    // FieldList: add focuses the new row's first field and announces it.
    const group = screen.getByRole('group', { name: /^Posting times/ });
    const status = group.getByRole('status');
    const times = group.locator('input[type="time"]');
    await expect(times).toHaveCount(3);
    await expect(times.nth(2)).toHaveAttribute('name', 'slots.2.time');
    await expect(group.getByRole('heading', { name: 'Item 2 of 3' })).toBeAttached();
    await group.getByRole('button', { name: 'Add time' }).focus();
    await page.keyboard.press('Enter');
    await expect(times).toHaveCount(4);
    await expect(times.nth(3)).toBeFocused();
    await expect(status).toHaveText('Item added');
    await group.getByRole('button', { name: 'Add time' }).focus();
    await page.keyboard.press('Space');
    await expect(times).toHaveCount(5);
    await expect(group.getByRole('button', { name: 'Add time' })).toBeDisabled();
    await expect(group.getByText('No more than 5 items allowed.')).toBeVisible();

    // Move keeps focus on the moved row's button and announces the position.
    await times.nth(0).fill('07:00');
    await group.getByRole('button', { name: 'Move item 1 down' }).focus();
    await page.keyboard.press('Enter');
    await expect(status).toHaveText('Moved to position 2');
    await expect(group.getByRole('button', { name: 'Move item 2 down' })).toBeFocused();
    await expect(group.getByRole('button', { name: 'Move item 1 up' })).toBeDisabled();

    // Remove focuses the next row's first field; the last row hands focus to Add.
    await group.getByRole('button', { name: 'Remove time 2' }).focus();
    await page.keyboard.press('Enter');
    await expect(times).toHaveCount(4);
    await expect(status).toHaveText('Item removed');
    await expect(times.nth(1)).toBeFocused();
    await group.getByRole('button', { name: 'Remove time 4' }).focus();
    await page.keyboard.press('Enter');
    await expect(times).toHaveCount(3);
    await expect(group.getByRole('button', { name: 'Add time' })).toBeFocused();
    for (const button of await group.getByRole('button').all()) if (await button.isEnabled()) expect.soft((await button.boundingBox())!.height, 'button height').toBeGreaterThanOrEqual(43.5);

    // AccountScopePicker states.
    const picker = screen.getByRole('group', { name: 'Account', exact: true }).first();
    const connection = picker.getByLabel('Connection');
    const state = screen.locator('#scope-state');
    await expect(picker.getByText('Choose a connection to see its accounts.')).toBeVisible();
    await connection.selectOption('meta');
    await expect(picker.getByRole('radio')).toHaveCount(3);
    await expect(picker.getByText('Suspended by the provider')).toBeVisible();
    await picker.getByRole('radio', { name: /Ad account 1/ }).check();
    await expect(state).toHaveText('Connection: meta; account: meta-1');
    await connection.selectOption('big');
    await expect(state).toHaveText('Connection: big; account: none');
    const combobox = picker.getByRole('combobox', { name: 'Account' });
    await expect(combobox).toBeVisible();
    await expect(picker.getByRole('radio')).toHaveCount(0);
    await combobox.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(state).toHaveText('Connection: big; account: big-2');
    await connection.selectOption('slow');
    await expect(picker.getByText('Loading accounts…')).toBeVisible();
    await connection.selectOption('empty');
    await expect(picker.getByText('This connection has no accounts available.')).toBeVisible();
    await connection.selectOption('old');
    await expect(picker.getByText('Expired', { exact: true })).toBeVisible();
    await expect(picker.getByText(/has expired/)).toBeVisible();
    await expect(picker.getByRole('button', { name: 'Reconnect' })).toBeVisible();
    await expect(screen.getByText('No connections yet.')).toBeVisible();
    await expect(screen.getByRole('link', { name: 'Connect an account' })).toHaveAttribute('href', '/connect');
    await connection.selectOption('meta');

    await mkdir(evidence, { recursive: true });
    await screen.screenshot({ path: resolve(evidence, `field-list-${theme}-${width}.png`), animations: 'disabled' });

    // Everything still fits at doubled text.
    const restore = await doubleText(page);
    try {
      expect.soft(await overflow(page), 'no page overflow at 200% text').toBeLessThanOrEqual(1);
      await screen.screenshot({ path: resolve(evidence, `field-list-${theme}-${width}-2x.png`), animations: 'disabled' });
    } finally { await restore(); }
    expect(errors).toEqual([]);
  });
}
