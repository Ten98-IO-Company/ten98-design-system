import { test, expect, type Page } from '@playwright/test';

type Color = number[];

// The same W3C sRGB calculation used by library.test.mjs, applied to rendered colors.
function contrast(foreground: Color, background: Color) {
  const luminance = (color: Color) => color.slice(0, 3).reduce((sum, channel, index) => {
    const value = channel / 255;
    return sum + [0.2126, 0.7152, 0.0722][index] * (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  }, 0);
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const composite = (foreground: Color, background: Color) => foreground.slice(0, 3).map((channel, index) => channel * foreground[3] + background[index] * (1 - foreground[3]));

async function colors(page: Page) {
  return page.evaluate(() => {
    // Canvas resolves both rgb() and color(srgb ...) without relying on CSS serialization.
    const context = document.createElement('canvas').getContext('2d')!;
    const color = (value: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const pixel = [...context.getImageData(0, 0, 1, 1).data];
      return [...pixel.slice(0, 3), pixel[3] / 255];
    };
    const style = (selector: string) => getComputedStyle(document.querySelector(selector)!);
    const root = style('html'), disabled = style('#disabled');
    return {
      header: color(style('.topbar').backgroundColor),
      headerText: color(style('.breadcrumb').color),
      canvas: color(style('body').backgroundColor),
      editable: color(style('#editable').backgroundColor),
      readonly: color(style('#readonly').backgroundColor),
      disabled: color(disabled.backgroundColor),
      disabledText: color(disabled.webkitTextFillColor),
      disabledOpacity: disabled.opacity,
      surface: color(root.getPropertyValue('--t98-surface')),
      disabledRole: color(root.getPropertyValue('--t98-disabled-surface')),
      scheme: root.colorScheme,
    };
  });
}

for (const [theme, system, expected] of [
  ['light', 'dark', 'light'], ['dark', 'light', 'dark'],
  ['system', 'light', 'light'], ['system', 'dark', 'dark'],
] as const) {
  test(`legacy header and native fields follow ${theme} theme with ${system} system`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: system });
    await page.goto(`/tests/legacy-theme.html?theme=${theme}`);
    const rendered = await colors(page);
    // Independent palette expectations guard against two aliases agreeing on a wrong fill.
    const surface = expected === 'dark' ? [23, 32, 44] : [255, 255, 255];
    const disabled = expected === 'dark' ? [29, 41, 56] : [245, 244, 250];
    expect(rendered.scheme).toBe(expected);
    expect(rendered.surface.slice(0, 3)).toEqual(surface);
    expect(rendered.disabled.slice(0, 3)).toEqual(disabled);
    expect(rendered.disabled).toEqual(rendered.disabledRole);
    expect(rendered.disabledOpacity).toBe('1');
    // Canvas premultiplication can round a translucent channel by one unit.
    rendered.header.slice(0, 3).forEach((value, index) => expect(Math.abs(value - surface[index])).toBeLessThanOrEqual(1));
    expect(rendered.header[3]).toBeCloseTo(0.851, 2);
    expect(rendered.editable).toEqual(rendered.surface);
    expect(rendered.readonly).toEqual(rendered.surface);
    expect(contrast(rendered.headerText, composite(rendered.header, rendered.canvas))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(rendered.disabledText, rendered.disabled)).toBeGreaterThanOrEqual(4.5);
    await expect(page.locator('#disabled')).toBeDisabled();
    await expect(page.locator('#readonly')).not.toBeEditable();
    await page.locator('#editable').fill('Edited synthetic value');
    await expect(page.locator('#editable')).toHaveValue('Edited synthetic value');
    await expect(page.locator('#readonly')).toHaveValue('Synthetic read-only value');

    await page.evaluate(() => {
      document.documentElement.style.setProperty('--t98-surface', '#2f3a48');
      document.documentElement.style.setProperty('--t98-disabled-surface', '#394352');
    });
    const inherited = await colors(page);
    expect(inherited.editable.slice(0, 3)).toEqual([47, 58, 72]);
    expect(inherited.readonly).toEqual(inherited.editable);
    expect(inherited.disabled.slice(0, 3)).toEqual([57, 67, 82]);
    expect(inherited.disabled).toEqual(inherited.disabledRole);
    inherited.header.slice(0, 3).forEach((value, index) => expect(Math.abs(value - [47, 58, 72][index])).toBeLessThanOrEqual(1));
    expect(inherited.header[3]).toBeCloseTo(0.851, 2);
  });
}

test('restoring the old fills reproduces both dark contrast failures', async ({ page }) => {
  await page.goto('/tests/legacy-theme.html?theme=dark&baseline=1');
  const old = await colors(page);
  expect(old.header[3]).toBeCloseTo(0.851, 2);
  expect(contrast(old.headerText, composite(old.header, old.canvas))).toBeLessThan(4.5);
  expect(contrast(old.disabledText, old.disabled)).toBeLessThan(4.5);
  expect(old.disabled).not.toEqual(old.disabledRole);
});

test('disabled values use their semantic text role despite a legacy muted override', async ({ page }) => {
  await page.goto('/tests/legacy-theme.html?theme=dark');
  await page.evaluate(() => document.documentElement.style.setProperty('--color-text-muted', '#695276'));
  const rendered = await colors(page);
  expect(rendered.disabledText.slice(0, 3)).toEqual([160, 173, 191]);
  expect(contrast(rendered.disabledText, rendered.disabled)).toBeGreaterThanOrEqual(4.5);
  // Negative control matches the consumer's inherited legacy foreground.
  await page.locator('#disabled').evaluate(element => (element as HTMLInputElement).style.color = 'var(--color-text-muted)');
  const inherited = await colors(page);
  expect(contrast(inherited.disabledText, inherited.disabled)).toBeLessThan(4.5);
});

test('light geometry and authentication brand styling match the legacy baseline', async ({ page }) => {
  const appearance = async (baseline: boolean) => {
    await page.goto(`/tests/legacy-theme.html?theme=light${baseline ? '&baseline=1' : ''}`);
    return page.evaluate(() => Object.fromEntries([
      '.workspace-main', '.topbar', '.breadcrumb', '#editable', '#disabled', '#readonly',
      '.auth-shell', '.auth-story', '.auth-form', '.brand', '.brand-mark', '.brand-dot',
    ].map(selector => {
      const element = document.querySelector(selector)!, style = getComputedStyle(element), rect = element.getBoundingClientRect();
      return [selector, {
        bounds: [rect.x, rect.y, rect.width, rect.height],
        padding: style.padding, gap: style.gap, border: style.border,
        font: style.font, color: style.color,
        ...(selector.startsWith('.auth') || selector.startsWith('.brand') ? { background: style.backgroundColor } : {}),
      }];
    })));
  };
  expect(await appearance(false)).toEqual(await appearance(true));
});
