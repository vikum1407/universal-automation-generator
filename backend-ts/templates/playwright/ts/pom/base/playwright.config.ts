import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:       './tests/ui',
  fullyParallel: {{PARALLEL}},
  forbidOnly:    !!process.env.CI,
  retries:       process.env.CI ? {{RETRY_COUNT}} : 0,
  workers:       process.env.CI ? {{THREAD_COUNT}} : undefined,
  {{REPORTER_CONFIG}},

  use: {
    baseURL:       process.env.BASE_URL ?? '{{BASE_URL}}',
    headless:      {{HEADLESS}},
    trace:         'on-first-retry',
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
    actionTimeout: {{TIMEOUT}},
  },

  projects: [
    /* ── Desktop browsers ── */
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use:  { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use:  { ...devices['Desktop Safari'] },
    },
    /* ── Mobile viewports ── */
    {
      name: 'mobile-chrome',
      use:  { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use:  { ...devices['iPhone 14'] },
    },
  ],

  outputDir: 'test-results/',
});
