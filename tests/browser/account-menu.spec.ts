import { expect, test, type Locator } from '@playwright/test';

async function menuBounds(panel: Locator) {
  return panel.evaluate(element => {
    const box = element.getBoundingClientRect();
    return { left: box.left, right: box.right, scroll: element.scrollWidth, width: element.clientWidth, document: document.documentElement.scrollWidth, viewport: innerWidth };
  });
}
function expectContained(bounds: Awaited<ReturnType<typeof menuBounds>>) {
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewport + 1);
  expect(bounds.scroll).toBeLessThanOrEqual(bounds.width + 1);
  expect(bounds.document).toBeLessThanOrEqual(bounds.viewport + 1);
}

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/tests/account-menu.html?theme=${info.project.name === 'narrow-dark' ? 'dark' : 'light'}`);
});

test('one header account control preserves native links and a quiet settings/version footer', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Account menu', exact: true });
  await expect(trigger).toHaveCount(1);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  const footer = page.getByRole('complementary', { name: 'Sidebar footer' });
  await expect(footer.getByRole('link', { name: 'Settings', exact: true })).toHaveAttribute('href', '/settings');
  await expect(footer).toContainText('0.8.12');
  await expect(footer).not.toContainText('Alex');
  await expect(footer.getByRole('button', { name: /Sign out|Account menu/ })).toHaveCount(0);
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('link', { name: 'Profile and appearance' })).toHaveAttribute('href', '/account');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await page.getByRole('link', { name: 'Profile and appearance' }).click();
  await expect(page.getByRole('heading', { name: 'Profile and appearance', exact: true })).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('status', { name: 'Account action status' })).not.toHaveText('Unexpected form submit');
});

test('keyboard opening, ordinary Tab navigation and Escape restore focus without a trap', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Account menu', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Profile and appearance' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Account security' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Local draft', { exact: true })).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('outside clicks close without consuming the action or losing draft values', async ({ page }) => {
  await page.getByLabel('Local draft', { exact: true }).fill('Keep this work');
  const trigger = page.getByRole('button', { name: 'Account menu', exact: true });
  await trigger.click();
  await page.getByRole('button', { name: 'Outside action', exact: true }).click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: 'Outside action', exact: true })).toBeFocused();
  await expect(page.getByRole('status', { name: 'Account action status' })).toHaveText('Outside action');
  await expect(page.getByLabel('Local draft', { exact: true })).toHaveValue('Keep this work');
});

test('native draft guards retain dialog focus, cancellation and an explicit sign-out action', async ({ page }) => {
  await page.getByLabel('Local draft', { exact: true }).fill('Unsent campaign');
  const trigger = page.getByRole('button', { name: 'Account menu', exact: true });
  await trigger.click();
  await page.getByRole('link', { name: 'Profile and appearance' }).click();
  const dialog = page.getByRole('dialog', { name: 'Unsaved draft' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Keep editing' })).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await dialog.getByRole('button', { name: 'Keep editing' }).click();
  await expect(page.getByLabel('Local draft', { exact: true })).toHaveValue('Unsent campaign');
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await trigger.click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByLabel('Sign out calls', { exact: true })).toHaveText('0');
  await dialog.getByRole('button', { name: 'Discard draft' }).click();
  await expect(page.getByLabel('Sign out calls', { exact: true })).toHaveText('1');
  await expect(page.getByLabel('Local draft', { exact: true })).toHaveValue('');
});

test('app-owned busy and error state keeps sign out single and retryable', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Account menu', exact: true });
  await trigger.click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByLabel('Sign out calls', { exact: true })).toHaveText('1');
  await trigger.click();
  const busy = page.getByRole('button', { name: 'Signing out…', exact: true });
  await expect(busy).toBeDisabled();
  await busy.evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.getByLabel('Sign out calls', { exact: true })).toHaveText('1');
  await page.getByRole('button', { name: 'Finish failed sign out', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Account action status' })).toHaveText('Sign out failed. Try again.');
  await trigger.click();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByLabel('Sign out calls', { exact: true })).toHaveText('2');
});

test('long identity stays readable and contained in both themes with enlarged text', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.getByRole('button', { name: 'Use long identity' }).click();
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    for (const enlarged of [false, true]) {
      await page.evaluate(value => {
        for (const node of document.querySelectorAll<HTMLElement>('[data-scaled-font]')) {
          node.style.removeProperty('font-size'); node.removeAttribute('data-scaled-font');
        }
        if (value) {
          const sizes = Array.from(document.querySelectorAll<HTMLElement>('.t98-account-menu, .t98-account-menu *, .t98-sidebar-footer, .t98-sidebar-footer *'))
            .map(node => ({ node, size: parseFloat(getComputedStyle(node).fontSize) }));
          for (const { node, size } of sizes) {
            node.setAttribute('data-scaled-font', String(size)); node.style.setProperty('font-size', `${size * 2}px`, 'important');
          }
        }
      }, enlarged);
      const trigger = page.getByRole('button', { name: 'Account menu', exact: true });
      if (await trigger.getAttribute('aria-expanded') !== 'true') await trigger.click();
      const panel = page.locator(`[id="${await trigger.getAttribute('aria-controls')}"]`);
      await expect(panel).toBeVisible();
      expectContained(await menuBounds(panel));
      await expect(panel).toContainText('alexandra.morgan-williams@regional-operations.example.test');
      if (enlarged) {
        expect(await panel.locator('strong').evaluate(element => parseFloat(getComputedStyle(element).fontSize) / Number(element.getAttribute('data-scaled-font')))).toBe(2);
      }
      await page.screenshot({ path: info.outputPath(`account-${theme}-${enlarged ? 'enlarged' : 'normal'}.png`), fullPage: true });
      await page.keyboard.press('Escape');
    }
  }
  expect(errors).toEqual([]);
});

test('unmounting an open account control leaves other navigation usable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.getByRole('button', { name: 'Account menu', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Account menu', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Toggle account control' }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.getByRole('button', { name: 'Account menu', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Toggle account control' }).click();
  await expect(page.getByRole('button', { name: 'Account menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
  expect(errors).toEqual([]);
});

test('aria-disabled and busy actions cannot invoke app handlers or native navigation', async ({ page }, info) => {
  await page.goto(`/tests/account-menu.html?unavailable=1&theme=${info.project.name === 'narrow-dark' ? 'dark' : 'light'}`);
  const trigger = page.getByRole('button', { name: 'Account menu', exact: true });
  await trigger.click();
  for (const name of ['Unavailable action', 'Pending action', 'Unavailable link']) {
    // Native aria-disabled does not block clicks by itself. Exercise the real dispatch guard.
    await page.getByText(name, { exact: true }).evaluate(element => (element as HTMLElement).click());
    await expect(page.getByLabel('Sign out calls', { exact: true })).toHaveText('0');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(new URL(page.url()).pathname).toBe('/tests/account-menu.html');
  }
});

test('native form validation keeps its fields visible until a successful submit event', async ({ page }, info) => {
  await page.goto(`/tests/account-menu.html?form=1&theme=${info.project.name === 'narrow-dark' ? 'dark' : 'light'}`);
  const trigger = page.getByRole('button', { name: 'Account menu', exact: true });
  await trigger.click();
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect(page.getByLabel('Account name', { exact: true })).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByLabel('Sign out calls', { exact: true })).toHaveText('0');
  await page.getByLabel('Account name', { exact: true }).fill('Updated name');
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect(page.getByRole('status', { name: 'Account action status' })).toHaveText('Account form submitted');
  await expect(page.getByLabel('Sign out calls', { exact: true })).toHaveText('1');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await expect(page.getByLabel('Account name', { exact: true })).toHaveValue('Updated name');
});

test('the containment check rejects an intentionally overflowing dropdown and passes after restoration', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Account menu', exact: true });
  await trigger.click();
  const panel = page.locator(`[id="${await trigger.getAttribute('aria-controls')}"]`);
  expectContained(await menuBounds(panel));
  await panel.evaluate(element => {
    (element as HTMLElement).style.width = '200vw';
    (element as HTMLElement).style.maxWidth = 'none';
  });
  const broken = await menuBounds(panel);
  expect(() => expectContained(broken)).toThrow();
  await panel.evaluate(element => {
    (element as HTMLElement).style.removeProperty('width');
    (element as HTMLElement).style.removeProperty('max-width');
  });
  expectContained(await menuBounds(panel));
});
