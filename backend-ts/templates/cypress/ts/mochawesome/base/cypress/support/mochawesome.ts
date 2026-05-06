// Mochawesome reporter setup for {{PROJECT_NAME}}
// Requires: cypress-mochawesome-reporter
// In cypress.config.ts reporter field:
//   reporter: 'cypress-mochawesome-reporter',
//   reporterOptions: {
//     charts: true,
//     reportPageTitle: '{{PROJECT_NAME}} Test Report',
//     embeddedScreenshots: true,
//     inlineAssets: true,
//     saveAllAttempts: false,
//   },
// In cypress/support/e2e.ts add:
//   import 'cypress-mochawesome-reporter/register';

export {};
