import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:         './src/tests',
  fullyParallel:   {{PARALLEL}},
  forbidOnly:      !!process.env.CI,
  retries:         process.env.CI ? {{RETRY_COUNT}} : 0,
  workers:         process.env.CI ? {{THREAD_COUNT}} : undefined,
  {{REPORTER_CONFIG}},

  use: {
    baseURL:      '{{BASE_URL}}',
    headless:     {{HEADLESS}},
    trace:        'on-first-retry',
    screenshot:   'only-on-failure',
    video:        'retain-on-failure',
    actionTimeout: {{TIMEOUT}},
  },

  projects: [
    {
      name:  '{{BROWSER}}',
      use:   { ...devices['Desktop Chrome'] },
    },
  ],

  outputDir: 'test-results/',
});
