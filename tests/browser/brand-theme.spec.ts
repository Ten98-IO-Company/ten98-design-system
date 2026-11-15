import { expect, test, type Locator, type Page } from '@playwright/test';

// The brand theme as a keyboard-first ledger (Books) meets it: fonts load from the package only, Arabic and Latin rows
// keep one height and baseline, figures line up, ink indicators stay apart, and no control box changes size.

type Rgb = [number, number, number];
const rgb = (value: string): Rgb => { const [r, g, b] = value.match(/[\d.]+/g)!.map(Number); return [r, g, b]; };
const luminance = (colour: Rgb) => {
  const [r, g, b] = colour.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => { const [x, y] = [luminance(rgb(a)), luminance(rgb(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
/** The colours of an inset box-shadow, outermost layer first, with their spread offsets. */
const shadowLayers = (value: string) => value === 'none' ? [] : [...value.matchAll(/(rgba?\([^)]+\))\s+(-?[\d.]+)px/g)].map(([, colour, x]) => ({ colour, x: Math.abs(Number(x)) }));
const open = async (page: Page, query = '') => {
  await page.goto(`/tests/brand-theme.html${query}`);
  await page.locator('.t98-table tbody tr').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
};
const token = (page: Page, name: string) => page.evaluate(name => getComputedStyle(document.documentElement).getPropertyValue(name).trim(), name).then(hex => {
  const n = parseInt(hex.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
});
const surface = (page: Page) => token(page, '--t98-surface');
const row = (page: Page, index: number) => page.locator('.t98-table tbody tr').nth(index);

test('the brand faces load as same-origin woff2 files from the package CSS, never data: URIs or remote fonts', async ({ page }) => {
  const fonts: string[] = [];
  page.on('request', request => { if (request.resourceType() === 'font') fonts.push(request.url()); });
  await open(page);
  await expect.poll(() => page.evaluate(() => [document.fonts.check('13px "JetBrains Mono"'), document.fonts.check('italic 16px "Libre Caslon Text"')])).toEqual([true, true]);
  expect(fonts.length).toBeGreaterThanOrEqual(3);
  for (const url of fonts) expect(new URL(url).origin === new URL(page.url()).origin && /\.woff2$/.test(url), url).toBe(true);
  const families = await page.evaluate(() => {
    const family = (selector: string) => getComputedStyle(document.querySelector(selector)!).fontFamily;
    const style = (selector: string) => getComputedStyle(document.querySelector(selector)!).fontStyle;
    return {
      amount: family('.t98-table td.t98-table-cell--numeric'), amountHeader: family('.t98-table th.t98-table-cell--numeric'), party: family('.t98-table tbody th'),
      reference: family('.t98-table tbody td .t98-mono'), key: family('.t98-key-hint__key'), empty: `${style('.t98-empty-state h3')} ${family('.t98-empty-state h3')}`,
      input: family('[data-probe=input]'), label: family('.t98-label'),
    };
  });
  expect(families.amount).toMatch(/^"JetBrains Mono"/);
  expect(families.reference).toMatch(/^"JetBrains Mono"/);
  expect(families.key).toMatch(/^"JetBrains Mono"/);
  expect(families.empty).toMatch(/^italic "Libre Caslon Text"/);
  // Names, headers and form text stay in the text face.
  for (const name of ['amountHeader', 'party', 'input', 'label'] as const) expect(families[name], name).toMatch(/^"Inter Variable"/);
});

for (const density of ['comfortable', 'compact'] as const) test(`Arabic and Latin rows keep one height and baseline, and figures line up (${density})`, async ({ page }) => {
  await open(page, `?density=${density}`);
  const measure = () => page.evaluate(() => [...document.querySelectorAll('.t98-table tbody tr')].map(tr => {
    const rowBox = tr.getBoundingClientRect();
    const textBox = (cell: Element) => { const range = document.createRange(); range.selectNodeContents(cell); return range.getBoundingClientRect(); };
    const [, reference, amount] = tr.children;
    const text = amount.textContent!;
    const node = [...amount.childNodes].find(child => child.nodeType === 3)!;
    const chars = [...text].map((_, index) => { const range = document.createRange(); range.setStart(node, index); range.setEnd(node, index + 1); const box = range.getBoundingClientRect(); return { left: box.left, width: box.width }; });
    return { height: rowBox.height, referenceTop: textBox(reference).top - rowBox.top, referenceBottom: textBox(reference).bottom - rowBox.top, amountEnd: textBox(amount).right, text, chars };
  }));
  for (const media of ['screen', 'print'] as const) {
    await page.emulateMedia({ media });
    const rows = await measure();
    const [, ...middle] = rows.slice(0, -1);
    // The first and last rows lose half a collapsed border; every row between, Arabic or Latin, has one height.
    if (media === 'screen') expect(middle.map(entry => entry.height)).toEqual(middle.map(() => density === 'compact' ? 34 : 42));
    else expect(new Set(middle.map(entry => entry.height)).size, `${media} row heights ${middle.map(entry => entry.height)}`).toBe(1);
    for (const entry of rows) {
      expect(Math.abs(entry.referenceTop - rows[2].referenceTop), `${media} reference baseline in "${entry.text}"`).toBeLessThanOrEqual(0.51);
      expect(Math.abs(entry.referenceBottom - rows[2].referenceBottom), `${media} reference baseline in "${entry.text}"`).toBeLessThanOrEqual(0.51);
      // Arabic-Indic digits end-align with the Latin rows.
      expect(Math.abs(entry.amountEnd - rows[0].amountEnd), `${media} end of "${entry.text}"`).toBeLessThanOrEqual(0.5);
    }
    // Latin figures: digits, the minus sign and the separators share one width, so each position lines up down the column.
    const latin = rows.filter(entry => /^[−\d,.]+$/.test(entry.text));
    expect(latin.length).toBe(4);
    const digit = latin[0].chars[0].width;
    for (const entry of latin) for (const char of entry.chars) expect(Math.abs(char.width - digit), `${media} glyph width in "${entry.text}"`).toBeLessThanOrEqual(0.05);
    for (let fromEnd = 1; fromEnd <= 7; fromEnd++) {
      const lefts = latin.filter(entry => entry.chars.length >= fromEnd).map(entry => entry.chars[entry.chars.length - fromEnd].left);
      expect(Math.max(...lefts) - Math.min(...lefts), `${media} column position ${fromEnd} from the end`).toBeLessThanOrEqual(0.05);
    }
  }
});

for (const theme of ['light', 'dark'] as const) test(`focus ring, current row and hover stay distinct with ink as the only accent (${theme})`, async ({ page }) => {
  await open(page, `?theme=${theme}`);
  const ground = await surface(page);
  const look = (locator: Locator) => locator.evaluate(element => { const style = getComputedStyle(element); return { background: style.backgroundColor, shadow: style.boxShadow, outline: style.outlineStyle === 'none' ? null : { colour: style.outlineColor, width: parseFloat(style.outlineWidth), offset: parseFloat(style.outlineOffset) } }; });

  // (b) The current row: tint plus an ink bar that holds 3:1 against the tint and the surface beside it.
  const current = await look(row(page, 1));
  const [bar] = shadowLayers(current.shadow);
  expect(bar?.x).toBe(3);
  expect(contrast(bar.colour, current.background)).toBeGreaterThanOrEqual(3);
  expect(contrast(bar.colour, ground)).toBeGreaterThanOrEqual(3);
  expect(current.outline).toBeNull();

  // (c) Hover: a tint only, no bar and no ring, so it never reads as current or focused.
  await row(page, 2).hover();
  const hovered = await look(row(page, 2));
  expect(hovered.shadow).toBe('none');
  expect(hovered.outline).toBeNull();
  expect(hovered.background).not.toBe(current.background);
  await page.mouse.move(0, 0);

  // (a) Focus on a row that is not current: a 2px ring holding 3:1 on the row and the surface, and no bar.
  await row(page, 1).focus();
  await page.keyboard.press('ArrowDown');
  await expect(row(page, 2)).toBeFocused();
  const focused = await look(row(page, 2));
  expect(focused.outline?.width).toBe(2);
  expect(focused.shadow).toBe('none');
  expect(contrast(focused.outline!.colour, focused.background === 'rgba(0, 0, 0, 0)' ? ground : focused.background)).toBeGreaterThanOrEqual(3);
  expect(contrast(focused.outline!.colour, ground)).toBeGreaterThanOrEqual(3);

  // A focused current row shows both: the ring at the edge, a tinted gap, then the bar.
  await page.keyboard.press('ArrowUp');
  await expect(row(page, 1)).toBeFocused();
  const both = await look(row(page, 1));
  expect(both.outline?.width).toBe(2);
  const [gap, inner] = shadowLayers(both.shadow);
  expect(gap.colour).toBe(both.background);
  expect(gap.x).toBeGreaterThan(both.outline!.width);
  expect(inner.x - gap.x).toBeGreaterThanOrEqual(3);
  expect(contrast(inner.colour, gap.colour)).toBeGreaterThanOrEqual(3);
  expect(contrast(both.outline!.colour, gap.colour)).toBeGreaterThanOrEqual(3);
});

for (const theme of ['light', 'dark'] as const) test(`the entry grid active cell carries an ink bar apart from its focus ring (${theme})`, async ({ page }) => {
  await page.goto(`/tests/entry-grid.html?theme=${theme}`);
  const ground = await surface(page);
  await page.getByRole('textbox', { name: 'Reference' }).focus();
  await page.keyboard.press('Tab');
  const active = page.locator('.t98-entry-grid__cell--active');
  await expect(active).toBeFocused();
  const style = () => active.evaluate(element => { const s = getComputedStyle(element); return { background: s.backgroundColor, shadow: s.boxShadow, outline: s.outlineStyle, outlineColour: s.outlineColor }; });
  const focused = await style();
  expect(focused.outline).toBe('solid');
  const [gap, bar] = shadowLayers(focused.shadow);
  expect(gap.colour).toBe(focused.background);
  expect(contrast(bar.colour, focused.background)).toBeGreaterThanOrEqual(3);
  expect(contrast(focused.outlineColour, focused.background)).toBeGreaterThanOrEqual(3);
  // Focus leaves the grid; the active cell keeps its bar and loses the ring.
  await page.keyboard.press('Shift+Tab');
  const resting = await style();
  expect(resting.outline).toBe('none');
  const [restingBar] = shadowLayers(resting.shadow);
  expect(restingBar.x).toBe(3);
  expect(contrast(restingBar.colour, resting.background)).toBeGreaterThanOrEqual(3);
  expect(contrast(restingBar.colour, ground)).toBeGreaterThanOrEqual(3);
});

test('pills and square corners change the radius only: control boxes keep their main-branch sizes', async ({ page }) => {
  for (const density of ['comfortable', 'compact'] as const) {
    await open(page, `?density=${density}`);
    const boxes = await page.evaluate(() => Object.fromEntries(Object.entries({
      button: '[data-probe=button]', sm: '[data-probe=button-sm]', lg: '[data-probe=button-lg]', input: '[data-probe=input]',
      segment: '.t98-segmented-option', key: '.t98-key-hint__key', badge: '.t98-badge', header: '.t98-table thead th', row: '.t98-table tbody tr:nth-child(3)',
    }).map(([name, selector]) => {
      const element = document.querySelector(selector)!;
      const style = getComputedStyle(element);
      return [name, `${element.getBoundingClientRect().height} ${style.paddingTop} ${style.paddingInlineEnd} ${style.lineHeight} ${style.borderTopLeftRadius}`];
    })));
    // Heights, paddings and line heights measured on main before the theme; only the last value (radius) is new.
    const compact = density === 'compact';
    expect(boxes).toEqual({
      button: `${compact ? 34 : 38} ${compact ? '6px' : '8px'} 12px 20px 999px`,
      sm: '30 4px 10px 20px 999px',
      lg: '42 10px 17px 20px 999px',
      input: `${compact ? 32 : 36} ${compact ? '6px' : '8px'} 12px 18px 2px`,
      segment: '44 8px 14px 18.2px 999px',
      key: '21.1875 0px 4px 19.2px 2px',
      badge: '20 2px 6px 16px 999px',
      header: `${compact ? 31 : 35} ${compact ? '6px' : '8px'} 16px 18px 0px`,
      row: `${compact ? 34 : 42} 0px 0px 19.5px 0px`,
    });
  }
});

test('links underline, ink buttons keep a visible ring, and reduced motion zeroes every duration token', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  const link = page.getByRole('link', { name: 'Payment terms' });
  expect(await link.evaluate(element => [getComputedStyle(element).textDecorationLine, getComputedStyle(element).textUnderlineOffset])).toEqual(['underline', '3px']);
  expect(await page.evaluate(() => ['--t98-motion', '--t98-motion-fast', '--t98-motion-normal'].map(name => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name))))).toEqual([0, 0, 0]);
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const primary = page.getByRole('button', { name: /New invoice/ });
    await primary.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(primary).toBeFocused();
    const ring = await primary.evaluate(element => { const style = getComputedStyle(element); return { width: style.outlineWidth, offset: style.outlineOffset, colour: style.outlineColor }; });
    expect([ring.width, ring.offset]).toEqual(['2px', '2px']);
    // The ring sits 2px off the ink fill, so it is drawn against the ground the button stands on: the page or a surface.
    for (const ground of [await token(page, '--t98-bg'), await surface(page)]) expect(contrast(ring.colour, ground), `${theme} ring on ${ground}`).toBeGreaterThanOrEqual(3);
  }
});
