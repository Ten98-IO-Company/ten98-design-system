// Quality sweep over every catalogue component state: no page overflow, WCAG AA text contrast (4.5:1, 3:1 for large
// text) in light and dark at 768px, and 44px touch targets on a 390px touch screen. Inline links inside a sentence and
// the visually hidden file input (its visible button is the target) are exempt.
import { expect, test, type Page, type Frame } from '@playwright/test';

const probe = (frame: Frame, touch: boolean, scope: string) => frame.evaluate(([touch, scope]) => {
  const parse = (value: string) => { const m = value.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = '1'] = m[1].split(/[ ,/]+/).filter(Boolean); return [+r, +g, +b, +a]; };
  const lum = ([r, g, b]: number[]) => { const c = [r, g, b].map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const background = (element: Element | null): number[] => {
    let colour = [255, 255, 255];
    const stack: number[][] = [];
    for (let node = element; node; node = node.parentElement) { const bg = parse(getComputedStyle(node).backgroundColor); if (bg && bg[3] > 0) { stack.push(bg); if (bg[3] >= 1) break; } if (getComputedStyle(node).backgroundImage !== 'none') return []; }
    if (stack.length && stack[stack.length - 1][3] >= 1) colour = stack.pop()!.slice(0, 3);
    for (const bg of stack.reverse()) colour = colour.map((c, i) => c * (1 - bg[3]) + bg[i] * bg[3]);
    return colour;
  };
  const issues: string[] = [];
  if (scope === 'body' && document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) issues.push(`overflow ${document.documentElement.scrollWidth - document.documentElement.clientWidth}px`);
  const describe = (el: Element) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}"`;
  for (const el of document.querySelectorAll(`${scope} *`)) {
    if (!(el instanceof HTMLElement) || !el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent!.trim());
    if (!own) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || +style.opacity === 0 || el.closest('[aria-hidden="true"],.t98-visually-hidden,.sr-only')) continue;
    if ((el as HTMLButtonElement).disabled || el.closest('[disabled],.t98-disabled,[aria-disabled="true"]')) continue;
    const fg = parse(style.color); const bg = background(el);
    if (!fg || bg.length === 0) continue;
    const mixed = fg.slice(0, 3).map((c, i) => c * fg[3] + bg[i] * (1 - fg[3]));
    const [a, b] = [lum(mixed), lum(bg)].sort((x, y) => y - x);
    const ratio = (a + 0.05) / (b + 0.05);
    const size = parseFloat(style.fontSize); const bold = +style.fontWeight >= 700;
    const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
    if (ratio < need - 0.01) issues.push(`contrast ${ratio.toFixed(2)}<${need} ${describe(el)}`);
  }
  if (touch) for (const el of document.querySelectorAll(['button', 'a[href]', 'select', 'input:not([type=hidden])', '[role=button]', '[role=tab]', 'summary', 'textarea'].map(sel => `${scope} ${sel}`).join(','))) {
    if (!(el instanceof HTMLElement) || !el.offsetParent) continue;
    if (el.closest('p, li > p') && el.tagName === 'A') continue;
    if (el.classList.contains('t98-file-input')) continue;
    let target: Element = el;
    if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) target = el.closest('label') ?? el;
    const r = target.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.height < 43.5 || r.width < 24) issues.push(`target ${Math.round(r.width)}x${Math.round(r.height)} ${describe(target)}`);
  }
  return issues;
}, [touch, scope] as const);

const configs = [
  { name: 'w768-light', width: 768, theme: 'light', touch: false },
  { name: 'w768-dark', width: 768, theme: 'dark', touch: false },
  { name: 'w390-touch', width: 390, theme: 'light', touch: true },
];
for (const config of configs) test(`catalogue quality sweep: ${config.name}`, async ({ browser }, info) => {
  test.skip(info.project.name !== 'chromium');
  test.setTimeout(300_000);
  const context = await browser.newContext({ viewport: { width: config.width, height: 900 }, hasTouch: config.touch, isMobile: config.touch, colorScheme: config.theme as 'light' | 'dark' });
  const page: Page = await context.newPage();
  const prefix = config.theme === 'dark' ? '/?theme=dark' : '/';
  await page.goto(`${prefix}#components`);
  await page.locator('.reference-component-card').first().waitFor();
  const links = await page.locator('.reference-component-card').evaluateAll(nodes => nodes.map(node => ({ href: node.getAttribute('href')!, name: node.querySelector('h2')!.textContent! })));
  const report: Record<string, string[]> = {};
  for (const link of links) {
    await page.goto(`${prefix}${link.href}?tab=states`);
    await page.locator('.reference-state').first().waitFor();
    await page.waitForTimeout(150);
    const found: string[] = [];
    for (const frame of page.frames()) {
      const main = frame === page.mainFrame();
      const isPreview = main || await (await frame.frameElement()).evaluate(el => (el as Element).classList.contains('reference-app-frame'));
      if (!isPreview) continue;
      found.push(...await probe(frame, config.touch, main ? '.reference-preview-content' : 'body').catch(error => [`probe-error ${String(error).slice(0, 120)}`]));
    }
    if (found.length) report[link.name] = [...new Set(found)];
  }
  expect(report, 'components with overflow, contrast or touch-target findings').toEqual({});
  await context.close();
});
