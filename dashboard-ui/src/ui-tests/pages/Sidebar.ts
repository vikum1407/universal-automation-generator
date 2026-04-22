import type { Page } from '@playwright/test';

export class Sidebar {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private async click(text: string): Promise<void> {
    const locator = this.page.locator(`a:has-text("${text}")`);
    await locator.first().waitFor({ timeout: 20000, state: 'visible' });
    await locator.first().click();
  }

  async timeline(): Promise<void> {
    await this.click('Timeline');
  }

  async trends(): Promise<void> {
    await this.click('Trends');
  }

  async insights(): Promise<void> {
    await this.click('Insights');
  }
}
