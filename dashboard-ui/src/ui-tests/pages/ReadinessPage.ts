import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReadinessPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto('/release');
  }

  async assertLoaded(): Promise<void> {
    await expect(
      this.page.getByRole('heading', { name: /Release Readiness/i })
    ).toBeVisible();
  }
}
