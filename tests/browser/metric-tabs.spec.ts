import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

test('analytics controls metric tabs link controlled panels and support keyboard activation without unavailable history', async ({ page }, info) => {
  await page.goto('/tests/metric-tabs.html');
  const list = page.getByRole('tablist', { name: 'Daily metric' });
  const views = list.getByRole('tab', { name: /Page views/ });
  const events = list.getByRole('tab', { name: /Events/ });
  const unavailable = list.getByRole('tab', { name: /Sessions and returning visitor history/ });
  await expect(views).toHaveAttribute('aria-selected', 'true');
  await expect(views).toContainText('20');
  await expect(views).toContainText('+10%');
  await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
  await expect(unavailable).toContainText('Session history is not supplied by this report.');
  await expect(unavailable).not.toContainText('0');
  const panel = page.getByRole('tabpanel');
  await expect(panel).toHaveCount(1);
  expect(await views.getAttribute('aria-controls')).toBe(await panel.getAttribute('id'));
  expect(await panel.getAttribute('aria-labelledby')).toBe(await views.getAttribute('id'));

  await views.focus();
  await page.keyboard.press('ArrowRight');
  await expect(events).toBeFocused();
  await expect(events).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#selected-metric')).toHaveText('Selected metric: customEvents');
  await expect(page.locator('#metric-changes')).toHaveText('Selection changes: 1');
  await expect(panel.getByRole('group', { name: /Daily custom events plot/ })).toBeVisible();
  await page.keyboard.press('Home');
  await expect(views).toBeFocused();
  await page.keyboard.press('End');
  await expect(events).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(views).toBeFocused();
  await events.focus();
  await page.keyboard.press('Enter');
  await expect(events).toHaveAttribute('aria-selected', 'true');
  await views.focus();
  await page.keyboard.press('Space');
  await expect(views).toHaveAttribute('aria-selected', 'true');
  const before = await page.locator('#metric-changes').textContent();
  await unavailable.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(page.locator('#metric-changes')).toHaveText(before!);
  await expect(page.locator('#selected-metric')).toHaveText('Selected metric: pageViews');
  await views.focus();
  await page.keyboard.press('Tab');
  await expect(panel).toBeFocused();
  await expect(list.locator('[tabindex="0"]')).toHaveCount(1);
  await mkdir(resolve('.qa/analytics-controls'), { recursive: true });
  await page.locator('.t98-metric-tabs').screenshot({ path: resolve('.qa/analytics-controls', `metric-tabs-detail-${info.project.name}.png`) });
  await page.getByRole('button', { name: 'Make page views unavailable' }).click();
  await expect(views).toHaveAttribute('aria-selected', 'true');
  await expect(views).toHaveAttribute('aria-disabled', 'true');
  await expect(views).toContainText('—');
  await expect(views).not.toContainText('20');
  await expect(views).not.toContainText('+10%');
  await expect(panel).toContainText('Page view history is no longer available.');
  await expect(panel.getByRole('img', { name: 'Daily page views', exact: true })).toHaveCount(0);
  await expect(page.locator('#selected-metric')).toHaveText('Selected metric: pageViews');
});

test('analytics controls metric tabs fit 320px with 44px targets, RTL arrows and 200 percent layout zoom', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await mkdir(resolve('.qa/analytics-controls'), { recursive: true });
  for (const dir of ['ltr', 'rtl']) {
    await page.goto(`/tests/metric-tabs.html?dir=${dir}&theme=${info.project.name === 'narrow-dark' ? 'dark' : 'light'}`);
    const list = page.getByRole('tablist', { name: 'Daily metric' });
    const views = list.getByRole('tab', { name: /Page views/ });
    const events = list.getByRole('tab', { name: /Events/ });
    for (const zoom of [1, 2]) {
      await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
      for (const tab of await list.getByRole('tab').all()) {
        const size = await tab.boundingBox();
        expect(size!.height, 'metric target height').toBeGreaterThanOrEqual(44 * zoom - 0.5);
        expect(size!.width, 'metric target width').toBeGreaterThanOrEqual(44 * zoom - 0.5);
        expect(size!.x, 'tab stays inside viewport').toBeGreaterThanOrEqual(-0.5);
        expect(size!.x + size!.width, 'tab stays inside viewport').toBeLessThanOrEqual(320.5);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 'no horizontal page overflow').toBeLessThanOrEqual(1);
      await views.focus();
      await page.keyboard.press(dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
      await expect(events).toBeFocused();
      await expect(events).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press(dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
      await expect(views).toBeFocused();
      await page.screenshot({ path: resolve('.qa/analytics-controls', `metric-tabs-${info.project.name}-${dir}-zoom${zoom}.png`), fullPage: true });
    }
  }
});
