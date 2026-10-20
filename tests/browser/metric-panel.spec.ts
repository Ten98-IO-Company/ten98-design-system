import { expect, test, type Locator } from '@playwright/test';

async function textLines(value: Locator) {
  return value.evaluate(element => {
    const text = element.firstChild!;
    const lines: { top: number; text: string }[] = [];
    for (let index = 0; index < text.textContent!.length; index++) {
      const range = document.createRange();
      range.setStart(text, index); range.setEnd(text, index + 1);
      const top = range.getBoundingClientRect().top;
      let line = lines.find(item => Math.abs(item.top - top) < 1);
      if (!line) { line = { top, text: '' }; lines.push(line); }
      line.text += text.textContent![index];
    }
    return lines.map(line => line.text);
  });
}

async function doubleFonts(article: Locator) {
  return article.evaluate(root => {
    // Snapshot the complete component before mutation so inherited text cannot double twice.
    const snapshots = [root, ...root.querySelectorAll<HTMLElement>('*')].map(element => {
      const style = getComputedStyle(element);
      return { element: element as HTMLElement, font: parseFloat(style.fontSize), line: parseFloat(style.lineHeight) };
    });
    for (const { element, font, line } of snapshots) {
      element.style.fontSize = `${font * 2}px`;
      if (Number.isFinite(line)) element.style.lineHeight = `${line * 2}px`;
    }
    return snapshots.map(({ element, font, line }) => ({
      text: element.textContent, before: font, after: parseFloat(getComputedStyle(element).fontSize),
      lineBefore: line, lineAfter: parseFloat(getComputedStyle(element).lineHeight),
    }));
  });
}

for (const width of [1440, 320]) {
  test(`comparison values remain whole in a ${width === 1440 ? '260px desktop panel' : '320px viewport'} at normal and doubled text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const theme = test.info().project.name === 'narrow-dark' ? 'dark' : 'light';
    await page.goto(`/?theme=${theme}#components/comparison-metric?tab=states`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const state = page.locator('.reference-state').filter({ has: page.getByRole('heading', { name: 'Unavailable', exact: true }) });
    const article = state.locator('.t98-comparison-metric');
    const unavailable = article.locator('.t98-comparison-value').first();
    const baseline = article.locator('.t98-comparison-value').last();
    const setPanel = async () => {
      await expect(article).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (width === 1440) await article.evaluate(element => (element as HTMLElement).style.width = '260px');
    };
    await setPanel();

    // Restore both old rules before doubling: this must reproduce the word fragments.
    await page.addStyleTag({ content: `.t98-comparison-values{grid-template-columns:repeat(2,minmax(0,1fr))}.t98-comparison-value[data-unavailable]{font-size:var(--t98-text-metric);font-weight:var(--t98-weight-bold);line-height:var(--t98-leading-tight)}@media(max-width:600px){.t98-comparison-values{grid-template-columns:minmax(0,1fr)}}` });
    const oldLines = await textLines(unavailable);
    expect(oldLines.join('')).toBe('Unavailable');
    if (width === 1440) expect(oldLines.length).toBeGreaterThan(1);
    else expect(oldLines).toEqual(['Unavailable']);
    const oldSnapshot = await doubleFonts(article);
    expect(oldSnapshot.every(item => item.after === item.before * 2)).toBeTruthy();
    expect((await textLines(unavailable)).length).toBeGreaterThan(1);
    await article.screenshot({ path: test.info().outputPath('old-metric-fragments.png') });

    // Reload removes the negative control and all inline font overrides.
    await page.reload();
    await setPanel();
    await expect(unavailable).toHaveText('Unavailable');
    await expect(unavailable).toHaveAttribute('data-unavailable', 'true');
    await expect(baseline).toHaveText('1,000');
    await expect(baseline).not.toHaveAttribute('data-unavailable');
    expect(await textLines(unavailable)).toEqual(['Unavailable']);
    expect(await textLines(baseline)).toEqual(['1,000']);
    await expect(unavailable).toHaveCSS('font-size', '13px');
    await expect(baseline).toHaveCSS('font-size', '28px');
    const zero = page.locator('.reference-state').filter({ has: page.getByRole('heading', { name: 'Measured zero', exact: true }) }).locator('.t98-comparison-value').first();
    await expect(zero).toHaveText('0');
    await expect(zero).not.toHaveAttribute('data-unavailable');
    await expect(article.locator('.t98-comparison-reason').first()).toHaveText('Current observations cannot be read.');
    await article.screenshot({ path: test.info().outputPath('metric-normal.png') });

    const snapshot = await doubleFonts(article);
    expect(snapshot.every(item => item.after === item.before * 2)).toBeTruthy();
    expect(snapshot.filter(item => Number.isFinite(item.lineBefore)).every(item => item.lineAfter === item.lineBefore * 2)).toBeTruthy();
    await expect(unavailable).toHaveCSS('font-size', '26px');
    await expect(baseline).toHaveCSS('font-size', '56px');
    expect(await textLines(unavailable)).toEqual(['Unavailable']);
    expect(await textLines(baseline)).toEqual(['1,000']);
    const fit = await article.evaluate(root => {
      const bounds = root.getBoundingClientRect();
      return {
        articleFits: root.scrollWidth <= root.clientWidth + 1,
        documentFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        descendantsFit: [...root.querySelectorAll('*')].every(element => { const rect = element.getBoundingClientRect(); return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1; }),
        zoom: [getComputedStyle(document.body).zoom, getComputedStyle(document.documentElement).zoom],
      };
    });
    expect(fit).toEqual({ articleFits: true, documentFits: true, descendantsFit: true, zoom: ['1', '1'] });
    await article.screenshot({ path: test.info().outputPath('metric-doubled.png') });
    await test.info().attach('font-snapshots', { body: JSON.stringify(snapshot), contentType: 'application/json' });
  });
}
