import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  timeout: 60_000,
  globalTimeout: 10 * 60_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5198',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'narrow-dark', use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 850 }, colorScheme: 'dark' } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5198',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});

