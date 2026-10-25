import { expect, test, type Page } from '@playwright/test';

const width = (name: string) => name === 'narrow-dark' ? 320 : 1440;
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('OIDC providers: derived status, write-only secret, test proof cleared, enable only from the review (#63)', async ({ page }, info) => {
  await page.setViewportSize({ width: width(info.project.name), height: 900 });
  await page.goto('/tests/operator-flows.html');
  const card = page.getByRole('region', { name: 'Company SSO' });
  await expect(card.getByText('Enabled', { exact: true })).toBeVisible();
  await expect(card.getByText('Draft tested')).toBeVisible();
  await expect(card.getByText('Draft ahead of live')).toBeVisible();
  await expect(card.getByText(/Draft revision 3 · Live revision 2 · Tested revision 3/)).toBeVisible();
  await expect(card.getByRole('button', { name: 'Enable tested provider' })).toHaveCount(0);

  // Editing never shows the stored secret; saving hands it over and clears the field.
  await card.getByRole('button', { name: 'Edit draft' }).click();
  const secret = page.getByLabel('Client secret');
  await expect(secret).toHaveValue('');
  await secret.fill('new-client-secret');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.locator('#log')).toContainText('"id":"p1"');
  await expect(page.locator('#log')).toContainText('"clientSecret":"new-client-secret"');
  await expect(secret).toHaveValue('');

  // Test sign-in: the proof is handed over and cleared; enabling happens only from the review.
  await card.getByText('Test sign-in', { exact: true }).click();
  await card.getByLabel('Current password').fill('synthetic-password');
  await card.getByRole('button', { name: 'Start test sign-in' }).click();
  await expect(page.locator('#log')).toContainText('test:{"id":"p1","password":"synthetic-password","secondFactor":"none"}');
  await expect(page.getByRole('heading', { name: 'Review test sign-in' })).toBeVisible();
  await expect(page.getByText('owner@example.test (verified by provider)')).toBeVisible();
  await page.getByRole('button', { name: 'Enable tested provider' }).click();
  await expect(page.locator('#log')).toContainText('enable:p1');
  expect(await overflow(page)).toBeLessThanOrEqual(1);
});

test('OIDC providers: disabling asks once, and a missing vault disables save and test', async ({ page }) => {
  await page.goto('/tests/operator-flows.html');
  await page.getByRole('region', { name: 'Company SSO' }).getByRole('button', { name: 'Disable', exact: true }).click();
  await page.getByRole('dialog', { name: 'Disable Company SSO?' }).getByRole('button', { name: 'Disable provider' }).click();
  await expect(page.locator('#log')).toHaveText('disable:p1');

  await page.goto('/tests/operator-flows.html?vault=missing');
  await expect(page.getByText('Credential storage is not configured on this server.').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create draft' })).toBeDisabled();
  await expect(page.getByLabel('Display name')).toBeDisabled();
});

test('provider credentials: write-only keys, confirm before disconnect, workspace pause, vault and uncertain locks (#63)', async ({ page }, info) => {
  await page.setViewportSize({ width: width(info.project.name), height: 900 });
  await page.goto('/tests/operator-flows.html');
  const row = page.getByRole('region', { name: 'Research model' });
  await expect(row.getByText('Check failed')).toBeVisible();
  await expect(row.getByText('The key was rejected.')).toBeVisible();
  await expect(row.getByText('Last checked: Never')).toBeVisible();

  const add = page.getByRole('form', { name: 'Add connection' });
  await add.getByLabel('Name').fill('Search');
  await add.getByLabel('Provider').selectOption('dataforseo');
  await add.getByLabel('DataForSEO API login email').fill('api@example.test');
  await add.getByLabel('DataForSEO API password').fill('dfs-secret');
  await add.getByRole('button', { name: 'Save connection' }).click();
  await expect(page.locator('#log')).toContainText('add:{"name":"Search","credentials":{"provider":"dataforseo","login":"api@example.test","password":"dfs-secret"}}');
  await expect(add.getByLabel('DataForSEO API password')).toHaveValue('');

  await row.getByRole('button', { name: 'Disconnect' }).click();
  await page.getByRole('dialog', { name: 'Permanently disconnect "Research model"?' }).getByRole('button', { name: 'Disconnect' }).click();
  await expect(page.locator('#log')).toContainText('disconnect:c1');

  await page.getByLabel('Pause paid provider work').check();
  await page.getByRole('button', { name: 'Save pause setting' }).click();
  await expect(page.locator('#log')).toContainText('pause:true');
  expect(await overflow(page)).toBeLessThanOrEqual(1);

  // Without a vault: save, rotate and check are disabled; disconnect and pause stay available.
  await page.goto('/tests/operator-flows.html?vault=missing');
  const locked = page.getByRole('region', { name: 'Research model' });
  await expect(locked.getByRole('button', { name: 'Run check' })).toBeDisabled();
  await expect(locked.getByRole('button', { name: 'Rotate credentials' })).toBeDisabled();
  await expect(locked.getByRole('button', { name: 'Disconnect' })).toBeEnabled();
  await expect(page.getByLabel('Pause paid provider work')).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Save connection' })).toBeDisabled();

  // Uncertain: every control locks until saved settings are reloaded.
  await page.goto('/tests/operator-flows.html?state=uncertain');
  await expect(page.getByText('The change may already be saved.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Research model' }).getByRole('button', { name: 'Disconnect' })).toBeDisabled();
  await page.getByRole('button', { name: 'Reload saved settings' }).click();
  await expect(page.locator('#log')).toHaveText('reload');
});

test('provider spending shows exact sub-cent dollar amounts from decimal strings (#158)', async ({ page }) => {
  await page.goto('/tests/operator-flows.html');
  await page.getByRole('button', { name: 'Review spending' }).click();
  await expect(page.getByText('$0.000123')).toBeVisible();
  await expect(page.getByText('$12.50')).toBeVisible();
  await expect(page.getByRole('cell', { name: '$0.0004' })).toBeVisible();
});
