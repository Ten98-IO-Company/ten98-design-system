import { expect, test, type Page } from '@playwright/test';

// TeamFlow changes to who may do what (a member's role, the two-factor policy) never commit on the control's change
// event: they ask first, starting on Cancel. Runs on every engine because each commits a closed select differently.

const calls = (page: Page) => page.evaluate(() => (window as unknown as { __calls: string[] }).__calls);
const only = async (page: Page, prefix: string) => (await calls(page)).filter(call => call.startsWith(prefix));
const open = (page: Page, switches = '') => page.goto(`/tests/workspace-flows.html?theme=light${switches}`);
const samRole = (page: Page) => page.getByLabel('Role for Sam Lee');
const dialogShown = (page: Page) => page.getByRole('dialog').waitFor({ state: 'visible', timeout: 1500 }).then(() => true, () => false);

// Each path is one input a person can make on a focused, closed select without opening it. The current role is always
// the first option, so Home stays on it; it is kept to prove that no engine commits on it either.
const paths: { name: string; act: (page: Page) => Promise<void> }[] = [
  { name: 'ArrowDown', act: page => page.keyboard.press('ArrowDown') },
  { name: 'ArrowRight', act: page => page.keyboard.press('ArrowRight') },
  { name: 'typing a letter', act: page => page.keyboard.press('a') },
  { name: 'End', act: page => page.keyboard.press('End') },
  { name: 'Home', act: page => page.keyboard.press('Home') },
  { name: 'the mouse wheel', act: async page => {
    const box = (await samRole(page).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 120);
  } },
];

for (const path of paths) {
  test(`${path.name} on a focused, closed role select never changes the role without the confirm`, async ({ page }) => {
    await open(page);
    const select = samRole(page);
    await select.focus();
    await path.act(page);
    const asked = await dialogShown(page);
    expect(await only(page, 'role:'), 'no role change before confirmation').toEqual([]);
    if (asked) {
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: 'Change Sam Lee from Member to Admin?' })).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
      await dialog.getByRole('button', { name: 'Cancel' }).click();
      await expect(dialog).toBeHidden();
    } else {
      // This engine does not commit on this input; close any popup it opened instead.
      await page.keyboard.press('Escape');
      test.info().annotations.push({ type: 'engine', description: `${path.name} does not commit a closed select here` });
    }
    await expect(select).toHaveValue('member');
    await expect(select).toBeFocused();
    expect(await only(page, 'role:')).toEqual([]);
  });
}

test('a role change asks first; Cancel keeps the old role and returns focus to the select', async ({ page }) => {
  await open(page);
  const select = samRole(page);
  await select.selectOption('admin');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Change Sam Lee from Member to Admin?' })).toBeVisible();
  await expect(select).toHaveValue('member');
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await expect(select).toHaveValue('member');
  await expect(select).toBeFocused();
  // Escape is a cancel too.
  await select.selectOption('admin');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(select).toHaveValue('member');
  await expect(select).toBeFocused();
  expect(await only(page, 'role:')).toEqual([]);
});

test('confirming calls onRoleChange once, announces the new role and returns focus to the select', async ({ page }) => {
  await open(page);
  const select = samRole(page);
  await select.selectOption('admin');
  await page.getByRole('dialog').getByRole('button', { name: 'Change role' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await only(page, 'role:')).toEqual(['role:{"id":"u2","role":"admin"}']);
  await expect(page.getByRole('status').filter({ hasText: 'Sam Lee is now Admin.' })).toHaveCount(1);
  await expect(select).toHaveValue('admin');
  await expect(select).toBeFocused();
});

test('a rejected role change shows the application error, keeps the old role and returns focus to the select', async ({ page }) => {
  await open(page, '&rejectRole=1');
  const select = samRole(page);
  await select.selectOption('admin');
  await page.getByRole('dialog').getByRole('button', { name: 'Change role' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('alert').filter({ hasText: 'Only owners can make admins.' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'is now' })).toHaveCount(0);
  await expect(select).toHaveValue('member');
  await expect(select).toBeFocused();
  expect(await only(page, 'role:')).toEqual(['role:{"id":"u2","role":"admin"}']);
});

test('promotion to owner, or to any higher role, is a danger confirm that starts on Cancel; a demotion is not', async ({ page }) => {
  await open(page, '&promote=1');
  const dialog = page.getByRole('dialog');
  const confirm = dialog.getByRole('button', { name: 'Change role' });
  for (const [label, role, title, danger] of [
    ['Role for Sam Lee', 'owner', 'Change Sam Lee from Member to Owner?', true],
    ['Role for Priya Nair', 'owner', 'Change Priya Nair from Admin to Owner?', true],
    ['Role for Sam Lee', 'admin', 'Change Sam Lee from Member to Admin?', true],
    ['Role for Priya Nair', 'member', 'Change Priya Nair from Admin to Member?', false],
  ] as const) {
    await page.getByLabel(label).selectOption(role);
    await expect(dialog.getByRole('heading', { name: title })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    if (danger) await expect(confirm).toHaveClass(/t98-button--danger/);
    else await expect(confirm).not.toHaveClass(/t98-button--danger/);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
  expect(await only(page, 'role:')).toEqual([]);
});

test('the two-factor policy asks before turning on or off, keeps its state until confirmed and announces the result', async ({ page }) => {
  await open(page);
  const box = page.getByRole('checkbox', { name: 'Require two-factor authentication for every member' });
  const dialog = page.getByRole('dialog');
  await box.focus();
  await page.keyboard.press('Space');
  await expect(dialog.getByRole('heading', { name: 'Require two-factor for all members?' })).toBeVisible();
  await expect(dialog).toContainText('locked out until they enrol');
  await expect(dialog.getByRole('button', { name: 'Require two-factor' })).toHaveClass(/t98-button--danger/);
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await expect(box).not.toBeChecked();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(box).not.toBeChecked();
  await expect(box).toBeFocused();
  expect(await only(page, 'policy:')).toEqual([]);

  await page.keyboard.press('Space');
  await dialog.getByRole('button', { name: 'Require two-factor' }).click();
  await expect(dialog).toBeHidden();
  expect(await only(page, 'policy:')).toEqual(['policy:true']);
  await expect(box).toBeChecked();
  await expect(box).toBeFocused();
  await expect(page.getByRole('status').filter({ hasText: 'Two-factor authentication is now required for every member.' })).toHaveCount(1);

  await page.keyboard.press('Space');
  await expect(dialog.getByRole('heading', { name: 'Stop requiring two-factor?' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Stop requiring' })).not.toHaveClass(/t98-button--danger/);
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await expect(box).toBeChecked();
  await dialog.getByRole('button', { name: 'Stop requiring' }).click();
  await expect(dialog).toBeHidden();
  expect(await only(page, 'policy:')).toEqual(['policy:true', 'policy:false']);
  await expect(box).not.toBeChecked();
  await expect(box).toBeFocused();
  await expect(page.getByRole('status').filter({ hasText: 'Two-factor authentication is no longer required.' })).toHaveCount(1);
});

test('after Revoke the share-link panel no longer shows the revoked invitation’s link', async ({ page }) => {
  await open(page);
  const dialog = page.getByRole('dialog');
  await page.getByRole('button', { name: /^New link: new.person/ }).click();
  await dialog.getByRole('button', { name: 'New link', exact: true }).click();
  const link = page.getByLabel('Invitation link');
  await expect(link).toHaveValue(/fedcba9876543210/);
  await page.getByRole('button', { name: /^Revoke: new.person/ }).click();
  await dialog.getByRole('button', { name: 'Revoke', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(await only(page, 'revokeInvitation:')).toEqual(['revokeInvitation:{"id":"i1"}']);
  await expect(link).toHaveCount(0);
  await expect(page.getByText('Share this link now.')).toHaveCount(0);
});

test('revoking a different invitation keeps the link that is still valid', async ({ page }) => {
  await open(page);
  const dialog = page.getByRole('dialog');
  await page.getByRole('button', { name: /^New link: new.person/ }).click();
  await dialog.getByRole('button', { name: 'New link', exact: true }).click();
  await page.getByRole('button', { name: /^Revoke: second@example\.com/ }).click();
  await dialog.getByRole('button', { name: 'Revoke', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByLabel('Invitation link')).toHaveValue(/fedcba9876543210/);
});

test('a role change to Owner is a danger confirm even when Owner is not in the invitation roles (#233 N7)', async ({ page }) => {
  await open(page, '&promote=1&noOwnerRole=1');
  await expect(page.getByRole('combobox', { name: 'Role', exact: true })).not.toContainText('Owner');
  await samRole(page).selectOption('owner');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Change Sam Lee from Member to Owner?' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Change role' })).toHaveClass(/t98-button--danger/);
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(await only(page, 'role:')).toEqual([]);
});

test('changing your own role is a danger confirm, even as a demotion (#233 N8)', async ({ page }) => {
  await open(page, '&selfEdit=1');
  await page.getByLabel('Role for Amal Haddad').selectOption('admin');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Change Amal Haddad from Owner to Admin?' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Change role' })).toHaveClass(/t98-button--danger/);
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(await only(page, 'role:')).toEqual([]);
});

// The open confirm names one member and one role. When the list changes under it, it closes and says why, so Confirm
// can never send that id or role.
type TeamControl = { remove: (id: string) => void; setRole: (id: string, role: string) => void; restrict: (id: string) => void };
const staleCases: { name: string; change: (team: TeamControl) => void; focus: 'message' | 'select' }[] = [
  { name: 'the member is removed', change: team => team.remove('u2'), focus: 'message' },
  { name: 'the member’s role changes', change: team => team.setRole('u2', 'owner'), focus: 'select' },
  { name: 'the chosen role is no longer assignable', change: team => team.restrict('u2'), focus: 'select' },
];
for (const { name, change, focus } of staleCases) {
  test(`an open role confirm closes with a message when ${name} (#233 N3)`, async ({ page }) => {
    await open(page);
    await samRole(page).selectOption('admin');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.evaluate(`(${change.toString()})(window.__team)`);
    await expect(dialog).toBeHidden();
    const message = page.getByRole('alert').filter({ hasText: 'Sam Lee’s role was not changed because the team list changed.' });
    await expect(message).toBeVisible();
    if (focus === 'message') await expect(message).toBeFocused();
    else await expect(samRole(page)).toBeFocused();
    await expect(page.getByRole('status').filter({ hasText: 'is now' })).toHaveCount(0);
    expect(await only(page, 'role:')).toEqual([]);
  });
}

test('a confirmed role change that updates the list is not reported as stale', async ({ page }) => {
  await open(page, '&promote=1');
  await samRole(page).selectOption('owner');
  await page.getByRole('dialog').getByRole('button', { name: 'Change role' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await only(page, 'role:')).toEqual(['role:{"id":"u2","role":"owner"}']);
  await expect(page.getByRole('status').filter({ hasText: 'Sam Lee is now Owner.' })).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

// #233 N9 depends on the Dialog patch for a multi-click that closes a dialog (0.40.1): on WebKit the dialog closes between the
// two clicks, the second lands on the page beneath and focus falls to the body. Remove fixme once that patch is merged.
test.fixme('a double-click on Confirm changes the role once and keeps focus on the select (#233 N9)', async ({ page }) => {
  await open(page);
  const select = samRole(page);
  await select.selectOption('admin');
  await page.getByRole('dialog').getByRole('button', { name: 'Change role' }).dblclick();
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await only(page, 'role:')).toEqual(['role:{"id":"u2","role":"admin"}']);
  await expect(select).toBeFocused();
});

test('a role written to the select without a change event is not kept after a reload (#233 N4)', async ({ page }) => {
  await open(page);
  await expect(samRole(page)).toHaveAttribute('autocomplete', 'off');
  await expect(page.getByRole('checkbox', { name: 'Require two-factor authentication for every member' })).toHaveAttribute('autocomplete', 'off');
  // Firefox restores form values on reload unless autocomplete is off; Chromium and WebKit do not restore them.
  await samRole(page).evaluate(select => { (select as HTMLSelectElement).value = 'admin'; });
  await page.reload();
  await expect(samRole(page)).toHaveValue('member');
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await only(page, 'role:')).toEqual([]);
});
