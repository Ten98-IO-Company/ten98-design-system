import { test, expect, type Page } from '@playwright/test';

type Color = number[];

// The same W3C sRGB calculation used by library.test.mjs, applied to rendered colors.
function contrast(foreground: Color, background: Color) {
  const luminance = (color: Color) => color.slice(0, 3).reduce((sum, channel, index) => {
    const value = channel / 255;
    return sum + [0.2126, 0.7152, 0.0722][index] * (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  }, 0);
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const composite = (foreground: Color, background: Color) => foreground.slice(0, 3).map((channel, index) => channel * foreground[3] + background[index] * (1 - foreground[3]));

async function colors(page: Page) {
  return page.evaluate(() => {
    // Canvas resolves both rgb() and color(srgb ...) without relying on CSS serialization.
    const context = document.createElement('canvas').getContext('2d')!;
    const color = (value: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const pixel = [...context.getImageData(0, 0, 1, 1).data];
      return [...pixel.slice(0, 3), pixel[3] / 255];
    };
    const style = (selector: string) => getComputedStyle(document.querySelector(selector)!);
    const root = style('html'), disabled = style('#disabled'), story = style('.auth-story');
    return {
      header: color(style('.topbar').backgroundColor),
      headerText: color(style('.breadcrumb').color),
      canvas: color(style('body').backgroundColor),
      editable: color(style('#editable').backgroundColor),
      readonly: color(style('#readonly').backgroundColor),
      disabled: color(disabled.backgroundColor),
      disabledText: color(disabled.webkitTextFillColor),
      disabledOpacity: disabled.opacity,
      workspace: color(style('.workspace-switch').backgroundColor),
      workspaceText: color(style('#workspace-choice').color),
      workspaceMeta: color(style('.workspace-switch small').color),
      avatar: color(style('.workspace-avatar').backgroundColor),
      avatarText: color(style('.workspace-avatar').color),
      actions: Object.fromEntries(['secondary', 'secondary-alias', 'primary', 'danger', 'disabled-action', 'nav-normal', 'nav-selected', 'nav-count'].map(id => {
        const action = style(`#${id}`);
        return [id, { text: color(action.color), fill: color(action.backgroundColor), opacity: action.opacity }];
      })),
      subtleRole: color(root.getPropertyValue('--t98-subtle')),
      surface: color(root.getPropertyValue('--t98-surface')),
      disabledRole: color(root.getPropertyValue('--t98-disabled-surface')),
      scheme: root.colorScheme,
      compatibility: Object.fromEntries(['search-key', 'tab-count', 'active-tab-count', 'integration-initial', 'native-count', 'native-avatar'].map(id => {
        const element = style(`#${id}`);
        return [id, { text: color(element.color), fill: color(element.backgroundColor) }];
      })),
      tag: {
        text: color(style('#subtle-tag').color),
        fill: color(style('#subtle-tag').backgroundColor),
        border: color(style('#subtle-tag').borderColor),
      },
      error: {
        text: color(style('.form-error').color),
        fill: color(style('.form-error').backgroundColor),
        border: color(style('.form-error').borderColor),
      },
      auth: {
        scheme: story.colorScheme,
        fill: color(story.backgroundColor),
        orbit: color(style('.auth-orbit').borderColor),
        text: Object.fromEntries(['wordmark', 'eyebrow', 'headline', 'emphasis', 'copy', 'channels', 'footer'].map(id => [id, color(style(`#auth-${id}`).color)])),
        roles: Object.fromEntries(['surface-subtle', 'surface-raised', 'text', 'text-muted', 'accent'].map(role => [role, color(story.getPropertyValue(`--color-${role}`))])),
      },
    };
  });
}

function expectAuthStory(auth: Awaited<ReturnType<typeof colors>>['auth'], scheme: 'light' | 'dark') {
  expect(auth.scheme).toBe(scheme);
  if (scheme === 'light') {
    expect(auth.fill.slice(0, 3)).toEqual([238, 233, 250]);
    expect(auth.orbit.slice(0, 3)).toEqual([228, 218, 243]);
    for (const [id, expected] of Object.entries({ eyebrow: [118, 96, 136], headline: [120, 87, 147], emphasis: [116, 92, 137], copy: [115, 97, 128], footer: [113, 99, 122] })) {
      expect(auth.text[id].slice(0, 3), `${id} legacy light color`).toEqual(expected);
    }
  } else {
    expect(auth.fill).toEqual(auth.roles['surface-subtle']);
    expect(auth.orbit).toEqual(auth.roles['surface-raised']);
    expect(auth.orbit).not.toEqual(auth.fill);
    expect(auth.text.headline).toEqual(auth.roles.text);
    expect(auth.text.emphasis).toEqual(auth.roles.accent);
    for (const id of ['eyebrow', 'copy', 'footer']) expect(auth.text[id]).toEqual(auth.roles['text-muted']);
  }
  for (const [id, foreground] of Object.entries(auth.text)) {
    expect(contrast(foreground, auth.fill), `auth ${id} on ${scheme} story`).toBeGreaterThanOrEqual(id === 'headline' || id === 'emphasis' ? 3 : 4.5);
  }
}

for (const [theme, system, expected] of [
  ['light', 'dark', 'light'], ['dark', 'light', 'dark'],
  ['system', 'light', 'light'], ['system', 'dark', 'dark'],
] as const) {
  test(`legacy surfaces, actions and native fields follow ${theme} theme with ${system} system`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: system });
    await page.goto(`/tests/legacy-theme.html?theme=${theme}`);
    const rendered = await colors(page);
    // Independent palette expectations guard against two aliases agreeing on a wrong fill.
    const surface = expected === 'dark' ? [23, 32, 44] : [255, 255, 255];
    const disabled = expected === 'dark' ? [29, 41, 56] : [245, 244, 250];
    expect(rendered.scheme).toBe(expected);
    expectAuthStory(rendered.auth, expected);
    const error = rendered.error;
    expect(error.text.slice(0, 3)).toEqual(expected === 'dark' ? [255, 163, 153] : [105, 99, 116]);
    expect(error.fill.slice(0, 3)).toEqual(expected === 'dark' ? [73, 42, 42] : [253, 240, 245]);
    expect(error.border.slice(0, 3)).toEqual(expected === 'dark' ? [255, 163, 153] : [242, 212, 224]);
    expect(contrast(error.text, error.fill), 'form error text').toBeGreaterThanOrEqual(4.5);
    expect(rendered.tag.fill.slice(0, 3)).toEqual(expected === 'dark' ? [29, 41, 56] : [249, 247, 253]);
    expect(rendered.tag.border.slice(0, 3)).toEqual(expected === 'dark' ? [52, 66, 88] : [240, 236, 247]);
    expect(rendered.tag.text.slice(0, 3)).toEqual(expected === 'dark' ? [173, 185, 202] : [105, 99, 116]);
    expect(contrast(rendered.tag.text, rendered.tag.fill), 'subtle tag text').toBeGreaterThanOrEqual(4.5);
    for (const [id, lightFill] of Object.entries({ 'search-key': [248, 247, 251], 'tab-count': [244, 238, 249], 'active-tab-count': [244, 238, 249], 'integration-initial': [241, 237, 252], 'native-count': [244, 238, 249], 'native-avatar': [239, 225, 212] })) {
      const item = rendered.compatibility[id], accent = id === 'active-tab-count' || id === 'integration-initial';
      expect(item.fill.slice(0, 3), `${id} fill`).toEqual(expected === 'dark' ? (['search-key', 'native-count', 'native-avatar'].includes(id) ? [29, 41, 56] : [53, 42, 84]) : lightFill);
      expect(item.text.slice(0, 3), `${id} text`).toEqual(expected === 'dark' ? (accent ? [194, 182, 255] : [173, 185, 202]) : (accent ? [89, 67, 206] : [105, 99, 116]));
      expect(contrast(item.text, item.fill), `${id} text contrast`).toBeGreaterThanOrEqual(4.5);
    }
    expect(rendered.surface.slice(0, 3)).toEqual(surface);
    expect(rendered.disabled.slice(0, 3)).toEqual(disabled);
    expect(rendered.disabled).toEqual(rendered.disabledRole);
    expect(rendered.disabledOpacity).toBe('1');
    // Canvas premultiplication can round a translucent channel by one unit.
    rendered.header.slice(0, 3).forEach((value, index) => expect(Math.abs(value - surface[index])).toBeLessThanOrEqual(1));
    expect(rendered.header[3]).toBeCloseTo(0.851, 2);
    expect(rendered.editable).toEqual(rendered.surface);
    expect(rendered.readonly).toEqual(rendered.surface);
    expect(contrast(rendered.headerText, composite(rendered.header, rendered.canvas))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(rendered.disabledText, rendered.disabled)).toBeGreaterThanOrEqual(4.5);
    expect(rendered.workspace).toEqual(rendered.subtleRole);
    expect(contrast(rendered.workspaceText, rendered.workspace)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(rendered.workspaceMeta, rendered.workspace)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(rendered.avatarText, rendered.avatar)).toBeGreaterThanOrEqual(4.5);
    for (const id of ['secondary', 'secondary-alias', 'primary', 'danger', 'nav-normal', 'nav-selected', 'nav-count']) {
      const action = rendered.actions[id];
      expect(contrast(action.text, composite(action.fill, rendered.canvas)), `${id} normal text`).toBeGreaterThanOrEqual(4.5);
    }
    for (const id of ['secondary', 'secondary-alias', 'primary', 'danger', 'nav-normal', 'nav-selected']) {
      await page.locator(`#${id}`).hover();
      await page.locator(`#${id}`).evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
      const hovered = await colors(page), action = hovered.actions[id];
      expect(contrast(action.text, composite(action.fill, hovered.canvas)), `${id} hovered text`).toBeGreaterThanOrEqual(4.5);
    }
    await expect(page.locator('#disabled-action')).toBeDisabled();
    expect(rendered.actions['disabled-action'].opacity).toBe('0.48');
    await page.getByLabel('Workspace', { exact: true }).selectOption('research');
    await expect(page.locator('#workspace-choice')).toHaveValue('research');
    await expect(page.locator('#disabled')).toBeDisabled();
    await expect(page.locator('#readonly')).not.toBeEditable();
    await page.locator('#editable').fill('Edited synthetic value');
    await expect(page.locator('#editable')).toHaveValue('Edited synthetic value');
    await expect(page.locator('#readonly')).toHaveValue('Synthetic read-only value');

    await page.evaluate(() => {
      document.documentElement.style.setProperty('--t98-surface', '#2f3a48');
      document.documentElement.style.setProperty('--t98-disabled-surface', '#394352');
    });
    const inherited = await colors(page);
    expect(inherited.editable.slice(0, 3)).toEqual([47, 58, 72]);
    expect(inherited.readonly).toEqual(inherited.editable);
    expect(inherited.disabled.slice(0, 3)).toEqual([57, 67, 82]);
    expect(inherited.disabled).toEqual(inherited.disabledRole);
    inherited.header.slice(0, 3).forEach((value, index) => expect(Math.abs(value - [47, 58, 72][index])).toBeLessThanOrEqual(1));
    expect(inherited.header[3]).toBeCloseTo(0.851, 2);
  });
}

test('restoring the old fills reproduces dark surface, action and navigation contrast failures', async ({ page }) => {
  await page.goto('/tests/legacy-theme.html?theme=dark&baseline=1');
  const old = await colors(page);
  expect(old.header[3]).toBeCloseTo(0.851, 2);
  expect(contrast(old.headerText, composite(old.header, old.canvas))).toBeLessThan(4.5);
  expect(contrast(old.disabledText, old.disabled)).toBeLessThan(4.5);
  expect(old.disabled).not.toEqual(old.disabledRole);
  expect(contrast(old.workspaceText, old.workspace)).toBeLessThan(4.5);
  expect(contrast(old.avatarText, old.avatar)).toBeLessThan(4.5);
  expect(old.tag.fill.slice(0, 3)).toEqual([249, 247, 253]);
  expect(contrast(old.tag.text, old.tag.fill), 'subtle tag old fill').toBeLessThan(4.5);
  for (const [id, fill] of Object.entries({ 'search-key': [248, 247, 251], 'tab-count': [244, 238, 249], 'active-tab-count': [244, 238, 249], 'integration-initial': [241, 237, 252], 'native-count': [244, 238, 249], 'native-avatar': [239, 225, 212] })) {
    const item = old.compatibility[id];
    expect(item.fill.slice(0, 3), `${id} old fill`).toEqual(fill);
    expect(contrast(item.text, item.fill), `${id} old fill contrast`).toBeLessThan(4.5);
  }
  for (const id of ['nav-selected', 'nav-count', 'danger']) {
    const action = old.actions[id];
    expect(contrast(action.text, composite(action.fill, old.canvas)), `${id} old fill`).toBeLessThan(4.5);
  }
  for (const id of ['secondary', 'secondary-alias', 'nav-normal']) {
    await page.locator(`#${id}`).hover();
    await page.locator(`#${id}`).evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
    const hovered = await colors(page), action = hovered.actions[id];
    expect(contrast(action.text, composite(action.fill, hovered.canvas)), `${id} old hover fill`).toBeLessThan(4.5);
  }
});

test('authentication story follows inherited dark color-scheme without a theme attribute', async ({ page }) => {
  await page.goto('/tests/legacy-theme.html?theme=dark');
  await page.evaluate(() => {
    const root = document.documentElement, dark = getComputedStyle(root);
    const roles = ['subtle', 'surface-raised', 'text', 'muted', 'accent'].map(role => [role, dark.getPropertyValue(`--t98-${role}`)]);
    for (const [role, value] of roles) root.style.setProperty(`--t98-${role}`, value);
    root.style.colorScheme = 'dark';
    root.removeAttribute('data-theme');
  });
  await expect(page.locator('[data-theme]')).toHaveCount(0);
  expectAuthStory((await colors(page)).auth, 'dark');
});

test('authentication story follows the nearest nested theme', async ({ page }) => {
  await page.goto('/tests/legacy-theme.html?theme=dark');
  await page.locator('.auth-shell').evaluate(element => element.setAttribute('data-theme', 'light'));
  expectAuthStory((await colors(page)).auth, 'light');
  await page.locator('.auth-story').evaluate(element => element.setAttribute('data-theme', 'dark'));
  expectAuthStory((await colors(page)).auth, 'dark');
  await page.goto('/tests/legacy-theme.html?theme=light');
  await page.locator('.auth-shell').evaluate(element => element.setAttribute('data-theme', 'dark'));
  expectAuthStory((await colors(page)).auth, 'dark');
  await page.locator('.auth-story').evaluate(element => element.setAttribute('data-theme', 'light'));
  expectAuthStory((await colors(page)).auth, 'light');
});

test('restoring only the old pale authentication story fails dark readability', async ({ page }) => {
  await page.goto('/tests/legacy-theme.html?theme=dark');
  const fixed = (await colors(page)).auth;
  expectAuthStory(fixed, 'dark');
  await page.addStyleTag({ content: '.auth-story{background:#eee9fa}' });
  const old = (await colors(page)).auth;
  expect(old.fill.slice(0, 3)).toEqual([238, 233, 250]);
  expect(old.text).toEqual(fixed.text);
  expect(contrast(old.text.wordmark, old.fill)).toBeLessThan(4.5);
  expect(contrast(old.text.headline, old.fill)).toBeLessThan(3);
  expect(contrast(old.text.copy, old.fill)).toBeLessThan(4.5);
});

test('restoring the pale error surface reproduces the native Campaign dark contrast failure', async ({ page }) => {
  await page.goto('/tests/legacy-theme.html?theme=dark');
  const fixed = (await colors(page)).error;
  expect(contrast(fixed.text, fixed.fill)).toBeGreaterThanOrEqual(4.5);
  await page.addStyleTag({ content: '.form-error{background:#fdf0f5;border-color:#f2d4e0}' });
  const old = (await colors(page)).error;
  expect(old.text).toEqual(fixed.text);
  expect(old.fill.slice(0, 3)).toEqual([253, 240, 245]);
  expect(contrast(old.text, old.fill)).toBeLessThan(4.5);
});

test('disabled values use their semantic text role despite a legacy muted override', async ({ page }) => {
  await page.goto('/tests/legacy-theme.html?theme=dark');
  await page.evaluate(() => document.documentElement.style.setProperty('--color-text-muted', '#695276'));
  const rendered = await colors(page);
  expect(rendered.disabledText.slice(0, 3)).toEqual([160, 173, 191]);
  expect(contrast(rendered.disabledText, rendered.disabled)).toBeGreaterThanOrEqual(4.5);
  // Negative control matches the consumer's inherited legacy foreground.
  await page.locator('#disabled').evaluate(element => (element as HTMLInputElement).style.color = 'var(--color-text-muted)');
  const inherited = await colors(page);
  expect(contrast(inherited.disabledText, inherited.disabled)).toBeLessThan(4.5);
});

test('light geometry and authentication brand styling match the legacy baseline', async ({ page }) => {
  const appearance = async (baseline: boolean) => {
    await page.goto(`/tests/legacy-theme.html?theme=light${baseline ? '&baseline=1' : ''}`);
    return page.evaluate(() => Object.fromEntries([
      '.workspace-main', '.topbar', '.breadcrumb', '#editable', '#disabled', '#readonly',
      '.auth-shell', '.auth-story', '.auth-form', '.brand', '.brand-mark', '.brand-dot',
    ].map(selector => {
      const element = document.querySelector(selector)!, style = getComputedStyle(element), rect = element.getBoundingClientRect();
      return [selector, {
        bounds: [rect.x, rect.y, rect.width, rect.height],
        padding: style.padding, gap: style.gap, border: style.border,
        font: style.font, color: style.color,
        ...(selector.startsWith('.auth') || selector.startsWith('.brand') ? { background: style.backgroundColor } : {}),
      }];
    })));
  };
  expect(await appearance(false)).toEqual(await appearance(true));
});

test('legacy topbar retains normal heights and contains doubled text at 320px', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/tests/legacy-theme.html?theme=${info.project.name === 'narrow-dark' ? 'dark' : 'light'}`);
  expect(await page.locator('.topbar').evaluate(element => element.getBoundingClientRect().height)).toBe(69);
  await page.setViewportSize({ width: 320, height: 850 });
  expect(await page.locator('.topbar').evaluate(element => element.getBoundingClientRect().height)).toBe(58);
  const text = page.locator('.topbar, .topbar *, .content > h1');
  const original = await text.evaluateAll(nodes => nodes.map(element => {
    const style = getComputedStyle(element);
    return { fontSize: parseFloat(style.fontSize), lineHeight: style.lineHeight };
  }));
  const heading = page.getByRole('heading', { name: 'Synthetic settings', exact: true });
  const headingSize = await heading.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
  const headingLine = await heading.evaluate(element => parseFloat(getComputedStyle(element).lineHeight));
  await text.evaluateAll((nodes, snapshot) => nodes.forEach((element, index) => {
    const style = (element as HTMLElement).style, before = snapshot[index];
    style.fontSize = `${before.fontSize * 2}px`;
    if (before.lineHeight !== 'normal') style.lineHeight = `${parseFloat(before.lineHeight) * 2}px`;
  }), original);
  expect(await heading.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeCloseTo(headingSize * 2);
  expect(await heading.evaluate(element => parseFloat(getComputedStyle(element).lineHeight))).toBeCloseTo(headingLine * 2);
  await expect(page.locator('#topbar-project')).toHaveText('Brand launch');
  await expect(page.locator('#topbar-context')).toHaveText('Calendar');
  await expect(page.getByRole('button', { name: 'Open navigation', exact: true })).toBeVisible();
  const bounds = await page.locator('.topbar, .topbar *').evaluateAll(nodes => nodes.filter(element => getComputedStyle(element).display !== 'none').map(element => {
    const rect = element.getBoundingClientRect();
    return { label: element.id || element.className.toString(), left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  }));
  const header = bounds[0];
  expect(header.bottom - header.top).toBeGreaterThan(58);
  for (const box of bounds) {
    expect(box.left, `${box.label} left`).toBeGreaterThanOrEqual(0);
    expect(box.right, `${box.label} right`).toBeLessThanOrEqual(320);
    expect(box.top, `${box.label} top`).toBeGreaterThanOrEqual(header.top);
    expect(box.bottom, `${box.label} bottom`).toBeLessThanOrEqual(header.bottom);
  }
  expect(await page.evaluate(() => ({ width: window.innerWidth, document: document.documentElement.scrollWidth,
    scale: window.visualViewport?.scale, htmlZoom: getComputedStyle(document.documentElement).zoom, bodyZoom: getComputedStyle(document.body).zoom })))
    .toEqual({ width: 320, document: 320, scale: 1, htmlZoom: '1', bodyZoom: '1' });
  // Restore only the old fixed mobile height and non-wrapping breadcrumb.
  await page.addStyleTag({ content: '.topbar{height:58px}.breadcrumb{flex-wrap:nowrap;white-space:nowrap}' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeGreaterThan(320);
  expect(await page.locator('.breadcrumb > *').evaluateAll(nodes => nodes.some(element => element.getBoundingClientRect().right > 320))).toBeTruthy();
});
