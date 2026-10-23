import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const evidence = resolve('.qa/account-flows');
const screens = ['profile', 'profile-disabled', 'password', 'password-error', 'password-none', '2fa-off', '2fa-enrolling', '2fa-codes', '2fa-on', 'sessions', 'identities', 'identities-last', 'identities-proof', 'panel', 'panel-error'];

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

const open = async (page: Page, screen: string, theme = 'light', width = 1440) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.emulateMedia({ colorScheme: theme as 'light' | 'dark', reducedMotion: 'reduce' });
  await page.goto(`/tests/account-flows.html?screen=${screen}&theme=${theme}`);
  await expect(page.locator('main')).toBeVisible();
};
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const widthOf = (name: string) => name === 'narrow-dark' ? 320 : 1440;

for (const theme of ['light', 'dark'] as const) {
  test(`every account flow fits the project width, also with doubled text, in ${theme}`, async ({ page }, info) => {
    const width = widthOf(info.project.name);
    await mkdir(evidence, { recursive: true });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const screen of screens) {
      await open(page, screen, theme, width);
      expect(await overflow(page), `${screen} has no page overflow`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: resolve(evidence, `${screen}-${theme}-${width}.png`), fullPage: true, animations: 'disabled' });
      const restore = await doubleText(page);
      expect(await overflow(page), `${screen} reflows with doubled text`).toBeLessThanOrEqual(1);
      await restore();
      const small = await page.locator('main :is(button, input:not([type=hidden]):not([type=radio]), select)').evaluateAll(nodes => nodes.filter(node => node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height < 43.5).map(node => node.outerHTML.slice(0, 80)));
      expect(small, `${screen} controls are at least 44px tall`).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}

test('revoking a session and signing out others confirm once before calling the handler', async ({ page }, info) => {
  await open(page, 'sessions', 'light', widthOf(info.project.name));
  const log = page.locator('#log');
  await expect(page.getByRole('button', { name: /Sign out: Chrome/ })).toHaveCount(0);
  await expect(page.getByText('This device')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out: Safari on iPhone' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(log).toHaveText('No calls');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(log).toHaveText('No calls');
  await page.getByRole('button', { name: 'Sign out: Safari on iPhone' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(log).toHaveText('revoke:s2');
  await page.getByRole('button', { name: 'Sign out all other sessions' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(log).toHaveText('revoke:s2');
  await page.getByRole('dialog').getByRole('button', { name: 'Sign out all other sessions' }).click();
  await expect(log).toHaveText('revoke:s2 | revoke-others');
});

test('turning off two-factor needs the password and one confirmation', async ({ page }, info) => {
  await open(page, '2fa-on', 'light', widthOf(info.project.name));
  const log = page.locator('#log');
  await page.getByRole('button', { name: 'Turn off two-factor authentication' }).click();
  await expect(page.getByText('Enter your current password.')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Current password').fill('synthetic-password');
  await page.getByRole('button', { name: 'Turn off two-factor authentication' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(log).toHaveText('No calls');
  await page.getByRole('dialog').getByRole('button', { name: 'Turn off two-factor authentication' }).click();
  await expect(log).toHaveText('disable:synthetic-password');
  await expect(page.getByRole('button', { name: 'Set up two-factor authentication' })).toBeVisible();
});

test('unlinking an identity asks for the password, confirms once and passes both values', async ({ page }, info) => {
  await open(page, 'identities', 'light', widthOf(info.project.name));
  const log = page.locator('#log');
  await page.getByRole('button', { name: 'Unlink: Google' }).click();
  await expect(page.getByText('Enter your current password.')).toBeVisible();
  await page.getByLabel('Current password').fill('synthetic-password');
  await page.getByRole('button', { name: 'Unlink: Google' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(log).toHaveText('No calls');
  await page.getByRole('dialog').getByRole('button', { name: 'Unlink', exact: true }).click();
  await expect(log).toHaveText('unlink:i2:synthetic-password');
});

test('the last sign-in method cannot be unlinked and says why', async ({ page }, info) => {
  await open(page, 'identities-last', 'light', widthOf(info.project.name));
  await expect(page.getByRole('button', { name: 'Unlink: Microsoft' })).toBeDisabled();
  await expect(page.getByText('Set a password before unlinking it.')).toBeVisible();
});

test('recovery codes download as a text file and copy with a visible result', async ({ page, context }, info) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page, '2fa-codes', 'light', widthOf(info.project.name));
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download' }).click()]);
  expect(download.suggestedFilename()).toBe('team-codes.txt');
  const path = await download.path();
  expect(await readFile(path!, 'utf8')).toBe('a1b2-c3d4-e5f6\ng7h8-i9j0-k1l2\nm3n4-o5p6-q7r8\ns9t0-u1v2-w3x4\n');
  await page.getByRole('button', { name: 'Copy all' }).click();
  await expect(page.locator('.t98-copy-control [role=status]').first()).toHaveText(/Copied|Copy failed/);
  await expect(page.locator('.t98-copy-control [role=status]').first()).toHaveText('Copied');
  // The Windows clipboard returns CRLF line breaks.
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r/g, '')).toBe('a1b2-c3d4-e5f6\ng7h8-i9j0-k1l2\nm3n4-o5p6-q7r8\ns9t0-u1v2-w3x4');
  await page.getByRole('button', { name: 'I saved these codes' }).click();
  await expect(page.locator('#log')).toHaveText('acknowledged');
  await expect(page.getByText('a1b2-c3d4-e5f6')).toHaveCount(0);
});

test('enrolment shows the QR with alt text and a one-time-code input, then moves to the codes stage', async ({ page }, info) => {
  await open(page, '2fa-off', 'light', widthOf(info.project.name));
  await page.getByLabel('Current password').fill('synthetic-password');
  await page.getByRole('button', { name: 'Set up two-factor authentication' }).click();
  await expect(page.getByRole('img', { name: /QR code to scan/ })).toBeVisible();
  const code = page.getByLabel('Authentication code');
  await expect(code).toHaveAttribute('autocomplete', 'one-time-code');
  await expect(code).toHaveAttribute('inputmode', 'numeric');
  await expect(code).toHaveAttribute('maxlength', '6');
  await code.fill('123456');
  await page.getByRole('button', { name: 'Turn on' }).click();
  await expect(page.locator('#log')).toHaveText('start:synthetic-password | verify:123456');
  await expect(page.getByText('a1b2-c3d4-e5f6')).toBeVisible();
});

test('password change catches a mismatch before calling the app', async ({ page }, info) => {
  await open(page, 'password', 'light', widthOf(info.project.name));
  await page.getByLabel('Current password').fill('old-password-value');
  await page.getByLabel('New password', { exact: true }).fill('a-long-new-password');
  await page.getByLabel('Confirm new password').fill('a-long-new-passwore');
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('The passwords do not match.')).toBeVisible();
  await expect(page.locator('#log')).toHaveText('No calls');
  await page.getByLabel('Confirm new password').fill('a-long-new-password');
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.locator('#log')).toHaveText('{"currentPassword":"old-password-value","newPassword":"a-long-new-password"}');
});

test('profile reports unsaved edits, detects the time zone and submits typed values', async ({ page }, info) => {
  await open(page, 'profile', 'light', widthOf(info.project.name));
  const log = page.locator('#log');
  await expect(page.getByLabel('Email address')).toHaveAttribute('readonly', '');
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  await page.getByLabel('Name').fill('Sam R');
  await expect(log).toContainText('dirty:true');
  await page.getByRole('radio', { name: 'Dark' }).check();
  await page.getByRole('button', { name: 'Use my time zone' }).click();
  await expect(page.getByText('Time zone set from this device.')).toBeVisible();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(log).toContainText('{"name":"Sam R","theme":"dark","locale":"en","timeZone":"Europe/London"}');
});

test('an error that arrives without a submit does not take focus from a field being typed in', async ({ page }) => {
  await open(page, 'late-error');
  const field = page.getByLabel('Current password');
  await field.focus();
  await field.pressSequentially('typing', { delay: 120 });
  await expect(page.getByText('Preferences could not be refreshed.')).toBeVisible();
  await expect(field).toBeFocused();
});

test('a profile without language or time zone submits only name and theme', async ({ page }) => {
  await open(page, 'profile-minimal');
  await expect(page.getByLabel('Time zone')).toHaveCount(0);
  await page.getByLabel('Name').fill('Sam R.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('#log')).toHaveText('{"name":"Sam R.","theme":"system"}');
});

test('SettingsPanel submits once on a double activation and passes the form values', async ({ page }, info) => {
  await open(page, 'panel', 'light', widthOf(info.project.name));
  await expect(page.getByRole('region', { name: 'Webhook' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Webhook' })).toBeVisible();
  await page.getByLabel('Endpoint URL').fill('https://example.test/next');
  await page.getByRole('button', { name: 'Save' }).dblclick();
  await expect(page.locator('#log')).toHaveText('save:https://example.test/next');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('#log')).toHaveText('save:https://example.test/next | cancel');
});

test('SettingsPanel moves focus to a failure that follows a submit', async ({ page }, info) => {
  await open(page, 'panel-error', 'light', widthOf(info.project.name));
  await expect(page.locator('.t98-flow-error')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('The endpoint could not be saved.')).toBeVisible();
  await expect(page.locator('.t98-flow-error')).toBeFocused();
});

test('SettingsPanel posts natively when only action is given', async ({ page }, info) => {
  await open(page, 'panel-native', 'light', widthOf(info.project.name));
  await page.getByLabel('Endpoint URL').fill('https://example.test/native');
  await Promise.all([page.waitForURL(/url=https%3A%2F%2Fexample\.test%2Fnative/), page.getByRole('button', { name: 'Save' }).click()]);
});

test('two-factor enrolment without a QR image shows the key and the setup link, both copyable', async ({ page }, info) => {
  await open(page, '2fa-enrolling-noqr', 'light', widthOf(info.project.name));
  await expect(page.getByRole('img')).toHaveCount(0);
  await expect(page.getByText('Enter the setup key in your authenticator app, or open the setup link on this device.')).toBeVisible();
  await expect(page.getByText('otpauth://totp/Discover:ada%40example.test?secret=JBSWY3DPEHPK3PXP&issuer=Discover')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy key' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('turning off two-factor can require an authenticator or recovery code as well as the password', async ({ page }, info) => {
  await open(page, '2fa-on-code', 'light', widthOf(info.project.name));
  const log = page.locator('#log');
  await page.getByLabel('Current password').fill('synthetic-password');
  await page.getByRole('button', { name: 'Turn off two-factor authentication' }).click();
  await expect(page.getByText('Enter a code from your authenticator app or a recovery code.')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Authenticator or recovery code').fill(' 123456 ');
  await page.getByRole('button', { name: 'Turn off two-factor authentication' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Turn off two-factor authentication' }).click();
  await expect(log).toHaveText('disable:synthetic-password:123456');
});
