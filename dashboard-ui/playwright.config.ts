import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'src/ui-tests',
  use: {
    baseURL: 'http://localhost:5173',
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
});
