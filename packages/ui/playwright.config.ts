import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the @expense-tracker/ui workspace.
 *
 * Tests live in ./e2e and run against a Next.js dev server that Playwright
 * starts automatically (see `webServer` below). Network calls to the API are
 * stubbed inside the tests, so no backend needs to be running.
 *
 * See https://playwright.dev/docs/test-configuration.
 */
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  /* Run tests within a file in parallel. */
  fullyParallel: true,
  /* Fail the build on CI if a `test.only` is accidentally committed. */
  forbidOnly: !!process.env.CI,
  /* Retry only on CI, where flakiness is more likely. */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel workers on CI for more stable runs. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters. */
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  /* Shared settings for all the projects below. */
  use: {
    baseURL: BASE_URL,
    /* Collect a trace when retrying a failed test for easier debugging. */
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start the Next.js dev server before running the tests. */
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
