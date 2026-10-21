import { expect, test, type Page } from '@playwright/test';

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const theme of ['light', 'dark'] as const) {
  test(`untrusted email HTML renders without scripts, network loads, forms or navigation in ${theme}`, async ({ page }, info) => {
    const width = info.project.name === 'narrow-dark' ? 320 : 1440;
    const reached: string[] = [];
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    // A response means the request left the browser; CSP- and sandbox-blocked loads never get one.
    page.on('response', response => { if (response.url().includes('/tests/probe-')) reached.push(response.url()); });
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(`/tests/sandboxed-preview.html?theme=${theme}`);

    const section = page.getByRole('region', { name: 'Email preview: Spring sale' }).first();
    const frame = page.frameLocator('iframe[title="Email preview: Spring sale"]');
    await expect(frame.getByRole('heading', { name: 'Spring sale starts Monday' })).toBeVisible();
    const iframe = page.locator('iframe[title="Email preview: Spring sale"]');
    await expect(iframe).toHaveAttribute('sandbox', '');
    await expect(iframe).toHaveAttribute('referrerpolicy', 'no-referrer');
    await expect(section.getByText('From Studio, to 1,204 subscribers.')).toBeVisible();

    // Inline data images load; scripts never run.
    expect(await frame.getByAltText('Inline badge').evaluate(img => (img as HTMLImageElement).naturalWidth)).toBe(40);
    expect(await frame.locator('body').getAttribute('data-scripted')).toBeNull();

    // Links and forms go nowhere.
    await frame.locator('#book').click();
    await frame.locator('#submit').click();
    await page.waitForTimeout(500);
    await expect(frame.getByRole('heading', { name: 'Spring sale starts Monday' })).toBeVisible();
    expect(page.frames().some(f => /probe-(link|form|refresh)/.test(f.url())), 'the frame never navigated').toBe(false);
    expect(reached, 'no probe request reached the network').toEqual([]);

    // A 600px frame scrolls inside its focusable region on narrow screens; the page itself does not overflow.
    const scroller = page.getByRole('region', { name: 'Email preview: Spring sale, scrollable' });
    await expect(scroller).toHaveAttribute('tabindex', '0');
    expect((await iframe.boundingBox())!.width).toBeCloseTo(600, 0);
    await page.getByRole('button', { name: 'Mobile' }).click();
    expect((await iframe.boundingBox())!.width).toBeCloseTo(375, 0);
    expect(await overflow(page), 'no page overflow').toBeLessThanOrEqual(1);
    await expect(page.getByText('Write the email body to see a preview.')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('a commented-out <head> cannot move the replay content policy out of effect', async ({ page }) => {
  const reached: string[] = [];
  page.on('response', response => { if (response.url().includes('/tests/probe-replay')) reached.push(response.url()); });
  await page.goto('/tests/sandboxed-preview.html');
  await expect(page.frameLocator('iframe[title="Replay with a commented head"]').getByText('Replay')).toBeVisible();
  await page.waitForTimeout(300);
  expect(reached).toEqual([]);
});
