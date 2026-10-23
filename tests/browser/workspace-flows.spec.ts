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

    // Settings navigation: current page, omitted items and hidden empty group.
    const nav = screen.getByRole('navigation', { name: 'Settings' });
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
