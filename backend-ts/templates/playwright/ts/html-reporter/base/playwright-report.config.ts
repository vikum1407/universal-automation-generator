// Playwright HTML reporter configuration for {{PROJECT_NAME}}
// This file documents the reporter options — add to playwright.config.ts reporter array:
//
//   reporter: [
//     ['html', { outputFolder: 'playwright-report', open: 'never' }],
//   ],

export const htmlReporterConfig = {
  outputFolder: 'playwright-report',
  // 'always' | 'never' | 'on-failure'
  open: 'on-failure' as const,
};
