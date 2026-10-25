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
