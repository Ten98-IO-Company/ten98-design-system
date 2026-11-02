import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`report toolbar preserves caller state and accessible controls in ${theme}`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto(`/tests/report-toolbar.html?theme=${theme}`);
    const toolbar = page.getByRole('group', { name: 'Visitor report controls', exact: true });
    const disclosure = toolbar.locator('summary');
    const country = toolbar.getByLabel('Country', { exact: true });
    const scope = toolbar.getByRole('region', { name: 'Applied report scope', exact: true });
    const action = toolbar.getByRole('button', { name: 'Export result', exact: true });
    const query = toolbar.getByLabel('Search', { exact: true });

    await expect(toolbar).toBeVisible();
    await expect(disclosure).toHaveAccessibleName('More report filters');
    await expect(country).toBeHidden();
    await expect(scope).toBeVisible();
    await expect(action).toBeVisible();
    await expect(toolbar.getByRole('button', { name: 'Apply report', exact: true })).toBeVisible();
    await disclosure.focus();
    await page.keyboard.press('Tab');
    await expect(action).toBeFocused();
    await disclosure.focus();
    await page.keyboard.press('Enter');
    await expect(country).toBeVisible();
    await country.fill('France');
    await query.fill('campaign');
    await expect(page.locator('#apply-count')).toHaveText('0');
    await expect(scope).toContainText('United Arab Emirates');
    await expect(scope).toContainText('All results');

    await disclosure.focus();
    await page.keyboard.press('Space');
    await expect(country).toBeHidden();
    await expect(scope).toBeVisible();
    await expect(action).toBeVisible();
    await page.keyboard.press('Space');
    await expect(country).toHaveValue('France');
    await expect(query).toHaveValue('campaign');
    await action.click();
    await expect(page.locator('#export-count')).toHaveText('1');
    await expect(page.locator('#apply-count')).toHaveText('0');
    await toolbar.getByRole('button', { name: 'Apply report', exact: true }).click();
    await expect(page.locator('#apply-count')).toHaveText('1');
    await expect(scope).toContainText('France');
    await expect(scope).toContainText('campaign');

    await page.setViewportSize({ width: 320, height: 1000 });
    const summary = page.locator('#result-summary');
    await expect(summary).toContainText('scopeIdentifierWithoutWordBreaks');
    for (const slot of [toolbar.getByLabel('From', { exact: true }), toolbar.getByLabel('To', { exact: true }), toolbar.getByLabel('Time zone', { exact: true }), query, disclosure, country, toolbar.getByLabel('Device', { exact: true }), scope, summary, action]) {
      await expect(slot).toBeVisible();
      const bounds = await slot.boundingBox();
      expect(bounds).not.toBeNull();
      if (bounds) {
        expect(bounds.x).toBeGreaterThanOrEqual(-1);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(321);
      }
    }
    const followsSlotOrder = await page.evaluate(() => {
      const ids = ['rt-search', 'rt-country', 'result-summary', 'export-result'];
      const nodes = ids.map(id => document.getElementById(id));
      return nodes.every((node, index) => node !== null && (index === 0 || Boolean(nodes[index - 1]!.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)));
    });
    expect(followsSlotOrder).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath(`report-toolbar-${theme}-320.png`), fullPage: true });
  });
}
