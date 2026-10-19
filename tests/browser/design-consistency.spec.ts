import { test, expect, type Locator } from '@playwright/test';

async function renderedColors(locator: Locator) {
  return locator.evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element);
    const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number).slice(0, 3);
    return { text: element.textContent, foreground: rgb(style.color), background: rgb(style.backgroundColor) };
  }));
}

function contrast(foreground: number[], background: number[]) {
  const luminance = (color: number[]) => color.reduce((sum, channel, index) => {
    const value = channel / 255;
    return sum + [0.2126, 0.7152, 0.0722][index] * (value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  }, 0);
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

for (const [theme, system, dark] of [['light', 'dark', false], ['dark', 'light', true], ['system', 'dark', true]] as const) {
  test(`table cells and compatibility statuses remain readable in ${theme} with ${system} system`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: system });
    for (const component of ['permission-matrix', 'review-summary', 'retention-table', 'rank-comparison']) {
      await page.goto(`/?theme=${theme}#components/${component}?tab=states`);
      const cells = page.locator('.reference-state').first().locator('th');
      await expect(cells.first()).toBeVisible();
      for (const cell of await renderedColors(cells)) {
        expect(contrast(cell.foreground, cell.background), `${component}: ${cell.text}`).toBeGreaterThanOrEqual(4.5);
        if (dark) expect(Math.max(...cell.background)).toBeLessThan(100);
      }
    }
    await page.goto(`/?theme=${theme}#components/app-badge?tab=states`);
    const badges = page.frameLocator('iframe').first().locator('.badge');
    await expect(badges.first()).toBeVisible();
    await expect(badges).toHaveCount(19);
    for (const badge of await renderedColors(badges)) {
      expect(badge.text?.trim()).toBeTruthy();
      expect(contrast(badge.foreground, badge.background), badge.text ?? '').toBeGreaterThanOrEqual(4.5);
      if (dark) expect(Math.max(...badge.background)).toBeLessThan(100);
    }
    if (dark) {
      // The original pale fill with a dark-theme foreground must fail this same oracle.
      await badges.first().evaluate(element => { (element as HTMLElement).style.cssText = 'background:#ecf7f0;color:#adb9ca'; });
      const [baseline] = await renderedColors(badges.first());
      expect(contrast(baseline.foreground, baseline.background)).toBeLessThan(4.5);
    }
  });
}

test('activity icons use canonical tone colors in light and dark themes', async ({ page }) => {
  for (const theme of ['light', 'dark']) {
    await page.goto(`/?theme=${theme}#components/activity-feed?tab=states`);
    const icons = page.locator('.reference-state').first().locator('.t98-activity-icon');
    await expect(icons).toHaveCount(5);
    for (const [index, tone] of ['neutral', 'success', 'warning', 'danger', 'info'].entries()) {
      const icon = icons.nth(index);
      const expected = await icon.evaluate((element, tone) => {
        const probe = document.createElement('span');
        probe.style.color = `var(--t98-${tone === 'neutral' ? 'muted' : tone})`;
        probe.style.backgroundColor = `var(--t98-${tone === 'neutral' ? 'subtle' : `${tone}-soft`})`;
        element.append(probe);
        const style = getComputedStyle(probe);
        const colors = { foreground: style.color, background: style.backgroundColor };
        probe.remove();
        return colors;
      }, tone);
      await expect(icon).toHaveCSS('color', expected.foreground);
      await expect(icon).toHaveCSS('background-color', expected.background);
    }
  }
});

test('catalogue preserves intrinsic controls and metric hierarchy', async ({ page }) => {
  for (const component of ['button', 'badge']) {
    await page.goto(`/#components/${component}?tab=states`);
    const preview = page.locator('.reference-state').first().locator('.reference-preview-content');
    const control = preview.locator(`:scope > .t98-${component}`).first();
    await expect(control).toBeVisible();
    const bounds = await control.boundingBox(), parent = await preview.boundingBox();
    expect(bounds!.width).toBeLessThan(parent!.width - 20);
  }
  await page.goto('/#components/comparison-metric?tab=states');
  const metric = page.locator('.t98-comparison-value').first();
  await expect(metric).toHaveCSS('font-size', '28px');
  await page.evaluate(() => document.documentElement.style.setProperty('--t98-text-metric', '32px'));
  await expect(metric).toHaveCSS('font-size', '32px');
});

test('audience counts respond to their panel width on a desktop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/#components/audience-summary?tab=states');
  const summary = page.locator('.t98-audience-summary').first();
  await summary.evaluate(element => (element as HTMLElement).style.width = '302px');
  const counts = summary.locator('.t98-audience-counts > div');
  await expect(counts).toHaveCount(4);
  const boxes = await counts.evaluateAll(elements => elements.map(element => ({ width: element.getBoundingClientRect().width, top: element.getBoundingClientRect().top })));
  expect(boxes.every(box => box.width >= 128)).toBeTruthy();
  expect(new Set(boxes.map(box => box.top)).size).toBeGreaterThanOrEqual(2);
  for (const count of await counts.all()) await expect(count.locator('dt')).toBeVisible();
  // Restoring the four fixed columns reproduces the squeezed panel on the same desktop.
  await summary.locator('.t98-audience-counts').evaluate(element => (element as HTMLElement).style.gridTemplateColumns = 'repeat(4,minmax(0,1fr))');
  expect((await counts.first().boundingBox())!.width).toBeLessThan(100);
});
