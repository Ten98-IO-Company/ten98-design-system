import { expect, test, type Page } from '@playwright/test';

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const theme of ['light', 'dark'] as const) {
  test(`conversation direction, actions, removal and media attachments work and reflow in ${theme}`, async ({ page }, info) => {
    const width = info.project.name === 'narrow-dark' ? 320 : 1440;
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(`/tests/conversation.html?theme=${theme}`);
    const thread = page.locator('section.t98-conversation-root');
    const inbound = thread.locator('[data-message-id="in-1"]');
    const outbound = thread.locator('[data-message-id="out-1"]');
    await expect(inbound.getByText('Received', { exact: true })).toBeVisible();
    await expect(outbound.getByText('Sent', { exact: true })).toBeVisible();

    // Outbound messages sit towards the end only on wide screens; direction is never shown by position alone.
    const [inBox, outBox] = [await inbound.boundingBox(), await outbound.boundingBox()];
    if (width >= 640) expect(outBox!.x).toBeGreaterThan(inBox!.x);
    else expect(Math.abs(outBox!.x - inBox!.x)).toBeLessThanOrEqual(1);

    // Audio loads real metadata; the missing video falls back to text and a download link.
    const audio = inbound.getByRole('figure', { name: /Voice note/ }).locator('audio');
    await expect(audio).toHaveAttribute('aria-label', 'Voice note from Studio visitor, 0:01');
    await expect.poll(() => audio.evaluate(element => (element as HTMLAudioElement).duration)).toBeCloseTo(1, 1);
    expect(await audio.evaluate(element => (element as HTMLAudioElement).paused)).toBe(true);
    await inbound.getByText('Transcript').click();
    await expect(inbound.getByText('What time does the studio open?', { exact: true })).toBeVisible();
    await expect(outbound.getByText('This video cannot be played in this browser.')).toBeVisible();
    await expect(outbound.getByRole('link', { name: 'Download Video reply' })).toHaveAttribute('href', '/tests/missing-video.mp4');
    await expect(outbound.locator('video')).toHaveCount(0);
    await expect(outbound.locator('blockquote')).toHaveText('What time does the studio open?');

    // Per-message actions are a named group; removal withholds content and attachments.
    const actions = inbound.getByRole('group', { name: 'Actions for the message from Studio visitor, 19 October, 13:00' });
    const hide = actions.getByRole('button', { name: 'Hide' });
    await hide.click();
    await expect(page.getByRole('status')).toHaveText('Comment hidden.');
    await expect(inbound.getByText('Message removed.')).toBeVisible();
    await expect(inbound.getByText('Hidden by Studio teammate.')).toBeVisible();
    await expect(inbound.locator('audio')).toHaveCount(0);
    await expect(inbound.getByText(/^What time does the studio open\? Avery/)).toHaveCount(0);

    expect(await overflow(page), 'no page overflow').toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test('outbound messages move to the start side in right-to-left layouts', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/tests/conversation.html?dir=rtl');
  const [inBox, outBox] = [await page.locator('[data-message-id="in-1"]').boundingBox(), await page.locator('[data-message-id="out-1"]').boundingBox()];
  expect(outBox!.x + outBox!.width).toBeLessThan(inBox!.x + inBox!.width);
  const rule = await page.locator('blockquote').evaluate(element => getComputedStyle(element).borderRightWidth);
  expect(parseFloat(rule)).toBeGreaterThan(0);
});

test('removed messages and quotes stay distinguishable in forced colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/tests/conversation.html');
  await page.getByRole('button', { name: 'Hide' }).click();
  const removed = page.locator('[data-message-id="in-1"]');
  expect(await removed.evaluate(element => getComputedStyle(element).borderTopStyle)).toBe('dashed');
  expect(parseFloat(await page.locator('blockquote').evaluate(element => getComputedStyle(element).borderLeftWidth))).toBeGreaterThan(0);
});
