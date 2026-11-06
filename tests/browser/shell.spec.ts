import { mkdir } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const evidence = '.qa/shell';

test.beforeEach(async ({ page }, info) => {
  if (info.title.startsWith('app ') || info.title.startsWith('SectionNav wrap:') || info.title.startsWith('SectionNav grid:') || info.title.startsWith('SectionNav disabled hints:')) return;
  await page.goto(`/tests/shell.html?theme=${info.project.name === 'narrow-dark' ? 'dark' : 'light'}`);
  await expect(page.getByRole('navigation', { name: 'Discover' })).toBeVisible();
});

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth,
    clipped: [...document.querySelectorAll<HTMLElement>('.t98-sidebar-nav, .t98-switcher, .t98-search-field')].filter(element => element.scrollWidth > element.clientWidth + 1).length }));
  expect(overflow.document).toBeLessThanOrEqual(overflow.viewport + 1);
  expect(overflow.clipped).toBe(0);
}

test('SectionNav disabled hints: unavailable descriptions stay contained before enabling and after selected reload', async ({ page }, info) => {
  const measurements: unknown[] = [];
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.setViewportSize({ width: 320, height: 900 });
  const nav = page.getByRole('navigation', { name: 'API model reports' });
  const list = nav.getByRole('list');
  const inspect = async (phase: string, expectedHints: number) => {
    await expect(nav.locator('.t98-visually-hidden')).toHaveCount(expectedHints);
    const geometry = await nav.evaluate(element => {
      const row = element.querySelector('ul')!, selected = element.querySelector('[aria-current="page"]');
      const bounds = row.getBoundingClientRect(), current = selected?.getBoundingClientRect();
      return { documentWidth: document.documentElement.scrollWidth, pageX: scrollX, pageY: scrollY,
        row: bounds.toJSON(), selectedVisible: Boolean(current && current.left >= bounds.left - 1 && current.right <= bounds.right + 1),
        hints: [...element.querySelectorAll<HTMLElement>('.t98-visually-hidden')].map(hint => ({
          text: hint.textContent, offsetParent: hint.offsetParent?.className,
          display: getComputedStyle(hint).display, visibility: getComputedStyle(hint).visibility,
          ariaHidden: hint.getAttribute('aria-hidden'), rect: hint.getBoundingClientRect().toJSON(),
        })) };
    });
    measurements.push({ phase, ...geometry });
    expect.soft(geometry.documentWidth, `${phase}: hidden hints must not widen the page`).toBeLessThanOrEqual(320);
    expect.soft(geometry.row.width).toBeLessThanOrEqual(288);
    for (const hint of geometry.hints) {
      expect.soft(hint.offsetParent, `${phase}: every hint stays inside its scrolling entry`).toBe('t98-section-nav__entry');
      expect(hint.text).toBe(', Load the selected report first.');
      expect(hint.display).not.toBe('none');
      expect(hint.visibility).toBe('visible');
      expect(hint.ariaHidden).toBeNull();
    }
    const snapshot = await nav.ariaSnapshot();
    expect(snapshot.match(/Load the selected report first\./g)).toHaveLength(expectedHints);
    return geometry;
  };
  try {
    for (const direction of ['ltr', 'rtl']) {
      await page.goto(`/tests/shell.html?view=sections-scroll&unavailable=1&pending=1&dir=${direction}&theme=${direction === 'rtl' ? 'dark' : 'light'}`);
      await page.evaluate(async () => { await document.fonts.ready; });
      await inspect(`${direction}: before async enable`, 4);
      await page.getByRole('button', { name: 'Load selected report', exact: true }).click();
      await page.getByRole('button', { name: 'Complete report load', exact: true }).click();
      await expect(nav.locator('[aria-disabled="true"]')).toHaveCount(3);
      const answer = nav.getByRole('link', { name: 'Answer analysis', exact: true });
      const recommendations = nav.getByRole('link', { name: 'Recommendations', exact: true });
      await answer.focus();
      await page.keyboard.press('Tab');
      await expect(recommendations).toBeFocused();
      await recommendations.press('Enter');
      await expect(recommendations).toHaveAttribute('aria-current', 'page');
      // Establish the selected fixture URL so the reload starts on Recommendations.
      await page.evaluate(() => {
        const url = new URL(location.href);
        url.searchParams.set('section', 'recommendations');
        url.searchParams.delete('pending');
        history.replaceState(null, '', url);
      });
      await page.reload();
      await page.evaluate(async () => { await document.fonts.ready; });
      await expect(recommendations).toHaveAttribute('aria-current', 'page');
      expect.soft((await inspect(`${direction}: Recommendations reload`, 3)).selectedVisible).toBe(true);
      await page.screenshot({ path: info.outputPath(`disabled-hints-${direction}.png`) });
      await list.evaluate(element => element.scrollTo({ left: 0 }));
      expect.soft((await inspect(`${direction}: manual scroll`, 3)).selectedVisible).toBe(false);
      expect.soft(await page.evaluate(() => scrollX)).toBe(0);
    }
    expect(requests.filter(url => !url.startsWith('http://127.0.0.1:5196/'))).toEqual([]);
    expect(requests.filter(url => new URL(url).pathname.startsWith('/api/'))).toEqual([]);
  } finally {
    await info.attach('disabled-hint-measurements', { body: JSON.stringify({ requests, measurements }), contentType: 'application/json' });
  }
});

for (const direction of ['ltr', 'rtl'] as const) {
  test(`SectionNav grid: scrolling stays contained and reveals async selection and resize in ${direction}`, async ({ page }, info) => {
    const requests: string[] = [];
    const measurements: unknown[] = [];
    page.on('request', request => requests.push(request.url()));
    const open = async (query = '') => {
      await page.goto(`/tests/shell.html?view=sections-scroll&theme=${direction === 'rtl' ? 'dark' : 'light'}${query}`);
      await page.locator('html').evaluate((element, dir) => element.setAttribute('dir', dir), direction);
    };
    const geometry = async (phase: string) => {
      const value = await page.getByRole('navigation', { name: 'API model reports' }).evaluate(nav => {
        const list = nav.querySelector('ul')!, current = nav.querySelector('[aria-current="page"]');
        const row = list.getBoundingClientRect(), selected = current?.getBoundingClientRect();
        return { viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, pageX: scrollX, pageY: scrollY,
          nav: nav.getBoundingClientRect().toJSON(), row: row.toJSON(), clientWidth: list.clientWidth, scrollWidth: list.scrollWidth,
          selectedVisible: Boolean(selected && selected.left >= row.left - 1 && selected.right <= row.right + 1),
          rows: new Set([...list.children].map(item => Math.round(item.getBoundingClientRect().top))).size };
      });
      measurements.push({ phase, ...value });
      return value;
    };
    try {
      await page.setViewportSize({ width: 320, height: 900 });
      await open();
      const initial = await geometry('implicit grid at320');
      expect.soft(initial.documentWidth, 'navigation must not widen the page').toBeLessThanOrEqual(320);
      expect.soft(initial.row.width, 'scrolling row fits its padded parent').toBeLessThanOrEqual(288);
      expect.soft(initial.rows).toBe(1);
      expect.soft(initial.row.height).toBeLessThanOrEqual(46);
      expect.soft(initial.scrollWidth).toBeGreaterThan(initial.clientWidth);
      const links = page.getByRole('navigation', { name: 'API model reports' }).getByRole('link');
      await links.first().focus();
      for (let index = 0; index < 5; index++) {
        if (index) await page.keyboard.press('Tab');
        await expect(links.nth(index)).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(links.nth(index)).toHaveAttribute('aria-current', 'page');
      }
      await page.screenshot({ path: info.outputPath(`navigation-${direction}-320.png`) });
      // A bounded parent isolates reveal behavior from the separate intrinsic-size failure above.
      await open('&bounded=1&pending=1&section=recommendations');
      await page.evaluate(async () => { await document.fonts.ready; });
      await expect(page.locator('[aria-disabled="true"]')).toHaveText(/Recommendations/);
      await expect(page.locator('[aria-current="page"]')).toHaveCount(0);
      await page.getByRole('button', { name: 'Load selected report', exact: true }).click();
      await expect(page.locator('[aria-current="page"]')).toHaveCount(0);
      await page.getByRole('button', { name: 'Complete report load', exact: true }).click();
      await expect(links.last()).toHaveAttribute('aria-current', 'page');
      await expect.soft.poll(async () => (await geometry('async current enabled')).selectedVisible, { timeout: 1000 }).toBe(true);
      await expect(links.last()).not.toBeFocused();
      await page.setViewportSize({ width: 1440, height: 900 });
      await open('&bounded=1&section=recommendations');
      await page.evaluate(async () => { await document.fonts.ready; });
      await expect.poll(async () => (await geometry('wide selected')).selectedVisible).toBe(true);
      await page.setViewportSize({ width: 320, height: 900 });
      await expect.soft.poll(async () => (await geometry('resize selected')).selectedVisible, { timeout: 1000 }).toBe(true);
      const resized = await geometry('final');
      expect.soft(resized.documentWidth).toBeLessThanOrEqual(320);
      expect.soft(resized.pageX).toBe(0);
      expect.soft(resized.pageY).toBe(0);
      const list = page.getByRole('navigation', { name: 'API model reports' }).getByRole('list');
      await expect(list).toHaveAttribute('data-overflow', 'start');
      await list.evaluate(element => element.scrollTo({ left: 0 }));
      await expect(list).toHaveAttribute('data-overflow', 'end');
      expect((await geometry('manual scroll stays at start')).selectedVisible).toBe(false);
      expect(requests.filter(url => !url.startsWith('http://127.0.0.1:5196/'))).toEqual([]);
      expect(requests.filter(url => new URL(url).pathname.startsWith('/api/'))).toEqual([]);
    } finally {
      await info.attach('section-nav-measurements', { body: JSON.stringify({ direction, requests, requestCount: requests.length, measurements }), contentType: 'application/json' });
    }
  });
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

test('SectionNav: landmark of links, aria-current, no tab roles, guard, 44px targets and one scrolling row', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Page sections' });
  await expect(nav.getByRole('list')).toBeVisible();
  await expect(nav.getByRole('link')).toHaveCount(7);
  await expect(nav.getByRole('tab')).toHaveCount(0);
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(nav.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: /Reports/ })).toContainText('3');
  expect((await nav.getByRole('link', { name: 'Overview' }).boundingBox())?.height).toBeGreaterThanOrEqual(44);
  const log = page.getByRole('status', { name: 'Section log' });
  await nav.getByRole('link', { name: 'Audience' }).click();
  await expect(log).toHaveText('select audience');
  await expect(nav.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('button', { name: 'Discard section draft' }).click();
  await nav.getByRole('link', { name: 'Audience' }).click();
  await expect(nav.getByRole('link', { name: 'Audience' })).toHaveAttribute('aria-current', 'page');
  // Links are Tab stops; arrow keys do not move focus between them.
  await nav.getByRole('link', { name: 'Audience' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(nav.getByRole('link', { name: 'Audience' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link', { name: 'Creative assets' })).toBeFocused();
  const row = await nav.evaluate(element => {
    const list = element.querySelector('ul')!;
    const tops = new Set([...list.querySelectorAll('a')].map(link => Math.round(link.getBoundingClientRect().top)));
    return { rows: tops.size, document: document.documentElement.scrollWidth - innerWidth, scrolls: list.scrollWidth > list.clientWidth, contained: list.getBoundingClientRect().right <= innerWidth + 1 };
  });
  expect(row.rows).toBe(1);
  expect(row.document).toBeLessThanOrEqual(1);
  expect(row.contained).toBe(true);
  if (page.viewportSize()!.width <= 400) expect(row.scrolls).toBe(true);
});

test('SectionNav mirrors in right-to-left without page overflow', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Page sections' });
  const edge = () => nav.getByRole('link', { name: 'Overview' }).evaluate(link => {
    const box = link.getBoundingClientRect(), strip = link.closest('nav')!.getBoundingClientRect();
    return { fromStart: box.left - strip.left, fromEnd: strip.right - box.right };
  });
  const ltr = await edge();
  expect(ltr.fromStart).toBeLessThan(ltr.fromEnd);
  await page.locator('html').evaluate(element => { element.setAttribute('dir', 'rtl'); });
  const rtl = await edge();
  expect(rtl.fromEnd).toBeLessThan(rtl.fromStart);
  await expectNoOverflow(page);
});

/* Full application frame (?view=app), composed only from library components. */
const appUrl = (theme: string) => `/tests/shell.html?view=app&theme=${theme}`;
const narrowOnly = (name: string) => { test.skip(name !== 'narrow-dark', 'Drawer behaviour is exercised at 320px.'); };
const sidebarOf = (page: Page) => page.locator('aside.t98-shell-sidebar');
const inside = (page: Page) => page.evaluate(() => document.querySelector('aside')!.contains(document.activeElement));

async function openDrawer(page: Page) {
  const toggle = page.getByRole('button', { name: 'Open navigation' });
  await toggle.click();
  await expect(page.getByRole('dialog', { name: 'Workspace' })).toBeVisible();
  return toggle;
}

test('app drawer: toggle opens, traps focus, Escape and close button return focus, no overflow', async ({ page }, info) => {
  narrowOnly(info.project.name);
  await page.goto(appUrl('dark'));
  const toggle = page.getByRole('button', { name: 'Open navigation' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(sidebarOf(page)).toBeHidden();
  await openDrawer(page);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expectNoOverflow(page);
  for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); expect(await inside(page)).toBe(true); }
  for (let i = 0; i < 14; i++) { await page.keyboard.press('Shift+Tab'); expect(await inside(page)).toBe(true); }
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: `${evidence}/app-drawer-${info.project.name}.png` });
  await page.keyboard.press('Escape');
  await expect(sidebarOf(page)).toBeHidden();
  await expect(toggle).toBeFocused();
  await openDrawer(page);
  await page.getByRole('button', { name: 'Close navigation' }).click();
  await expect(sidebarOf(page)).toBeHidden();
  await expect(toggle).toBeFocused();
  await expectNoOverflow(page);
  await page.screenshot({ path: `${evidence}/app-closed-${info.project.name}.png` });
});

test('app frame on desktop: static sidebar and no menu toggle', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium', 'Desktop layout is checked at 1440px.');
  await page.goto(appUrl('light'));
  await expect(sidebarOf(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Close navigation' })).toBeHidden();
  expect(await sidebarOf(page).evaluate(element => getComputedStyle(element).position)).toBe('sticky');
  await expect(page.getByRole('banner').getByRole('navigation', { name: 'Breadcrumb' }).locator('[aria-current="page"]')).toHaveText('Overview');
  expect(await page.locator('main').evaluate(main => main.closest('header') === null && !main.querySelector('header'))).toBe(true);
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: `${evidence}/app-desktop-${info.project.name}.png` });
});

test('app skip link focuses main', async ({ page }) => {
  await page.goto(appUrl('light'));
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main', { name: 'Page content' })).toBeFocused();
});

test('app skip link focuses main and leaves the URL hash (capability tokens) untouched', async ({ page, context }) => {
  await page.goto(appUrl('light'));
  await page.evaluate(() => history.replaceState(null, '', `${location.pathname}${location.search}#token=abc`));
  const skip = page.getByRole('link', { name: 'Skip to content' });
  const main = page.getByRole('main', { name: 'Page content' });
  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(main).toBeFocused();
  expect(await page.evaluate(() => location.hash)).toBe('#token=abc');
  // The link is only on screen while focused, and each activation moves focus away.
  await skip.focus();
  await skip.click({ modifiers: ['ControlOrMeta'] });
  await skip.focus();
  await skip.click({ button: 'middle' });
  await expect(main).toBeFocused();
  expect(context.pages()).toHaveLength(1);
  expect(await page.evaluate(() => location.hash)).toBe('#token=abc');
});

test('app topbar wrap keeps long breadcrumb labels visible at 320px with doubled text', async ({ page }, info) => {
  narrowOnly(info.project.name);
  await page.goto(`${appUrl('light')}&crumbs=long`);
  const crumbs = page.getByRole('banner').getByRole('navigation', { name: 'Breadcrumb' });
  // Snapshot every size first: changing a parent before measuring its child would compound inheritance.
  await page.evaluate(() => {
    const sizes = [...document.body.querySelectorAll<HTMLElement>('*')].map(element => ({ element, size: parseFloat(getComputedStyle(element).fontSize), height: parseFloat(getComputedStyle(element).lineHeight) }));
    for (const { element, size, height } of sizes) {
      element.style.setProperty('font-size', `${size * 2}px`, 'important');
      if (Number.isFinite(height)) element.style.setProperty('line-height', `${height * 2}px`, 'important');
    }
  });
  for (const selector of ['.t98-app-topbar__scope', '.t98-app-topbar__current']) {
    const metrics = await crumbs.locator(selector).evaluate(element => ({ clipped: element.scrollWidth > element.clientWidth + 1, right: element.getBoundingClientRect().right, viewport: innerWidth, ellipsis: getComputedStyle(element).textOverflow }));
    expect(metrics.clipped, selector).toBe(false);
    expect(metrics.ellipsis, selector).toBe('clip');
    expect(metrics.right, selector).toBeLessThanOrEqual(metrics.viewport + 1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});

test('app drawer in right-to-left opens from the inline-end side without overflow', async ({ page }, info) => {
  narrowOnly(info.project.name);
  await page.goto(appUrl('dark'));
  await page.locator('html').evaluate(element => { element.setAttribute('dir', 'rtl'); });
  await openDrawer(page);
  const right = async () => { const box = (await sidebarOf(page).boundingBox())!; return box.x + box.width; };
  await expect.poll(right).toBeGreaterThanOrEqual(page.viewportSize()!.width - 1);
  expect((await sidebarOf(page).boundingBox())!.x).toBeGreaterThan(0);
  await expectNoOverflow(page);
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: `${evidence}/app-drawer-rtl-${info.project.name}.png` });
});

test('app touch targets are at least 44px at 320px', async ({ page }, info) => {
  narrowOnly(info.project.name);
  await page.goto(appUrl('dark'));
  const tall = async (locator: ReturnType<Page['locator']>, label: string) => {
    const count = await locator.count();
    expect(count, label).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) expect((await locator.nth(i).boundingBox())!.height, `${label} ${i}`).toBeGreaterThanOrEqual(43.5);
  };
  await tall(page.getByRole('button', { name: 'Open navigation' }), 'menu toggle');
  await tall(page.getByRole('link', { name: /Set up two-factor/ }), 'banner action');
  await tall(page.getByRole('button', { name: 'Dismiss' }), 'banner dismiss');
  await page.getByRole('searchbox', { name: 'Search everything' }).fill('x');
  await tall(page.getByRole('button', { name: 'Clear search' }), 'clear');
  await page.getByRole('button', { name: 'Account menu' }).click();
  await tall(page.locator('.t98-account-menu__actions').locator('a, button'), 'account items');
  await page.keyboard.press('Escape');
  await openDrawer(page);
  await tall(page.getByRole('navigation', { name: 'Primary' }).locator('a, button'), 'nav items');
  await tall(page.getByRole('link', { name: /^New project in/ }), 'create');
  await tall(page.getByRole('link', { name: 'Manage' }), 'status action');
});

test('app focus returns to the account trigger on Escape and stays on switcher selects', async ({ page }, info) => {
  narrowOnly(info.project.name);
  await page.goto(appUrl('dark'));
  const trigger = page.getByRole('button', { name: 'Account menu' });
  await trigger.click();
  await page.getByRole('link', { name: 'Profile and appearance' }).focus();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('link', { name: 'Profile and appearance' })).toBeHidden();
  await openDrawer(page);
  const select = sidebarOf(page).locator('select').first();
  await select.focus();
  await select.selectOption('labs');
  await expect(select).toBeFocused();
  await expect(page.getByRole('dialog', { name: 'Workspace' })).toBeVisible();
});

test('href with onSelect: preventDefault cancels navigation and onNavigate, otherwise navigation proceeds, modified clicks skip callbacks', async ({ page }) => {
  const link = page.getByRole('navigation', { name: 'Guarded' }).getByRole('link', { name: 'Guarded page' });
  const counters = page.getByRole('status', { name: 'Guard counters' });
  await expect(link).toHaveAttribute('href', '#/guarded-a');
  await link.click();
  await expect(counters).toHaveText('selected 1, navigated 0');
  expect(page.url()).not.toContain('guarded-a');
  await page.getByRole('button', { name: 'Discard draft' }).click();
  await link.click();
  await expect(counters).toHaveText('selected 2, navigated 1');
  await expect.poll(() => page.url()).toContain('#/guarded-a');
  await link.click({ modifiers: ['Control'] });
  await link.click({ modifiers: ['Meta'] });
  await expect(counters).toHaveText('selected 2, navigated 1');
});

for (const direction of ['ltr', 'rtl'] as const) {
  test(`wrapped long breadcrumb names stay readable at 320, 768 and 1440 in ${direction}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Widths are set explicitly; one project is enough.');
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${appUrl('light')}&crumbs=long`);
      await page.locator('html').evaluate((element, dir) => element.setAttribute('dir', dir), direction);
      const header = page.locator('.t98-shell-header');
      const metrics = await header.evaluate(node => {
        const scope = node.querySelector<HTMLElement>('.t98-app-topbar__scope')!;
        const line = parseFloat(getComputedStyle(scope).lineHeight) || parseFloat(getComputedStyle(scope).fontSize) * 1.4;
        const trigger = node.querySelector<HTMLElement>('.t98-account-menu button')!.getBoundingClientRect();
        const crumb = node.querySelector<HTMLElement>('.t98-app-topbar__breadcrumb')!.getBoundingClientRect();
        return { scopeLines: Math.round(scope.getBoundingClientRect().height / line), crumbWidth: crumb.width, crumbTop: crumb.top, crumbBottom: crumb.bottom, triggerTop: trigger.top, triggerBottom: trigger.bottom, height: node.getBoundingClientRect().height, page: document.documentElement.scrollWidth };
      });
      // Regression: the scope used to break a few characters per line (9 lines at 320, a 2,854px header at 768).
      expect(metrics.scopeLines, `${width} scope lines`).toBeLessThanOrEqual(2);
      expect(metrics.crumbWidth, `${width} crumb width`).toBeGreaterThanOrEqual(120);
      expect(metrics.height, `${width} header height`).toBeLessThan(width === 320 ? 320 : 260);
      expect(metrics.page, `${width} page width`).toBeLessThanOrEqual(width);
      // At phone width the account control stays beside the breadcrumb (vertically centred) rather than dropping below it;
      // wider bars may move search and actions to their own rows.
      if (width === 320) expect(metrics.triggerTop, `${width} account row`).toBeLessThan(metrics.crumbBottom);
    }
  });
}

for (const direction of ['ltr', 'rtl'] as const) {
  test(`an unbroken 130-character scope name is clamped to two lines with its full name in a title, in ${direction}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Widths are set explicitly; one project is enough.');
    const name = 'Project-' + 'long-name-'.repeat(12);
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${appUrl('light')}&crumbs=unbroken`);
      await page.locator('html').evaluate((element, dir) => element.setAttribute('dir', dir), direction);
      const scope = page.locator('.t98-app-topbar__scope');
      await expect(scope).toHaveAttribute('title', name);
      // Discover's measure (tests/shell-flow-browser.mjs compactScope): header height and workspace lines.
      const metrics = await page.locator('.t98-shell-header').evaluate(node => {
        const element = node.querySelector<HTMLElement>('.t98-app-topbar__scope')!;
        return { lines: element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight), height: node.getBoundingClientRect().height, crumb: node.querySelector('.t98-app-topbar__breadcrumb')!.getBoundingClientRect().width, page: document.documentElement.scrollWidth };
      });
      expect(metrics.lines, `${width} scope lines`).toBeLessThanOrEqual(2.05);
      expect(metrics.height, `${width} header height`).toBeLessThanOrEqual(320);
      expect(metrics.page, `${width} page width`).toBeLessThanOrEqual(width);
      if (width === 320) expect(metrics.crumb, 'the breadcrumb has its own full-width row').toBeGreaterThan(240);
      // The clamp is visual only: the accessible name keeps the whole scope.
      expect(await scope.textContent()).toBe(name);
    }
  });
}

test('the current crumb truncates with an ellipsis and keeps its full name in the title', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(appUrl('light'));
  const current = page.locator('.t98-app-topbar__current');
  // text-overflow applies only to a block container; the crumbs' inline-flex would clip without the ellipsis.
  expect(await current.evaluate(element => getComputedStyle(element).display)).toBe('block');
  await expect(current).toHaveAttribute('title', 'Overview');
  await expect(current).toHaveCSS('text-overflow', 'ellipsis');
});

test('the topbar search text starts after the magnifier, even when the spacing token is missing', async ({ page }) => {
  await page.goto(appUrl('light'));
  const gap = () => page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>('.t98-search-field--topbar .t98-search-field__input')!;
    const icon = document.querySelector('.t98-search-field--topbar .t98-search-field__icon')!;
    const textStart = input.getBoundingClientRect().left + parseFloat(getComputedStyle(input).paddingInlineStart);
    return textStart - icon.getBoundingClientRect().right;
  });
  expect(await gap()).toBeGreaterThanOrEqual(4);
  // An app stylesheet that drops or overrides the token must not collapse the padding.
  await page.addStyleTag({ content: '.t98-search-field { --t98-space-10: initial; --t98-space-3: initial; --t98-space-2: initial; }' });
  expect(await gap()).toBeGreaterThanOrEqual(4);
});

test('SectionNav at 320px fades the edge that hides sections and starts with the current one in view', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tests/shell.html?theme=light');
  const list = page.getByRole('navigation', { name: 'Page sections' }).getByRole('list');
  await expect(list).toHaveAttribute('data-overflow', 'end');
  expect(await list.evaluate(element => getComputedStyle(element).maskImage)).toContain('linear-gradient');
  await list.evaluate(element => { element.scrollLeft = element.scrollWidth; });
  await expect(list).toHaveAttribute('data-overflow', 'start');

  // A current section near the end is scrolled into the row's view on load, without moving the page.
  await page.goto('/tests/shell.html?theme=light&section=settings');
  const current = page.getByRole('navigation', { name: 'Page sections' }).getByRole('link', { name: 'Settings' });
  await expect(current).toHaveAttribute('aria-current', 'page');
  const inView = await current.evaluate(element => {
    const row = element.closest('ul')!.getBoundingClientRect(), box = element.getBoundingClientRect();
    return box.left >= row.left - 1 && box.right <= row.right + 1;
  });
  expect(inView).toBe(true);
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
});

test('the sidebar status label keeps a readable width at 1280px, wrapping its action instead (#77)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(appUrl('light'));
  await page.locator('.t98-sidebar-status__label').first().evaluate(element => { element.textContent = 'Connect your channels'; });
  const width = await page.locator('.t98-sidebar-status__label').first().evaluate(element => element.getBoundingClientRect().width);
  expect(width).toBeGreaterThanOrEqual(100);
});


async function openWrappedSections(page: Page, theme: string, direction: 'ltr' | 'rtl', zoom: number) {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(`/tests/shell.html?view=sections-wrap&theme=${theme}`);
  // CSS body zoom reproduces the consumer's constrained grid; this is not native browser zoom.
  await page.evaluate(({ direction, zoom }) => {
    document.documentElement.dir = direction;
    document.body.style.margin = '0';
    document.body.style.zoom = String(zoom);
  }, { direction, zoom });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await expect(page.getByRole('navigation', { name: 'Wrapped report sections' })).toBeVisible();
}

test('SectionNav wrap: complete labels fit the padded grid at 320px with CSS body zoom', async ({ page }, info) => {
  const theme = info.project.name === 'narrow-dark' ? 'dark' : 'light';
  for (const direction of ['ltr', 'rtl'] as const) for (const zoom of [1, 2]) {
    await openWrappedSections(page, theme, direction, zoom);
    const nav = page.getByRole('navigation', { name: 'Wrapped report sections' });
    const list = nav.getByRole('list');
    await expect(nav.getByRole('listitem')).toHaveCount(5);
    await expect(nav.getByRole('link')).toHaveCount(4);
    await expect(nav.getByText('Hidden specialist section', { exact: true })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Specialized citation reports', exact: true })).toHaveText('Specialized citation reports');
    await expect(nav.locator('[aria-disabled="true"]')).toContainText('Requires report access');
    const metrics = await page.getByRole('main', { name: 'Wrapped section content' }).evaluate(main => {
      const nav = main.querySelector('nav')!;
      const list = nav.querySelector('ul')!;
      const zoom = Number(getComputedStyle(document.body).zoom) || 1;
      const mainBox = main.getBoundingClientRect();
      const mainStyle = getComputedStyle(main);
      const start = mainBox.left + parseFloat(mainStyle.paddingLeft) * zoom;
      const end = mainBox.right - parseFloat(mainStyle.paddingRight) * zoom;
      const violations: string[] = [];
      for (const element of [nav, list, ...nav.querySelectorAll('li, .t98-section-nav__link, .t98-badge')]) {
        const box = element.getBoundingClientRect();
        if (box.left < start - 1 || box.right > end + 1 || box.left < -1 || box.right > innerWidth + 1) violations.push(`bounds: ${element.tagName} ${element.className}`);
      }
      for (const element of [document.documentElement, document.body, main, nav, list]) {
        if (element.scrollWidth > element.clientWidth + 1) violations.push(`horizontal overflow: ${element.tagName}`);
      }
      for (const element of [nav, list, ...nav.querySelectorAll('.t98-section-nav__link')]) {
        const style = getComputedStyle(element);
        if (style.maskImage !== 'none' || style.clipPath !== 'none' || ['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY) || !['none', '0'].includes(style.webkitLineClamp) || style.textOverflow === 'ellipsis') violations.push(`clipping style: ${element.className}`);
      }
      let wrapped = false;
      const target = nav.querySelectorAll('.t98-section-nav__link')[2];
      for (const link of nav.querySelectorAll<HTMLElement>('.t98-section-nav__link')) {
        const box = link.getBoundingClientRect();
        if (box.height / zoom < 43.5) violations.push(`touch height: ${link.textContent}`);
        const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          if (!node.textContent?.trim() || node.parentElement?.closest('.t98-visually-hidden')) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          const fragments = [...range.getClientRects()];
          if (link === target && new Set(fragments.map(rect => Math.round(rect.top))).size > 1) wrapped = true;
          for (const fragment of fragments) {
            if (fragment.left < start - 1 || fragment.right > end + 1 || fragment.left < box.left - 1 || fragment.right > box.right + 1 || fragment.top < box.top - 1 || fragment.bottom > box.bottom + 1) violations.push(`text fragment: ${node.textContent}`);
          }
        }
      }
      return { violations, wrapped, mainWidth: mainBox.width, contentWidth: end - start, display: mainStyle.display, listMask: getComputedStyle(list).maskImage };
    });
    expect(metrics.violations, `${direction}, CSS body zoom ${zoom}`).toEqual([]);
    expect(metrics.display).toBe('grid');
    expect(metrics.mainWidth).toBeCloseTo(320, 0);
    expect(metrics.contentWidth).toBeCloseTo(320 - 32 * zoom, 0);
    expect(metrics.wrapped).toBe(true);
    expect(metrics.listMask).toBe('none');
    await expect(list).not.toHaveAttribute('data-overflow', /.+/);
    await page.screenshot({ path: info.outputPath(`sections-wrap-${direction}-css-zoom-${zoom}.png`), fullPage: true });
  }
});

test('SectionNav wrap: keyboard skips unavailable sections and retains the caller navigation guard', async ({ page }, info) => {
  const theme = info.project.name === 'narrow-dark' ? 'dark' : 'light';
  for (const direction of ['ltr', 'rtl'] as const) for (const zoom of [1, 2]) {
    await openWrappedSections(page, theme, direction, zoom);
    const nav = page.getByRole('navigation', { name: 'Wrapped report sections' });
    const overview = nav.getByRole('link', { name: 'Overview', exact: true });
    const citations = nav.getByRole('link', { name: 'Specialized citation reports', exact: true });
    const evidence = nav.getByRole('link', { name: /^CitationEvidenceScope/ });
    const sources = nav.getByRole('link', { name: 'Sources', exact: true });
    const guard = page.getByRole('status', { name: 'Wrapped section guard' });
    await expect(overview).toHaveAttribute('aria-current', 'page');
    await overview.focus();
    await page.keyboard.press('Tab');
    await expect(citations).toBeFocused();
    const focus = await citations.evaluate(element => ({ visible: element.matches(':focus-visible'), style: getComputedStyle(element).outlineStyle, width: parseFloat(getComputedStyle(element).outlineWidth) }));
    expect(focus.visible).toBe(true);
    expect(focus.style).not.toBe('none');
    expect(focus.width).toBeGreaterThan(0);
    await page.keyboard.press('Enter');
    await expect(guard).toHaveText('selected 1, accepted 0');
    await expect(overview).toHaveAttribute('aria-current', 'page');
    expect(new URL(page.url()).hash).toBe('');
    await page.keyboard.press('Tab');
    await expect(evidence).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(sources).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Discard draft', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await overview.focus();
    await page.keyboard.press('Tab');
    await expect(citations).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(guard).toHaveText('selected 2, accepted 1');
    await expect(citations).toHaveAttribute('aria-current', 'page');
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(page.getByRole('status', { name: 'Wrapped current section' })).toHaveText('Selected: citations');
    await expect.poll(() => new URL(page.url()).hash).toBe('#/wrap-citations');
  }
});
