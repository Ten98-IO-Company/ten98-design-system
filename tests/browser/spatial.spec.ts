import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const evidence = resolve('.qa/spatial');

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
const activeDate = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.closest('[data-date]')?.getAttribute('data-date'));

for (const theme of ['light', 'dark'] as const) {
  test(`maps, heatmaps, replay and calendar are operable and reflow in ${theme}`, async ({ page }, info) => {
    const width = info.project.name === 'narrow-dark' ? 320 : 1440;
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto(`/tests/spatial.html?theme=${theme}`);
    const screen = page.locator('#spatial');
    await expect(screen.getByRole('heading', { level: 1, name: 'Spatial and calendar' })).toBeVisible();
    expect(await overflow(page), 'no page overflow').toBeLessThanOrEqual(1);

    // Replay: script-only sandbox, never same-origin.
    const frame = screen.locator('iframe');
    await expect(frame).toHaveAttribute('sandbox', 'allow-scripts');
    await expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');

    // Map: one tab stop, arrows rove in name order, Shift+arrows pan, +/- and buttons zoom.
    const map = screen.locator('section[aria-label="Sessions by country"]');
    const stops = map.locator('path[tabindex="0"]');
    await expect(stops).toHaveCount(1);
    await stops.focus();
    await expect(stops).toHaveAttribute('data-code', 'AA');
    await page.keyboard.press('ArrowRight');
    await expect(map.locator('path[data-code="BB"]')).toBeFocused();
    await expect(map.locator('path[tabindex="0"]')).toHaveAttribute('data-code', 'BB');
    await expect(map.getByRole('status')).toContainText('Beta sample: Sessions 300 sessions');
    await page.keyboard.press('End');
    await expect(map.locator('path[data-code="DD"]')).toBeFocused();
    const svg = map.locator('svg.t98-map-svg');
    const before = await svg.getAttribute('viewBox');
    await page.keyboard.press('+');
    await expect(map.getByText('Zoom 2 of 4')).toBeVisible();
    const zoomed = await svg.getAttribute('viewBox');
    expect(zoomed).not.toBe(before);
    await page.keyboard.press('Shift+ArrowRight');
    expect(await svg.getAttribute('viewBox')).not.toBe(zoomed);
    await map.getByRole('button', { name: 'Zoom in' }).click();
    await expect(map.getByText('Zoom 3 of 4')).toBeVisible();
    await map.getByRole('button', { name: 'Pan left' }).click();
    await map.getByRole('button', { name: 'Reset view' }).click();
    await expect(map.getByText('Zoom 1 of 4')).toBeVisible();
    expect(await svg.getAttribute('viewBox')).toBe(before);
    await expect(map.getByRole('cell', { name: 'No data' })).toBeVisible();
    await expect(map.getByRole('row', { name: /^Not recorded\s+Unavailable/ })).toBeVisible();

    // Heatmap: a null share is Unavailable.
    await expect(screen.getByText('Bottom half · Unavailable')).toBeVisible();

    // Calendar: APG keys.
    const calendar = screen.locator('section[aria-label$="calendar"]');
    await expect(calendar.locator('td[tabindex="0"]')).toHaveAttribute('data-date', '2026-10-21');
    await calendar.locator('td[data-date="2026-10-21"]').focus();
    await page.keyboard.press('ArrowRight');
    expect(await activeDate(page)).toBe('2026-10-22');
    await page.keyboard.press('ArrowDown');
    expect(await activeDate(page)).toBe('2026-10-29');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowLeft');
    expect(await activeDate(page)).toBe('2026-10-21');
    await page.keyboard.press('Home');
    expect(await activeDate(page)).toBe('2026-10-19');
    await page.keyboard.press('End');
    expect(await activeDate(page)).toBe('2026-10-25');
    await page.keyboard.press('PageDown');
    await expect(screen.locator('#log')).toHaveText('next');
    await expect(calendar.getByRole('heading', { name: 'November 2026' })).toBeVisible();
    expect(await activeDate(page)).toBe('2026-11-25');
    await page.keyboard.press('PageUp');
    await expect(calendar.getByRole('heading', { name: 'October 2026' })).toBeVisible();
    expect(await activeDate(page)).toBe('2026-10-25');
    await expect(calendar.getByRole('columnheader')).toHaveCount(7);
    await expect(calendar.getByText('Creating entries is disabled: read-only access.')).toBeVisible();
    await expect(calendar.getByRole('button', { name: /^Create on/ }).first()).toBeDisabled();
    const box = await calendar.getByRole('button', { name: 'Next month' }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(43.5);

    expect(await overflow(page), 'no overflow after interaction').toBeLessThanOrEqual(1);
    await mkdir(evidence, { recursive: true });
    await page.screenshot({ path: resolve(evidence, `${info.project.name}-${theme}.png`), fullPage: true });

    const restore = await doubleText(page);
    expect(await overflow(page), 'no overflow at doubled text').toBeLessThanOrEqual(1);
    await page.screenshot({ path: resolve(evidence, `${info.project.name}-${theme}-200pct.png`), fullPage: true });
    await restore();

    expect(errors).toEqual([]);
  });
}

test('spatial components stay visible in forced colors', async ({ page }, info) => {
  await page.setViewportSize({ width: info.project.name === 'narrow-dark' ? 320 : 1440, height: 1000 });
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/tests/spatial.html');
  const alpha = page.locator('path[data-code="AA"]');
  await expect(alpha).toBeVisible();
  const fill = await alpha.evaluate(element => getComputedStyle(element).fill);
  expect(fill).not.toBe('none');
  await expect(page.locator('.t98-heatmap-band-label').first()).toBeVisible();
  await expect(page.locator('td[data-date="2026-10-21"]')).toBeVisible();
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: resolve(evidence, `${info.project.name}-forced-colors.png`), fullPage: true });
});
