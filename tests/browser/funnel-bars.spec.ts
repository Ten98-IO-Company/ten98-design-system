import { expect, test } from '@playwright/test';

test('funnel bars compare supplied observations and retain accessible actions and narrow content', async ({ page }, info) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  const dark = info.project.name === 'narrow-dark';
  await page.setViewportSize({ width: 1808, height: 1236 });
  await page.goto(`/?theme=${dark ? 'dark' : 'light'}#components/funnel-breakdown?tab=states`);
  const positive = page.getByRole('region', { name: 'Three-step funnel · synthetic observations', exact: true });
  await expect(positive.locator('.t98-funnel-bar')).toHaveCount(3);
  await positive.scrollIntoViewIfNeeded();
  const geometry = await positive.locator('.t98-funnel-bar').evaluateAll(bars => bars.map(bar => {
    const fill = bar.querySelector('.t98-funnel-bar-fill')!;
    return { track: bar.getBoundingClientRect().width, fill: fill.getBoundingClientRect().width };
  }));
  for (const [index, ratio] of [1, 2 / 3, 1 / 3].entries()) expect(geometry[index].fill / geometry[index].track).toBeCloseTo(ratio, 2);
  const bounds = await positive.boundingBox();
  expect(bounds!.height).toBeLessThan(540);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(1236);
  await positive.screenshot({ path: info.outputPath('funnel-bars-desktop.png') });
  const first = positive.getByRole('button', { name: '1. Landing page', exact: true });
  await first.focus();
  await first.press('Enter');
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  const drilldown = positive.getByRole('button', { name: 'View matching activity for Landing page', exact: true });
  await page.keyboard.press('Tab');
  await expect(drilldown).toBeFocused();
  await drilldown.press('Enter');
  await expect(positive.getByRole('status')).toHaveText('Matching activity: Landing page');
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(positive.getByRole('button', { name: 'View matching activity for Purchase', exact: true })).toBeDisabled();
  const unavailable = page.getByRole('region', { name: 'Funnel comparison availability', exact: true });
  await expect(unavailable.locator('.t98-funnel-bar')).toHaveCount(1);
  await expect(unavailable.locator('.t98-funnel-bar-fill')).toHaveAttribute('width', '0');
  await expect(unavailable.getByText('Comparison unavailable.', { exact: true })).toHaveCount(2);
  await expect(unavailable.locator('.t98-funnel-count').nth(0)).toHaveText('Visitors: 0');
  await expect(unavailable.locator('.t98-funnel-count').nth(1)).toHaveText('Visitors: 0');
  await expect(unavailable.locator('.t98-funnel-count').nth(2)).toHaveText('Visitors: Unavailable');
  await expect(unavailable.getByRole('button')).toHaveCount(0);
  const disabled = page.getByRole('region', { name: 'Loading funnel comparison', exact: true });
  await expect(disabled).toHaveAttribute('aria-busy', 'true');
  for (const control of await disabled.getByRole('button').all()) await expect(control).toBeDisabled();
  await page.setViewportSize({ width: 320, height: 850 });
  await page.evaluate(() => {
    document.documentElement.dir = 'rtl';
    const sizes = [...document.body.querySelectorAll<HTMLElement>('*')].map(element => ({ element, size: getComputedStyle(element).fontSize, line: getComputedStyle(element).lineHeight }));
    for (const { element, size, line } of sizes) {
      element.style.setProperty('font-size', `${parseFloat(size) * 2}px`, 'important');
      if (Number.isFinite(parseFloat(line))) element.style.setProperty('line-height', `${parseFloat(line) * 2}px`, 'important');
    }
  });
  await positive.scrollIntoViewIfNeeded();
  const narrowWidth = (await positive.boundingBox())!.width;
  expect((await positive.locator('.t98-funnel-step-heading').first().boundingBox())!.width).toBeGreaterThan(narrowWidth * .7);
  expect((await positive.locator('.t98-funnel-bar').first().boundingBox())!.width).toBeGreaterThan(narrowWidth * .7);
  for (const region of [positive, unavailable, disabled]) {
    expect(await region.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    for (const control of await region.getByRole('button').all()) {
      const box = await control.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  }
  const rtl = await positive.locator('.t98-funnel-bar').nth(1).evaluate(bar => ({ track: bar.getBoundingClientRect().right, fill: bar.querySelector('.t98-funnel-bar-fill')!.getBoundingClientRect().right }));
  expect(Math.abs(rtl.track - rtl.fill)).toBeLessThanOrEqual(1);
  expect(requests.every(url => new URL(url).origin === new URL(info.project.use.baseURL!).origin)).toBe(true);
  expect(requests.length).toBeLessThanOrEqual(30);
  expect(errors).toEqual([]);
  await info.attach('request-count', { body: String(requests.length), contentType: 'text/plain' });
  await positive.screenshot({ path: info.outputPath('funnel-bars-320-rtl-text200.png') });
});
