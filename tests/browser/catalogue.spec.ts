import { test, expect } from '@playwright/test';

test('shared product controls preserve identity, drafts, evidence and native forms', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tests/product-components.html');
  await page.getByRole('button', { name: 'Run checks', exact: true }).click();
  await expect(page.locator('#result')).toHaveText(/^PASS:/);
  expect(errors).toEqual([]);
});

test('original connection, investigation and mutation recovery remain intact', async ({ page }) => {
  await page.goto('/tests/flow-recipes.html');
  await page.getByRole('button', { name: 'Run checks', exact: true }).click();
  await expect(page.locator('#result')).toHaveText(/^PASS:/, { timeout: 15_000 });
});

test('every component state page renders without browser errors or page overflow', async ({ page }, info) => {
  test.setTimeout(120_000);
  const prefix = info.project.name === 'narrow-dark' ? '/?theme=dark' : '/';
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${prefix}#components`);
  await expect(page.locator('.reference-component-card')).toHaveCount(73);
  const links = await page.locator('.reference-component-card').evaluateAll(nodes => nodes.map(node => ({ href: node.getAttribute('href')!, name: node.querySelector('h2')!.textContent! })));
  for (const link of links) {
    await test.step(link.name, async () => {
      await page.goto(`${prefix}${link.href}?tab=states`);
      await expect(page.locator('.reference-detail > header h1')).toHaveText(link.name);
      await expect(page.locator('.reference-state').first()).toBeVisible();
      expect(await page.locator('.reference-state').count()).toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${link.name} must contain horizontal overflow`).toBeTruthy();
    });
  }
  if (info.project.name === 'narrow-dark') {
    await expect(page.locator('html')).toHaveCSS('direction', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  }
  expect(errors).toEqual([]);
});

test('templates, hierarchy and usage rules are keyboard accessible', async ({ page }, info) => {
  const prefix = info.project.name === 'narrow-dark' ? '/?theme=dark' : '/';
  await page.goto(`${prefix}#templates`);
  await page.getByRole('button', { name: /EditorTemplate Create or change/ }).click();
  await expect(page.getByRole('heading', { name: 'EditorTemplate', exact: true })).toBeVisible();
  const hierarchy = page.getByRole('tab', { name: 'Component hierarchy' });
  await hierarchy.focus();
  await hierarchy.press('Enter');
  await expect(page.getByRole('heading', { name: '1. Design tokens' })).toBeVisible();
  await page.getByRole('tab', { name: 'Behavior and usage' }).click();
  await expect(page.getByRole('heading', { name: 'Read-only still permits inspection' })).toBeVisible();
  expect(await page.locator('main').getByRole('heading', { level: 1 }).count()).toBe(1);
});

test('flow discovery, copyable source and reference decisions are connected', async ({ page }, info) => {
  const prefix = info.project.name === 'narrow-dark' ? '/?theme=dark' : '/';
  await page.goto(`${prefix}#flows`);
  await page.getByLabel('Product', { exact: true }).selectOption('Campaign');
  await expect(page.locator('.reference-component-card')).toHaveCount(8);
  await page.getByLabel('Find a flow').fill('C6');
  await expect(page.locator('.reference-component-card')).toHaveCount(1);
  await page.locator('.reference-component-card').click();
  await expect(page.getByRole('heading', { name: 'Design decisions and acceptance cases' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reference flows' })).toBeVisible();
  await expect(page.locator('.reference-code code')).toContainText("from '@ten98/ui'");
});

test('navigation restores focus and keeps scrollbar tracks hidden', async ({ page }, info) => {
  await page.goto('/#components');
  if (info.project.name === 'narrow-dark') {
    const trigger = page.getByRole('button', { name: 'Open navigation', exact: true });
    await trigger.click();
    await expect(page.getByRole('button', { name: 'Close navigation', exact: true }).first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }
  const search = page.getByRole('button', { name: 'Search catalogue', exact: true });
  await search.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(search).toBeFocused();
  expect(await page.locator('.catalog-sidebar > nav').evaluate(element => getComputedStyle(element).scrollbarWidth)).toBe('none');
});

test('templates retain layout at 200 percent text zoom', async ({ page }, info) => {
  await page.goto(`${info.project.name === 'narrow-dark' ? '/?theme=dark' : '/'}#templates`);
  // Text-only zoom exercises reflow independently of a smaller viewport.
  await page.addStyleTag({ content: 'html { font-size: 200% !important }' });
  await page.getByRole('tab', { name: 'Component hierarchy' }).click();
  await expect(page.getByRole('heading', { name: '5. Application flows' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
});
