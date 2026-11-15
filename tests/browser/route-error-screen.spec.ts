import { test, expect } from '@playwright/test';

const message = 'The report could not load. Reference: 7F3A-21C9.';

test('a route error takes focus on its heading, keeps the reference selectable and retries', async ({ page }) => {
  await page.goto('/tests/route-error-screen.html');
  const open = page.getByRole('button', { name: 'Open the report' });
  await open.focus();
  await page.keyboard.press('Enter');

  const heading = page.getByRole('heading', { level: 1, name: 'This page stopped working' });
  await expect(heading).toBeFocused();
  // Focus moved after keyboard use shows the token focus ring.
  expect(await heading.evaluate(element => {
    const style = getComputedStyle(element), probe = document.createElement('span');
    probe.style.color = 'var(--t98-focus)';
    document.body.append(probe);
    const focus = getComputedStyle(probe).color;
    probe.remove();
    return { visible: element.matches(':focus-visible'), style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor === focus };
  })).toEqual({ visible: true, style: 'solid', width: '2px', color: true });

  await expect(page.getByRole('main', { name: 'Page content' }).getByRole('region', { name: 'This page stopped working' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText(message);
  await expect(page.getByRole('link', { name: 'Go to home' })).toHaveAttribute('href', '/home');

  // The reference is plain text that can be selected and copied.
  const alertTitle = page.getByRole('alert').getByText(message);
  expect(await alertTitle.evaluate(element => getComputedStyle(element).userSelect)).not.toBe('none');
  expect(await alertTitle.evaluate(element => {
    const node = element.firstChild!, start = node.textContent!.indexOf('7F3A');
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, start + '7F3A-21C9'.length);
    const selection = getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    return selection.toString();
  })).toBe('7F3A-21C9');

  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('#retries')).toHaveText('Retries: 1');
  await expect(heading).toHaveCount(0);
});

test('a route error fits the content area at narrow widths', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tests/route-error-screen.html?theme=dark');
  await page.getByRole('button', { name: 'Open the report' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'This page stopped working' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  for (const target of [page.getByRole('button', { name: 'Try again' }), page.getByRole('link', { name: 'Go to home' })]) {
    expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(24);
  }
});
