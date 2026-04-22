import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HeatmapPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto('/release/heatmap');
  }

  async assertLoaded(): Promise<void> {
    await expect(
      this.page.locator('main').getByText(/Heatmap/i).first()
    ).toBeVisible();
  }
}
