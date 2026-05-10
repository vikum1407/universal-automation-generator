import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir:       './tests/api',
  fullyParallel: {{PARALLEL}},
  forbidOnly:    !!process.env.CI,
  retries:       process.env.CI ? {{RETRY_COUNT}} : 0,
  workers:       process.env.CI ? {{THREAD_COUNT}} : undefined,
  timeout:       {{TIMEOUT}},
  {{REPORTER_CONFIG}},

  use: {
    baseURL:            process.env.API_BASE_URL ?? '{{API_BASE_URL}}',
    extraHTTPHeaders:   {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
      ...(process.env.API_TOKEN ? { 'Authorization': `Bearer ${process.env.API_TOKEN}` } : {}),
    },
  },

  outputDir: 'test-results/',
});
