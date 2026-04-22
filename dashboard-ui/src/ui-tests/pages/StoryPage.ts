import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class StoryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto('/release/story');
  }

  async assertLoaded(): Promise<void> {
    await expect(
      this.page.locator('main').getByText(/Story/i).first()
    ).toBeVisible();
  }
}
