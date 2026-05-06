// Allure configuration for {{PROJECT_NAME}}
// Add 'allure-playwright' to the reporter array in playwright.config.ts:
//   reporter: [['allure-playwright', { detail: true, outputFolder: 'allure-results' }]]

export const allureConfig = {
  detail:       true,
  outputFolder: 'allure-results',
  suiteTitle:   true,
  environmentInfo: {
    framework: '{{FRAMEWORK}}',
    language:  '{{LANGUAGE}}',
    baseUrl:   '{{BASE_URL}}',
    browser:   '{{BROWSER}}',
    version:   '{{VERSION}}',
  },
};
