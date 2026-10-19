import { test, expect, type Page } from '@playwright/test';

// Measure the rendered native controls; this deliberately does not certify picker popups
// or internal date/time segments, which the browser may scroll independently.
async function geometry(page: Page, selector: string, narrow: boolean) {
  for (const field of await page.locator(selector).locator('.field, .field > span, input, select').all()) await expect(field).toBeVisible();
  const result = await page.locator(selector).evaluate(container => {
    const outer = container.getBoundingClientRect();
    const escaped: string[] = [];
    for (const element of container.querySelectorAll('.field, .field > span, input, select')) {
      const rect = element.getBoundingClientRect();
      if (rect.left < outer.left - 1 || rect.right > outer.right + 1) escaped.push(element.id || element.tagName);
      if (element.matches('.field > span')) {
        const range = document.createRange();
        range.selectNodeContents(element);
        if ([...range.getClientRects()].some(text => text.left < rect.left - 1 || text.right > rect.right + 1)) escaped.push('label text');
      }
    }
    const pairs = [...container.querySelectorAll('.form-grid')].map(grid => {
      const [first, second] = [...grid.children].map(field => field.getBoundingClientRect());
      return { stacked: second.top >= first.bottom - 1 };
    });
    return { escaped, pairs, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  expect(result.escaped, `${selector}: controls and label text stay inside the container`).toEqual([]);
  expect(result.overflow, 'document horizontal overflow').toBeLessThanOrEqual(1);
  if (narrow) expect(result.pairs.every(pair => pair.stacked), 'every narrow pair stacks').toBe(true);
}

async function doubleText(page: Page) {
  const measured = await page.evaluate(() => {
    // Snapshot every computed size first: inherited sizes must not multiply repeatedly.
    const before = [...document.body.querySelectorAll<HTMLElement>('*')]
      .filter(element => !element.matches('script, style'))
      .map(element => ({ element, size: parseFloat(getComputedStyle(element).fontSize) }));
    before.forEach(({ element, size }) => { element.style.fontSize = `${size * 2}px`; });
    return before.filter(({ element }) => element.matches('.field, .field > span, input, select'))
      .map(({ element, size }) => ({ before: size, after: parseFloat(getComputedStyle(element).fontSize) }));
  });
  expect(measured.length).toBeGreaterThan(20);
  measured.forEach(size => expect(size.after).toBeCloseTo(size.before * 2, 3));
}

async function nativeBehavior(page: Page, prefix: string) {
  const from = page.locator(`#${prefix}-from`), through = page.locator(`#${prefix}-through`);
  const start = page.locator(`#${prefix}-start`), end = page.locator(`#${prefix}-end`);
  await expect(from).toHaveAttribute('type', 'date');
  await expect(from).toHaveAttribute('min', '2026-01-01');
  await expect(from).toHaveAttribute('max', '2026-12-31');
  await expect(from).toHaveValue('2026-10-01');
  await expect(from).toBeEditable();
  await expect(through).toHaveValue('2026-10-19');
  await expect(through).toHaveAttribute('type', 'date');
  await expect(through).toHaveAttribute('min', '2026-01-01');
  await expect(through).toHaveAttribute('max', '2026-12-31');
  await expect(through).not.toBeEditable();
  await expect(through).toHaveAttribute('readonly', '');
  await expect(start).toHaveAttribute('type', 'datetime-local');
  await expect(start).toHaveAttribute('min', '2026-01-01T00:00');
  await expect(start).toHaveAttribute('max', '2026-12-31T23:59');
  await expect(start).toHaveValue('2026-10-19T09:30');
  await expect(start).toBeEditable();
  await expect(end).toBeDisabled();
  await expect(end).toHaveAttribute('type', 'datetime-local');
  await expect(end).toHaveAttribute('min', '2026-01-01T00:00');
  await expect(end).toHaveAttribute('max', '2026-12-31T23:59');
  await expect(end).toHaveValue('2026-10-19T10:30');
  await from.fill('2026-10-02');
  await start.fill('2026-10-20T11:45');
  await page.locator(`#${prefix}-title`).fill('Edited native title');
  await page.locator(`#${prefix}-form select`).selectOption('local');
  const values = await page.locator(`#${prefix}-form`).evaluate(form => Object.fromEntries(new FormData(form as HTMLFormElement)));
  expect(values).toEqual({ from: '2026-10-02', through: '2026-10-19', start: '2026-10-20T11:45', title: 'Edited native title', destination: 'local' });
  // Native constraints remain active after editing; FormData excludes the disabled end.
  await from.fill('2027-01-01');
  expect(await from.evaluate(input => (input as HTMLInputElement).validity.rangeOverflow)).toBe(true);
  await from.fill('2026-10-02');
}

for (const theme of ['light', 'dark']) {
  for (const enlarged of [false, true]) {
    test(`native form pairs fit ${theme} at ${enlarged ? '2x computed text' : 'normal text'}`, async ({ page }) => {
      await page.goto(`/tests/form-grid.html?theme=${theme}`);
      await expect(page.locator('#settings-from')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
      const narrow = page.viewportSize()!.width === 320;
      if (enlarged) await doubleText(page);
      await geometry(page, '.settings-panel', narrow);
      if (!narrow && !enlarged) {
        const tops = await page.locator('#settings-form [data-pair="dates"] > .field').evaluateAll(fields => fields.map(field => field.getBoundingClientRect().top));
        expect(Math.abs(tops[0] - tops[1])).toBeLessThanOrEqual(20);
      }
      await nativeBehavior(page, 'settings');
      await page.getByRole('button', { name: 'Open scheduling dialog' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await geometry(page, '#schedule-dialog', narrow);
      await nativeBehavior(page, 'modal');
    });
  }
}

test('old two-column intrinsic sizing reproduces native overflow at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto('/tests/form-grid.html?theme=light');
  await expect(page.locator('#settings-from')).toBeVisible();
  await page.addStyleTag({ content: '.form-grid{grid-template-columns:1fr 1fr!important}.field,.field input,.field select,.field textarea{min-width:auto!important}' });
  const original = await page.evaluate(() => {
    const grid = document.querySelector('#settings-form [data-pair="dates"]')!.getBoundingClientRect();
    const date = document.querySelector('#settings-through')!.getBoundingClientRect();
    return { documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, dateEscapesGrid: date.right - grid.right };
  });
  expect(original.documentOverflow, 'restoring the original rules must reproduce rendered document overflow').toBeGreaterThan(1);
  expect(original.dateEscapesGrid, 'the original native Through field escapes the date grid content area').toBeGreaterThan(1);
});
