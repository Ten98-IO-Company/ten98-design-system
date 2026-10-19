import { test, expect, type Page } from '@playwright/test';

async function doubleText(page: Page) {
  // Snapshot first: changing a parent before measuring its child would compound inheritance.
  const snapshots = await Promise.all(page.frames().map(frame => frame.evaluateHandle(() => {
    const sizes = [...document.body.querySelectorAll('*')].filter((element): element is HTMLElement => element instanceof HTMLElement).map(element => {
      const style = getComputedStyle(element);
      return { element, original: element.style.cssText, size: parseFloat(style.fontSize), height: parseFloat(style.lineHeight) };
    });
    for (const { element, size, height } of sizes) {
      element.style.setProperty('font-size', `${size * 2}px`, 'important');
      if (Number.isFinite(height)) element.style.setProperty('line-height', `${height * 2}px`, 'important');
    }
    return sizes;
  })));
  return async () => {
    for (const snapshot of snapshots) {
      await snapshot.evaluate(sizes => { for (const { element, original } of sizes) element.style.cssText = original; });
      await snapshot.dispose();
    }
  };
}

test('shared product controls preserve identity, drafts, evidence and native forms', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tests/product-components.html');
  await page.getByRole('button', { name: 'Run checks', exact: true }).click();
  await expect(page.locator('#result')).toHaveText(/^PASS:/);
  expect(errors).toEqual([]);
});

test('original connection, investigation and mutation recovery remain intact', async ({ page }) => {
  await page.goto('/tests/flow-recipes.html');
  await page.getByRole('button', { name: 'Run checks', exact: true }).click();
  await expect(page.locator('#result')).toHaveText(/^PASS:/, { timeout: 15_000 });
});

test('every component state page renders without browser errors or page overflow', async ({ page }, info) => {
  test.setTimeout(120_000);
  const prefix = info.project.name === 'narrow-dark' ? '/?theme=dark' : '/';
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${prefix}#components`);
  await expect(page.locator('.reference-component-card')).toHaveCount(73);
  const links = await page.locator('.reference-component-card').evaluateAll(nodes => nodes.map(node => ({ href: node.getAttribute('href')!, name: node.querySelector('h2')!.textContent! })));
  for (const link of links) {
    await test.step(link.name, async () => {
      await page.goto(`${prefix}${link.href}?tab=states`);
      await expect(page.locator('.reference-detail > header h1')).toHaveText(link.name);
      await expect(page.locator('.reference-state').first()).toBeVisible();
      for (const frame of page.frames().filter(frame => frame !== page.mainFrame())) await expect(frame.locator('.specimen')).toBeVisible();
      expect(await page.locator('.reference-state').count()).toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${link.name} must contain horizontal overflow`).toBeTruthy();
      if (info.project.name === 'narrow-dark') {
        const heading = page.locator('.reference-detail > header h1');
        const original = await heading.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
        const restore = await doubleText(page);
        try {
          expect(await heading.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeCloseTo(original * 2);
          for (const frame of page.frames()) {
            const fits = await frame.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
            expect.soft(fits, `${link.name} must reflow at actual 200% text size`).toBeTruthy();
          }
        } finally { await restore(); }
      }
    });
  }
  if (info.project.name === 'narrow-dark') {
    await expect(page.locator('html')).toHaveCSS('direction', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  }
  expect(errors).toEqual([]);
});

test('templates, hierarchy and usage rules are keyboard accessible', async ({ page }, info) => {
  const prefix = info.project.name === 'narrow-dark' ? '/?theme=dark' : '/';
  await page.goto(`${prefix}#templates`);
  const picker = page.getByLabel('Page template', { exact: true });
  await expect(picker.locator('option')).toHaveCount(5);
  await picker.focus();
  await picker.press('End');
  await expect(picker).toHaveValue('SettingsTemplate');
  await picker.selectOption('EditorTemplate');
  await expect(page.getByRole('heading', { name: 'EditorTemplate', exact: true })).toBeVisible();
  await expect(page.locator('.reference-template-context')).toContainText('Scope → steps → feedback → form + preview → save actions');
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toHaveCount(0);
  await expect(page.locator('.reference-preview .t98-template--editor')).toBeVisible();
  // Browsing must reach the preview without scrolling past five full template cards.
  await expect(page.locator('.reference-preview')).toBeInViewport({ ratio: .05 });
  await picker.selectOption('SettingsTemplate');
  await page.locator('.reference-preview').getByRole('link', { name: 'General', exact: true }).click();
  await expect(page).toHaveURL(/#templates$/);
  await expect(page.locator('.reference-preview section[id]').filter({ has: page.getByRole('heading', { name: 'General', exact: true }) })).toBeFocused();
  await picker.selectOption('DetailTemplate');
  await page.locator('.reference-preview').getByRole('link', { name: 'Activity', exact: true }).click();
  await expect(page).toHaveURL(/#templates$/);
  await expect(page.locator('.reference-preview section[id]').filter({ has: page.getByRole('heading', { name: 'Activity', exact: true }) })).toBeFocused();
  const hierarchy = page.getByRole('tab', { name: 'Component hierarchy' });
  await hierarchy.focus();
  await hierarchy.press('Enter');
  await expect(page.getByRole('heading', { name: '1. Design tokens' })).toBeVisible();
  await page.getByRole('tab', { name: 'Behavior and usage' }).click();
  await expect(page.getByRole('heading', { name: 'Read-only still permits inspection' })).toBeVisible();
  expect(await page.locator('main').getByRole('heading', { level: 1 }).count()).toBe(1);
});

test('open dialogs keep enlarged controls usable and return focus', async ({ page }, info) => {
  const prefix = info.project.name === 'narrow-dark' ? '/?theme=dark' : '/';
  for (const [id, name, close] of [['dialog', 'Open dialog', 'Done'], ['confirm-dialog', 'Open typed confirmation', 'Cancel']]) {
    await page.goto(`${prefix}#components/${id}?tab=states`);
    const trigger = page.getByRole('button', { name, exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const title = dialog.getByRole('heading');
    const original = await title.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
    const restore = await doubleText(page);
    try {
      expect(await title.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeCloseTo(original * 2);
      expect.soft(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1), `${id} contains enlarged controls`).toBeTruthy();
      if (id === 'confirm-dialog') {
        await expect(dialog.getByRole('button', { name: 'Confirm demo' })).toBeDisabled();
        await dialog.getByLabel('Type REMOVE to confirm').fill('REMOVE');
        await expect(dialog.getByRole('button', { name: 'Confirm demo' })).toBeEnabled();
      }
      await dialog.getByRole('button', { name: close, exact: true }).click();
      await expect(trigger).toBeFocused();
    } finally { await restore(); }
  }
});

test('every reference flow reflows with visibly doubled text', async ({ page }, info) => {
  test.setTimeout(120_000);
  const prefix = info.project.name === 'narrow-dark' ? '/?theme=dark' : '/';
  await page.goto(`${prefix}#flows`);
  await expect(page.locator('.reference-component-card')).toHaveCount(28);
  const links = await page.locator('.reference-component-card').evaluateAll(nodes => nodes.map(node => ({ href: node.getAttribute('href')!, name: node.querySelector('h2')!.textContent! })));
  for (const link of links) await test.step(link.name, async () => {
    await page.goto(`${prefix}${link.href}`);
    const heading = page.locator('.reference-page-heading h1');
    await expect(heading).toHaveText(link.name);
    const original = await heading.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
    const restore = await doubleText(page);
    try {
      expect(await heading.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeCloseTo(original * 2);
      expect.soft(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${link.name} must reflow with doubled text`).toBeTruthy();
    } finally { await restore(); }
  });
});

test('flow discovery, copyable source and reference decisions are connected', async ({ page }, info) => {
  const prefix = info.project.name === 'narrow-dark' ? '/?theme=dark' : '/';
  await page.goto(`${prefix}#flows`);
  await page.getByLabel('Product', { exact: true }).selectOption('Campaign');
  await expect(page.locator('.reference-component-card')).toHaveCount(8);
  await page.getByLabel('Find a flow').fill('C6');
  await expect(page.locator('.reference-component-card')).toHaveCount(1);
  await page.locator('.reference-component-card').click();
  await expect(page.getByRole('heading', { name: 'Design decisions and acceptance cases' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reference flows' })).toBeVisible();
  await expect(page.locator('.reference-code code')).toContainText("from '@ten98/ui'");
});

test('navigation restores focus, hides scrollbar tracks and gives current setup commands', async ({ page }, info) => {
  await page.goto('/#components');
  if (info.project.name === 'narrow-dark') {
    const trigger = page.getByRole('button', { name: 'Open navigation', exact: true });
    await trigger.click();
    await expect(page.getByRole('button', { name: 'Close navigation', exact: true }).first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }
  const search = page.getByRole('button', { name: 'Search catalogue', exact: true });
  await search.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(search).toBeFocused();
  expect(await page.locator('.catalog-sidebar > nav').evaluate(element => getComputedStyle(element).scrollbarWidth)).toBe('none');
  await page.goto('/#getting-started');
  await expect(page.getByRole('heading', { name: 'Copy a component. Keep the system.' })).toBeVisible();
  await expect(page.getByLabel('Build the library', { exact: true })).toHaveText('npm install\nnpx playwright install chromium\nnpm run check:all\nnpm pack');
  await expect(page.getByLabel('Existing application stylesheet', { exact: true })).toHaveText("@import '@ten98/ui/app-tokens.css';\n@import '@ten98/ui/app.css';\n@import '@ten98/ui/product.css';\n/* App-specific overrides follow. */");
});

test('templates retain layout at 200 percent text zoom', async ({ page }, info) => {
  await page.goto(`${info.project.name === 'narrow-dark' ? '/?theme=dark' : '/'}#templates`);
  await page.getByRole('tab', { name: 'Component hierarchy' }).click();
  const heading = page.getByRole('heading', { level: 1 });
  const original = await heading.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
  const restore = await doubleText(page);
  expect(await heading.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeCloseTo(original * 2);
  await expect(page.getByRole('heading', { name: '5. Application flows' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  await restore();
});

test('replay controls expose only supported inactivity requests', async ({ page }) => {
  await page.goto('/#components/replay-controls?tab=states');
  const state = (name: string) => page.locator('.reference-state').filter({ has: page.getByRole('heading', { name, exact: true }) });
  const unsupported = state('Unsupported inactivity skip');
  await expect(unsupported.getByRole('checkbox', { name: 'Skip inactive periods' })).toHaveCount(0);
  await unsupported.getByRole('button', { name: 'Play recording', exact: true }).click();
  await expect(unsupported.getByRole('button', { name: 'Pause recording', exact: true })).toBeVisible();
  await unsupported.getByRole('slider', { name: 'Seek recording', exact: true }).press('End');
  await expect(unsupported.getByRole('slider', { name: 'Seek recording', exact: true })).toHaveValue('90');
  await unsupported.getByLabel('Playback speed', { exact: true }).selectOption('2');
  await expect(unsupported.getByLabel('Playback speed', { exact: true })).toHaveValue('2');
  const readOnly = state('Read-only inactivity skip');
  await expect(readOnly.getByRole('checkbox', { name: 'Skip inactive periods' })).toBeDisabled();
  await expect(readOnly.getByRole('checkbox', { name: 'Skip inactive periods' })).not.toBeChecked();
  await expect(readOnly.getByRole('button', { name: 'Play recording', exact: true })).toBeEnabled();
  const editable = state('Paused').getByRole('checkbox', { name: 'Skip inactive periods' });
  await editable.check();
  await expect(editable).toBeChecked();
});
