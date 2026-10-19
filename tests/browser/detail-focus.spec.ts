import { expect, test } from '@playwright/test';

test('detail navigation recovers hidden keyboard focus and preserves app restoration and drafts', async ({ page }) => {
  await page.goto('/#components/detail-workspace?tab=states');
  const state = page.locator('.reference-state').filter({ has: page.getByRole('heading', { name: 'Narrow with back', exact: true }) });
  const workspace = state.locator('.t98-detail-root');
  const open = workspace.getByRole('button', { name: 'Open studio conversation', exact: true });
  const detailHeading = workspace.getByRole('heading', { name: 'Studio opening conversation', exact: true });
  // Mounting a selected narrow workspace must not take focus from page navigation.
  await expect(page.locator('.reference-detail > header h1')).toBeFocused();
  await expect(detailHeading).not.toBeFocused();
  const back = workspace.getByRole('button', { name: 'Back to list', exact: true });
  await back.focus();
  await back.press('Enter');
  // The app deliberately restores its originating control in requestAnimationFrame.
  await expect(open).toBeFocused();
  await open.press('Enter');
  await expect(open).not.toBeVisible();
  await expect(detailHeading).toBeFocused();
  const draft = workspace.getByLabel('App-owned reply draft', { exact: true });
  await draft.fill('Unsent keyboard navigation draft');
  const returnButton = workspace.getByRole('button', { name: 'Return to conversations', exact: true });
  await returnButton.focus();
  await returnButton.press('Enter');
  await expect(open).toBeFocused();
  await open.press('Enter');
  await expect(detailHeading).toBeFocused();
  await expect(draft).toHaveValue('Unsent keyboard navigation draft');
});

test('detail navigation retains keyboard focus while both panes remain visible', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('/#components/detail-workspace?tab=states');
  const state = page.locator('.reference-state').filter({ has: page.getByRole('heading', { name: 'No selection', exact: true }) });
  const workspace = state.locator('.t98-detail-root');
  const open = workspace.getByRole('button', { name: 'Open studio conversation', exact: true });
  await expect(workspace.locator('.t98-detail-list-pane')).toBeVisible();
  await expect(workspace.locator('.t98-detail-detail-pane')).toBeVisible();
  await open.focus();
  await open.press('Enter');
  await expect(workspace).toHaveAttribute('data-selected', 'true');
  await expect(workspace.locator('.t98-detail-list-pane')).toBeVisible();
  await expect(workspace.locator('.t98-detail-detail-pane')).toBeVisible();
  await expect(open).toBeFocused();
});

test('detail navigation has a visible return target without app focus restoration', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 850 });
  await page.goto('/tests/product-components.html');
  await page.getByRole('button', { name: 'Run checks', exact: true }).click();
  await expect(page.locator('#result')).toHaveText(/^PASS:/);
  const workspace = page.locator('.t98-detail-root');
  const back = workspace.getByRole('button', { name: 'Back to list', exact: true });
  await back.focus();
  await back.press('Enter');
  await expect(workspace.getByRole('heading', { name: 'Conversations', exact: true })).toBeFocused();
  const open = workspace.getByRole('button', { name: 'Open conversation', exact: true });
  await open.focus();
  await open.press('Enter');
  await expect(workspace.getByRole('heading', { name: 'Selected conversation', exact: true })).toBeFocused();
  await expect(workspace.getByLabel('Reply draft', { exact: true })).toHaveValue('Unsent response');
});

test('app selection guards retain their dialog focus and per-conversation drafts', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('/#flows/campaign-recovery-inbox');
  const workspace = page.locator('.reference-preview .t98-detail-root');
  const sam = workspace.getByRole('button', { name: 'Open Sam conversation', exact: true });
  await sam.focus();
  await sam.press('Enter');
  const draft = workspace.getByLabel('Public reply text', { exact: true });
  await draft.fill('Keep this unsent conversation draft');
  const robin = workspace.getByRole('button', { name: 'Open Robin conversation', exact: true });
  await robin.focus();
  await robin.press('Enter');
  const guard = page.getByRole('dialog', { name: 'Keep this unsaved draft before switching?', exact: true });
  const stay = guard.getByRole('button', { name: 'Stay in conversation', exact: true });
  await expect(guard).toBeVisible();
  await expect.poll(() => guard.evaluate(dialog => dialog.contains(document.activeElement))).toBe(true);
  await expect(sam).toHaveAttribute('aria-pressed', 'true');
  await stay.focus();
  await stay.press('Enter');
  await expect(guard).not.toBeVisible();
  await expect(robin).toBeFocused();
  await expect(draft).toHaveValue('Keep this unsent conversation draft');
});
