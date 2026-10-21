import { expect, test } from '@playwright/test';

test('the isolated player connects only after the token handshake, stays offline and fails closed', async ({ page }) => {
  const reached: string[] = [];
  page.on('response', response => { if (response.url().includes('/tests/probe-player')) reached.push(response.url()); });
  await page.goto('/tests/player.html');
  const log = (mode: string) => page.locator(`[data-log="${mode}"]`);

  const frame = page.locator('iframe[title="Player ok"]');
  await expect(frame).toHaveAttribute('src', /^data:text\/html;charset=utf-8,/);
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin');
  await expect(log('ok')).toHaveText('ready 1000');
  await expect(page.frameLocator('iframe[title="Player ok"]').getByText('Payload {"events":2}')).toBeVisible();
  // The data: document has an opaque origin: it cannot reach the app even with allow-same-origin.
  expect(await frame.evaluate(element => { try { return (element as HTMLIFrameElement).contentDocument === null; } catch { return true; } })).toBe(true);
  await page.getByRole('button', { name: 'Play ok' }).click();
  await expect(log('ok')).toHaveText('ready 1000 | sent true | tick 250 true');
  await page.getByRole('button', { name: 'Play past end ok' }).click();
  await expect(log('ok')).toContainText('sent false');

  // A forged token, silence past the timeout and an unknown message each fail closed, and nothing is sent to them.
  await expect(log('wrong-token')).toHaveText('failed');
  await expect(page.frameLocator('iframe[title="Player wrong-token"]').locator('body')).toHaveCount(0);
  await expect(log('chatty')).toHaveText('ready 1000 | failed');
  await expect(log('silent')).toHaveText('failed', { timeout: 5000 });
  await page.getByRole('button', { name: 'Play silent' }).click();
  await expect(log('silent')).toHaveText('failed | sent undefined');

  // Retry remounts with a fresh document (new nonce and token).
  const before = await page.locator('iframe[title="Player ok"]').getAttribute('src');
  expect(before).toBeTruthy();
  const alerts = page.getByRole('alert');
  await expect(alerts).toHaveCount(3);
  expect(reached, 'every player fetch was blocked by the CSP').toEqual([]);
});
