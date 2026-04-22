import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Sidebar } from './Sidebar';

export class ExecutionPage extends BasePage {
  readonly sidebar: Sidebar;

  constructor(page: Page) {
    super(page);
    this.sidebar = new Sidebar(page);
  }

  async open(): Promise<void> {
    await this.goto('/execution');
  }

  async assertTimelineLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/execution$/);
  }

  async assertTrendsLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/execution\/trends$/);
  }

  async assertInsightsLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/execution\/insights$/);
  }
}
