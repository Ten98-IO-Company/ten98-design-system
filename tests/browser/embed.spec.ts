import { expect, test } from '@playwright/test';

for (const width of [1440, 375]) {
  test(`EmbedHost names its region, sizes the SDK mount and covers it while loading or failed at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/embed.html');
    const map = page.getByRole('region', { name: 'Billboard locations map' });
    await expect(map).toHaveAttribute('aria-busy', 'true');
    await expect(map.getByRole('status')).toHaveText('Loading map…');
    // lg is 390px wide-screen and narrows to md (300px) under 760px; sm stays 230px.
    const height = (name: string) => page.getByRole('region', { name }).evaluate(element => element.getBoundingClientRect().height);
    expect(Math.round(await height('Billboard locations map'))).toBe(width > 760 ? 390 : 300);
    expect(Math.round(await height('Integration preview map'))).toBe(230);
    const video = page.getByRole('region', { name: 'Video embed' });
    const box = (await video.boundingBox())!;
    expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.02);

    await page.getByRole('button', { name: 'Finish loading' }).click();
    await expect(map).not.toHaveAttribute('aria-busy');
    const canvas = map.locator('[data-sdk="map"]');
    await expect(canvas).toBeVisible();
    const fill = await canvas.evaluate(element => { const own = element.getBoundingClientRect(); const host = element.closest('[role="region"]')!.getBoundingClientRect(); return host.height - own.height; });
    expect(fill).toBeLessThanOrEqual(2);

    await page.getByRole('button', { name: 'Fail' }).click();
    await expect(map.getByText('Map unavailable. Add a Maps key in Integrations.')).toBeVisible();
    await expect(canvas).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}
