import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const evidence = resolve('.qa/primitives-extensions');

// WCAG relative luminance from a computed rgb()/rgba() string.
function luminance(color: string) {
  const [r, g, b] = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(channel => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

async function open(page: Page, theme: string, reducedMotion: 'reduce' | 'no-preference') {
  await page.emulateMedia({ colorScheme: theme as 'light' | 'dark', reducedMotion });
  await page.goto(`/tests/primitives-extensions.html?theme=${theme}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Primitive extensions' })).toBeVisible();
}

for (const theme of ['light', 'dark'] as const) {
  test(`extended primitives stay contained, focusable, accessible and contrasted in ${theme}`, async ({ page }, info) => {
    await mkdir(evidence, { recursive: true });
    await open(page, theme, 'no-preference');

    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 'no page overflow').toBeLessThanOrEqual(1);
    const escaped = await page.locator('#extensions').evaluate(root => {
      const bounds = root.getBoundingClientRect();
      return [...root.querySelectorAll('*')].filter(node => { const rect = node.getBoundingClientRect(); return rect.width > 0 && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1); }).map(node => node.className || node.tagName);
    });
    expect(escaped, 'every element stays inside the screen').toEqual([]);

    // Anchors, disabled anchors, dismiss and icon-only controls.
    await expect(page.locator('#link-button')).toHaveAttribute('href', '/reports');
    await expect(page.locator('#disabled-link')).toHaveAttribute('aria-disabled', 'true');
    expect(await page.locator('#disabled-link').getAttribute('href')).toBeNull();
    await expect(page.getByLabel(/^Region/)).toHaveAttribute('required', '');
    await expect(page.getByRole('region', { name: /A card whose title/ })).toBeVisible();
    await expect(page.locator('progress:not([value])')).toHaveAttribute('aria-busy', 'true');

    for (const selector of ['#icon-only', '#dismissible button']) {
      const box = (await page.locator(selector).boundingBox())!;
      expect(box.width, `${selector} width`).toBeGreaterThanOrEqual(44);
      expect(box.height, `${selector} height`).toBeGreaterThanOrEqual(44);
    }

    // Keyboard focus rings: Tab through the interactive controls and measure each outline.
    const focusable = ['link-button', 'toggle', 'icon-only', 'full-width', 'region', 'project'];
    await page.locator('#extensions').first().evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    const seen: string[] = [];
    for (let step = 0; step < 14 && seen.length < focusable.length + 1; step += 1) {
      await page.keyboard.press('Tab');
      const state = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement;
        const style = getComputedStyle(element);
        return { id: element.id || element.closest('#dismissible') && 'dismiss', outline: style.outlineStyle, width: parseFloat(style.outlineWidth), visible: element.matches(':focus-visible') };
      });
      if (!state.id) continue;
      seen.push(state.id);
      expect(state.visible, `${state.id} matches :focus-visible`).toBe(true);
      expect(state.outline, `${state.id} outline style`).not.toBe('none');
      expect(state.width, `${state.id} outline width`).toBeGreaterThanOrEqual(2);
    }
    expect(seen).toEqual(expect.arrayContaining([...focusable, 'dismiss']));
    expect(seen, 'disabled anchor is skipped').not.toContain('disabled-link');

    // Pressed toggle: state and visual change.
    const toggle = page.locator('#toggle');
    const before = await toggle.evaluate(node => getComputedStyle(node).backgroundColor);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await page.mouse.move(0, 0);
    await expect.poll(() => toggle.evaluate(node => getComputedStyle(node).backgroundColor), { message: 'pressed style differs' }).not.toBe(before);

    // Badge palettes: measured contrast from computed colours.
    const badges = await page.locator('#palettes > *').evaluateAll(nodes => nodes.map(node => { const style = getComputedStyle(node); return { name: node.textContent, color: style.color, background: style.backgroundColor }; }));
    expect(badges).toHaveLength(7);
    for (const badge of badges) expect(contrast(badge.color, badge.background), `${badge.name} contrast in ${theme}`).toBeGreaterThanOrEqual(4.5);

    // Dismiss removes the alert and is application-owned.
    await page.getByRole('button', { name: 'Dismiss message' }).click();
    await expect(page.locator('#dismissible')).toHaveCount(0);

    await page.screenshot({ path: resolve(evidence, `${info.project.name}-${theme}.png`), fullPage: true });
  });
}

test('indeterminate progress animates and stops under reduced motion', async ({ page }) => {
  await open(page, 'light', 'no-preference');
  const bar = page.locator('progress:not([value])');
  expect(await bar.evaluate(node => getComputedStyle(node).animationName)).not.toBe('none');
  expect(await bar.evaluate(node => node.getAnimations().some(animation => animation.playState === 'running'))).toBe(true);
  await open(page, 'light', 'reduce');
  expect(await bar.evaluate(node => getComputedStyle(node).animationName)).toBe('none');
  expect(await bar.evaluate(node => node.getAnimations().length)).toBe(0);
});

test('tabs skip disabled items with the keyboard, ignore clicks on them and mount only the selected panel', async ({ page }) => {
  await open(page, 'light', 'no-preference');
  const tabs = page.locator('#lazy-tabs');
  const tab = (name: string) => tabs.getByRole('tab', { name });
  await expect(tab('Two')).toHaveAttribute('aria-disabled', 'true');
  await expect(tabs.getByRole('tabpanel')).toHaveCount(1);
  await expect(tabs.getByText('First panel')).toBeVisible();
  await expect(tabs.getByText('Third panel')).toHaveCount(0);
  await tab('Two').click({ force: true });
  await expect(tab('One')).toHaveAttribute('aria-selected', 'true');
  await tab('One').focus();
  await page.keyboard.press('ArrowRight');
  await expect(tab('Three')).toBeFocused();
  await expect(tab('Three')).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.getByText('Third panel')).toBeVisible();
  await expect(tabs.getByText('First panel')).toHaveCount(0);
  await page.keyboard.press('End');
  await expect(tab('Four')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(tab('One')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tab('Four')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tab('One')).toBeFocused();
});
