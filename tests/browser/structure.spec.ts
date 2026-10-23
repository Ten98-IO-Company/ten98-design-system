import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const evidence = resolve('.qa/structure');

for (const theme of ['light', 'dark'] as const) {
  test(`element-free screen composition holds at the project width in ${theme}`, async ({ page }, info) => {
    const width = info.project.name === 'narrow-dark' ? 320 : 1440;
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto(`/tests/structure.html?theme=${theme}`);
    const screen = page.locator('#structure');
    await expect(screen.getByRole('heading', { level: 1, name: 'Campaign summary' })).toBeVisible();

    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 'no page overflow').toBeLessThanOrEqual(1);
    const columns = await page.locator('#metrics').evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width >= 960 ? 3 : 1);
    const truncated = await page.locator('#truncated').evaluate(node => ({ cut: node.scrollWidth > node.clientWidth, overflow: getComputedStyle(node).textOverflow }));
    // The long label fits beside its badges at desktop width and is cut with an ellipsis on a phone.
    expect(truncated).toEqual({ cut: width < 960, overflow: 'ellipsis' });
    await expect(page.locator('#form')).toHaveAttribute('method', 'post');
    // A button directly in a Stack keeps its intrinsic width.
    const [buttonWidth, formWidth] = await page.evaluate(() => ['#stacked-button', '#form'].map(selector => document.querySelector(selector)!.getBoundingClientRect().width));
    expect(buttonWidth).toBeLessThan(formWidth / 2);
    await expect(screen.getByLabel('Channel')).toHaveValue('all');
    const link = screen.getByRole('link', { name: 'All reports' });
    await link.focus();
    expect(await link.evaluate(node => getComputedStyle(node).outlineStyle)).toBe('solid');
    // Text inherits theme tokens rather than a fixed color.
    const [text, background] = await page.evaluate(() => [getComputedStyle(document.querySelector('.t98-heading')!).color, getComputedStyle(document.body).backgroundColor]);
    expect(text).not.toBe(background);
    // Every primitive uses the library font, never the browser's default serif.
    const fonts = await page.evaluate(() => [...new Set(['.t98-heading', '.t98-text', '.t98-description-list dd', '.t98-list-item'].map(selector => getComputedStyle(document.querySelector(selector)!).fontFamily))]);
    expect(fonts).toHaveLength(1);

    await mkdir(evidence, { recursive: true });
    await screen.screenshot({ path: resolve(evidence, `structure-${theme}-${width}.png`), animations: 'disabled' });
  });
}
