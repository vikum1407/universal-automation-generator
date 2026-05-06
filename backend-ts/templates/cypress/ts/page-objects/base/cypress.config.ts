import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl:          '{{BASE_URL}}',
    specPattern:      'cypress/e2e/**/*.cy.ts',
    supportFile:      'cypress/support/e2e.ts',
    defaultCommandTimeout: {{TIMEOUT}},
    pageLoadTimeout:  60000,
    screenshotOnRunFailure: true,
    video:            false,
    retries: {
      runMode:  {{RETRY_COUNT}},
      openMode: 0,
    },
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
