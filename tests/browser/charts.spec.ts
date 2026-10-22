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

test('axis labels never overlap, responsive width fills the figure and dense series scroll inside', async ({ page }, info) => {
  const width = info.project.name === 'narrow-dark' ? 320 : 1440;
  await mkdir(evidence, { recursive: true });
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('/tests/charts.html');
  const screen = page.locator('#charts');
  const labelled = async (name: RegExp) => {
    const plot = screen.getByRole('group', { name });
    return { plot, ticks: await plot.locator('svg text.t98-chart-x-tick').evaluateAll(nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return { text: node.textContent ?? '', left: box.left, right: box.right, title: node.querySelector('title')?.textContent ?? null }; })) };
  };
  for (const name of [/Weekly visits plot/, /Visits and sign-ups plot/, /Sixty days plot/]) {
    const { ticks } = await labelled(name);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < ticks.length; i++) expect(ticks[i].left, `${name} ticks ${i - 1}/${i}`).toBeGreaterThanOrEqual(ticks[i - 1].right);
  }
  const weekly = await labelled(/Weekly visits plot/);
  expect(weekly.ticks[0].text).toMatch(/^Week one/);
  const lastTick = weekly.ticks.at(-1)!;
  expect(lastTick.title ?? lastTick.text).toBe('Week eight of the launch');
  if (width === 320) expect(weekly.ticks.some(tick => tick.text.endsWith('…') && tick.title)).toBe(true);
  const visits = screen.locator('figure', { hasText: 'Weekly visits' }).first();
  await visits.getByText('View data table').click();
  await expect(visits.getByRole('rowheader', { name: 'Week seven of the launch' })).toHaveCount(1);

  const sixty = await labelled(/Sixty days plot/);
  expect(sixty.ticks[0].text).toBe('D1');
  expect(sixty.ticks.at(-1)!.text).toBe('D60');
  const dims = await sixty.plot.evaluate(node => ({ visible: node.clientWidth, content: node.scrollWidth }));
  expect(dims.content, 'sixty points scroll inside the region').toBeGreaterThan(dims.visible);
  expect(await overflow(page)).toBeLessThanOrEqual(1);

  const fill = await weekly.plot.evaluate(node => ({ svg: node.querySelector('svg')!.getBoundingClientRect().width, figure: (() => { const figure = node.closest('figure')!; const style = getComputedStyle(figure); return figure.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight); })() }));
  if (width === 1440) expect(fill.svg).toBeGreaterThanOrEqual(fill.figure * 0.9);

  // Resizing re-measures and keyboard inspection keeps working.
  await page.setViewportSize({ width: width === 1440 ? 600 : 700, height: 1000 });
  await expect.poll(() => weekly.plot.evaluate(node => Math.round(node.querySelector('svg')!.getBoundingClientRect().width))).not.toBe(Math.round(fill.svg));
  await weekly.plot.focus();
  await page.keyboard.press('ArrowRight');
  await expect(readoutOf(weekly.plot)).toHaveText('Week two of the launch · Visits: 18');
  expect(await overflow(page)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: resolve(evidence, `charts-ticks-${width}.png`), fullPage: true });
});

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

for (const theme of ['light', 'dark'] as const) {
  test(`WeekdayHourGrid cell text keeps 4.5:1 contrast at every shade and scrolls inside its region in ${theme}`, async ({ page }, info) => {
    const width = info.project.name === 'narrow-dark' ? 320 : 1440;
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(`/tests/charts.html?theme=${theme}`);
    const grid = page.getByRole('region', { name: 'Sessions by hour table' });
    await expect(grid.getByRole('row')).toHaveCount(8);
    await expect(grid.getByRole('cell', { name: 'Unavailable' })).toHaveCount(1);
    const ratios = await grid.locator('td.t98-hour-cell:not(.t98-hour-cell--unavailable)').evaluateAll(cells => {
      const rgb = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      const lum = ([r, g, b]: number[]) => [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      // Paint each background over the page surface so translucent mixes are measured as seen.
      const probe = document.createElement('canvas').getContext('2d')!;
      return cells.map(cell => {
        const style = getComputedStyle(cell);
        probe.fillStyle = getComputedStyle(document.body).backgroundColor; probe.fillRect(0, 0, 1, 1);
        probe.fillStyle = style.backgroundColor; probe.fillRect(0, 0, 1, 1);
        const bg = [...probe.getImageData(0, 0, 1, 1).data].slice(0, 3);
        const [a, b] = [lum(rgb(style.color)), lum(bg)].sort((x, y) => y - x);
        return (a + 0.05) / (b + 0.05);
      });
    });
    expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    if (width === 320) {
      await grid.focus();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => grid.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
    }
  });
}

test('a compressed 90-day chart fits its figure without scrolling and still inspects points by keyboard', async ({ page }, info) => {
  const width = info.project.name === 'narrow-dark' ? 320 : 1440;
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/tests/charts.html');
  const figure = page.locator('figure', { hasText: 'Ninety days compressed' });
  const plot = figure.getByRole('group', { name: /Ninety days compressed plot/ });
  await expect(plot).toBeVisible();
  expect(await plot.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await plot.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(figure.getByRole('status')).toContainText('Day 3 · Visits:');
  await page.keyboard.press('Home');
  await expect(figure.getByRole('status')).toContainText('Day 1 · Visits: unavailable');
  const boxes = await figure.locator('.t98-chart-x-tick').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect()).map(r => [r.left, r.right]));
  for (let i = 1; i < boxes.length; i++) expect(boxes[i][0]).toBeGreaterThanOrEqual(boxes[i - 1][1] - 0.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('BarList filter rows are 44px targets and the share donut fits its card at 320px with doubled text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/tests/charts.html');
  for (const name of ['Search', 'Social']) expect((await page.getByRole('button', { name }).boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
  const restore = await doubleText(page);
  const donut = page.locator('figure', { hasText: 'Delivery share' }).locator('.t98-share-donut');
  const fits = await donut.evaluate(svg => svg.getBoundingClientRect().right <= svg.closest('figure')!.getBoundingClientRect().right + 0.5);
  expect(fits, 'the donut stays inside its card').toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await restore();
});
