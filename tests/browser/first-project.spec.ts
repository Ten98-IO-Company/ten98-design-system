import { expect, test } from '@playwright/test';

test('the in-shell first-project step submits the sample-data choice and offers Skip beside its submit', async ({ page }) => {
  await page.goto('/tests/first-project.html');
  await page.getByLabel('Project name').fill('Spring launch');
  await page.getByLabel('Add sample data').check();
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.locator('#log')).toHaveText('{"name":"Spring launch","sample":true}');

  const create = (await page.getByRole('button', { name: 'Create project' }).boundingBox())!;
  const skip = page.getByRole('button', { name: 'Skip for now' });
  const skipBox = (await skip.boundingBox())!;
  expect(Math.abs(skipBox.y - create.y)).toBeLessThan(create.height * 2.5);
  await skip.click();
  await expect(page.locator('#log')).toHaveText('skipped');
});

test('a project name of only spaces shows a field error instead of submitting (#151)', async ({ page }) => {
  await page.goto('/tests/first-project.html');
  await page.getByLabel('Project name').fill('   ');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByText('Enter a project name.')).toBeVisible();
  await expect(page.getByLabel('Project name')).toBeFocused();
  await expect(page.locator('#log')).toHaveText('');
  await page.getByLabel('Project name').fill('  Spring launch  ');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.locator('#log')).toHaveText('{"name":"Spring launch","sample":false}');
});

test('the default asks for the name only', async ({ page }) => {
  await page.goto('/tests/first-project.html');
  await expect(page.getByLabel('Project name')).toBeVisible();
  await expect(page.getByLabel('Site origin')).toHaveCount(0);
  await expect(page.getByRole('textbox')).toHaveCount(1);
});

test.describe('the website step: the address comes first and suggests the name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/first-project.html?address=1');
  });

  test('the address sits above the name, and Tab goes from one to the other', async ({ page }) => {
    const address = page.getByLabel('Site origin');
    const name = page.getByLabel('Project name');
    expect((await address.boundingBox())!.y).toBeLessThan((await name.boundingBox())!.y);
    await address.focus();
    await page.keyboard.press('Tab');
    await expect(name).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Add sample data')).toBeFocused();
  });

  test('the name follows the address as it is typed, from its hostname without www', async ({ page }) => {
    const address = page.getByLabel('Site origin');
    const name = page.getByLabel('Project name');
    await expect(name).toHaveValue('');
    await address.fill('https://www.example.com/x');
    await expect(name).toHaveValue('example.com');
    await address.fill('shop.example.org/products?page=2');
    await expect(name).toHaveValue('shop.example.org');
    await address.fill('');
    await expect(name).toHaveValue('');
    await address.pressSequentially('https://www.example.net/about');
    await expect(name).toHaveValue('example.net');
    // Text that is not an address yet suggests nothing, so a half-typed address leaves no stale name behind.
    await address.fill('https://');
    await expect(name).toHaveValue('');
  });

  test('a name the person edits is never overwritten by later address changes', async ({ page }) => {
    const address = page.getByLabel('Site origin');
    const name = page.getByLabel('Project name');
    await address.fill('https://www.example.com');
    await expect(name).toHaveValue('example.com');
    await name.focus();
    await page.keyboard.press('End');
    await page.keyboard.type(' shop');
    await expect(name).toHaveValue('example.com shop');
    await address.fill('https://www.example.org');
    await expect(name).toHaveValue('example.com shop');
    await address.fill('');
    await expect(name).toHaveValue('example.com shop');
    // Clearing the name is an edit too: it stays empty rather than refilling.
    await name.fill('');
    await address.fill('https://www.example.net');
    await expect(name).toHaveValue('');
  });

  test('a name typed before the address is kept', async ({ page }) => {
    await page.getByLabel('Project name').fill('Acme');
    await page.getByLabel('Site origin').fill('https://www.example.com');
    await expect(page.getByLabel('Project name')).toHaveValue('Acme');
  });

  test('replacing the suggestion with text of the person\'s own takes the name over', async ({ page }) => {
    const address = page.getByLabel('Site origin');
    const name = page.getByLabel('Project name');
    await address.fill('https://www.example.com');
    await expect(name).toHaveValue('example.com');
    await name.fill('example.org');
    await address.fill('https://www.example.net');
    await expect(name).toHaveValue('example.org');
  });

  test('a name the app gives is never replaced by the address', async ({ page }) => {
    await page.goto('/tests/first-project.html?address=1&named=1');
    await expect(page.getByLabel('Project name')).toHaveValue('Spring launch');
    await page.getByLabel('Site origin').fill('https://www.example.com');
    await expect(page.getByLabel('Project name')).toHaveValue('Spring launch');
  });

  test('submits the suggested name with the address, and an edited name with it', async ({ page }) => {
    const address = page.getByLabel('Site origin');
    await address.fill('https://www.example.com/x');
    await page.getByRole('button', { name: 'Create project' }).click();
    await expect(page.locator('#log')).toHaveText('{"name":"example.com","origin":"https://www.example.com/x","sample":false}');
    await page.getByLabel('Project name').fill('Example shop');
    await page.getByRole('button', { name: 'Create project' }).click();
    await expect(page.locator('#log')).toHaveText('{"name":"Example shop","origin":"https://www.example.com/x","sample":false}');
  });
});
