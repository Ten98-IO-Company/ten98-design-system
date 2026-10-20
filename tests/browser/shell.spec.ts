import { mkdir } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const evidence = '.qa/shell';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/tests/shell.html?theme=${info.project.name === 'narrow-dark' ? 'dark' : 'light'}`);
  await expect(page.getByRole('navigation', { name: 'Discover' })).toBeVisible();
});

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth,
    clipped: [...document.querySelectorAll<HTMLElement>('.t98-sidebar-nav, .t98-switcher, .t98-search-field')].filter(element => element.scrollWidth > element.clientWidth + 1).length }));
  expect(overflow.document).toBeLessThanOrEqual(overflow.viewport + 1);
  expect(overflow.clipped).toBe(0);
}

test('renders without overflow and saves screenshots', async ({ page }, info) => {
  await expectNoOverflow(page);
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: `${evidence}/${info.project.name}.png`, fullPage: true });
});

test('current page, touch size and the filter with its announced status', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Discover' });
  await expect(nav.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(nav.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '#/overview');
  await expect(nav.getByRole('link', { name: /Alerts/ })).toContainText('new');
  expect((await nav.getByRole('link', { name: 'Overview' }).boundingBox())?.height).toBeGreaterThanOrEqual(44);
  const status = page.locator('.t98-search-field__status').first();
  await expect(status).toBeEmpty();
  await page.getByRole('searchbox', { name: 'Filter pages' }).fill('quer');
  await expect(nav.getByRole('link', { name: 'Saved searches' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Overview' })).toBeHidden();
  await expect(nav.getByText('Manage')).toBeHidden();
  await expect(status).toHaveText('1 of 4 pages');
  await page.getByRole('searchbox', { name: 'Filter pages' }).fill('zzz');
  await expect(nav.getByText('No pages match "zzz"')).toBeVisible();
  await expect(status).toHaveText('0 of 4 pages');
  await page.getByRole('button', { name: 'Clear filter' }).click();
  await expect(nav.getByRole('link', { name: 'Overview' })).toBeVisible();
  await expect(status).toBeEmpty();
});

test('keyboard Tab reaches nav items and Enter selects through the link component', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Discover' });
  await page.getByRole('searchbox', { name: 'Filter pages' }).focus();
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link', { name: 'Overview' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link', { name: 'Saved searches' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(nav.getByRole('link', { name: 'Saved searches' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current', 'page');
});

test('callback navigation uses buttons, skips hidden items and disabled items', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Campaign' });
  await expect(nav.getByRole('link')).toHaveCount(0);
  await expect(nav.getByRole('button', { name: 'Hidden admin' })).toHaveCount(0);
  await expect(nav.getByRole('button', { name: 'Campaigns' })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('button', { name: /Audiences/ }).focus();
  await page.keyboard.press('Enter');
  await expect(nav.getByRole('button', { name: /Audiences/ })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('status', { name: 'Selected page' })).toHaveText('Selected: audiences');
  await expect(nav.locator('[aria-disabled="true"]')).toContainText('Billing');
  await expect(nav.locator('[aria-disabled="true"]')).toHaveCount(1);
});

test('workspace switcher states and search status region', async ({ page }) => {
  const workspace = page.getByLabel('Workspace').first();
  await expect(workspace).toHaveAccessibleDescription('Workspace admin');
  await expect(page.getByRole('link', { name: /^New project in Acme/ })).toHaveAttribute('href', '#/projects/new');
  await expect(page.getByText('Loading projects…')).toBeAttached();
  await expect(page.locator('select[aria-busy="true"]')).toBeDisabled();
  await expect(page.getByText('No projects yet')).toBeAttached();
  await expect(page.getByRole('button', { name: 'Create project in Labs' })).toBeVisible();
  await expect(page.getByText('No workspaces available')).toBeVisible();
  const search = page.getByRole('searchbox', { name: 'Search everything' });
  await expect(page.getByText('/', { exact: true })).toHaveAttribute('aria-hidden', 'true');
  await search.fill('shoes');
  await expect(page.getByRole('status').filter({ hasText: 'Results for shoes' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(search).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Clear search' })).toHaveCount(0);
});

test('right-to-left mirrors the layout without overflow', async ({ page }, info) => {
  const icon = () => page.getByRole('navigation', { name: 'Discover' }).getByRole('link', { name: 'Overview' }).evaluate(link => {
    const box = link.getBoundingClientRect(), svg = link.querySelector('svg')!.getBoundingClientRect(), text = link.querySelector('span')!.getBoundingClientRect();
    return { iconInStart: svg.left - box.left, iconInEnd: box.right - svg.right, textLeft: text.left, iconLeft: svg.left };
  });
  const ltr = await icon();
  expect(ltr.iconInStart).toBeLessThan(ltr.iconInEnd);
  await page.locator('html').evaluate(element => { element.setAttribute('dir', 'rtl'); });
  const rtl = await icon();
  expect(rtl.iconInEnd).toBeLessThan(rtl.iconInStart);
  expect(rtl.iconLeft).toBeGreaterThan(rtl.textLeft);
  await page.getByRole('searchbox', { name: 'Search everything' }).fill('x');
  const clear = await page.getByRole('button', { name: 'Clear search' }).boundingBox();
  const field = await page.getByRole('searchbox', { name: 'Search everything' }).boundingBox();
  expect(clear!.x).toBeLessThan(field!.x + field!.width / 2);
  await expectNoOverflow(page);
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: `${evidence}/${info.project.name}-rtl.png`, fullPage: true });
});
