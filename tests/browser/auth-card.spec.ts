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

for (const [width, margin, padding] of [[1440, 24, 32], [375, 16, 24]] as const) {
  test(`an explicit card surface cards the form column beside the brand panel at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/auth-card.html?split');
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in to Campaign' })).toBeVisible();
    const shell = page.locator('.t98-auth-layout');
    await expect(shell).toHaveClass(/auth-split/);
    const card = page.locator('.t98-auth-layout--card .auth-form');
    const style = await card.evaluate(element => { const s = getComputedStyle(element); return { padding: parseFloat(s.paddingTop), margin: parseFloat(s.marginLeft), border: s.borderTopWidth, radius: s.borderTopLeftRadius, title: parseFloat(getComputedStyle(element.querySelector('h1')!).fontSize) }; });
    expect(style).toEqual({ padding, margin, border: '1px', radius: '8px', title: 24 });
    expect(await card.locator('h1').evaluate(element => getComputedStyle(element).marginTop)).toBe('0px');
    const box = (await card.boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(460.5);
    // The margin is real space: the card never touches the viewport edges.
    expect(box.x).toBeGreaterThanOrEqual(margin - 0.5);
    expect(width - box.x - box.width).toBeGreaterThanOrEqual(margin - 0.5);
    if (width === 1440) {
      // Two columns kept: the aside is beside the card, and the card centres in the right half.
      const aside = (await page.locator('aside.auth-story').boundingBox())!;
      expect(aside.x + aside.width).toBeLessThanOrEqual(box.x);
      expect(Math.abs((box.x - (aside.x + aside.width)) - (width - box.x - box.width))).toBeLessThanOrEqual(1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}
