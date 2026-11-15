import { expect, test, type Page } from '@playwright/test';
import { createThemeScript, themeStorageKey } from '../../src/lib/theme-script';

const dark = 'rgb(18, 19, 22)', light = 'rgb(247, 247, 248)';

// Serve the fixture with the real pre-paint script first in head, as an app's server or framework head does.
async function open(page: Page, search = '') {
  await page.route('**/tests/theme.html*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('<head>', `<head><script>${createThemeScript()}</script>`);
    await route.fulfill({ response, body });
  });
  await page.goto(`/tests/theme.html${search}`);
  await expect(page.locator('#resolved')).toBeVisible();
}
type Probe = { themeLog: string[]; firstFrameBackground?: string };
const log = (page: Page) => page.evaluate(() => (window as unknown as Probe).themeLog);
const firstFrame = (page: Page) => page.waitForFunction(() => (window as unknown as Probe).firstFrameBackground).then(handle => handle.jsonValue());
const background = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const cached = (page: Page) => page.evaluate(key => localStorage.getItem(key), themeStorageKey);
// Seeds the cache before the first load only, so a reload reads what the page itself saved.
const seed = (page: Page, theme: string) => page.addInitScript(([key, value]) => {
  if (sessionStorage.getItem('seeded')) return;
  localStorage.setItem(key, value);
  sessionStorage.setItem('seeded', '1');
}, [themeStorageKey, theme]);

test('a cached dark theme paints dark from the first frame and never flips', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await seed(page, 'dark');
  await open(page);
  expect(await firstFrame(page)).toBe(dark);
  expect(await log(page)).toEqual(['dark']);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
});

test('system follows the emulated colour scheme live', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await open(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
  await expect(page.locator('#resolved')).toHaveText('dark');
  expect(await background(page)).toBe(dark);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('#resolved')).toHaveText('light');
  expect(await background(page)).toBe(light);
  expect(await log(page)).toEqual(['system']);
});

test('a choice persists across reload without a flash', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await open(page);
  await page.getByRole('radio', { name: 'Dark' }).check();
  await expect(page.getByRole('status')).toHaveText('Saved for this browser.');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await cached(page)).toBe('dark');
  await page.reload();
  await expect(page.locator('#resolved')).toHaveText('dark');
  expect(await firstFrame(page)).toBe(dark);
  expect(await log(page)).toEqual(['dark']);
});

test('the account value wins once known and replaces the cache', async ({ page }) => {
  await seed(page, 'dark');
  await open(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Account loads light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
  await expect.poll(() => cached(page)).toBe('light');
});

test('a failed save restores the previous theme', async ({ page }) => {
  await open(page, '?account=light&fail=1');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.getByRole('status')).toHaveText('The account could not be saved.');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
  expect(await cached(page)).toBe('light');
});

test('blocked storage falls back to system and keeps a choice for the tab', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }));
  await open(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
  await page.getByRole('radio', { name: 'Dark' }).check();
  await expect(page.getByRole('status')).toHaveText('Changed for this tab only.');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await background(page)).toBe(dark);
});
