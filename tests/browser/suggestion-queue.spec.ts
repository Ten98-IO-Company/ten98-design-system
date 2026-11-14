import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const primary = (page: Page) => page.locator('#primary-queue');
const requests = async (page: Page): Promise<{ groupId: string; itemIds: string[]; state: string }[]> => JSON.parse(await page.locator('#queue-requests').innerText());
const action = (page: Page, name: string) => primary(page).getByRole('button', { name, exact: true });

test('suggestion queue waits for controlled updates and preserves app edits and provenance', async ({ page }) => {
  await page.goto('/tests/suggestion-queue.html?hold=1');
  const queue = primary(page);
  await expect(queue.getByRole('region', { name: 'Campaign suggestions', exact: true })).toBeVisible();
  await expect(queue).toContainText('1 of 5 accepted; 3 suggested; 1 dismissed.');
  await expect(queue).toContainText('Imported from the campaign brief.');
  await expect(queue).toContainText('Source: the product brief.');
  await page.getByLabel('Edit search phrase', { exact: true }).fill('Edited phrase');
  await expect(queue.getByText('Edited', { exact: true })).toBeVisible();
  await expect(page.locator('#queue-draft')).toHaveText('Draft: Edited phrase');
  await action(page, 'Accept Edited phrase').click();
  expect(await requests(page)).toEqual([{ groupId: 'campaign:[draft]', itemIds: ['term:[one]'], state: 'accepted' }]);
  await expect(action(page, 'Accept Edited phrase')).toBeVisible();
  await expect(queue).toContainText('1 of 5 accepted; 3 suggested; 1 dismissed.');
  await page.getByRole('button', { name: 'Commit pending request', exact: true }).click();
  await expect(queue).toContainText('2 of 5 accepted; 2 suggested; 1 dismissed.');
  await expect(action(page, 'Accept Edited phrase')).toHaveCount(0);
  await expect(action(page, 'Dismiss Edited phrase')).toBeVisible();
  await expect(page.getByLabel('Edit search phrase', { exact: true })).toHaveValue('Edited phrase');
  await expect(page.getByRole('button', { name: 'Commit pending request', exact: true })).toBeFocused();
  await mkdir(resolve('.qa/suggestion-queue'), { recursive: true });
  await queue.screenshot({ path: resolve('.qa/suggestion-queue', `edited-detail-${page.viewportSize()!.width}.png`) });
  await page.getByRole('button', { name: 'Toggle read-only', exact: true }).click();
  await expect(queue.getByRole('listitem', { name: 'Edited phrase', exact: true })).toBeVisible();
  await expect(queue.getByRole('textbox')).toHaveCount(0);
  await expect(queue.getByRole('button')).toHaveCount(0);
  await expect(queue).toContainText('Source: the product brief.');
  await expect(queue).toContainText('2 of 5 accepted; 2 suggested; 1 dismissed.');
  await expect(page.locator('#queue-submits')).toHaveText('Form submissions: 0');
});

test('suggestion queue bulk changes send one exact batch without restoring dismissed items or crossing groups', async ({ page }) => {
  await page.goto('/tests/suggestion-queue.html');
  await action(page, 'Accept all in Campaign terms').click();
  expect(await requests(page)).toEqual([{ groupId: 'campaign:[draft]', itemIds: ['term:[one]', 'two'], state: 'accepted' }]);
  await expect(primary(page)).toContainText('3 of 5 accepted; 1 suggested; 1 dismissed.');
  await expect(action(page, 'Accept Dubai')).toBeVisible();
  await expect(action(page, 'Accept Search phrase')).toHaveCount(0);
  await action(page, 'Dismiss all in Campaign terms').click();
  expect(await requests(page)).toEqual([
    { groupId: 'campaign:[draft]', itemIds: ['term:[one]', 'two'], state: 'accepted' },
    { groupId: 'campaign:[draft]', itemIds: ['term:[one]', 'two', 'three'], state: 'dismissed' },
  ]);
  await expect(primary(page)).toContainText('0 of 5 accepted; 1 suggested; 4 dismissed.');
  await expect(action(page, 'Accept Dubai')).toBeVisible();
  await expect(action(page, 'Restore Old phrase')).not.toBeVisible();
  await expect(page.locator('#queue-submits')).toHaveText('Form submissions: 0');
});

test('suggestion queue supports Enter and Space, restores collapsed dismissals and recovers row focus', async ({ page }) => {
  await page.goto('/tests/suggestion-queue.html');
  await action(page, 'Accept Search phrase').focus();
  await page.keyboard.press('Enter');
  await expect(action(page, 'Dismiss Search phrase')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(action(page, 'Accept Product name')).toBeFocused();
  await expect(action(page, 'Restore Search phrase')).not.toBeVisible();
  const dismissed = primary(page).locator('summary').filter({ hasText: 'Dismissed (2)' });
  await dismissed.focus();
  await page.keyboard.press('Enter');
  await expect(action(page, 'Restore Search phrase')).toBeVisible();
  await action(page, 'Restore Search phrase').focus();
  await page.keyboard.press('Space');
  await expect(action(page, 'Accept Search phrase')).toBeFocused();
  expect((await requests(page)).at(-1)).toEqual({ groupId: 'campaign:[draft]', itemIds: ['term:[one]'], state: 'suggested' });
  await action(page, 'Accept Search phrase').focus();
  await page.keyboard.press('Tab');
  expect(await primary(page).evaluate(element => element.contains(document.activeElement))).toBe(true);
  await expect(page.locator('#queue-submits')).toHaveText('Form submissions: 0');
});

test('suggestion queue read-only and absent callbacks suppress editors and mutations while retaining review evidence', async ({ page }) => {
  for (const mode of ['read-only', 'no-handler']) {
    await page.goto(`/tests/suggestion-queue.html?mode=${mode}`);
    const queue = primary(page);
    await expect(queue).toContainText('Search phrase');
    await expect(queue).toContainText('Imported from the campaign brief.');
    await expect(queue).toContainText('Source: the product brief.');
    await expect(queue).toContainText('1 of 5 accepted; 3 suggested; 1 dismissed.');
    await expect(queue.getByRole('button', { name: /^(Accept|Dismiss|Restore) / })).toHaveCount(0);
    await expect(queue.getByRole('textbox')).toHaveCount(0);
    await queue.locator('summary').filter({ hasText: 'Dismissed (1)' }).click();
    await expect(queue.getByRole('listitem', { name: 'Old phrase', exact: true })).toBeVisible();
    await expect(queue.getByRole('button', { name: /^Restore / })).toHaveCount(0);
    expect(await requests(page)).toEqual([]);
    if (mode === 'read-only') await expect(queue).toContainText('This saved review is read-only.');
  }
});

test('suggestion queue handles empty groups, an empty queue and accepted or dismissed terminal states', async ({ page }) => {
  for (const mode of ['empty', 'empty-group', 'accepted', 'dismissed']) {
    await page.goto(`/tests/suggestion-queue.html?mode=${mode}`);
    const queue = primary(page);
    if (mode === 'empty' || mode === 'empty-group') {
      await expect(queue).toContainText('No suggestions are available.');
      await expect(queue).toContainText('0 of 0 accepted; 0 suggested; 0 dismissed.');
      await expect(queue.getByRole('button', { name: /^(Accept|Dismiss|Restore) / })).toHaveCount(0);
    } else if (mode === 'accepted') {
      await expect(queue).toContainText('1 of 1 accepted; 0 suggested; 0 dismissed.');
      await expect(action(page, 'Accept Reviewed phrase')).toHaveCount(0);
      await expect(action(page, 'Dismiss Reviewed phrase')).toBeVisible();
    } else {
      await expect(queue).toContainText('0 of 1 accepted; 0 suggested; 1 dismissed.');
      await expect(action(page, 'Restore Reviewed phrase')).not.toBeVisible();
      await queue.locator('summary').filter({ hasText: 'Dismissed (1)' }).click();
      await expect(action(page, 'Restore Reviewed phrase')).toBeVisible();
    }
  }
});

test('suggestion queue keeps queues and odd duplicate ids isolated and recovers last-row and bulk focus', async ({ page }) => {
  await page.goto('/tests/suggestion-queue.html?two=1');
  const secondary = page.locator('#secondary-queue');
  await action(page, 'Accept Search phrase').click();
  await expect(secondary.getByRole('button', { name: 'Accept Search phrase', exact: true })).toBeVisible();
  await expect(action(page, 'Accept Dubai')).toBeVisible();
  await action(page, 'Dismiss Dubai').focus();
  await page.keyboard.press('Enter');
  await expect(primary(page)).toContainText('2 of 5 accepted; 1 suggested; 2 dismissed.');
  expect(await primary(page).evaluate(element => element.contains(document.activeElement))).toBe(true);
  await action(page, 'Dismiss all in Campaign terms').focus();
  await page.keyboard.press('Space');
  expect(await primary(page).evaluate(element => element.contains(document.activeElement))).toBe(true);
  const ids = await page.locator('[id]').evaluateAll(elements => elements.map(element => element.id));
  expect(new Set(ids).size).toBe(ids.length);
  await expect(secondary.getByRole('button', { name: 'Accept Search phrase', exact: true })).toBeVisible();
  expect(await requests(page)).toEqual([
    { groupId: 'campaign:[draft]', itemIds: ['term:[one]'], state: 'accepted' },
    { groupId: 'locations/#', itemIds: ['term:[one]'], state: 'dismissed' },
    { groupId: 'campaign:[draft]', itemIds: ['term:[one]', 'two', 'three'], state: 'dismissed' },
  ]);
  await expect(page.locator('#queue-submits')).toHaveText('Form submissions: 0');
});

test('suggestion queue fits 320px in both directions and themes at 200 percent zoom with 44px actions', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 1000 });
  await mkdir(resolve('.qa/suggestion-queue'), { recursive: true });
  for (const dir of ['ltr', 'rtl']) {
    for (const theme of ['light', 'dark']) {
      await page.goto(`/tests/suggestion-queue.html?dir=${dir}&theme=${theme}`);
      const queue = primary(page);
      for (const zoom of [1, 2]) {
        await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
        await expect(page.getByLabel('Edit search phrase', { exact: true })).toBeVisible();
        await expect(queue.getByRole('status').locator('bdi')).toHaveCSS('direction', 'ltr');
        for (const button of [...await queue.getByRole('button').all(), ...await queue.locator('summary').all()]) {
          const bounds = await button.boundingBox();
          expect(bounds!.height, 'action height').toBeGreaterThanOrEqual(44 * zoom - 0.5);
          expect(bounds!.width, 'action width').toBeGreaterThanOrEqual(44 * zoom - 0.5);
          expect(bounds!.x, 'action left').toBeGreaterThanOrEqual(-0.5);
          expect(bounds!.x + bounds!.width, 'action right').toBeLessThanOrEqual(320.5);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
        await queue.screenshot({ path: resolve('.qa/suggestion-queue', `${info.project.name}-${dir}-${theme}-zoom${zoom}.png`) });
        await page.screenshot({ path: resolve('.qa/suggestion-queue', `${info.project.name}-${dir}-${theme}-zoom${zoom}-viewport.png`) });
      }
    }
  }
});

test('suggestion queue catalogue contract and all state examples render without errors or overflow', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const prefix = info.project.name === 'narrow-dark' ? '/?theme=dark' : '/';
  await page.goto(`${prefix}#components`);
  await expect(page.locator('.reference-component-card')).toHaveCount(174);
  const href = await page.locator('.reference-component-card').filter({ has: page.getByRole('heading', { name: 'SuggestionQueue', exact: true }) }).getAttribute('href');
  expect(href).toBeTruthy();
  await page.goto(`${prefix}${href}?tab=states`);
  await expect(page.locator('.reference-detail > header h1')).toHaveText('SuggestionQueue');
  await expect(page.locator('.reference-state')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});