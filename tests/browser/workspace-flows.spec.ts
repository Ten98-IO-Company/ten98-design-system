import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const evidence = resolve('.qa/workspace-flows');

async function doubleText(page: Page) {
  // Snapshot first: changing a parent before measuring its child would compound inheritance.
  const snapshot = await page.evaluateHandle(() => {
    const sizes = [...document.body.querySelectorAll('*')].filter((element): element is HTMLElement => element instanceof HTMLElement).map(element => {
      const style = getComputedStyle(element);
      return { element, original: element.style.cssText, size: parseFloat(style.fontSize), height: parseFloat(style.lineHeight) };
    });
    for (const { element, size, height } of sizes) {
      element.style.setProperty('font-size', `${size * 2}px`, 'important');
      if (Number.isFinite(height)) element.style.setProperty('line-height', `${height * 2}px`, 'important');
    }
    return sizes;
  });
  return async () => {
    await snapshot.evaluate(sizes => { for (const { element, original } of sizes) element.style.cssText = original; });
    await snapshot.dispose();
  };
}
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const calls = (page: Page) => page.evaluate(() => (window as unknown as { __calls: string[] }).__calls);
const only = async (page: Page, prefix: string) => (await calls(page)).filter(call => call.startsWith(prefix));

for (const theme of ['light', 'dark'] as const) {
  test(`workspace flows confirm once, reveal secrets once and reflow in ${theme}`, async ({ page }, info) => {
    const width = info.project.name === 'narrow-dark' ? 320 : 1440;
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto(`/tests/workspace-flows.html?theme=${theme}`);
    await mkdir(evidence, { recursive: true });
    const screen = page.locator('#workspace-flows-fixture');
    await expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
    expect(await overflow(page), 'no page overflow').toBeLessThanOrEqual(1);

    // Settings navigation: current page, omitted items and hidden empty group. Narrow layouts show it inside the
    // "Settings: Team" disclosure (#85), so open that first.
    if (width < 500) await screen.locator('summary', { hasText: 'Settings: Team' }).click();
    const nav = screen.getByRole('navigation', { name: 'Settings' }).filter({ visible: true });
    await expect(nav.getByRole('link', { name: 'Team' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Profile' })).not.toHaveAttribute('aria-current', 'page');
    await expect(nav.getByText('Billing')).toHaveCount(0);
    await expect(nav.getByText('Operator')).toHaveCount(0);
    if (width < 500) {
      const [navBox, mainBox] = await Promise.all([nav.boundingBox(), screen.locator('.t98-template-main').boundingBox()]);
      expect(navBox!.y + navBox!.height, 'navigation stacks above the content').toBeLessThanOrEqual(mainBox!.y + 1);
    }

    // API key creation reveals the secret once; copy works or falls back visibly.
    const keys = screen.getByRole('region', { name: 'API keys' });
    await expect(keys.getByText('Copy this key now.')).toHaveCount(0);
    await keys.getByLabel('Key name').fill('Deploy');
    await keys.getByRole('button', { name: 'Create key' }).click();
    await expect(keys.getByText('Choose at least one scope.')).toBeVisible();
    await keys.getByRole('checkbox', { name: /^Read/ }).check();
    await keys.getByRole('button', { name: 'Create key' }).click();
    await expect.poll(() => calls(page)).toContain('create:{"name":"Deploy","scopes":["read"],"expiresInDays":30}');
    await expect(keys.getByText(/Copy this key now\./)).toBeVisible();
    await keys.getByRole('button', { name: 'Copy key' }).click();
    const copied = keys.getByText('Copied', { exact: true });
    const manual = keys.getByText('Copy failed. The key is selected: copy it manually.');
    await expect(copied.or(manual)).toBeVisible();
    if (await manual.isVisible()) {
      await expect(keys.getByLabel('Select and copy')).toBeFocused();
      expect(await page.evaluate(() => document.activeElement instanceof HTMLInputElement ? document.activeElement.value.slice(document.activeElement.selectionStart ?? 0, document.activeElement.selectionEnd ?? 0) : '')).toContain('t98_live_');
    }
    expect(await overflow(page), 'no overflow with the secret').toBeLessThanOrEqual(1);
    await screen.screenshot({ path: resolve(evidence, `workspace-flows-${theme}-${width}.png`), animations: 'disabled' });
    await keys.getByRole('button', { name: 'I have saved it' }).click();
    await expect(keys.getByText(/Copy this key now\./)).toHaveCount(0);

    // Revoke: Cancel never calls; confirming calls once. Revoked keys have no action.
    await expect(keys.getByRole('button', { name: /^Revoke: Retired key/ })).toHaveCount(0);
    const revoke = keys.getByRole('button', { name: /^Revoke: production-deployment/ });
    await revoke.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Revoke this key?' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    expect(await only(page, 'revoke:')).toEqual([]);
    await revoke.click();
    await dialog.getByRole('button', { name: 'Revoke', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(await only(page, 'revoke:')).toEqual(['revoke:{"id":"k1"}']);

    // Team: current user and read-only rows have no actions; role change and removal.
    const team = screen.getByRole('region', { name: 'Team' });
    await expect(team.getByRole('button', { name: /^Remove: Amal/ })).toHaveCount(0);
    await expect(team.getByLabel('Role for Amal Haddad')).toHaveCount(0);
    await team.getByLabel('Role for Sam Lee').selectOption('admin');
    await expect.poll(() => calls(page)).toContain('role:{"id":"u2","role":"admin"}');
    await team.getByRole('button', { name: /^Remove: Sam Lee/ }).click();
    await expect(dialog.getByRole('heading', { name: 'Remove this member?' })).toBeVisible();
    expect(await only(page, 'remove:')).toEqual([]);
    await dialog.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(await only(page, 'remove:')).toEqual(['remove:{"id":"u2"}']);

    // Invitations are the only way to add people; revoking confirms once.
    await expect(team.getByText(/Add (existing|account)/i)).toHaveCount(0);
    await team.getByRole('button', { name: /^Revoke: new.person/ }).click();
    await dialog.getByRole('button', { name: 'Revoke', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(await only(page, 'revokeInvitation:')).toEqual(['revokeInvitation:{"id":"i1"}']);
    await team.getByLabel('Email address').fill('invitee@example.com');
    await team.getByRole('button', { name: 'Send invitation' }).click();
    await expect.poll(() => calls(page)).toContain('invite:{"email":"invitee@example.com","role":"member"}');
    await expect(team.getByText(/Share this link now\./)).toBeVisible();

    // Policy toggle.
    await team.getByRole('checkbox', { name: /Require two-factor/ }).check();
    await expect.poll(() => calls(page)).toContain('policy:true');

    // Ownership transfer needs a candidate and the typed phrase.
    const transfer = team.getByRole('button', { name: 'Transfer ownership' });
    await expect(transfer).toBeDisabled();
    await team.getByLabel('New owner').selectOption('u3');
    await transfer.click();
    const confirm = dialog.getByRole('button', { name: 'Transfer ownership' });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel(/Type TRANSFER/).fill('TRANSFER');
    expect(await only(page, 'transfer:')).toEqual([]);
    await confirm.click();
    await expect(dialog).toBeHidden();
    expect(await only(page, 'transfer:')).toEqual(['transfer:{"userId":"u3"}']);

    // Forms submit typed values; project origin is required.
    await screen.getByRole('region', { name: 'Workspace name' }).getByLabel('Workspace name').fill('Acme Two');
    await screen.getByRole('button', { name: 'Save name' }).click();
    await expect.poll(() => calls(page)).toContain('workspace:{"name":"Acme Two"}');
    const project = screen.getByRole('region', { name: 'Create a project' });
    await expect(project.getByLabel('Site origin')).toHaveAttribute('required', '');
    await project.getByLabel('Project name').fill('Site');
    await project.getByLabel('Site origin').fill('https://www.example.com');
    await project.getByRole('button', { name: 'Create project' }).click();
    await expect.poll(() => calls(page)).toContain('project:{"name":"Site","origin":"https://www.example.com"}');

    // Danger zone: typed confirmation, handler only after confirming.
    const danger = screen.getByRole('region', { name: 'Danger zone' });
    await danger.getByRole('button', { name: 'Delete workspace' }).click();
    const destroy = dialog.getByRole('button', { name: 'Delete workspace' });
    await expect(destroy).toBeDisabled();
    await dialog.getByLabel(/Type DELETE/).fill('DELETE');
    expect(await only(page, 'danger:')).toEqual([]);
    await destroy.click();
    await expect(dialog).toBeHidden();
    expect(await only(page, 'danger:')).toEqual(['danger:{"id":"delete"}']);

    // Touch targets and reflow at doubled text.
    for (const control of await screen.getByRole('button').all()) {
      if (!(await control.isVisible())) continue;
      const box = await control.boundingBox();
      expect(box!.height, `${await control.innerText()} is at least 44px tall`).toBeGreaterThanOrEqual(43.5);
    }
    const restore = await doubleText(page);
    try {
      expect.soft(await overflow(page), 'no page overflow at 200% text').toBeLessThanOrEqual(1);
      await screen.screenshot({ path: resolve(evidence, `workspace-flows-${theme}-${width}-2x.png`), animations: 'disabled' });
    } finally { await restore(); }
    expect(errors).toEqual([]);
  });
}

test('CopyButton shows a visible, selected fallback when the clipboard is denied', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) }, configurable: true });
    document.execCommand = () => false;
  });
  await page.goto('/tests/workspace-flows.html?theme=light');
  const keys = page.locator('#workspace-flows-fixture').getByRole('region', { name: 'API keys' });
  await keys.getByLabel('Key name').fill('Deploy');
  await keys.getByRole('checkbox', { name: /^Read/ }).check();
  await keys.getByRole('button', { name: 'Create key' }).click();
  await keys.getByRole('button', { name: 'Copy key' }).click();
  await expect(keys.getByText('Copy failed. The key is selected: copy it manually.')).toBeVisible();
  const manual = keys.getByLabel('Select and copy');
  await expect(manual).toBeFocused();
  expect(await manual.evaluate((input: HTMLInputElement) => input.value.slice(input.selectionStart ?? 0, input.selectionEnd ?? 0))).toContain('t98_live_');
});

test('a new invitation link takes focus when it appears (#83)', async ({ page }) => {
  await page.goto('/tests/workspace-flows.html?theme=light');
  await page.getByLabel('Email address').fill('teammate@example.com');
  await page.getByRole('button', { name: 'Send invitation' }).click();
  await expect(page.getByLabel('Invitation link')).toBeFocused();
});

test('invitation resend and new link confirm once, and an unconfirmed resend offers only its exact retry (#151)', async ({ page }) => {
  await page.goto('/tests/workspace-flows.html?theme=light');
  // Opt-in relative expiry keeps the exact date visible, not only in a title touch users cannot reach.
  const expiresCell = page.getByRole('table', { name: 'Invitations' }).getByRole('cell').filter({ has: page.locator('time') }).first();
  await expect(expiresCell.locator('time')).toHaveAttribute('datetime', '2026-11-01T00:00:00.000Z');
  await expect(expiresCell).toContainText('Nov 1, 2026');
  const dialog = page.getByRole('dialog');

  await page.getByRole('button', { name: /^New link: new.person/ }).click();
  await expect(dialog).toContainText('The current link stops working.');
  await dialog.getByRole('button', { name: 'New link', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(await only(page, 'renew:')).toEqual(['renew:{"id":"i1"}']);
  await expect(page.getByLabel('Invitation link')).toHaveValue(/fedcba/);
  await expect(page.getByLabel('Invitation link')).toBeFocused();

  await page.getByRole('button', { name: /^Resend: new.person/ }).click();
  await dialog.getByRole('button', { name: 'Resend', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(await only(page, 'resend:')).toEqual(['resend:{"id":"i1"}']);
  await expect(page.getByRole('alert').filter({ hasText: 'Result not confirmed' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^(Resend|New link|Revoke): new.person/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /: second@example\.com$/ })).toHaveCount(0);
  // Focus follows the row's buttons as they swap, instead of falling to the page.
  const retry = page.getByRole('button', { name: 'Retry: Resend: new.person@example.com' });
  await expect(retry).toBeFocused();
  // The retry repeats the confirmed attempt directly, without a second confirmation.
  await retry.click();
  await expect(dialog).toBeHidden();
  expect(await only(page, 'resend:')).toEqual(['resend:{"id":"i1"}', 'resend:{"id":"i1"}']);
  await expect(page.getByRole('button', { name: /^Resend: new.person/ })).toBeFocused();
});

test('Cancel or Escape from an invitation confirm returns focus to the button that opened it (#153 review)', async ({ page }) => {
  await page.goto('/tests/workspace-flows.html?theme=light');
  const revoke = page.getByRole('button', { name: /^Revoke: new.person/ });
  await revoke.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(revoke).toBeFocused();
  const renew = page.getByRole('button', { name: /^New link: new.person/ });
  await renew.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(renew).toBeFocused();
});

test('a confirm dropped by the single-submit guard stays open with its error instead of closing as if it ran (#153 review)', async ({ page }) => {
  await page.goto('/tests/workspace-flows.html?theme=light&slowRole=1');
  await page.getByLabel('Role for Sam Lee').selectOption('admin');
  await page.getByRole('button', { name: /^Revoke: new.person/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Revoke', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('could not be completed');
  await expect(dialog).toBeVisible();
  expect(await only(page, 'revokeInvitation:')).toEqual([]);
});

test('an empty unconfirmed value is not retry mode: every invitation keeps its actions (#153 review)', async ({ page }) => {
  await page.goto('/tests/workspace-flows.html?theme=light&unconfirmed=blank');
  await page.getByRole('button', { name: /^Resend: new.person/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Resend', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('button', { name: /^Retry/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Resend: / })).toHaveCount(2);
});

test('an unconfirmed revoke of an invitation that is no longer pending offers no Retry and leaves other rows usable (#153 review)', async ({ page }) => {
  await page.goto('/tests/workspace-flows.html?theme=light&revokeUnconfirmed=1');
  await page.getByRole('button', { name: /^Revoke: new.person/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Revoke', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Result not confirmed.' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Retry/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Revoke: second@example\.com$/ })).toBeVisible();
});

test('a Checkbox hit target is its whole label row, at least 44px tall at any pointer (Discover target check)', async ({ page }) => {
  await page.goto('/tests/workspace-flows.html?theme=light');
  const box = page.getByRole('checkbox', { name: 'Require two-factor authentication for every member' });
  // The visible box stays 15px; the target WCAG 2.5.8 measures is the label that wraps it.
  const row = (await box.locator('xpath=ancestor::label[1]').boundingBox())!;
  expect(row.height).toBeGreaterThanOrEqual(43.5);
  expect(row.width).toBeGreaterThanOrEqual(44);
  await page.getByText('Require two-factor authentication for every member').click();
  await expect(box).toBeChecked();
  expect(await only(page, 'policy:')).toEqual(['policy:true']);
});
