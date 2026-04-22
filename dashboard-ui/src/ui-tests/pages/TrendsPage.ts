import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class TrendsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto('/execution/trends');
  }

  async assertLoaded(): Promise<void> {
    await expect(
      this.page.getByRole('heading', { level: 1 })
    ).toBeVisible();
  }
}
