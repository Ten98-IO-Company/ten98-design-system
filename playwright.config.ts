import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  timeout: 60_000,
  globalTimeout: 15 * 60_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5196',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'narrow-dark', use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 850 }, colorScheme: 'dark' } },
    // Key handling is engine-specific (key reachability, and focus hand-off in the entry grid); the rest runs on Chromium.
    { name: 'firefox', testMatch: /key-reachability\.spec\.ts/, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testMatch: /(key-reachability|entry-grid(-rules)?)\.spec\.ts/, use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'node scripts/serve-browser.mjs',
    url: 'http://127.0.0.1:5196',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
