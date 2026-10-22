import { expect, test } from '@playwright/test';

for (const [width, margin, padding] of [[1440, 24, 32], [375, 16, 24]] as const) {
  test(`AuthLayout surface="card" centres a bordered card at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/auth-card.html');
    const card = page.locator('.t98-auth-layout--card .auth-form');
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in to Campaign' })).toBeVisible();
    const box = (await card.boundingBox())!;
    const style = await card.evaluate(element => { const s = getComputedStyle(element); return { padding: parseFloat(s.paddingTop), margin: parseFloat(s.marginLeft), border: s.borderTopWidth, radius: s.borderTopLeftRadius }; });
    expect(style).toEqual({ padding, margin, border: '1px', radius: '8px' });
    expect(box.width).toBeLessThanOrEqual(460.5);
    // Centred: equal space either side.
    expect(Math.abs(box.x - (width - box.x - box.width))).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}
