import { expect, test } from '@playwright/test';

test('report errors alert once with their reason while ready siblings remain statuses', async ({ page }, info) => {
  await page.goto(`/?theme=${info.project.name === 'narrow-dark' ? 'dark' : 'light'}#components/report-panel?tab=states`);
  const state = page.locator('.reference-state').filter({ has: page.getByRole('heading', { name: 'ready', exact: true }) });
  const widget = state.getByRole('region', { name: 'Accepted events', exact: true });
  const sibling = state.getByRole('region', { name: 'Unaffected sibling widget', exact: true });
  await expect(widget.getByRole('status')).toHaveCount(1);
  await expect(state.getByRole('alert')).toHaveCount(0);

  await state.getByLabel('Local widget scenario', { exact: true }).selectOption('error');
  await expect(state.getByRole('alert')).toHaveCount(1);
  await expect(widget.getByRole('alert')).toContainText('Report could not be refreshed');
  await expect(widget.getByRole('alert')).toContainText('This widget failed to refresh. Other widgets keep their own state.');
  await expect(widget.getByRole('status')).toHaveCount(0);
  await expect(widget).toContainText('Previously supplied content is shown; this refresh has not confirmed new data.');
  await expect(widget.locator('.t98-report-content')).toHaveText('42 accepted events');
  await expect(sibling.getByRole('status')).toHaveCount(1);
  await expect(sibling.getByRole('alert')).toHaveCount(0);
  await expect(sibling.locator('.t98-report-content')).toHaveText('12 accepted events');

  await state.getByLabel('Local widget scenario', { exact: true }).selectOption('ready');
  await expect(widget.getByRole('status')).toHaveCount(1);
  await expect(widget.getByRole('status')).toContainText('42 accepted events in the applied scope.');
  await expect(state.getByRole('alert')).toHaveCount(0);
});

test('report region name can differ from its visible heading without a nested region', async ({ page }, info) => {
  await page.goto(`/?theme=${info.project.name === 'narrow-dark' ? 'dark' : 'light'}#components/report-panel?tab=states`);
  const state = page.locator('.reference-state').filter({ has: page.getByRole('heading', { name: 'Separate region name', exact: true }) });
  const widget = state.getByRole('region', { name: 'Visitors over time', exact: true });
  await expect(state.getByRole('region')).toHaveCount(1);
  await expect(widget).toBeVisible();
  await expect(widget).toHaveAttribute('aria-label', 'Visitors over time');
  await expect(widget).not.toHaveAttribute('aria-labelledby');
  await expect(widget.getByRole('heading', { name: 'Visitor activity', exact: true })).toBeVisible();
  await expect(widget).toContainText('Demo website');
  await expect(widget).toContainText('Synthetic website analytics');
  await expect(widget).toContainText('Unknown');
  await expect(widget.locator('.t98-report-content')).toHaveText('0 recorded pageviews');
  await expect(widget.getByRole('region')).toHaveCount(0);
  await expect(widget.getByRole('status')).toHaveCount(1);
  await expect(widget.getByRole('alert')).toHaveCount(0);
});
