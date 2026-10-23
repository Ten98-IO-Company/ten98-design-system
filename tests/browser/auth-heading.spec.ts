import { test, expect, type Locator } from '@playwright/test';

const discoverTitle = 'Website analytics and search research.';

// Range fragments measure the rendered text inside the actual clipping ancestor.
const headingFragments = (story: Locator) => story.evaluate(element => {
  const title = element.querySelector<HTMLElement>('.auth-story-title, h1')!;
  const bounds = element.getBoundingClientRect();
  const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  const fragments: { text: string; clipped: boolean }[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rectangles = [...range.getClientRects()].filter(rect => rect.width && rect.height);
    if (!rectangles.length) fragments.push({ text: node.textContent, clipped: true });
    for (const rect of rectangles) {
      fragments.push({ text: node.textContent, clipped: rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1 });
    }
  }
  return { text: title.textContent, overflow: getComputedStyle(element).overflow, fragments };
});

const normalGeometry = (shell: Locator) => shell.evaluate(element => {
  const geometry = (selector: string) => {
    const node = element.querySelector(selector);
    if (!node) return null;
    const rect = node.getBoundingClientRect(), style = getComputedStyle(node);
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, font: style.font, color: style.color, background: style.backgroundColor, padding: style.padding, border: style.border, overflow: style.overflow };
  };
  return ['.auth-story', '.auth-story-title, h1', '.brand', '.brand-mark', '.brand strong', '.brand small', '.auth-orbit', '.auth-form', '.auth-form-inner'].map(geometry);
});

const formState = (shell: Locator) => shell.locator('.auth-form').evaluate(element => [...element.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('input, select, button')].map(control => {
  const rect = control.getBoundingClientRect();
  return { tag: control.tagName, width: rect.width, height: rect.height, value: control.value, disabled: control.disabled, required: 'required' in control ? control.required : undefined };
}));

for (const fixture of ['auth-layout', 'legacy-theme']) {
  test(`${fixture} auth keeps normal branding and layout at desktop and narrow widths`, async ({ page }) => {
    for (const width of [1440, 320]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 850 });
      await page.goto(`/tests/${fixture}.html?theme=${theme}`);
      const shell = page.locator('.auth-shell');
      await expect(shell).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const current = await normalGeometry(shell);
      const oldRule = await page.addStyleTag({ content: '.auth-story :is(h1,.auth-story-title) { overflow-wrap: normal !important; }' });
      try { expect(await normalGeometry(shell)).toEqual(current); }
      finally { await oldRule.evaluate(element => element.parentNode?.removeChild(element)); }
    }
  });
  for (const direction of ['ltr', 'rtl']) {
    test(`${fixture} auth story keeps doubled text visible in ${direction}`, async ({ page }, info) => {
      await page.setViewportSize({ width: 320, height: 850 });
      for (const theme of ['light', 'dark']) {
        await page.goto(`/tests/${fixture}.html?theme=${theme}`);
        const shell = page.locator('.auth-shell'), story = shell.locator('.auth-story');
        await expect(story).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await page.locator('html').evaluate((element, dir) => { element.setAttribute('dir', dir); }, direction);
        await story.locator('.auth-story-title, h1').evaluate((element, text) => {
          const emphasis = document.createElement('em');
          emphasis.textContent = 'research.';
          element.replaceChildren(document.createTextNode(text.slice(0, -emphasis.textContent.length)), emphasis);
        }, discoverTitle);
        await story.scrollIntoViewIfNeeded();

        const normal = await normalGeometry(shell);
        const oldNormal = await page.addStyleTag({ content: '.auth-story :is(h1,.auth-story-title) { overflow-wrap: normal !important; }' });
        try { expect(await normalGeometry(shell)).toEqual(normal); }
        finally { await oldNormal.evaluate(element => element.parentNode?.removeChild(element)); }
        expect((await headingFragments(story)).fragments.filter(fragment => fragment.clipped)).toEqual([]);
        const originalControls = await formState(shell);
        if (fixture === 'auth-layout') expect(originalControls.length).toBeGreaterThanOrEqual(3);
        const orbit = await shell.locator('.auth-orbit').evaluateAll(elements => elements.map(element => {
          const style = getComputedStyle(element);
          return { width: style.width, height: style.height, border: style.border, position: style.position };
        }));

        const doubled = await story.locator('.auth-story-title, h1').evaluate(element => {
          // Freeze every computed size before any write, avoiding inherited double-doubling.
          const frozen = [element, ...element.querySelectorAll<HTMLElement>('*')].map(node => {
            const style = getComputedStyle(node);
            return { node: node as HTMLElement, font: parseFloat(style.fontSize), line: parseFloat(style.lineHeight) };
          });
          for (const item of frozen) {
            item.node.style.fontSize = `${item.font * 2}px`;
            item.node.style.lineHeight = `${item.line * 2}px`;
          }
          return frozen.map(item => ({ beforeFont: item.font, beforeLine: item.line, afterFont: parseFloat(getComputedStyle(item.node).fontSize), afterLine: parseFloat(getComputedStyle(item.node).lineHeight) }));
        });
        for (const size of doubled) {
          expect(size.beforeFont).toBeGreaterThan(0);
          expect(size.beforeLine).toBeGreaterThan(0);
          expect(size.afterFont).toBeCloseTo(size.beforeFont * 2, 3);
          expect(size.afterLine).toBeCloseTo(size.beforeLine * 2, 2);
        }

        const visible = await headingFragments(story);
        expect(visible.text).toBe(discoverTitle);
        expect(visible.overflow).toBe('hidden');
        expect(visible.fragments.length).toBeGreaterThan(1);
        expect(visible.fragments.filter(fragment => fragment.clipped)).toEqual([]);
        expect(await formState(shell)).toEqual(originalControls);
        expect(await shell.locator('.auth-orbit').evaluateAll(elements => elements.map(element => {
          const style = getComputedStyle(element);
          return { width: style.width, height: style.height, border: style.border, position: style.position };
        }))).toEqual(orbit);

        const oldWrapping = await page.addStyleTag({ content: '.auth-story :is(h1,.auth-story-title) { overflow-wrap: normal !important; }' });
        try {
          const broken = await headingFragments(story);
          await shell.screenshot({ path: info.outputPath(`${fixture}-${direction}-${theme}-old-clipped.png`) });
          expect(broken.text).toBe(discoverTitle);
          expect(broken.fragments.some(fragment => fragment.clipped), 'The old wrapping rule must reproduce actual clipped text').toBe(true);
        } finally { await oldWrapping.evaluate(element => element.parentNode?.removeChild(element)); }

        expect((await headingFragments(story)).fragments.filter(fragment => fragment.clipped)).toEqual([]);
        await shell.screenshot({ path: info.outputPath(`${fixture}-${direction}-${theme}-doubled-visible.png`) });
        const form = shell.locator('.auth-form-inner');
        const formContent = form.locator('h1, h2, p, input, select, button, a');
        expect(await formContent.count()).toBeGreaterThan(0);
        for (const item of await formContent.all()) {
          await item.scrollIntoViewIfNeeded();
          await expect(item).toBeInViewport({ ratio: 1 });
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);

        // Reproduce the consumer's separate CSS zoom scene without calling it browser zoom.
        await story.locator('.auth-story-title, h1').evaluate(element => {
          for (const node of [element, ...element.querySelectorAll<HTMLElement>('*')]) {
            (node as HTMLElement).style.removeProperty('font-size');
            (node as HTMLElement).style.removeProperty('line-height');
          }
        });
        await page.locator('body').evaluate(element => { element.style.zoom = '2'; });
        try {
          expect((await headingFragments(story)).fragments.filter(fragment => fragment.clipped)).toEqual([]);
          const oldZoomRule = await page.addStyleTag({ content: '.auth-story :is(h1,.auth-story-title) { overflow-wrap: normal !important; }' });
          try {
            expect((await headingFragments(story)).fragments.some(fragment => fragment.clipped)).toBe(true);
            await shell.screenshot({ path: info.outputPath(`${fixture}-${direction}-${theme}-css-bodyzoom2-old-clipped.png`) });
          } finally { await oldZoomRule.evaluate(element => element.parentNode?.removeChild(element)); }
          expect((await headingFragments(story)).fragments.filter(fragment => fragment.clipped)).toEqual([]);
          await shell.screenshot({ path: info.outputPath(`${fixture}-${direction}-${theme}-css-bodyzoom2-visible.png`) });
        } finally { await page.locator('body').evaluate(element => { element.style.removeProperty('zoom'); }); }
      }
    });
  }
}
