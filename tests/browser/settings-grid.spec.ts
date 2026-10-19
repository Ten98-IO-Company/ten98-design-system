import { expect, test, type Page } from '@playwright/test';

async function contained(page: Page, columns: number) {
  const geometry = await page.locator('.settings-grid').evaluate(grid => {
    const bounds = grid.getBoundingClientRect();
    const scroll = grid.querySelector('.table-scroll')!;
    return {
      columns: getComputedStyle(grid).gridTemplateColumns.split(/\s+/).length,
      documentFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      childrenFit: [...grid.children].every(child => child.getBoundingClientRect().right <= bounds.right + 1),
      controlsFit: [...grid.querySelectorAll('input, select, button')].filter(control => !control.closest('.table-scroll')).every(control => {
        const panel = control.closest('.panel')!.getBoundingClientRect(), rect = control.getBoundingClientRect();
        return rect.left >= panel.left && rect.right <= panel.right;
      }),
      tableScrolls: scroll.scrollWidth > scroll.clientWidth,
      scrollFitsPanel: scroll.getBoundingClientRect().right <= scroll.closest('.panel')!.getBoundingClientRect().right,
      zoom: [getComputedStyle(document.body).zoom, getComputedStyle(document.documentElement).zoom],
    };
  });
  expect(geometry).toEqual({ columns, documentFits: true, childrenFit: true, controlsFit: true,
    tableScrolls: true, scrollFitsPanel: true, zoom: ['1', '1'] });
  await expect(page.getByRole('columnheader')).toHaveText(['Email', 'Role', 'Expires', 'Status', 'Action']);
  await expect(page.getByRole('cell', { name: 'colleague@yourcompany.com', exact: true })).toBeVisible();
  await page.locator('.table-scroll').scrollIntoViewIfNeeded();
  await page.locator('.table-scroll').evaluate(element => element.scrollLeft = element.scrollWidth);
  await expect(page.getByRole('button', { name: 'Revoke', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
}

async function oldMinimumOverflows(page: Page) {
  const old = await page.addStyleTag({ content: '.settings-grid > * { min-width:auto }' });
  const overflow = await page.locator('.settings-grid').evaluate(grid => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    child: Math.max(...[...grid.children].map(child => child.getBoundingClientRect().right)) - grid.getBoundingClientRect().right,
  }));
  expect(overflow.document).toBeGreaterThan(1);
  expect(overflow.child).toBeGreaterThan(1);
  await old.evaluate(element => element.remove());
}

test('native settings columns contain their table at desktop and 320px with doubled text', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/tests/legacy-theme.html?theme=${info.project.name === 'narrow-dark' ? 'dark' : 'light'}`);
  // Rendered native structure from Campaign main.tsx and WorkspaceInvitations.tsx.
  // Both plain column wrappers matter: panel/table scrolling already worked inside them.
  await page.locator('body').evaluate(body => body.innerHTML = `
    <section class="workspace-main"><main class="content"><h1>Settings</h1><div class="settings-grid">
      <div><section class="panel settings-panel"><h2>Project settings</h2>
        <form id="project-form"><label class="field"><span>Project name *</span><input name="name" value="Brand launch" required></label><button class="button primary">Save project name</button></form>
        <p><button class="button">Manage integrations and project connections</button></p>
      </section></div>
      <div><section class="panel settings-panel"><h2>Invite your team</h2>
        <p>Give a colleague access to every project in this workspace. Invitation links expire after seven days and can be used once.</p>
        <form id="invite-form"><fieldset>
          <label class="field"><span>Colleague’s email *</span><input name="email" type="email" required maxlength="254" autocomplete="email" placeholder="colleague@yourcompany.com"></label>
          <label class="field"><span>Workspace role</span><select name="role"><option value="editor">Editor</option><option value="viewer">Viewer</option></select></label>
          <button class="button primary">Create invitation link</button>
        </fieldset></form>
        <p class="helper-note">Share the link yourself. Creating an invitation sends no email.</p>
        <div class="table-scroll"><table><thead><tr><th>Email</th><th>Role</th><th>Expires</th><th>Status</th><th>Action</th></tr></thead>
          <tbody><tr><td>colleague@yourcompany.com</td><td>editor</td><td>26/10/2026</td><td>pending</td><td><button type="button" class="button danger">Revoke</button></td></tr></tbody>
        </table></div>
      </section></div>
    </div></main></section>`);
  await page.evaluate(() => document.fonts.ready);
  await contained(page, 2);
  await page.setViewportSize({ width: 320, height: 1000 });
  await contained(page, 1);
  await oldMinimumOverflows(page);

  const doubled = await page.locator('.content').evaluate(root => {
    const before = [root, ...root.querySelectorAll<HTMLElement>('*')].map(element => {
      const style = getComputedStyle(element);
      return { element: element as HTMLElement, font: parseFloat(style.fontSize), line: parseFloat(style.lineHeight) };
    });
    for (const { element, font, line } of before) {
      element.style.fontSize = `${font * 2}px`;
      if (Number.isFinite(line)) element.style.lineHeight = `${line * 2}px`;
    }
    return before.map(({ element, font }) => ({ before: font, after: parseFloat(getComputedStyle(element).fontSize) }));
  });
  for (const font of doubled) expect(font.after).toBeCloseTo(font.before * 2);
  await contained(page, 1);
  await page.getByRole('textbox', { name: 'Project name *', exact: true }).fill('Retained project draft');
  await page.getByRole('textbox', { name: 'Colleague’s email *', exact: true }).fill('invitee@example.test');
  await page.getByRole('combobox', { name: 'Workspace role', exact: true }).selectOption('viewer');
  expect(await page.locator('#project-form').evaluate(form => Object.fromEntries(new FormData(form as HTMLFormElement)))).toEqual({ name: 'Retained project draft' });
  expect(await page.locator('#invite-form').evaluate(form => Object.fromEntries(new FormData(form as HTMLFormElement)))).toEqual({ email: 'invitee@example.test', role: 'viewer' });
  await oldMinimumOverflows(page);
});
