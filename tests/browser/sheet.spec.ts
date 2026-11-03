import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';

const panelOf = (page: Page) => page.getByRole('dialog', { name: 'Edit campaign', exact: true });
async function openEditor(page: Page, query = '') {
  await page.goto(`/tests/sheet.html${query ? `?${query}` : ''}`);
  await page.getByRole('button', { name: 'Open editor', exact: true }).click();
  const panel = panelOf(page);
  await expect(panel).toBeVisible();
  return panel;
}
async function forceNativeClose(panel: Locator) {
  await panel.evaluate(element => (element as HTMLDialogElement).close());
}
async function backdrop(page: Page, panel: Locator) {
  const box = await panel.boundingBox();
  await page.mouse.click(box!.x > 4 ? box!.x / 2 : box!.x + box!.width + 4, Math.min(100, box!.y + box!.height / 2));
}

test('sheet modal traps keyboard focus, scrolls its body and restores an explicit focus target', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const panel = await openEditor(page, 'restore=1&long=1');
  await expect(panel).toHaveAccessibleDescription('Update the saved campaign draft.');
  await expect.poll(() => panel.evaluate(element => element.matches(':modal'))).toBe(true);
  await page.getByLabel('Background campaign', { exact: true }).focus();
  expect(await panel.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await panel.getByLabel('Campaign name', { exact: true }).focus();
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let index = 0; index < 10; index++) {
      await page.keyboard.press(key);
      const focus = await panel.evaluate(element => ({ contained: element.contains(document.activeElement), active: document.activeElement?.tagName, pageFocused: document.hasFocus() }));
      // Native dialogs allow Tab into browser chrome while keeping page content inert.
      expect(focus.contained || (focus.active === 'BODY' && !focus.pageFocused), `focus after ${key} ${index}: ${JSON.stringify(focus)}`).toBe(true);
    }
  }
  const body = panel.locator('.t98-dialog-body');
  const header = panel.locator('.t98-dialog-header');
  const footer = panel.locator('.t98-dialog-footer');
  const before = { header: await header.boundingBox(), footer: await footer.boundingBox() };
  await body.evaluate(element => { element.scrollTop = element.scrollHeight; });
  expect(await body.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect((await header.boundingBox())!.y).toBeCloseTo(before.header!.y, 0);
  expect((await footer.boundingBox())!.y).toBeCloseTo(before.footer!.y, 0);
  await panel.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await expect(panel).not.toBeVisible();
  await expect(page.getByLabel('Return focus target', { exact: true })).toBeFocused();
  await expect(page.locator('#sheet-closes')).toHaveText('Close calls: 1');
});

test('sheet modeless mode keeps the background editable and changes modality without a false close', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 850 });
  const panel = await openEditor(page, 'modal=false');
  expect(await panel.evaluate(element => element.matches(':modal'))).toBe(false);
  await page.getByLabel('Background campaign', { exact: true }).fill('Edited outside the sheet');
  await expect(page.locator('#sheet-background')).toHaveText('Background: Edited outside the sheet');
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'Switch modality', exact: true }).click();
  await expect.poll(() => panel.evaluate(element => element.matches(':modal'))).toBe(true);
  await expect(page.locator('#sheet-closes')).toHaveText('Close calls: 0');
  await panel.getByRole('button', { name: 'Switch modality', exact: true }).click();
  await expect.poll(() => panel.evaluate(element => element.matches(':modal'))).toBe(false);
  await expect(page.locator('#sheet-closes')).toHaveText('Close calls: 0');
  await panel.getByLabel('Campaign name', { exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(panel).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Open editor', exact: true })).toBeFocused();
});

test('sheet dirty close paths ask before discarding and a late busy state disables an already open discard action', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 850 });
  const panel = await openEditor(page, 'mode=dirty');
  await panel.getByLabel('Campaign name', { exact: true }).fill('Unsaved campaign');
  const prompt = panel.getByRole('alertdialog', { name: 'Discard unsaved changes?', exact: true });
  for (const attempt of ['button', 'escape', 'backdrop', 'native']) {
    if (attempt === 'button') await panel.getByRole('button', { name: 'Close dialog', exact: true }).click();
    else if (attempt === 'escape') { await panel.getByLabel('Campaign name', { exact: true }).focus(); await page.keyboard.press('Escape'); }
    else if (attempt === 'backdrop') await backdrop(page, panel);
    else await forceNativeClose(panel);
    await expect(prompt).toBeVisible();
    await expect(prompt.getByRole('button', { name: 'Keep editing', exact: true })).toBeFocused();
    await prompt.getByRole('button', { name: 'Keep editing', exact: true }).click();
    await expect(prompt).not.toBeVisible();
    await expect(panel.getByLabel('Campaign name', { exact: true })).toHaveValue('Unsaved campaign');
    expect(await panel.evaluate(element => element.contains(document.activeElement))).toBe(true);
    await expect(page.locator('#sheet-closes')).toHaveText('Close calls: 0');
  }
  await panel.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await panel.getByRole('button', { name: 'Start busy', exact: true }).click();
  await expect(prompt.getByRole('button', { name: 'Discard changes', exact: true })).toBeDisabled();
  await forceNativeClose(panel);
  await expect(panel).toBeVisible();
  await expect(page.locator('#sheet-closes')).toHaveText('Close calls: 0');
  await panel.getByRole('button', { name: 'Finish simulated save', exact: true }).click();
  await expect(prompt.getByRole('button', { name: 'Discard changes', exact: true })).toBeEnabled();
  await prompt.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(panel).not.toBeVisible();
});

test('sheet busy submits preserve exact FormData, reject duplicate submits and forced closes, and retain errors and drafts', async ({ page }) => {
  const panel = await openEditor(page, 'mode=submit');
  await panel.getByLabel('Campaign name', { exact: true }).fill('Saved draft');
  await panel.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.locator('#sheet-saves')).toHaveText('Save calls: 1');
  expect(JSON.parse(await page.locator('#sheet-submitted').innerText())).toEqual([['campaign', 'Saved draft'], ['revision', 'revision-7'], ['intent', 'save']]);
  await expect(panel.getByLabel('Campaign name', { exact: true })).toBeDisabled();
  await expect(panel.getByRole('button', { name: 'Save campaign', exact: true })).toBeDisabled();
  await panel.locator('form').evaluate(form => (form as HTMLFormElement).requestSubmit(form.querySelector<HTMLButtonElement>('button[type="submit"]')!));
  await expect(page.locator('#sheet-saves')).toHaveText('Save calls: 1');
  await forceNativeClose(panel);
  await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeVisible();
  await expect(page.locator('#sheet-closes')).toHaveText('Close calls: 0');
  await panel.getByRole('button', { name: 'Finish simulated save', exact: true }).click();
  await expect(panel).toContainText('Simulated save failed; draft retained.');
  await expect(panel.getByLabel('Campaign name', { exact: true })).toBeEnabled();
  await expect(panel.getByLabel('Campaign name', { exact: true })).toHaveValue('Saved draft');
  await expect(panel).toBeVisible();
});

test('sheet unconfirmed saves lock editors and all close paths while keeping recovery available', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 850 });
  const panel = await openEditor(page);
  await panel.getByLabel('Campaign name', { exact: true }).fill('Unconfirmed draft');
  await panel.getByRole('button', { name: 'Simulate unknown save', exact: true }).click();
  await expect(panel).toContainText('The last save has not been confirmed.');
  await expect(panel.getByRole('button', { name: 'Close dialog', exact: true })).toBeDisabled();
  await expect(panel.getByLabel('Campaign name', { exact: true })).toBeDisabled();
  const recovery = panel.getByRole('button', { name: 'Check save status', exact: true });
  await expect(recovery).toBeEnabled();
  await recovery.focus();
  await page.keyboard.press('Escape');
  await backdrop(page, panel);
  await forceNativeClose(panel);
  await expect(panel).toBeVisible();
  await expect(page.locator('#sheet-closes')).toHaveText('Close calls: 0');
  await recovery.click();
  await expect(panel.getByLabel('Campaign name', { exact: true })).toBeEnabled();
  await expect(panel.getByLabel('Campaign name', { exact: true })).toHaveValue('Unconfirmed draft');
  await expect(panel).toContainText('Save outcome is unknown.');
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await expect(panel).not.toBeVisible();
});

test('sheet shared Dialog mechanism also intercepts native forced close while closeDisabled is true', async ({ page }) => {
  const panel = await openEditor(page, 'mode=legacy');
  await expect(panel.getByRole('button', { name: 'Close dialog', exact: true })).toBeDisabled();
  await forceNativeClose(panel);
  await expect(panel).toBeVisible();
  await expect(page.locator('#sheet-closes')).toHaveText('Close calls: 0');
  await panel.getByRole('button', { name: 'Finish simulated save', exact: true }).click();
  await forceNativeClose(panel);
  await expect(panel).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Open editor', exact: true })).toBeFocused();
});

test('sheet desktop widths sit at inline end and closed sheets remain native closed', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 850 });
  for (const [width, expected] of [['sm', 400], ['md', 560], ['lg', 720]] as const) {
    for (const dir of ['ltr', 'rtl']) {
      await page.goto(`/tests/sheet.html?width=${width}&dir=${dir}`);
      await expect(page.locator('dialog')).not.toBeVisible();
      expect(await page.locator('dialog').evaluate(element => (element as HTMLDialogElement).open)).toBe(false);
      await page.getByRole('button', { name: 'Open editor', exact: true }).click();
      const panel = panelOf(page);
      const box = await panel.boundingBox();
      expect(box!.width).toBeCloseTo(expected, 0);
      if (dir === 'ltr') expect(box!.x + box!.width).toBeCloseTo(1280, 0); else expect(box!.x).toBeCloseTo(0, 0);
      await panel.getByRole('button', { name: 'Close dialog', exact: true }).click();
      expect(await page.locator('dialog').evaluate(element => (element as HTMLDialogElement).open)).toBe(false);
    }
  }
});

test('sheet narrow layouts preserve 44px actions and stable scrolling chrome in RTL themes and 200 percent zoom', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mkdir(resolve('.qa/sheet'), { recursive: true });
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const dir of ['ltr', 'rtl']) {
      for (const theme of ['light', 'dark']) {
        const panel = await openEditor(page, `dir=${dir}&theme=${theme}&long=1`);
        for (const zoom of width === 320 ? [1, 2] : [1]) {
          await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
          const box = await panel.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(-0.5);
          expect(box!.x + box!.width).toBeLessThanOrEqual(width + 0.5);
          expect(box!.y).toBeGreaterThanOrEqual(-0.5);
          expect(box!.y + box!.height).toBeLessThanOrEqual(1000.5);
          if (width === 320) expect(box!.width).toBeCloseTo(320, 0);
          for (const button of await panel.getByRole('button').all()) {
            const target = await button.boundingBox();
            expect(target!.height).toBeGreaterThanOrEqual(44 * zoom - 0.5);
            expect(target!.width).toBeGreaterThanOrEqual(44 * zoom - 0.5);
          }
          const header = panel.locator('.t98-dialog-header');
          const footer = panel.locator('.t98-dialog-footer');
          const before = { header: await header.boundingBox(), footer: await footer.boundingBox() };
          await panel.locator('.t98-dialog-body').evaluate(element => { element.scrollTop = element.scrollHeight; });
          expect((await header.boundingBox())!.y).toBeCloseTo(before.header!.y, 0);
          expect((await footer.boundingBox())!.y).toBeCloseTo(before.footer!.y, 0);
          expect(await panel.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
          expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
          const name = `${info.project.name}-${width}-${dir}-${theme}-zoom${zoom}`;
          await page.screenshot({ path: resolve('.qa/sheet', `${name}-viewport.png`) });
          await panel.screenshot({ path: resolve('.qa/sheet', `${name}-sheet.png`) });
        }
      }
    }
  }
});
