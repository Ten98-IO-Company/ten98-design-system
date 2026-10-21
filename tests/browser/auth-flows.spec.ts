import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const evidence = resolve('.qa/auth-flows');
const screens = ['signin', 'signin-single', 'signin-busy', 'signin-error', 'signin-providers-pending', 'signin-providers-loading', 'signin-providers-error', 'signin-providers-start-error', 'signin-providers-empty', 'setup', 'setup-full', 'setup-error', 'setup-busy', 'loading', 'error', 'boundary', 'unconfirmed', 'signin-unconfirmed',
  '2fa-authenticator', '2fa-recovery', '2fa-error', 'recovery-request', 'recovery-loading', 'recovery-disabled', 'recovery-error', 'recovery-sent', 'recovery-reset', 'recovery-reset-link', 'recovery-reset-error', 'recovery-unconfirmed', 'recovery-invalid',
  'invitation-loading', 'invitation-new', 'invitation-signin-label', 'invitation-busy', 'invitation-signin-busy', 'invitation-join', 'invitation-signin', 'invitation-mismatch', 'invitation-unavailable', 'invitation-accepted', 'onboarding', 'onboarding-native', 'onboarding-error'];

const open = async (page: Page, screen: string, theme: string, width: number) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.emulateMedia({ colorScheme: theme as 'light' | 'dark', reducedMotion: 'reduce' });
  await page.goto(`/tests/auth-flows.html?screen=${screen}&theme=${theme}`);
  await expect(page.locator('.auth-shell')).toBeVisible();
};

for (const theme of ['light', 'dark'] as const) {
  test(`every flow and state fits the project width with one h1 in ${theme}`, async ({ page }, info) => {
    const width = info.project.name === 'narrow-dark' ? 320 : 1440;
    await mkdir(evidence, { recursive: true });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const screen of screens) {
      await open(page, screen, theme, width);
      await expect(page.locator('h1'), `${screen} has one h1`).toHaveCount(1);
      await expect(page.locator('main'), `${screen} has one main landmark`).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${screen} has no page overflow`).toBeLessThanOrEqual(1);
      const clipped = await page.locator('.auth-shell *').evaluateAll(nodes => nodes.filter(node => node.scrollWidth > node.clientWidth + 1 && getComputedStyle(node).overflowX === 'visible' && node.getBoundingClientRect().right > innerWidth + 1).length);
      expect(clipped, `${screen} keeps content inside the viewport`).toBe(0);
      await page.screenshot({ path: resolve(evidence, `${screen}-${theme}-${width}.png`), fullPage: true, animations: 'disabled' });
    }
    expect(errors).toEqual([]);
  });
}

test('native form exposes field names, tokens, hidden fields and the story label', async ({ page }, info) => {
  await open(page, 'setup-full', 'light', info.project.name === 'narrow-dark' ? 320 : 1440);
  const form = page.locator('form');
  await expect(form).toHaveAttribute('action', '/setup');
  await expect(form).toHaveAttribute('method', 'post');
  await expect(form.locator('input[type=hidden][name=csrf]')).toHaveValue('token-from-server');
  for (const [name, autocomplete] of [['name', 'name'], ['token', 'off'], ['email', 'username'], ['password', 'new-password'], ['workspaceName', 'organization']]) {
    await expect(form.locator(`[name=${name}]`)).toHaveAttribute('autocomplete', autocomplete);
  }
  await expect(form.getByLabel('Password')).toHaveAccessibleDescription('Use at least 12 characters.');
  await expect(form.getByLabel('Add sample content to the workspace')).toBeChecked();
  await expect(page.getByRole('link', { name: 'Sign in instead' })).toHaveAttribute('href', '#login');
});

test('busy forms are announced and disabled', async ({ page }, info) => {
  await open(page, 'signin-busy', 'light', info.project.name === 'narrow-dark' ? 320 : 1440);
  await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('fieldset')).toHaveAttribute('disabled', '');
  await expect(page.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
  await expect(page.getByLabel('Email address')).toBeDisabled();
});

test('a failed submit moves focus to the error alert each time and ignores repeat submits', async ({ page }, info) => {
  await open(page, 'interactive', 'light', info.project.name === 'narrow-dark' ? 320 : 1440);
  await page.getByLabel('Email address').fill('member@example.test');
  await page.getByLabel('Password').fill('synthetic-password');
  const submit = page.getByRole('button', { name: 'Sign in', exact: true });
  await submit.dblclick();
  await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
  const alert = page.locator('form [role=alert]');
  await expect(alert).toHaveText('The email or password is incorrect. Attempt 1.');
  await expect(alert).toBeFocused();
  await expect(page.getByRole('status')).toHaveText('Submitted email,password');
  await page.getByLabel('Password').focus();
  await submit.click();
  await expect(alert).toHaveText('The email or password is incorrect. Attempt 2.');
  await expect(alert).toBeFocused();
  await info.attach('after-error', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: resolve(evidence, `interactive-error-${info.project.name}.png`), fullPage: true });
});

test('provider list renders links, buttons and nothing when empty', async ({ page }, info) => {
  const width = info.project.name === 'narrow-dark' ? 320 : 1440;
  await open(page, 'signin', 'light', width);
  await expect(page.getByRole('link', { name: 'Continue with Microsoft' })).toHaveAttribute('href', '#entra');
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled();
  await expect(page.getByRole('main', { name: 'Sign in' })).toBeVisible();
  await open(page, 'signin-providers-empty', 'light', width);
  await expect(page.locator('.t98-auth-providers')).toHaveCount(0);
  await open(page, 'signin-providers-pending', 'light', width);
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('link', { name: 'Continue with Microsoft' })).toBeVisible();
});

test('two-factor mode toggle clears the code and changes the input constraints', async ({ page }, info) => {
  await open(page, '2fa-authenticator', 'light', info.project.name === 'narrow-dark' ? 320 : 1440);
  const code = page.locator('input[name=code]');
  await expect(code).toHaveAttribute('inputmode', 'numeric');
  await expect(code).toHaveAttribute('maxlength', '6');
  await code.fill('123456');
  await page.getByRole('button', { name: 'Use a recovery code' }).click();
  await expect(code).toHaveValue('');
  await expect(code).toHaveAttribute('inputmode', 'text');
  await expect(code).toHaveAttribute('maxlength', '21');
  await expect(code).toHaveAttribute('autocomplete', 'one-time-code');
  await expect(page.getByLabel('Recovery code')).toBeVisible();
  await code.fill('abcde-12345');
  await page.getByRole('button', { name: 'Use your authenticator app' }).click();
  await expect(code).toHaveValue('');
});

test('a mismatched confirmation shows a field error and a focused form-level alert', async ({ page }, info) => {
  await open(page, 'recovery-reset', 'light', info.project.name === 'narrow-dark' ? 320 : 1440);
  await expect(page.locator('input[type=hidden][name=token]')).toHaveValue('reset-token');
  await page.getByLabel('New password', { exact: true }).fill('synthetic-password-1');
  await page.getByLabel('Confirm new password').fill('synthetic-password-2');
  await page.getByRole('button', { name: 'Reset password' }).click();
  await expect(page.locator('.t98-field-error')).toHaveText('The passwords do not match.');
  await expect(page.getByLabel('Confirm new password')).toHaveAttribute('aria-invalid', 'true');
  const alert = page.locator('.t98-flow-error');
  await expect(alert).toHaveText('The passwords do not match.');
  await expect(alert).toBeFocused();
});

test('the reset form offers a new link before the link is invalid', async ({ page }, info) => {
  await open(page, 'recovery-reset-link', 'light', info.project.name === 'narrow-dark' ? 320 : 1440);
  await expect(page.locator('form').getByRole('button', { name: 'Request a new link' })).toBeVisible();
  await expect(page.locator('form').getByRole('link', { name: 'Back to sign in' })).toBeVisible();
});

test('a provider start error shows below usable buttons and a pending provider shows a status', async ({ page }, info) => {
  const width = info.project.name === 'narrow-dark' ? 320 : 1440;
  await open(page, 'signin-providers-start-error', 'light', width);
  const google = page.getByRole('button', { name: 'Continue with Google' });
  await expect(google).toBeEnabled();
  const [list, alert] = await Promise.all([page.locator('.t98-auth-providers > ul').boundingBox(), page.locator('.t98-auth-providers [role=alert]').boundingBox()]);
  expect(alert!.y).toBeGreaterThanOrEqual(list!.y + list!.height);
  await open(page, 'signin-providers-pending', 'light', width);
  await expect(page.locator('.t98-auth-providers').getByRole('status')).toHaveText('Contacting the provider…');
});

test('invitation sign-in label is overridable and every busy state is aria-busy', async ({ page }, info) => {
  const width = info.project.name === 'narrow-dark' ? 320 : 1440;
  await open(page, 'invitation-signin-label', 'light', width);
  await expect(page.getByRole('button', { name: 'I already have an account' })).toBeVisible();
  for (const screen of ['invitation-busy', 'invitation-signin-busy']) {
    await open(page, screen, 'light', width);
    await expect(page.locator('main :is(form, div)[aria-busy=true]'), screen).toHaveCount(1);
  }
});

test('recovery, invitation and onboarding screens expose the right actions', async ({ page }, info) => {
  const width = info.project.name === 'narrow-dark' ? 320 : 1440;
  await open(page, 'recovery-invalid', 'light', width);
  await expect(page.getByRole('button', { name: 'Request a new link' })).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);
  await open(page, 'recovery-disabled', 'light', width);
  await expect(page.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '#signin');
  await open(page, 'invitation-new', 'light', width);
  await expect(page.getByRole('button', { name: 'Create account and join' })).toBeVisible();
  await expect(page.locator('input[type=hidden][name=token]')).toHaveValue('invite-token');
  await open(page, 'invitation-join', 'light', width);
  await expect(page.getByRole('button', { name: 'Join workspace' })).toBeVisible();
  await expect(page.locator('input[name=password]')).toHaveCount(0);
  await open(page, 'invitation-signin', 'light', width);
  await expect(page.getByRole('button', { name: 'Sign in to join' })).toBeVisible();
  await open(page, 'invitation-mismatch', 'light', width);
  await expect(page.getByText('Signed in as someone.else@example.test; this invitation is for new.member@example.test.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Switch account' })).toBeVisible();
  await open(page, 'invitation-unavailable', 'light', width);
  await expect(page.getByRole('alert')).toHaveText('This invitation was cancelled by the workspace owner.');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await open(page, 'onboarding-native', 'light', width);
  const signOut = page.locator('form[action="/logout"]');
  await expect(signOut).toHaveAttribute('method', 'post');
  await expect(signOut.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await expect(page.locator('input[name=name]')).toHaveAttribute('maxlength', '120');
  await open(page, 'signin-unconfirmed', 'light', width);
  await expect(page.getByRole('alert')).toContainText('could not confirm');
});

test('setup submits typed values with a boolean sample and without hidden fields', async ({ page }, info) => {
  const width = info.project.name === 'narrow-dark' ? 320 : 1440;
  const fill = async () => {
    await page.getByLabel('Your name').fill('Owner');
    await page.getByLabel('Setup token').fill('setup-token');
    await page.getByLabel('Email address').fill('owner@example.test');
    await page.getByLabel('Password').fill('synthetic-password-1');
    await page.getByLabel('Workspace name').fill('Acme');
  };
  await open(page, 'values', 'light', width);
  await fill();
  await page.getByRole('button', { name: 'Create owner account' }).click();
  await expect(page.getByRole('status')).toHaveText('{"name":"Owner","token":"setup-token","email":"owner@example.test","password":"synthetic-password-1","workspaceName":"Acme","sample":false}');
  await page.getByLabel('Add sample content').check();
  await page.getByRole('button', { name: 'Create owner account' }).click();
  await expect(page.getByRole('status')).toContainText('"sample":true');
  await open(page, 'values-hidden', 'light', width);
  await fill();
  await page.getByRole('button', { name: 'Create owner account' }).click();
  await expect(page.getByRole('status')).toContainText('"sample":false');
  await expect(page.getByRole('status')).not.toContainText('csrf');
});

test('a custom onReload recovers the error boundary in place', async ({ page }) => {
  await open(page, 'boundary-recover', 'light', 1440);
  await page.getByRole('button', { name: 'Reload' }).click();
  await expect(page.locator('#recovered')).toHaveText('Recovered without a page reload.');
  await expect(page.locator('.auth-shell')).toHaveCount(0);
});
