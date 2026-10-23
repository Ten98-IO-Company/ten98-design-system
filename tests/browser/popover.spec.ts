import { expect, test, type Page } from '@playwright/test';

const inside = (page: Page, name: string) => page.getByRole('dialog', { name }).evaluate(node => {
  const box = node.getBoundingClientRect();
  return box.left >= 0 && box.top >= 0 && box.right <= window.innerWidth && box.bottom <= window.innerHeight;
});

for (const dir of ['ltr', 'rtl'] as const) {
  test(`Popover opens in the top layer, moves focus in, closes on Escape and outside click, and stays in the viewport (${dir})`, async ({ page }) => {
    await page.goto(`/tests/popover.html?dir=${dir}`);
    const trigger = page.getByRole('button', { name: 'Add emoji' });
    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Emoji' });
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(panel.getByRole('button', { name: 'Smile' })).toBeFocused();
    expect(await inside(page, 'Emoji')).toBe(true);
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await panel.getByRole('button', { name: 'Heart' }).click();
    await expect(page.locator('#picked')).toHaveText('Heart');
    await page.mouse.click(5, 300);
    await expect(panel).toBeHidden();

    // A controlled popover at the far edge still fits the viewport.
    await page.getByRole('button', { name: 'Filters' }).click();
    await expect(page.locator('#open')).toHaveText('true');
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    expect(await inside(page, 'Filters')).toBe(true);
    await page.getByRole('dialog', { name: 'Filters' }).getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeHidden();
    await expect(page.locator('#open')).toHaveText('false');
  });
}
