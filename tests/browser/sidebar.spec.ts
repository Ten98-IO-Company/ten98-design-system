import { expect, test } from '@playwright/test';

async function fixture(page: import('@playwright/test').Page) {
  await page.goto('/tests/sidebar.html');
  await expect(page.locator('#trigger')).toBeVisible();
}

test('mobile drawer traps only visible controls, restores focus and cleans up on resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await fixture(page);
  await expect(page.locator('.sidebar')).toHaveAttribute('inert', '');
  await expect(page.locator('.sidebar')).not.toBeVisible();
  await page.locator('#trigger').click();
  await expect(page.locator('#first')).toBeFocused();
  await expect(page.locator('#workspace')).toHaveAttribute('inert', '');
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#last')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#first')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByText('Closed group', { exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#dialog-open')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#trigger')).toBeFocused();
  await expect(page.locator('#workspace')).not.toHaveAttribute('inert');
  await page.locator('#trigger').click();
  await page.locator('#last').click();
  await expect(page.locator('#trigger')).toBeFocused();
  await page.locator('#trigger').click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator('.sidebar')).not.toHaveAttribute('aria-modal');
  await expect(page.locator('.sidebar')).not.toHaveAttribute('inert');
  await expect(page.locator('#workspace')).not.toHaveAttribute('inert');
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('a native discard dialog retains Escape and focus while the drawer stays open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await fixture(page);
  await page.locator('#trigger').click();
  await page.locator('#dialog-open').click();
  await expect(page.locator('#keep')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#discard-confirm')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#discard')).not.toBeVisible();
  await expect(page.locator('.sidebar')).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('#dialog-open')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#trigger')).toBeFocused();
});

test('a nonmodal native dialog does not release drawer keyboard containment', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await fixture(page);
  await page.locator('#trigger').click();
  await page.locator('#discard').evaluate((dialog: HTMLDialogElement) => dialog.show());
  await expect(page.locator('#discard')).toBeVisible();
  await expect(page.locator('#first')).toBeFocused();
  await page.locator('#last').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#first')).toBeFocused();
  await page.locator('#keep').focus();
  await expect(page.locator('#first')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.sidebar')).not.toHaveAttribute('aria-modal');
  await expect(page.locator('#trigger')).toBeFocused();
  await expect(page.locator('#discard')).toBeVisible();
  await page.locator('#discard').evaluate((dialog: HTMLDialogElement) => dialog.close());
});
