import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, test, type Browser } from '@playwright/test';

/*
 * Which chords reach a page, and whether cancelling them stops the browser's own action, per engine. Playwright sends keys
 * to the page's renderer, so browser-chrome accelerators (new tab, close tab, address bar, menus, full screen) are not
 * exercised: a "reached" here does not prove a real browser window delivers the chord. reservedChord() lists those from
 * browser documentation instead. Set KEY_MATRIX_UPDATE=1 to rewrite the expectation after an engine upgrade.
 */
const CHORDS = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F12', 'Enter', 'Escape',
  'Control+A', 'Control+Enter', 'Control+S', 'Control+P', 'Alt+C', 'Alt+D', 'Alt+E', 'Alt+F', 'Alt+G', 'Control+K'];
// Playwright names to registry chords: "Control+A" → "Ctrl+A".
const registryChord = (chord: string) => chord.replace('Control', 'Ctrl');

interface Probe { reached: boolean; cancelable: boolean; ran: boolean; prevented: boolean; effects: string[] }
async function probe(browser: Browser, chord: string, bind: boolean): Promise<Probe> {
  const page = await browser.newPage();
  try {
    await page.goto(`/tests/key-reachability.html?chord=${encodeURIComponent(registryChord(chord))}&bind=${bind ? 1 : 0}`);
    await expect(page.getByRole('textbox', { name: 'Probe' })).toBeFocused();
    await page.evaluate(() => { (window as unknown as { marker: boolean }).marker = true; });
    await page.keyboard.press(chord);
    // Default actions such as a reload or focus move settle after the event; give them a moment to show.
    await page.waitForTimeout(300);
    const alive = await page.evaluate(() => (window as unknown as { marker?: boolean }).marker === true).catch(() => false);
    if (!alive) return { reached: false, cancelable: false, ran: false, prevented: false, effects: ['page-replaced'] };
    const report = await page.evaluate(() => window.report);
    return { reached: report.keydowns > 0, cancelable: report.cancelable, ran: report.ran, prevented: report.prevented, effects: [...report.effects].sort() };
  } finally {
    await page.close();
  }
}

test('representative chords reach the page and the registry can cancel them', async ({ browser, browserName }, info) => {
  test.skip(info.project.name === 'narrow-dark', 'One Chromium run is enough.');
  test.setTimeout(180_000);
  const matrix: Record<string, { reached: boolean; cancelable: boolean; registryRan: boolean; effectsUnhandled: string[]; effectsCancelled: string[] }> = {};
  for (const chord of CHORDS) {
    const observed = await probe(browser, chord, false);
    const bound = await probe(browser, chord, true);
    expect(bound.ran === bound.prevented, `${chord}: the registry cancels exactly when it runs a command`).toBe(true);
    matrix[registryChord(chord)] = { reached: observed.reached, cancelable: observed.cancelable, registryRan: bound.ran, effectsUnhandled: observed.effects, effectsCancelled: bound.effects };
  }
  const recorded = JSON.stringify(matrix, null, 2) + '\n';
  // Kept with the test results (and the CI diagnostics artifact) so an engine without a local install can be recorded from CI.
  writeFileSync(info.outputPath('key-reachability.json'), recorded);
  const file = new URL(`../fixtures/key-reachability/${browserName}.json`, import.meta.url);
  if (process.env.KEY_MATRIX_UPDATE) writeFileSync(file, recorded);
  expect(existsSync(file), `No recorded matrix for ${browserName}; the observed one is in the test results`).toBe(true);
  expect(matrix).toEqual(JSON.parse(readFileSync(file, 'utf8')));
});
