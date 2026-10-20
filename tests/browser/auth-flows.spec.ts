import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const evidence = resolve('.qa/auth-flows');
const screens = ['signin', 'signin-single', 'signin-busy', 'signin-error', 'signin-providers-pending', 'signin-providers-loading', 'signin-providers-error', 'signin-providers-empty', 'setup', 'setup-full', 'setup-error', 'setup-busy', 'loading', 'error', 'boundary'];

const open = async (page: Page, screen: string, theme: string, width: number) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.emulateMedia({ colorScheme: theme as 'light' | 'dark', reducedMotion: 'reduce' });
  await page.goto(`/tests/auth-flows.html?screen=${screen}&theme=${theme}`);
  await expect(page.locator('.auth-shell')).toBeVisible();
};

for (const theme of ['light', 'dark'] as const) {
  test(`every flow and state fits the project width with one h1 in ${theme}`, async ({ page }, info) => {
    const width = info.project.name === 'narrow-dark' ? 320 : 1440;
    await mkdir(evidence, { recursive: true });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const screen of screens) {
      await open(page, screen, theme, width);
      await expect(page.locator('h1'), `${screen} has one h1`).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${screen} has no page overflow`).toBeLessThanOrEqual(1);
      const clipped = await page.locator('.auth-shell *').evaluateAll(nodes => nodes.filter(node => node.scrollWidth > node.clientWidth + 1 && getComputedStyle(node).overflowX === 'visible' && node.getBoundingClientRect().right > innerWidth + 1).length);
      expect(clipped, `${screen} keeps content inside the viewport`).toBe(0);
      await page.screenshot({ path: resolve(evidence, `${screen}-${theme}-${width}.png`), fullPage: true, animations: 'disabled' });
    }
    expect(errors).toEqual([]);
  });
}

test('native form exposes field names, tokens, hidden fields and the story label', async ({ page }, info) => {
  await open(page, 'setup-full', 'light', info.project.name === 'narrow-dark' ? 320 : 1440);
  const form = page.locator('form');
  await expect(form).toHaveAttribute('action', '/setup');
  await expect(form).toHaveAttribute('method', 'post');
  await expect(form.locator('input[type=hidden][name=csrf]')).toHaveValue('token-from-server');
  for (const [name, autocomplete] of [['name', 'name'], ['token', 'off'], ['email', 'username'], ['password', 'new-password'], ['workspaceName', 'organization']]) {
    await expect(form.locator(`[name=${name}]`)).toHaveAttribute('autocomplete', autocomplete);
  }
  await expect(form.getByLabel('Password')).toHaveAccessibleDescription('Use at least 12 characters.');
  await expect(form.getByLabel('Add sample content to the workspace')).toBeChecked();
  await expect(page.getByRole('link', { name: 'Sign in instead' })).toHaveAttribute('href', '#login');
});

test('busy forms are announced and disabled', async ({ page }, info) => {
  await open(page, 'signin-busy', 'light', info.project.name === 'narrow-dark' ? 320 : 1440);
  await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('fieldset')).toHaveAttribute('disabled', '');
  await expect(page.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
  await expect(page.getByLabel('Email address')).toBeDisabled();
});

test('a failed submit moves focus to the error alert each time and ignores repeat submits', async ({ page }, info) => {
  await open(page, 'interactive', 'light', info.project.name === 'narrow-dark' ? 320 : 1440);
  await page.getByLabel('Email address').fill('member@example.test');
  await page.getByLabel('Password').fill('synthetic-password');
  const submit = page.getByRole('button', { name: 'Sign in', exact: true });
  await submit.dblclick();
  await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
  const alert = page.locator('form [role=alert]');
  await expect(alert).toHaveText('The email or password is incorrect. Attempt 1.');
  await expect(alert).toBeFocused();
  await expect(page.getByRole('status')).toHaveText('Submitted email,password');
  await page.getByLabel('Password').focus();
  await submit.click();
  await expect(alert).toHaveText('The email or password is incorrect. Attempt 2.');
  await expect(alert).toBeFocused();
  await info.attach('after-error', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: resolve(evidence, `interactive-error-${info.project.name}.png`), fullPage: true });
});

test('provider list renders links, buttons and nothing when empty', async ({ page }, info) => {
  const width = info.project.name === 'narrow-dark' ? 320 : 1440;
  await open(page, 'signin', 'light', width);
  await expect(page.getByRole('link', { name: 'Continue with Microsoft' })).toHaveAttribute('href', '#entra');
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled();
  await expect(page.getByRole('main', { name: 'Sign in' })).toBeVisible();
  await open(page, 'signin-providers-empty', 'light', width);
  await expect(page.locator('.t98-auth-providers')).toHaveCount(0);
  await open(page, 'signin-providers-pending', 'light', width);
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('link', { name: 'Continue with Microsoft' })).toBeVisible();
});
