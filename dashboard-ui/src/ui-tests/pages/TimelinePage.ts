import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Sidebar } from './Sidebar';

export class TimelinePage extends BasePage {
  private pageRef: Page;
  readonly sidebar: Sidebar;

  constructor(page: Page) {
    super(page);
    this.pageRef = page;
    this.sidebar = new Sidebar(page);
  }

  async open(): Promise<void> {
    await this.goto('/execution');
  }

  async assertLoaded(): Promise<void> {
    await expect(
      this.pageRef.getByRole('heading', { name: 'Execution Timeline' })
    ).toBeVisible();
  }

  async assertJourneyListVisible(): Promise<void> {
    await expect(
      this.pageRef.locator('div').filter({ hasText: 'run_' }).first()
    ).toBeVisible();
  }

  async clickFirstJourney(): Promise<void> {
    await this.pageRef.locator('a[href^="/execution/run_"]').first().click();
  }

  async assertRunDetailsVisible(): Promise<void> {
    await expect(
      this.pageRef.getByRole('heading', { name: /Execution Run:/ })
    ).toBeVisible();
  }
}
