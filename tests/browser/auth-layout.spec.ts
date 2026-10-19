import { test, expect, type Page } from '@playwright/test';

const brandAppearance = (page: Page) => page.locator('.auth-shell').evaluate(element => {
  const style = (selector: string) => getComputedStyle(element.querySelector(selector)!);
  const mark = style('.brand-mark'), brand = style('.brand'), form = style('.auth-form-inner');
  return { mark: [mark.width, mark.height, mark.borderRadius, mark.font, mark.color, mark.backgroundColor], brand: [brand.gap, brand.padding, brand.color], formMax: form.maxWidth };
});

test('standalone auth shares Campaign composition and retains native forms in both themes', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const theme of ['light', 'dark']) {
    await page.goto(`/tests/legacy-theme.html?theme=${theme}`);
    const nativeBrand = await brandAppearance(page);
    for (const single of [false, true]) {
    await page.goto(`/tests/auth-layout.html?theme=${theme}${single ? '&single' : ''}`);
    const shell = page.locator('.auth-shell');
    await expect(shell).toBeVisible();
    await expect(shell.getByRole('heading', { level: 1, name: 'Sign in' })).toHaveCount(1);
    await expect(shell.locator('.auth-story')).toHaveCount(single ? 0 : 1);
    await expect(shell.locator('.brand')).toHaveCount(1);
    const geometry = await shell.evaluate(element => {
      const form = element.querySelector('.auth-form')!.getBoundingClientRect();
      const story = element.querySelector('.auth-story')?.getBoundingClientRect();
      return { columns: getComputedStyle(element).gridTemplateColumns.split(' ').length, formWidth: form.width, storyWidth: story?.width, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    expect(geometry.overflow).toBe(false);
    expect(geometry.columns).toBe(single || page.viewportSize()!.width <= 760 ? 1 : 2);
    if (!single) {
      expect(await brandAppearance(page)).toEqual(nativeBrand);
      await expect(shell.getByText('Consumer instructions must remain visible.')).toBeVisible();
      await expect(shell.getByRole('link', { name: 'Recover access' })).toBeVisible();
    }
    if (!single && page.viewportSize()!.width > 960) expect(geometry.formWidth).toBeCloseTo(geometry.storyWidth!, 0);
    await shell.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(shell.getByRole('status')).toHaveCount(0);
    await shell.getByLabel('Email address').fill('invalid-email');
    await shell.getByLabel('Password').fill('synthetic-password');
    await shell.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(shell.getByRole('status')).toHaveCount(0);
    await shell.getByLabel('Email address').fill('member@example.test');
    await shell.getByLabel('Password').fill('');
    await shell.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(shell.getByRole('status')).toHaveCount(0);
    await shell.getByLabel('Password').fill('synthetic-password');
    await shell.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(shell.getByRole('status')).toHaveText('Form validated: email, password. No authentication request sent.');
    expect(await shell.locator('form').evaluate(element => Object.fromEntries(new FormData(element as HTMLFormElement)))).toEqual({ email: 'member@example.test', password: 'synthetic-password' });
    await page.screenshot({ path: info.outputPath(`auth-${theme}-${single ? 'single' : 'split'}.png`), fullPage: true });
    }
  }
  expect(errors).toEqual([]);
});

test('brand guide and catalogue reuse the same auth layout and app-owned states', async ({ page }, info) => {
  const prefix = info.project.name === 'narrow-dark' ? '/?theme=dark' : '/';
  await page.goto(`${prefix}#brand`);
  const frame = page.frameLocator('iframe[title^="Campaign login:"]');
  await expect(frame.locator('.auth-shell')).toBeVisible();
  await expect(frame.getByRole('heading', { name: 'Sign in', level: 1 })).toBeVisible();
  expect(await frame.locator('.auth-story-title').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.getByLabel('Reference state').selectOption('Owner setup');
  await expect(frame.getByRole('heading', { name: 'Create owner account', level: 1 })).toBeVisible();
  await expect(frame.getByLabel('Your name')).toBeVisible();
  await page.getByLabel('Reference state').selectOption('Signing in');
  await expect(frame.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
  await page.getByLabel('Reference state').selectOption('Error');
  await expect(frame.getByRole('alert')).toContainText('Sign-in failed.');
  await expect(page.locator('.reference-section').filter({ has: page.getByRole('heading', { name: 'Login pattern', exact: true }) }).locator('.reference-code')).toContainText('<AuthLayout');
  await page.goto(`${prefix}#components/auth-layout?tab=states`);
  const states = page.locator('.reference-state');
  await expect(states).toHaveCount(3);
  await expect(states.locator('.auth-shell')).toHaveCount(3);
  await expect(states.locator('.auth-form h1')).toHaveCount(3);
  await expect(states.locator('.auth-story')).toHaveCount(1);
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', await page.locator('html').evaluate(element => element.clientWidth));
  await page.screenshot({ path: info.outputPath('auth-catalogue-states.png'), fullPage: true });
});
