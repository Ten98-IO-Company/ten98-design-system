import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

type Theme = 'light' | 'dark';
const evidence = resolve('.qa/layout-2026-10-20/after');

async function setScene(page: Page, info: TestInfo, theme: Theme) {
  // Exercise the supported layout widths in both themes, independent of the host theme.
  const width = info.project.name === 'narrow-dark' ? 360 : 1440;
  await page.setViewportSize({ width, height: 1000 });
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  return width;
}

async function open(page: Page, theme: Theme, route: string) {
  await page.goto(`/?theme=${theme}#${route}`);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  const preview = page.locator('.reference-preview');
  await expect(preview).toBeVisible();
  return preview;
}

async function capture(locator: Locator, name: string, theme: Theme, width: number) {
  await mkdir(evidence, { recursive: true });
  await locator.screenshot({ path: resolve(evidence, `${name}-${theme}-${width}.png`), animations: 'disabled' });
}

async function fits(page: Page, container: Locator, context: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${context}: no page overflow`).toBeLessThanOrEqual(1);
  expect(await container.evaluate(element => element.scrollWidth - element.clientWidth), `${context}: no component overflow`).toBeLessThanOrEqual(1);
}

async function doubleText(container: Locator) {
  const snapshot = await container.evaluateHandle(root => {
    const entries = [root, ...root.querySelectorAll('*')].filter((element): element is HTMLElement => element instanceof HTMLElement).map(element => {
      const computed = getComputedStyle(element);
      return { element, css: element.style.cssText, font: parseFloat(computed.fontSize), line: parseFloat(computed.lineHeight) };
    });
    // Snapshot all inherited sizes before mutating any parent.
    for (const { element, font, line } of entries) {
      element.style.setProperty('font-size', `${font * 2}px`, 'important');
      if (Number.isFinite(line)) element.style.setProperty('line-height', `${line * 2}px`, 'important');
    }
    return entries;
  });
  return async () => {
    await snapshot.evaluate(entries => { for (const { element, css } of entries) element.style.cssText = css; });
    await snapshot.dispose();
  };
}

async function inventorySpacing(card: Locator) {
  return card.evaluate(element => {
    const content = element.querySelector('.t98-card-content')!;
    const fields = [...content.querySelectorAll('.t98-field')].map(field => field.getBoundingClientRect());
    const action = content.querySelector('button')!.getBoundingClientRect();
    const bounds = content.getBoundingClientRect();
    const computed = getComputedStyle(content);
    const usableWidth = bounds.width - parseFloat(computed.paddingLeft) - parseFloat(computed.paddingRight);
    const pairs = fields.slice(1).map((field, index) => {
      const before = fields[index];
      const vertical = field.top - before.bottom;
      const horizontal = Math.max(field.left - before.right, before.left - field.right);
      return Math.max(vertical, horizontal);
    });
    return { fieldGaps: pairs, actionGap: action.top - Math.max(...fields.map(field => field.bottom)), actionWidth: action.width, usableWidth };
  });
}

function expectInventorySpacing(measured: Awaited<ReturnType<typeof inventorySpacing>>) {
  expect(measured.fieldGaps.length, 'the inventory exposes both date fields').toBe(1);
  for (const gap of measured.fieldGaps) expect(gap, 'date fields remain separate').toBeGreaterThanOrEqual(12 - .5);
  expect(measured.actionGap, 'the proposal action follows the date fields with breathing room').toBeGreaterThanOrEqual(12 - .5);
}

async function recoverySpacing(page: Page, theme: Theme, width: number) {
  await page.goto(`/?theme=${theme}#components/alert?tab=states`);
  const state = page.locator('.reference-state').filter({ has: page.getByRole('heading', { name: 'Recovery action', exact: true }) });
  const alert = state.locator('.t98-alert');
  await expect(alert).toBeVisible();
  const actions = alert.locator('.t98-alert-actions');
  const buttons = actions.getByRole('button');
  await expect(buttons).toHaveCount(2);
  const placement = await alert.evaluate(element => {
    const message = element.querySelector('.t98-alert-description')!.getBoundingClientRect();
    const action = element.querySelector('.t98-alert-actions')!.getBoundingClientRect();
    return { gap: action.top - message.bottom, left: action.left - message.left };
  });
  expect(placement.gap, 'recovery actions sit below the complete message').toBeGreaterThanOrEqual(12 - .5);
  expect(Math.abs(placement.left), 'message and action row share one content edge').toBeLessThanOrEqual(1);
  await fits(page, alert, 'recovery alert');
  await capture(alert, 'alert-recovery-actions', theme, width);

  // Give the existing two actions room for only the wider button. A genuine wrapping
  // row must move the second button down; inspecting flex-wrap alone cannot prove it.
  const original = await actions.getAttribute('style');
  const widest = Math.max(...await buttons.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width)));
  try {
    await actions.evaluate((element, max) => { (element as HTMLElement).style.maxWidth = `${max + 1}px`; }, widest);
    const bounds = await buttons.evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    }));
    expect(bounds[1].top - bounds[0].bottom, 'the second recovery action wraps with the shared action gap').toBeGreaterThanOrEqual(12 - .5);
    await fits(page, alert, 'wrapped recovery actions');
  } finally {
    await actions.evaluate((element, style) => {
      if (style === null) element.removeAttribute('style');
      else element.setAttribute('style', style);
    }, original);
  }
  await expect(buttons.first()).toBeVisible();
}

for (const theme of ['light', 'dark'] as const) {
  test(`OOH controls and recovery actions have measured spacing in ${theme}`, async ({ page }, info) => {
    const width = await setScene(page, info, theme);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const preview = await open(page, theme, 'flows/campaign-ooh-booking');
    const start = preview.getByLabel('Full-day start · Asia/Dubai', { exact: true });
    const card = preview.locator('.t98-card').filter({ has: page.getByLabel('Full-day start · Asia/Dubai', { exact: true }) });
    await expect(card).toHaveCount(1);
    await expect(start).toBeVisible();
    expectInventorySpacing(await inventorySpacing(card));
    if (width === 1440) {
      const measured = await inventorySpacing(card);
      expect(measured.actionWidth, 'the proposal action keeps its content width on a wide card').toBeLessThan(measured.usableWidth - 12);
    }
    await fits(page, preview, 'OOH feature');
    await capture(preview, 'flow-ooh-inventory', theme, width);

    // Restore the specific old card defect. The same rendered geometry oracle must
    // reject it, then pass again after restoring the exact original inline styles.
    const content = card.locator('.t98-card-content');
    const original = await content.getAttribute('style');
    try {
      await content.evaluate(element => (element as HTMLElement).style.setProperty('gap', '0px', 'important'));
      let rejected = false;
      try { expectInventorySpacing(await inventorySpacing(card)); } catch { rejected = true; }
      expect(rejected, 'restoring the old zero-gap card must fail the positive spacing oracle').toBe(true);
    } finally {
      await content.evaluate((element, style) => {
        if (style === null) element.removeAttribute('style');
        else element.setAttribute('style', style);
      }, original);
    }
    expectInventorySpacing(await inventorySpacing(card));

    const label = card.locator('.t98-label').first();
    const originalFont = await label.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
    const restore = await doubleText(preview);
    try {
      expect(await label.evaluate(element => parseFloat(getComputedStyle(element).fontSize)), 'the test actually doubles rendered text').toBeCloseTo(originalFont * 2);
      expectInventorySpacing(await inventorySpacing(card));
      await fits(page, preview, 'OOH feature at doubled text');
    } finally { await restore(); }
    await recoverySpacing(page, theme, width);
    expect(errors).toEqual([]);
  });

  test(`all 28 flows are feature sections rather than page layouts in ${theme}`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await setScene(page, info, theme);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`/?theme=${theme}#flows`);
    const links = page.locator('.reference-component-card');
    await expect(links).toHaveCount(28);
    const routes = await links.evaluateAll(nodes => nodes.map(node => ({ href: node.getAttribute('href')!, name: node.querySelector('h2')!.textContent! })));
    expect(new Set(routes.map(route => route.href)).size).toBe(28);
    for (const route of routes) await test.step(route.name, async () => {
      await page.goto(`/?theme=${theme}${route.href}`);
      const preview = page.locator('.reference-preview');
      await expect(preview).toBeVisible();
      await expect(preview.locator('.t98-template')).toHaveCount(0);
      await expect(preview.getByRole('heading', { level: 1 })).toHaveCount(0);
      const sections = preview.locator('.t98-flow-section');
      expect(await sections.count(), 'a flow exposes at least one feature section').toBeGreaterThan(0);
      for (const section of await sections.all()) {
        const heading = section.locator(':scope > .t98-flow-header h2');
        await expect(heading).toHaveCount(1);
        await expect(heading).toHaveText(/\S/u);
        await expect(section).toHaveAccessibleName(await section.getAttribute('aria-label') || await heading.innerText());
        const gap = await section.evaluate(element => {
          const header = element.querySelector(':scope > .t98-flow-header')!.getBoundingClientRect();
          const body = element.querySelector(':scope > .t98-flow-body')!.getBoundingClientRect();
          return body.top - header.bottom;
        });
        expect(gap, 'feature content stays separate from its heading/context').toBeGreaterThanOrEqual(12 - .5);
      }
      await fits(page, preview, route.name);
    });
    expect(errors).toEqual([]);
  });

  test(`all five templates compose multiple feature sections under one page title in ${theme}`, async ({ page }, info) => {
    test.setTimeout(120_000);
    const width = await setScene(page, info, theme);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const preview = await open(page, theme, 'templates');
    const picker = page.getByLabel('Page template', { exact: true });
    await expect(picker.locator('option')).toHaveCount(5);
    const kinds = await picker.locator('option').evaluateAll(nodes => nodes.map(node => (node as HTMLOptionElement).value));
    expect(new Set(kinds).size).toBe(5);
    for (const kind of kinds) await test.step(kind, async () => {
      await picker.selectOption(kind);
      await expect(page.getByRole('heading', { name: kind, exact: true })).toBeVisible();
      await expect(preview.locator('.t98-template')).toHaveCount(1);
      await expect(preview.locator('.t98-template .t98-template')).toHaveCount(0);
      const title = preview.getByRole('heading', { level: 1 });
      await expect(title).toHaveCount(1);
      await expect(title).toHaveText(/\S/u);
      const sections = preview.locator('.t98-flow-section');
      expect(await sections.count(), 'a full template combines multiple feature sections').toBeGreaterThanOrEqual(2);
      for (const section of await sections.all()) {
        await expect(section.locator(':scope > .t98-flow-header h2')).toHaveCount(1);
        await expect(section.getByRole('heading', { level: 1 })).toHaveCount(0);
      }
      if (kind === 'CollectionTemplate') {
        const status = preview.getByLabel('Campaign status', { exact: true });
        expect((await status.boundingBox())!.width, 'a short status filter keeps the shared compact width').toBeLessThanOrEqual(320);
      }
      if (kind === 'CollectionTemplate' || kind === 'OverviewTemplate') {
        const status = preview.locator('.t98-badge').filter({ hasText: /^Scheduled$/ });
        await expect(status).toHaveCount(1);
        const lines = await status.evaluate(element => {
          const style = getComputedStyle(element);
          return (element.getBoundingClientRect().height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)) / parseFloat(style.lineHeight);
        });
        expect(lines, 'the short Scheduled status remains one readable word').toBeLessThanOrEqual(1.05);
      }
      await fits(page, preview, kind);
      await capture(preview, `template-${kind.replace('Template', '').toLowerCase()}`, theme, width);
      const originalFont = await title.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
      const restore = await doubleText(preview);
      try {
        expect(await title.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeCloseTo(originalFont * 2);
        await fits(page, preview, `${kind} at doubled text`);
      } finally { await restore(); }
    });
    expect(errors).toEqual([]);
  });
}

test('the full editor saves an incomplete local draft through its one native form', async ({ page }, info) => {
  const theme = info.project.name === 'narrow-dark' ? 'dark' : 'light';
  await setScene(page, info, theme);
  const preview = await open(page, theme, 'templates');
  await page.getByLabel('Page template', { exact: true }).selectOption('EditorTemplate');
  const name = preview.getByLabel('Campaign name', { exact: true });
  const save = preview.getByRole('button', { name: 'Save draft', exact: true });
  await expect(preview.locator('form')).toHaveCount(1);
  await expect(save).toHaveAttribute('form', await preview.locator('form').getAttribute('id') as string);
  await name.fill('');
  await save.click();
  expect(await name.evaluate(element => (element as HTMLInputElement).validity.valueMissing)).toBe(true);
  await expect(preview.getByText('Draft saved in the local example. No request was sent.', { exact: true })).toHaveCount(0);
  await name.fill('Incomplete draft');
  await preview.getByLabel('Caption', { exact: true }).fill('');
  await preview.getByRole('checkbox', { name: 'Studio Dubai — Instagram', exact: true }).uncheck();
  await expect(save).toBeEnabled();
  await save.click();
  await expect(preview.getByText('Draft saved in the local example. No request was sent.', { exact: true })).toBeVisible();
  await expect(name).toHaveValue('Incomplete draft');
  await expect(preview.getByLabel('Caption', { exact: true })).toHaveValue('');
  await expect(preview.getByRole('checkbox', { name: 'Studio Dubai — Instagram', exact: true })).not.toBeChecked();
});

test('isolated component previews resize and settle after content grows and shrinks', async ({ page }, info) => {
  await setScene(page, info, info.project.name === 'narrow-dark' ? 'dark' : 'light');
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`/${info.project.name === 'narrow-dark' ? '?theme=dark' : ''}#components/app-field?tab=states`);
  const frame = page.locator('.reference-state iframe').first();
  await expect(page.frameLocator('.reference-state iframe').first().locator('.specimen')).toBeVisible();
  await expect.poll(() => frame.evaluate(element => {
    const doc = (element as HTMLIFrameElement).contentDocument!;
    // The assigned iframe height is border-box; clientHeight excludes its two border pixels.
    return Math.abs(element.getBoundingClientRect().height - Math.max(100, doc.body.scrollHeight + 4));
  })).toBeLessThanOrEqual(1);
  const before = (await frame.boundingBox())!.height;
  await frame.evaluate(element => {
    const doc = (element as HTMLIFrameElement).contentDocument!;
    const target = doc.defaultView as Window & { previewErrors: string[] };
    target.previewErrors = [];
    target.addEventListener('error', event => target.previewErrors.push(event.message));
    const content = doc.createElement('div');
    content.id = 'qa-dynamic-preview-content';
    content.style.height = '360px';
    content.textContent = 'Additional preview content';
    doc.querySelector('.specimen')!.append(content);
  });
  await expect.poll(async () => (await frame.boundingBox())!.height).toBeGreaterThan(before + 300);
  await frame.evaluate(element => (element as HTMLIFrameElement).contentDocument!.getElementById('qa-dynamic-preview-content')!.remove());
  await expect.poll(async () => Math.abs((await frame.boundingBox())!.height - before)).toBeLessThanOrEqual(1);
  await frame.evaluate(element => new Promise<void>(resolve => {
    const target = (element as HTMLIFrameElement).contentWindow!;
    target.requestAnimationFrame(() => target.requestAnimationFrame(() => resolve()));
  }));
  expect(await frame.evaluate(element => ((element as HTMLIFrameElement).contentWindow as Window & { previewErrors: string[] }).previewErrors)).toEqual([]);
  expect(errors).toEqual([]);
});
