import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const evidence = resolve('.qa/controls');

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

for (const theme of ['light', 'dark'] as const) {
  test(`controls compose, reflow and stay keyboard operable in ${theme}`, async ({ page }, info) => {
    const width = info.project.name === 'narrow-dark' ? 320 : 1440;
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto(`/tests/controls.html?theme=${theme}`);
    const screen = page.locator('#controls');
    await expect(screen.getByRole('heading', { level: 1, name: 'Controls' })).toBeVisible();
    expect(await overflow(page), 'no page overflow').toBeLessThanOrEqual(1);

    // Disclosure: keyboard toggle, with actions outside the summary.
    const summary = screen.locator('summary', { hasText: 'Advanced settings' });
    await expect(summary.getByRole('button')).toHaveCount(0);
    await summary.focus();
    await expect(screen.getByText('Retry limits and delivery windows.')).toBeHidden();
    await page.keyboard.press('Enter');
    await expect(screen.getByText('Retry limits and delivery windows.')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(screen.getByText('Retry limits and delivery windows.')).toBeHidden();

    // RadioGroup: arrow keys select.
    const email = screen.getByRole('radio', { name: /^Email/ });
    await email.focus();
    await page.keyboard.press('ArrowDown');
    await expect(screen.getByRole('radio', { name: /^Social network/ })).toBeChecked();

    // SegmentedControl: roving focus and selection.
    const group = screen.getByRole('group', { name: 'Range' });
    const week = group.getByRole('button', { name: 'Week' });
    await expect(week).toHaveAttribute('aria-pressed', 'true');
    await week.focus();
    await page.keyboard.press('ArrowRight');
    await expect(group.getByRole('button', { name: 'Month' })).toBeFocused();
    await expect(group.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(group.getByRole('button', { name: 'Day' })).toBeFocused();
    await expect(group.getByRole('button', { name: 'Week' })).toHaveAttribute('tabindex', '-1');

    // Pager: disabled at both ends.
    const pager = screen.getByRole('navigation', { name: 'Results pages' });
    await expect(pager.getByRole('button', { name: 'Previous' })).toBeEnabled();
    await pager.getByRole('button', { name: 'Previous' }).click();
    await expect(pager.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await expect(pager.getByRole('status')).toHaveText('1–20 of 60');
    await pager.getByRole('button', { name: 'Next' }).click();
    await pager.getByRole('button', { name: 'Next' }).click();
    await expect(pager.getByRole('button', { name: 'Next' })).toBeDisabled();

    // Scroll regions are focusable and scroll by keyboard.
    await page.keyboard.press('Shift'); // the last interaction was a click; keyboard use makes focus visible
    const codeRegion = screen.getByRole('region', { name: 'ts code' });
    await codeRegion.focus();
    await expect(codeRegion).toBeFocused();
    expect(await codeRegion.evaluate(node => getComputedStyle(node).outlineStyle)).toBe('solid');
    await page.keyboard.press('PageDown');
    await expect.poll(() => codeRegion.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    const list = screen.getByRole('region', { name: 'Destinations options' });
    await list.focus();
    await page.keyboard.press('PageDown');
    await expect.poll(() => list.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    const scroller = screen.getByRole('region', { name: 'Monthly spend' });
    await scroller.evaluate(node => { (node.firstElementChild as HTMLElement).style.minInlineSize = '3000px'; });
    await scroller.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => scroller.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
    expect(await overflow(page), 'a wide Scroller does not widen the page').toBeLessThanOrEqual(1);
    await scroller.evaluate(node => { (node.firstElementChild as HTMLElement).style.minInlineSize = ''; });

    // Combobox keeps its datalist wiring; status line is busy.
    const city = screen.getByLabel('City');
    expect(await city.evaluate(node => (node as HTMLInputElement).list?.options.length)).toBe(3);
    await expect(screen.getByRole('status').filter({ hasText: 'Loading campaigns' })).toHaveAttribute('aria-busy', 'true');

    // DateTimeField: native type, value callback and the visible time zone in the description.
    const publish = screen.getByLabel('Publish at');
    await expect(publish).toHaveAttribute('type', 'datetime-local');
    await publish.fill('2026-10-21T10:15');
    await expect(screen.getByText('Value: 2026-10-21T10:15')).toBeVisible();
    const described = await publish.evaluate(node => node.getAttribute('aria-describedby')!.split(' ').map(id => document.getElementById(id)?.textContent));
    expect(described).toEqual(['Asia/Dubai (GST)', 'Posts go out at this time.']);

    // FileField: the button opens the native chooser; dropped files are added and announced; remove works.
    const attachments = screen.getByRole('group', { name: 'Attachments' });
    const fileList = screen.getByRole('list', { name: 'Selected files' });
    await expect(fileList.getByRole('listitem')).toHaveCount(1);
    const chooser = page.waitForEvent('filechooser');
    await attachments.getByRole('button', { name: 'Choose files' }).click();
    expect((await chooser).isMultiple()).toBe(true);
    await (await chooser).setFiles([{ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') }, { name: 'data.csv', mimeType: 'text/csv', buffer: Buffer.alloc(2048) }]);
    await expect(fileList.getByRole('listitem')).toHaveCount(3);
    await expect(fileList).toContainText('5 B');
    await expect(fileList).toContainText('2 KB');
    await expect(attachments.getByRole('status')).toHaveText('2 files added');

    await attachments.evaluate(zone => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(['x'], 'dropped.png', { type: 'image/png' }));
      zone.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: transfer }));
      zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
    });
    await expect(fileList.getByRole('listitem')).toHaveCount(4);
    await expect(fileList).toContainText('dropped.png');
    await expect(attachments.getByRole('status')).toHaveText('1 file added');
    expect(await overflow(page), 'a long file name does not overflow').toBeLessThanOrEqual(1);

    await fileList.getByRole('button', { name: 'Remove notes.txt' }).click();
    await expect(fileList.getByRole('listitem')).toHaveCount(3);
    await expect(fileList).not.toContainText('notes.txt');

    // Interactive targets are at least 44px tall.
    for (const target of [summary, group.getByRole('button', { name: 'Day' }), pager.getByRole('button', { name: 'Next' }), screen.getByRole('button', { name: 'Copy code' }), attachments.getByRole('button', { name: 'Choose files' }), fileList.getByRole('button', { name: 'Remove data.csv' })]) {
      expect.soft((await target.boundingBox())!.height, 'target height').toBeGreaterThanOrEqual(43.5);
    }
    for (const label of await screen.locator('label.t98-choice').all()) expect.soft((await label.boundingBox())!.height, 'choice row height').toBeGreaterThanOrEqual(43.5);

    await mkdir(evidence, { recursive: true });
    await screen.screenshot({ path: resolve(evidence, `controls-${theme}-${width}.png`), animations: 'disabled' });

    // Everything still fits at doubled text.
    const restore = await doubleText(page);
    try {
      expect.soft(await overflow(page), 'no page overflow at 200% text').toBeLessThanOrEqual(1);
      await screen.screenshot({ path: resolve(evidence, `controls-${theme}-${width}-2x.png`), animations: 'disabled' });
    } finally { await restore(); }
    expect(errors).toEqual([]);
  });
}
