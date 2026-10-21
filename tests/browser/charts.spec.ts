import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const evidence = resolve('.qa/charts');

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
const readoutOf = (plot: ReturnType<Page['locator']>) => plot.locator('xpath=following-sibling::p[@role="status"]');

for (const theme of ['light', 'dark'] as const) {
  test(`charts stay inspectable by keyboard and inside the page in ${theme}`, async ({ page }, info) => {
    const width = info.project.name === 'narrow-dark' ? 320 : 1440;
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await mkdir(evidence, { recursive: true });
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto(`/tests/charts.html?theme=${theme}`);
    const screen = page.locator('#charts');
    await expect(screen.getByRole('heading', { level: 1, name: 'Charts' })).toBeVisible();
    expect(await overflow(page), 'no page overflow').toBeLessThanOrEqual(1);

    // Unavailable is hatched text, never a zero bar; the partial point carries a ring.
    const visits = screen.locator('figure', { hasText: 'Weekly visits' }).first();
    await expect(visits.locator('.t98-chart-unavailable-text')).toHaveText('Unavailable');
    await expect(visits.locator('.t98-chart-partial-mark').first()).toBeVisible();
    expect(await visits.locator('rect.t98-chart-bar').evaluateAll(rects => rects.filter(rect => Number(rect.getAttribute('height')) <= 0).length)).toBe(0);
    await expect(visits).toContainText('8 points, minimum -4, maximum 30, 1 unavailable');

    // Keyboard: roving point, series switch and a polite announcement.
    const plot = screen.getByRole('group', { name: /Visits and sign-ups plot/ });
    await expect(plot).toHaveAttribute('tabindex', '0');
    const readout = readoutOf(plot);
    await plot.focus();
    await expect(readout).toHaveText('Week one of the launch · Visits: 12');
    await page.keyboard.press('ArrowRight');
    await expect(readout).toHaveText('Week two of the launch · Visits: 18');
    await page.keyboard.press('ArrowRight');
    await expect(readout).toHaveText('Week three of the launch · Visits: unavailable');
    await page.keyboard.press('ArrowDown');
    await expect(readout).toHaveText('Week three of the launch · Sign-ups: 7');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('End');
    await expect(readout).toHaveText('Week eight of the launch · Visits: 28');
    await page.keyboard.press('Home');
    await expect(readout).toHaveText('Week one of the launch · Visits: 12');
    const barsPlot = screen.getByRole('group', { name: /Weekly visits plot/ });
    await barsPlot.focus();
    for (let step = 0; step < 4; step++) await page.keyboard.press('ArrowRight');
    await expect(readoutOf(barsPlot)).toHaveText('Week five of the launch · Visits: 21 (partial)');
    await expect(screen.locator('#inspected')).toHaveText('Inspected: 4');

    // The data table lists every x and sits in a focusable scroll region.
    await visits.getByText('View data table').click();
    const table = visits.getByRole('region', { name: 'Weekly visits data table' });
    await expect(table).toHaveAttribute('tabindex', '0');
    await expect(table.getByRole('rowheader')).toHaveCount(8);
    await expect(table.getByRole('cell', { name: 'Unavailable' })).toHaveCount(1);

    // The wide plot scrolls inside its own region.
    const scroll = await plot.evaluate(node => ({ visible: node.clientWidth, content: node.scrollWidth }));
    if (width === 320) expect(scroll.content).toBeGreaterThan(scroll.visible);
    expect(await overflow(page), 'no overflow after interaction').toBeLessThanOrEqual(1);

    // Selection and unavailable states.
    const list = screen.getByRole('list', { name: 'Spend by channel' });
    await expect(list.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-pressed', 'true');
    await list.getByRole('button', { name: 'Social' }).click();
    await expect(list.getByRole('button', { name: 'Social' })).toHaveAttribute('aria-pressed', 'true');
    await expect(list).toContainText('Unavailable');
    await expect(screen.getByText('Unavailable', { exact: true }).last()).toBeVisible();

    await page.screenshot({ path: resolve(evidence, `charts-${theme}-${width}.png`), fullPage: true });

    const restore = await doubleText(page);
    expect(await overflow(page), 'no page overflow with doubled text').toBeLessThanOrEqual(1);
    await page.screenshot({ path: resolve(evidence, `charts-${theme}-${width}-doubled.png`), fullPage: true });
    await restore();
    expect(errors).toEqual([]);
  });
}

test('forced colors keep chart strokes and hatching visible', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/tests/charts.html');
  const result = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'CanvasText';
    document.body.append(probe);
    const text = getComputedStyle(probe).color;
    probe.remove();
    const stroke = (selector: string) => { const node = document.querySelector(selector); return node ? getComputedStyle(node).stroke : 'missing'; };
    return { text, line: stroke('.t98-chart-line'), bar: stroke('rect.t98-chart-bar'), hatch: stroke('.t98-chart-hatch-line'), column: stroke('.t98-chart-unavailable-column') };
  });
  expect(result.line).toBe(result.text);
  expect(result.bar).toBe(result.text);
  expect(result.hatch).toBe(result.text);
  expect(result.column).toBe(result.text);
  await mkdir(evidence, { recursive: true });
  await page.locator('#charts').screenshot({ path: resolve(evidence, 'charts-forced-colors.png') });
});

test('the plot stays left to right in a right to left page', async ({ page }) => {
  await page.goto('/tests/charts.html?dir=rtl');
  const plot = page.getByRole('group', { name: /Weekly visits plot/ });
  await expect(plot).toHaveCSS('direction', 'ltr');
  const first = await plot.locator('text.t98-chart-axis-text', { hasText: 'Week' }).first().boundingBox();
  const last = await plot.locator('text.t98-chart-axis-text', { hasText: 'Week' }).last().boundingBox();
  expect(first!.x).toBeLessThan(last!.x);
  await plot.focus();
  await page.keyboard.press('ArrowRight');
  await expect(readoutOf(plot)).toHaveText('Week two of the launch · Visits: 18');
});
