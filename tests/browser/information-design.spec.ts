import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Download, type Locator, type Page, type TestInfo } from '@playwright/test';

const theme = (info: TestInfo) => info.project.name === 'narrow-dark' ? 'dark' : 'light';
const capture = (info: TestInfo, name: string) => resolve(process.cwd(), '..', `information-design-${info.project.name}-${name}.png`);
const metadata = (page: Page, label: string) => page.locator(`dl[aria-label="${label}"]`);

async function doubleText(page: Page) {
  return page.evaluate(() => {
    const probe = document.querySelector('h1')!;
    const before = Number.parseFloat(getComputedStyle(probe).fontSize);
    const sizes = [...document.querySelectorAll('*')].filter((element): element is HTMLElement => element instanceof HTMLElement).map(element => {
      const style = getComputedStyle(element);
      return { element, font: Number.parseFloat(style.fontSize), line: Number.parseFloat(style.lineHeight) };
    });
    for (const { element, font, line } of sizes) {
      if (Number.isFinite(font)) element.style.fontSize = `${font * 2}px`;
      if (Number.isFinite(line)) element.style.lineHeight = `${line * 2}px`;
    }
    return { before, after: Number.parseFloat(getComputedStyle(probe).fontSize) };
  });
}

async function pairs(list: Locator) {
  return list.evaluate(element => [...element.children].map(item => {
    const row = item.getBoundingClientRect(), term = item.querySelector('dt')!.getBoundingClientRect(), value = item.querySelector('dd')!.getBoundingClientRect();
    return { x: row.x, termX: term.x, termY: term.y, termBottom: term.bottom, valueX: value.x, valueY: value.y, width: row.width };
  }));
}

async function expectDownload(download: Download, filename: string, contents: string) {
  expect(download.suggestedFilename()).toBe(filename);
  const file = await download.path();
  expect(file).not.toBeNull();
  if (!file) throw new Error('The browser did not provide a downloaded file.');
  expect(await readFile(file)).toEqual(Buffer.from(contents, 'utf8'));
}

async function openReport(page: Page, info: TestInfo) {
  await page.goto(`/?theme=${theme(info)}#components/report-toolbar?tab=states`);
  const state = page.locator('.reference-state').filter({ has: page.getByRole('heading', { name: 'Complete traffic report', exact: true }) });
  const report = state.getByRole('region', { name: 'Synthetic traffic report', exact: true });
  await expect(report).toBeVisible();
  return report;
}

test('catalogue query and category survive direct links, detail tabs, reload and back', async ({ page }, info) => {
  await page.goto(`/?theme=${theme(info)}#components?q=sheet&group=Feedback`);
  const search = page.getByRole('textbox', { name: 'Search components', exact: true, includeHidden: true });
  const category = page.getByRole('combobox', { name: 'Component category', exact: true, includeHidden: true });
  await expect(search).toHaveValue('sheet');
  await expect(category).toHaveValue('Feedback');
  await page.locator('.reference-component-card').filter({ has: page.getByRole('heading', { name: 'Sheet', exact: true }) }).click();
  await page.getByRole('navigation', { name: 'Sheet documentation', exact: true }).getByRole('link', { name: 'Props', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Sheet', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Sheet props', exact: true })).toBeVisible();
  await expect(search).toHaveValue('sheet');
  await expect(category).toHaveValue('Feedback');
  await page.getByRole('link', { name: 'All components', exact: true }).click();
  await expect(search).toHaveValue('sheet');
  await expect(category).toHaveValue('Feedback');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Sheet', exact: true })).toBeVisible();
  expect(new URLSearchParams((await page.url()).split('?').at(-1)).get('q')).toBe('sheet');
});

test('catalogue zero results has a keyboard recovery that clears both filters', async ({ page }, info) => {
  await page.goto(`/?theme=${theme(info)}#components?q=no-such-component-2048&group=Feedback`);
  await expect(page.getByRole('heading', { name: 'No matching components', exact: true })).toBeVisible();
  const clear = page.getByRole('button', { name: 'Clear filters', exact: true });
  await clear.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox', { name: 'Search components', exact: true })).toHaveValue('');
  await expect(page.getByRole('combobox', { name: 'Component category', exact: true })).toHaveValue('All');
  await expect(page.locator('.reference-component-card').filter({ has: page.getByRole('heading', { name: 'DescriptionList', exact: true }) })).toBeVisible();
  expect(new URL(await page.url()).hash).toBe('#components');
});

test('mobile component discovery has one keyboard filter set at 320px, RTL and doubled text', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 1000 });
  for (const dir of ['ltr', 'rtl'] as const) {
    await page.goto(`/?theme=${theme(info)}&direction=${dir}#components/sheet?q=sheet&group=Feedback`);
    await page.evaluate(value => { document.documentElement.dir = value; }, dir);
    const size = await doubleText(page);
    expect(size.after).toBeCloseTo(size.before * 2, 1);
    const browser = page.getByRole('complementary', { name: 'Components', exact: true });
    const toggle = browser.locator('summary');
    const search = browser.getByRole('textbox', { name: 'Search components', exact: true });
    await expect(page.getByRole('textbox', { name: 'Search components', exact: true, includeHidden: true })).toHaveCount(1);
    await expect(page.getByRole('combobox', { name: 'Component category', exact: true, includeHidden: true })).toHaveCount(1);
    await expect(search).toBeHidden();
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(search).toBeVisible();
    await search.fill('description');
    await browser.getByRole('combobox', { name: 'Component category', exact: true }).selectOption('Layout');
    const target = browser.getByRole('navigation', { name: 'Component results', exact: true }).getByRole('link', { name: /^DescriptionList/ });
    await target.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'DescriptionList', level: 1, exact: true })).toBeVisible();
    await expect(target).toHaveAttribute('aria-current', 'page');
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(search).toBeHidden();
    const layout = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      width: document.documentElement.scrollWidth,
      outside: [...document.querySelectorAll('body *')].filter(element => {
        const box = element.getBoundingClientRect(), style = getComputedStyle(element);
        return box.width > 0 && style.visibility !== 'hidden' && box.right > document.documentElement.clientWidth + 1;
      }).slice(0, 8).map(element => ({ tag: element.tagName, className: element.className, width: element.getBoundingClientRect().width })),
    }));
    expect(layout.width, JSON.stringify({ dir, size, outside: layout.outside })).toBeLessThanOrEqual(layout.viewport + 1);
    await page.screenshot({ path: capture(info, `discovery-${dir}-text-200`), fullPage: true });
  }
});

test('metadata keeps default geometry, aligns wide pairs and respects declared column counts per container', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/tests/information-design.html?theme=${theme(info)}`);
  const shape = (list: Locator) => list.evaluate(element => {
    const origin = element.getBoundingClientRect();
    return [...element.querySelectorAll('dt,dd')].map(child => { const rect = child.getBoundingClientRect(); return [rect.x - origin.x, rect.y - origin.y, rect.width, rect.height]; });
  });
  expect(await shape(metadata(page, 'Default metadata'))).toEqual(await shape(metadata(page, 'Explicit default metadata')));
  const horizontal = await pairs(metadata(page, 'Horizontal metadata'));
  expect(new Set(horizontal.map(pair => pair.valueX)).size).toBe(1);
  for (const pair of horizontal) { expect(pair.valueX).toBeGreaterThan(pair.termX + 100); expect(Math.abs(pair.termY - pair.valueY)).toBeLessThan(4); }
  const gap = (list: Locator) => list.evaluate(element => Number.parseFloat(getComputedStyle(element).rowGap));
  expect(await gap(metadata(page, 'Compact metadata'))).toBeLessThan(await gap(metadata(page, 'Horizontal metadata')));
  for (const width of [900, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [label, maximum] of [['Two-column metadata', 2], ['Three-column metadata', 3]] as const) {
      const rows = await pairs(metadata(page, label));
      expect(rows).toHaveLength(6);
      expect(new Set(rows.map(pair => Math.round(pair.x))).size, `${label} at ${width}`).toBeLessThanOrEqual(maximum);
      for (const pair of rows.filter(pair => pair.width <= 416)) expect(pair.valueY).toBeGreaterThanOrEqual(pair.termBottom - 1);
    }
  }
});

test('metadata full text and links remain readable in narrow RTL containers with doubled text', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 1000 });
  for (const dir of ['ltr', 'rtl'] as const) {
    await page.goto(`/tests/information-design.html?theme=${theme(info)}&direction=${dir}`);
    await page.evaluate(value => { document.documentElement.dir = value; }, dir);
    const size = await doubleText(page);
    expect(size.after).toBeCloseTo(size.before * 2, 1);
    for (const label of ['Horizontal metadata', 'Compact metadata', 'Two-column metadata', 'Three-column metadata']) {
      const list = metadata(page, label);
      for (const pair of await pairs(list)) expect(pair.valueY).toBeGreaterThanOrEqual(pair.termBottom - 1);
      await expect(list.locator('dd').nth(2)).toHaveText('0');
      await expect(list.locator('dd').nth(3)).toHaveText('No observation supplied');
      await expect(list.getByRole('link')).toHaveText('https://example.com/research/organic-search-visibility/retained-observations?country=ae&device=mobile');
      const clipped = await list.evaluate(element => [...element.querySelectorAll('dt,dd')].flatMap(cell => {
        const bounds = cell.getBoundingClientRect(), walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT), failures: string[] = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const range = document.createRange(); range.selectNodeContents(node);
          if ([...range.getClientRects()].some(rect => rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1)) failures.push(node.textContent ?? '');
        }
        return failures;
      }));
      expect(clipped, `${label} ${dir} text fragments`).toEqual([]);
      const rect = await list.boundingBox();
      expect(rect).not.toBeNull();
      if (rect) { expect(rect.x).toBeGreaterThanOrEqual(-1); expect(rect.x + rect.width).toBeLessThanOrEqual(321); }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: capture(info, `metadata-${dir}-text-200`), fullPage: true });
  }
});

test('modern styles alone reduce root and nested settings navigation motion from 100ms to zero', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(`/tests/information-design.html?theme=${theme(info)}`);
  const durations = () => page.locator('#settings-root .t98-settings-compact-nav__summary > svg, #settings-nested .t98-settings-compact-nav__summary > svg').evaluateAll(elements => elements.map(element => {
    const value = getComputedStyle(element).transitionDuration.split(',')[0].trim();
    return Number.parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
  }));
  await expect.poll(durations).toEqual([100, 100]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(durations).toEqual([0, 0]);
  const toggle = page.locator('#settings-nested summary');
  await toggle.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#settings-nested details')).toHaveAttribute('open', '');
});

test('complete report separates draft and applied scope, zero and missing observations, and exports actual CSV bytes', async ({ page }, info) => {
  const report = await openReport(page, info);
  const scope = report.getByRole('region', { name: 'Applied report scope', exact: true });
  await expect(report.getByRole('tab', { name: /^Page views/ })).toContainText('1,234');
  await expect(report.getByRole('tab', { name: /^Custom events/ })).toContainText('3 known');
  await report.getByLabel('Device scope', { exact: true }).selectOption('Mobile');
  await report.getByLabel('Reporting period', { exact: true }).selectOption('latest');
  await expect(scope).toContainText('All devices');
  await expect(scope).toContainText('Filter edits are not applied');
  const firstDownload = page.waitForEvent('download');
  await report.getByRole('button', { name: 'Export sample CSV', exact: true }).click();
  await expectDownload(await firstDownload, 'synthetic-traffic-all-all.csv', 'date,device,page_views,custom_events,custom_event_state\r\n2026-11-01,Mobile,140,0,measured\r\n2026-11-01,Desktop,260,2,measured\r\n2026-11-02,Mobile,150,0,measured\r\n2026-11-02,Desktop,270,,unavailable\r\n2026-11-03,Mobile,144,0,measured\r\n2026-11-03,Desktop,270,1,measured\r\n');
  await report.getByRole('button', { name: 'Apply report', exact: true }).click();
  await expect(scope).toContainText('Mobile');
  await expect(scope).toContainText('2026-11-03');
  await expect(scope).not.toContainText('Filter edits are not applied');
  const events = report.getByRole('tab', { name: /^Custom events/ });
  await expect(events.locator('strong')).toHaveText('0');
  await events.click();
  await expect(report.getByRole('tab', { name: /^Unique visitors/ })).toBeDisabled();
  await expect(report.getByRole('tab', { name: /^Unique visitors/ })).toContainText('Visitor history is not supplied');
  const secondDownload = page.waitForEvent('download');
  await report.getByRole('button', { name: 'Export sample CSV', exact: true }).click();
  await expectDownload(await secondDownload, 'synthetic-traffic-Mobile-latest.csv', 'date,device,page_views,custom_events,custom_event_state\r\n2026-11-03,Mobile,144,0,measured\r\n');
  await report.screenshot({ path: capture(info, 'complete-report') });
});

test('complete report exposes export failure, retains applied rows and recovers without applying drafts', async ({ page }, info) => {
  const report = await openReport(page, info);
  await report.getByLabel('Device scope', { exact: true }).selectOption('Mobile');
  await report.getByRole('button', { name: 'Apply report', exact: true }).click();
  await report.getByLabel('Device scope', { exact: true }).selectOption('Desktop');
  await page.evaluate(() => {
    const create = URL.createObjectURL;
    const state = window as Window & { restoreInformationDownload?: () => void };
    state.restoreInformationDownload = () => { URL.createObjectURL = create; delete state.restoreInformationDownload; };
    URL.createObjectURL = () => { throw new Error('Synthetic export failure'); };
  });
  const button = report.getByRole('button', { name: 'Export sample CSV', exact: true });
  await button.click();
  await expect(report.getByRole('alert')).toHaveText('The sample CSV could not be saved. Try exporting again.');
  await expect(button).toBeEnabled();
  await expect(report.getByRole('region', { name: 'Applied report scope', exact: true })).toContainText('Mobile');
  await expect(report.getByRole('table', { name: 'Applied daily observations', exact: true }).getByRole('row')).toHaveCount(4);
  await page.evaluate(() => (window as Window & { restoreInformationDownload?: () => void }).restoreInformationDownload?.());
  const download = page.waitForEvent('download');
  await button.click();
  await expectDownload(await download, 'synthetic-traffic-Mobile-all.csv', 'date,device,page_views,custom_events,custom_event_state\r\n2026-11-01,Mobile,140,0,measured\r\n2026-11-02,Mobile,150,0,measured\r\n2026-11-03,Mobile,144,0,measured\r\n');
  await expect(report.getByRole('alert')).toHaveCount(0);
});
