import { expect, test, type Page } from '@playwright/test';

// Security regressions: the content policy injected into untrusted srcdoc documents must stay in effect.
// A probe counts as having left the browser unless the browser reports it as blocked by CSP. Response events are
// not enough: ORB and CORS discard the response of a request that already reached the server.
function watchProbes(page: Page, pattern: RegExp) {
  const left: string[] = [];
  page.on('requestfinished', request => { if (pattern.test(request.url())) left.push(new URL(request.url()).pathname); });
  page.on('requestfailed', request => { if (pattern.test(request.url()) && request.failure()?.errorText !== 'csp') left.push(new URL(request.url()).pathname); });
  return left;
}

test('a leading non-HTML-whitespace character cannot push the preview and replay policies out of the head', async ({ page }) => {
  const left = watchProbes(page, /\/tests\/probe-boundary-(pixel|fetch)/);
  await page.goto('/tests/sandbox-boundary.html');
  await expect(page.frameLocator('iframe[title="Leading-space email"]').getByText('Email body')).toBeVisible();
  await expect(page.frameLocator('iframe[title="Leading-space replay frame"]').getByText('Replay body')).toBeVisible();
  await page.waitForTimeout(500);
  expect(left, 'no probe request left the browser').toEqual([]);
});

test('a replay document cannot carry recorded data to the network by navigating its own frame', async ({ page }) => {
  const left = watchProbes(page, /\/tests\/probe-boundary-navigation/);
  await page.goto('/tests/sandbox-boundary.html');
  await page.waitForTimeout(800);
  expect(left, 'the replay frame never navigated to a network URL').toEqual([]);
});
