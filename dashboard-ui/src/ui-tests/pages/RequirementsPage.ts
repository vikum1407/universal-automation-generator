import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class RequirementsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto('/dashboard/projects/my-app/requirements');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.page.locator('text=REQ-')).toBeVisible();
  }
}
