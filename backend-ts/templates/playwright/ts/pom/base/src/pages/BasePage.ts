import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path = '') {
    await this.page.goto(path);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1500);
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  protected async clickAndWait(locator: Locator) {
    await locator.click();
    await this.waitForLoad();
  }

  protected async fillField(locator: Locator, value: string) {
    await locator.clear();
    await locator.fill(value);
  }

  protected async assertVisible(locator: Locator, message?: string) {
    await expect(locator, message).toBeVisible();
  }

  protected async assertText(locator: Locator, expected: string) {
    await expect(locator).toHaveText(expected);
  }
}
