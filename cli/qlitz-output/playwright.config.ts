import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './ui-tests',
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'playwright-report.json' }]
  ]
});
