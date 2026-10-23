import { test, expect, type Page } from '@playwright/test';

const brandAppearance = (page: Page) => page.locator('.auth-shell').evaluate(element => {
  const style = (selector: string) => getComputedStyle(element.querySelector(selector)!);
  const mark = style('.brand-mark'), brand = style('.brand'), form = style('.auth-form-inner');
  return { mark: [mark.width, mark.height, mark.borderRadius, mark.font, mark.color, mark.backgroundColor], brand: [brand.gap, brand.padding, brand.color], formMax: form.maxWidth };
});

test('standalone auth shares Campaign composition and retains native forms in both themes', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const theme of ['light', 'dark']) {
    await page.goto(`/tests/legacy-theme.html?theme=${theme}`);
    const nativeBrand = await brandAppearance(page);
    for (const single of [false, true]) {
    await page.goto(`/tests/auth-layout.html?theme=${theme}${single ? '&single' : ''}`);
    const shell = page.locator('.auth-shell');
    await expect(shell).toBeVisible();
    await expect(shell.getByRole('heading', { level: 1, name: 'Sign in' })).toHaveCount(1);
    await expect(shell.locator('.auth-story')).toHaveCount(single ? 0 : 1);
    await expect(shell.locator('.brand')).toHaveCount(1);
    const geometry = await shell.evaluate(element => {
      const form = element.querySelector('.auth-form')!.getBoundingClientRect();
      const story = element.querySelector('.auth-story')?.getBoundingClientRect();
      return { columns: getComputedStyle(element).gridTemplateColumns.split(' ').length, formWidth: form.width, storyWidth: story?.width, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    expect(geometry.overflow).toBe(false);
    expect(geometry.columns).toBe(single || page.viewportSize()!.width <= 760 ? 1 : 2);
    if (!single) {
      expect(await brandAppearance(page)).toEqual(nativeBrand);
      await expect(shell.getByText('Consumer instructions must remain visible.')).toBeVisible();
      await expect(shell.getByRole('link', { name: 'Recover access' })).toBeVisible();
    }
    if (!single && page.viewportSize()!.width > 960) expect(geometry.formWidth).toBeCloseTo(geometry.storyWidth!, 0);
    const spacing = await shell.locator('form').evaluate(form => {
      const fields = [...form.querySelectorAll('.t98-field')].map(field => field.getBoundingClientRect());
      const action = form.querySelector('button[type=submit]')!.getBoundingClientRect();
      return {
        betweenFields: fields[1]!.top - fields[0]!.bottom,
        beforeAction: action.top - fields[1]!.bottom,
        hints: [...form.querySelectorAll('.t98-field')].map(field => field.querySelector('.t98-field-description')!.getBoundingClientRect().top - field.querySelector('input')!.getBoundingClientRect().bottom),
      };
    });
    expect(spacing.betweenFields).toBeCloseTo(20, 0);
    expect(spacing.beforeAction).toBeCloseTo(25, 0);
    expect(spacing.hints).toEqual([7, 7]);
    await expect(shell.getByLabel('Email address')).toHaveAccessibleDescription('Use the email address registered to your account.');
    await expect(shell.getByLabel('Password')).toHaveAccessibleDescription('Use your account password.');
    await shell.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(shell.getByRole('status')).toHaveCount(0);
    await shell.getByLabel('Email address').fill('invalid-email');
    await shell.getByLabel('Password').fill('synthetic-password');
    await shell.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(shell.getByRole('status')).toHaveCount(0);
    await shell.getByLabel('Email address').fill('member@example.test');
    await shell.getByLabel('Password').fill('');
    await shell.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(shell.getByRole('status')).toHaveCount(0);
    await shell.getByLabel('Password').fill('synthetic-password');
    await shell.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(shell.getByRole('status')).toHaveText('Form validated: email, password. No authentication request sent.');
    expect(await shell.locator('form').evaluate(element => Object.fromEntries(new FormData(element as HTMLFormElement)))).toEqual({ email: 'member@example.test', password: 'synthetic-password' });
    await page.screenshot({ path: info.outputPath(`auth-${theme}-${single ? 'single' : 'split'}.png`), fullPage: true });
    }
  }
  expect(errors).toEqual([]);
});

test('the split story panel fills the viewport height from the top; narrow stays stacked', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1600 });
  await page.goto('/tests/auth-layout.html');
  const wide = await page.locator('.auth-story').evaluate(element => ({ offset: element.getBoundingClientRect().top - element.closest('.auth-shell')!.getBoundingClientRect().top, height: element.getBoundingClientRect().height, viewport: innerHeight }));
  expect(wide.offset).toBe(0);
  expect(wide.height).toBeGreaterThanOrEqual(wide.viewport);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tests/auth-layout.html');
  const narrow = await page.locator('.auth-shell').evaluate(element => ({ columns: getComputedStyle(element).gridTemplateColumns.split(' ').length, overflow: document.documentElement.scrollWidth > innerWidth + 1, story: element.querySelector('.auth-story')!.getBoundingClientRect().height, viewport: innerHeight }));
  expect(narrow.columns).toBe(1);
  expect(narrow.overflow).toBe(false);
  expect(narrow.story).toBeLessThan(narrow.viewport);
});

test('brand guide and catalogue reuse the same auth layout and app-owned states', async ({ page }, info) => {
  for (const theme of ['light', 'dark']) {
    const prefix = theme === 'dark' ? '/?theme=dark' : '/';
    await page.goto(`${prefix}#brand`);
    const frame = page.frameLocator('iframe[title^="Campaign login:"]');
    await expect(frame.locator('.auth-shell')).toBeVisible();
    await expect(frame.getByRole('heading', { name: 'Sign in', level: 1 })).toBeVisible();
    expect(await frame.locator('.auth-story-title').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    await page.getByLabel('Reference state').selectOption('Owner setup');
    await expect(frame.getByRole('heading', { name: 'Create owner account', level: 1 })).toBeVisible();
    await expect(frame.getByLabel('Your name')).toBeVisible();
    await expect(frame.locator('.field-help')).toHaveText('Use at least 12 characters.');
    const legacySpacing = await frame.locator('.auth-form form').evaluate(form => {
      const fields = [...form.querySelectorAll('.field')].map(field => field.getBoundingClientRect());
      const hint = form.querySelector('.field-help')!.getBoundingClientRect();
      const action = form.querySelector('button[type=submit]')!.getBoundingClientRect();
      return { betweenFields: fields[1]!.top - fields[0]!.bottom, beforeHint: hint.top - fields[2]!.bottom, afterHint: action.top - hint.bottom };
    });
    expect(legacySpacing.betweenFields).toBeCloseTo(20, 0);
    expect(legacySpacing.beforeHint).toBeCloseTo(13, 0);
    expect(legacySpacing.afterHint).toBeCloseTo(22, 0);
    await page.screenshot({ path: info.outputPath(`auth-legacy-${theme}-hint.png`), fullPage: true });
    await page.getByLabel('Reference state').selectOption('Signing in');
    await expect(frame.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
    await page.getByLabel('Reference state').selectOption('Error');
    await expect(frame.getByRole('alert')).toContainText('Sign-in failed.');
    await expect(page.locator('.reference-section').filter({ has: page.getByRole('heading', { name: 'Login pattern', exact: true }) }).locator('.reference-code')).toContainText('<AuthLayout');
    await page.goto(`${prefix}#components/auth-layout?tab=states`);
    const states = page.locator('.reference-state');
    await expect(states).toHaveCount(4);
    await expect(states.locator('.auth-shell')).toHaveCount(4);
    await expect(states.locator('.auth-form h1')).toHaveCount(4);
    await expect(states.locator('.auth-story')).toHaveCount(1);
    const appHeading = states.filter({ has: page.getByRole('heading', { name: 'App-owned heading', exact: true }) });
    await expect(appHeading.locator('.auth-form-inner > .t98-auth-title')).toHaveCount(0);
    await expect(appHeading.locator('form > .t98-auth-title')).toHaveText('Recover account');
    await expect(appHeading.locator('.auth-form h1')).toHaveText('Recover account');
    await expect(appHeading.locator('.auth-form form')).toHaveCount(1);
    await expect(appHeading.getByRole('textbox', { name: 'Email', exact: true })).toHaveAttribute('type', 'email');
    await expect(appHeading.getByRole('textbox', { name: 'Email', exact: true })).toHaveAttribute('required', '');
    await expect(appHeading.getByRole('textbox', { name: 'Email', exact: true })).toHaveAttribute('autocomplete', 'username');
    const headingGap = await appHeading.locator('form').evaluate(form => form.querySelector('.t98-field')!.getBoundingClientRect().top - form.querySelector('h1')!.getBoundingClientRect().bottom);
    expect(headingGap).toBeCloseTo(16, 0);
    const errorState = states.filter({ has: page.getByRole('heading', { name: 'App-owned error composition', exact: true }) });
    const feedbackSpacing = await errorState.locator('form').evaluate(form => {
      const fields = form.querySelectorAll('.t98-field');
      const alert = form.querySelector('[role=alert]')!.getBoundingClientRect();
      const action = form.querySelector('button[type=submit]')!.getBoundingClientRect();
      return { before: alert.top - fields[1]!.getBoundingClientRect().bottom, after: action.top - alert.bottom };
    });
    expect(feedbackSpacing.before).toBeCloseTo(20, 0);
    expect(feedbackSpacing.after).toBeCloseTo(21, 0);
    await expect(page.locator('html')).toHaveJSProperty('scrollWidth', await page.locator('html').evaluate(element => element.clientWidth));
    await page.screenshot({ path: info.outputPath(`auth-catalogue-${theme}-states.png`), fullPage: true });
  }
});

test('auth controls have a touch floor and grow with root text without enlarging choice glyphs', async ({ page }, info) => {
  for (const theme of ['light', 'dark']) {
    for (const entry of ['auth-layout', 'legacy-theme']) {
      await page.goto('/tests/' + entry + '.html?theme=' + theme);
      const form = page.locator('.auth-form-inner');
      await expect(form).toBeVisible();
      // Add native compatibility controls to the existing entry-point fixtures;
      // standalone auth also retains its real React Input and Button controls.
      await form.evaluate(element => {
        const controls = document.createElement('div');
        controls.dataset.authSizing = '';
        const field = document.createElement('label');
        field.className = 'field';
        field.textContent = 'Native email';
        const input = document.createElement('input');
        input.type = 'email';
        input.required = true;
        field.append(input);
        controls.append(field);
        const selectLabel = document.createElement('label');
        selectLabel.className = 'field';
        selectLabel.textContent = 'Workspace choice';
        const select = document.createElement('select');
        select.append(new Option('Workspace', 'workspace'));
        selectLabel.append(select);
        controls.append(selectLabel);
        for (const className of ['button', 'btn']) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = className;
          button.textContent = 'Continue';
          controls.append(button);
        }
        for (const type of ['checkbox', 'radio']) {
          const label = document.createElement('label');
          label.className = 'checkbox-label';
          const choice = document.createElement('input');
          choice.type = type;
          label.append(choice, 'Remember this choice');
          controls.append(label);
        }
        element.append(controls);
      });
      const sizes = () => form.evaluate(element => ({
        controls: [...element.querySelectorAll('input:not([type=checkbox]):not([type=radio]),select,button')].map(control => control.getBoundingClientRect().height),
        glyphs: [...element.querySelectorAll('input[type=checkbox],input[type=radio]')].map(control => {
          const rect = control.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      }));
      await page.locator('html').evaluate(element => { element.style.fontSize = '16px'; });
      const normal = await sizes();
      expect(normal.controls.length).toBeGreaterThanOrEqual(entry === 'auth-layout' ? 7 : 4);
      expect(normal.controls.every(height => height >= 44)).toBe(true);
      expect(normal.glyphs).toEqual([{ width: 14, height: 14 }, { width: 14, height: 14 }]);
      expect(normal.overflow).toBe(false);
      await expect(form.getByLabel('Native email', { exact: true })).toHaveJSProperty('required', true);
      await page.locator('html').evaluate(element => { element.style.fontSize = '12px'; });
      const reduced = await sizes();
      expect(reduced.controls.every(height => height >= 44)).toBe(true);
      expect(reduced.glyphs).toEqual(normal.glyphs);
      await page.locator('html').evaluate(element => { element.style.fontSize = '24px'; });
      const enlarged = await sizes();
      expect(enlarged.controls.every((height, index) => height >= 66 && height > normal.controls[index]!)).toBe(true);
      expect(enlarged.glyphs).toEqual(normal.glyphs);
      expect(enlarged.overflow).toBe(false);
      await page.screenshot({ path: info.outputPath('auth-controls-' + entry + '-' + theme + '-enlarged.png'), fullPage: true });
    }
  }
});
