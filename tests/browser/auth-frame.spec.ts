import { expect, test, type Page } from '@playwright/test';

const layout = (page: Page) => page.locator('.auth-shell').evaluate(shell => {
  const form = shell.querySelector('.auth-form')!.getBoundingClientRect();
  const aside = shell.querySelector('.t98-auth-aside')?.getBoundingClientRect();
  return { split: shell.classList.contains('auth-split'), brand: !!shell.querySelector('a[href="/"]'), form: [Math.round(form.left), Math.round(form.width)], aside: aside && [Math.round(aside.left), Math.round(aside.width)] };
});

for (const width of [1280, 375]) test(`loading, sign-in and boundary share one auth frame at ${width}px (#157)`, async ({ page }) => {
  page.on('pageerror', () => undefined);
  await page.setViewportSize({ width, height: 900 });
  const seen = [];
  for (const screen of ['loading', 'sign-in', 'boundary']) {
    await page.goto(`/tests/auth-frame.html?screen=${screen}`);
    await expect(page.locator('.auth-shell')).toBeVisible();
    const shape = await layout(page);
    expect(shape.split, `${screen} uses the provider's aside`).toBe(true);
    expect(shape.brand, `${screen} shows the provider's linked brand`).toBe(true);
    seen.push(shape);
  }
  expect(seen[1]).toEqual(seen[0]);
  expect(seen[2]).toEqual(seen[0]);
  // Labels default to the title, and the provider's password policy reaches the flow.
  await page.goto('/tests/auth-frame.html?screen=sign-in');
  await expect(page.getByRole('main', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByLabel('Password')).toHaveAttribute('maxlength', '64');
});

test('an explicit aside={null} drops the provider aside on one screen (#157)', async ({ page }) => {
  await page.goto('/tests/auth-frame.html?screen=no-aside');
  await expect(page.locator('.auth-shell')).not.toHaveClass(/auth-split/);
  await expect(page.locator('.t98-auth-brand a[href="/"]')).toBeVisible();
});
