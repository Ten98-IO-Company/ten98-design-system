import { expect, test } from '@playwright/test';

test('analytics results follow configuration at full width, with table scrolling contained on narrow screens', async ({ page }) => {
  const narrow = test.info().project.name === 'narrow-dark';
  for (const [flow, label, lastControl] of [
    ['discover-query-explorer', 'Last successful query', 'Next local query outcome'],
    ['discover-ordered-funnel', 'Saved funnel result', 'Next local result'],
    ['discover-observed-attribution', 'Applied attribution report', 'Next local report outcome'],
  ]) {
    await page.goto(`/${narrow ? '?theme=dark' : ''}#flows/${flow}`);
    const preview = page.locator('.reference-preview');
    const result = preview.getByRole('region', { name: label, exact: true });
    await expect(result).toBeVisible();
    const reportBounds = await result.boundingBox();
    const templateBounds = await preview.locator('.t98-flow-section').first().boundingBox();
    const controlBounds = await preview.getByLabel(lastControl, { exact: true }).boundingBox();
    if (!narrow && flow !== 'discover-ordered-funnel') {
      expect(controlBounds!.width, 'Short report controls keep a compact width').toBeLessThanOrEqual(320);
    }
    expect(reportBounds!.width).toBeGreaterThanOrEqual(templateBounds!.width * .95);
    expect(reportBounds!.y).toBeGreaterThanOrEqual(controlBounds!.y + controlBounds!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    if (flow === 'discover-observed-attribution') {
      const scroll = result.locator('.t98-table-scroll');
      const sizes = await scroll.evaluate(element => ({ visible: element.clientWidth, content: element.scrollWidth }));
      if (narrow) {
        expect(sizes.content).toBeGreaterThan(sizes.visible);
        await scroll.focus();
        await page.keyboard.press('ArrowRight');
        await expect.poll(() => scroll.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
      } else {
        expect(sizes.content).toBeLessThanOrEqual(sizes.visible + 1);
      }
      await result.getByText('Measurement and collection limits', { exact: true }).click();
      await expect(result.getByText(/^First: earliest retained observation/)).toBeVisible();
    }
  }
});
