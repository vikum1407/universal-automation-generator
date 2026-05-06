import { test as base } from '@playwright/test';

// Extend base test with your page fixtures here.
// Example:
//
//   import { HomePage } from '@pages/HomePage';
//   type MyFixtures = { homePage: HomePage };
//
//   export const test = base.extend<MyFixtures>({
//     homePage: async ({ page }, use) => {
//       await use(new HomePage(page));
//     },
//   });

export const test = base;
export { expect } from '@playwright/test';
