import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  fullyParallel: {{PARALLEL}},
  forbidOnly:    !!process.env.CI,
  retries:       process.env.CI ? {{RETRY_COUNT}} : 0,
  workers:       process.env.CI ? {{THREAD_COUNT}} : undefined,
  {{REPORTER_CONFIG}},

  use: {
    trace:         'on-first-retry',
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
    actionTimeout: {{TIMEOUT}},
  },

  projects: [
    // ── UI project ─────────────────────────────────────────────────────────────
    {
      name:    'ui-chrome',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL:  process.env.BASE_URL ?? '{{BASE_URL}}',
        headless: {{HEADLESS}},
      },
    },
    {
      name:    'ui-firefox',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Firefox'],
        baseURL:  process.env.BASE_URL ?? '{{BASE_URL}}',
        headless: {{HEADLESS}},
      },
    },

    // ── API project ────────────────────────────────────────────────────────────
    {
      name:    'api',
      testDir: './tests/api',
      use: {
        baseURL:          process.env.API_BASE_URL ?? '{{API_BASE_URL}}',
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
          'Accept':       'application/json',
          ...(process.env.API_TOKEN ? { 'Authorization': `Bearer ${process.env.API_TOKEN}` } : {}),
        },
      },
    },
  ],

  outputDir: 'test-results/',
});
