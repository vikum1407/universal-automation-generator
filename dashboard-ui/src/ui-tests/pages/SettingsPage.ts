import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SettingsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(projectId: string): Promise<void> {
    await this.goto(`/projects/${projectId}`);

    // Wait for the project sidebar to load
    await this.page.getByRole('button', { name: /^Overview$/i }).waitFor();

    // Click the Settings button in the project sidebar
    await this.page.getByRole('button', { name: /^Settings$/i }).click();
  }

  async assertSettingsVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /Self-?Updating Selectors/i })).toBeVisible();
    await expect(this.page.getByRole('heading', { name: /AI Test Refactoring/i })).toBeVisible();
    await expect(this.page.getByRole('heading', { name: /Cloud Sync/i })).toBeVisible();
  }
}
