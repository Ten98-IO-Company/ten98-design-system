import { expect, test, type Page } from '@playwright/test';
import { createThemeScript, themeStorageKey } from '../../src/lib/theme-script';

const dark = 'rgb(18, 19, 22)', light = 'rgb(247, 247, 248)';

// Serve the fixture with the real pre-paint script first in head, as an app's server or framework head does.
// With csp, the response carries a nonce policy and every other script gets the nonce, as Campaign's server does.
type Serve = { script?: boolean; csp?: { themeNonce: boolean } };
const nonce = 't98-test-nonce';
async function open(page: Page, search = '', { script = true, csp }: Serve = {}) {
  await page.route('**/tests/theme.html*', async route => {
    const response = await route.fetch();
    let body = await response.text();
    if (csp) body = body.replaceAll('<script', `<script nonce="${nonce}"`);
    if (script) body = body.replace('<head>', `<head><script${csp?.themeNonce ? ` nonce="${nonce}"` : ''}>${createThemeScript()}</script>`);
    const headers = csp ? { ...response.headers(), 'content-security-policy': `script-src 'self' 'nonce-${nonce}'` } : response.headers();
    await route.fulfill({ response, body, headers });
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

test('a router re-inserting the head script after first paint does not rewrite the theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await seed(page, 'dark');
  await open(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  // As TanStack Start does on client navigation: the same inline script appended again, now with a stale cache.
  await page.evaluate(([key, code]) => {
    localStorage.setItem(key, 'light');
    const script = document.createElement('script');
    script.textContent = code;
    document.head.append(script);
  }, [themeStorageKey, createThemeScript()]);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await log(page)).toEqual(['dark']);
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

test('hydrating server HTML keeps the cached dark theme without a rewrite or a hydration warning', async ({ page }) => {
  const messages: string[] = [];
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) messages.push(message.text()); });
  page.on('pageerror', error => messages.push(error.message));
  await page.emulateMedia({ colorScheme: 'light' });
  await seed(page, 'dark');
  await open(page, '?ssr=1');
  await expect(page.locator('#resolved')).toHaveText('dark');
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
  expect(await firstFrame(page)).toBe(dark);
  expect(await log(page)).toEqual(['dark']);
  expect(messages).toEqual([]);
});

test('the cache holds only the theme under one key, and an unknown account value never clears it', async ({ page }) => {
  await seed(page, 'dark');
  await open(page, '?account=light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect.poll(() => cached(page)).toBe('light');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => Object.entries(localStorage))).toEqual([[themeStorageKey, 'light']]);
});

test('the pre-paint script runs under a nonce policy', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', message => { if (/Content Security Policy/i.test(message.text())) violations.push(message.text()); });
  await page.emulateMedia({ colorScheme: 'light' });
  await seed(page, 'dark');
  await open(page, '', { csp: { themeNonce: true } });
  expect(await firstFrame(page)).toBe(dark);
  expect(await log(page)).toEqual(['dark']);
  expect(violations).toEqual([]);
});

test('negative control: without its nonce the policy blocks the script and the first frame is light', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await seed(page, 'dark');
  await open(page, '', { csp: { themeNonce: false } });
  expect(await firstFrame(page)).toBe(light);
  expect((await log(page))[0]).toBe('(none)');
});

type Spy = { storageCalls: number; listeners: { storage: number; media: number } };
// Counts the page's localStorage calls and the theme listeners still attached.
const spy = (page: Page) => page.addInitScript(() => {
  const record: Spy = { storageCalls: 0, listeners: { storage: 0, media: 0 } };
  (window as unknown as { themeSpy: Spy }).themeSpy = record;
  type Method = (this: unknown, ...args: unknown[]) => unknown;
  const wrap = (target: object, name: string, before: (self: unknown, args: unknown[]) => void) => {
    const original = (target as Record<string, Method>)[name];
    (target as Record<string, Method>)[name] = function (this: unknown, ...args: unknown[]) { before(this, args); return original.apply(this, args); };
  };
  for (const name of ['getItem', 'setItem', 'removeItem', 'clear', 'key']) wrap(Storage.prototype, name, self => { if (self === window.localStorage) record.storageCalls++; });
  wrap(window, 'addEventListener', (_, [type]) => { if (type === 'storage') record.listeners.storage++; });
  wrap(window, 'removeEventListener', (_, [type]) => { if (type === 'storage') record.listeners.storage--; });
  wrap(MediaQueryList.prototype, 'addEventListener', (_, [type]) => { if (type === 'change') record.listeners.media++; });
  wrap(MediaQueryList.prototype, 'removeEventListener', (_, [type]) => { if (type === 'change') record.listeners.media--; });
});
const spied = (page: Page) => page.evaluate(() => (window as unknown as { themeSpy: Spy }).themeSpy);

test('every listener is removed on unmount, and with the cache on the theme stays', async ({ page }) => {
  await spy(page);
  await open(page, '?account=dark');
  expect((await spied(page)).listeners).toEqual({ storage: 1, media: 1 });
  await page.getByRole('button', { name: 'Unmount' }).click();
  await expect(page.locator('#resolved')).toHaveCount(0);
  expect((await spied(page)).listeners).toEqual({ storage: 0, media: 0 });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test.describe('without a browser cache (storageKey: null)', () => {
  test('the account value applies, sign-out returns to system and nothing touches localStorage', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await seed(page, 'dark');
    await spy(page);
    await open(page, '?account=light&cache=off', { script: false });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('radio', { name: 'Dark' }).check();
    await expect(page.getByRole('status')).toHaveText('Changed for this tab only.');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
    await expect(page.locator('#resolved')).toHaveText('light');
    expect(await spied(page)).toEqual({ storageCalls: 0, listeners: { storage: 0, media: 1 } });
  });

  test('an unknown value is system from the start, and an earlier value or choice never returns', async ({ page }) => {
    await seed(page, 'dark');
    await open(page, '?cache=off', { script: false });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
    await page.getByRole('radio', { name: 'Light' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: 'Account loads dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
    await expect(page.getByRole('radio', { name: 'System' })).toBeChecked();
  });

  test('unmounting resets to system', async ({ page }) => {
    await spy(page);
    await open(page, '?account=dark&cache=off', { script: false });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'Unmount' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
    expect(await spied(page)).toEqual({ storageCalls: 0, listeners: { storage: 0, media: 0 } });
  });

  test('a failed save restores the previous theme', async ({ page }) => {
    await open(page, '?account=light&cache=off&fail=1', { script: false });
    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.getByRole('status')).toHaveText('The account could not be saved.');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
  });
});
