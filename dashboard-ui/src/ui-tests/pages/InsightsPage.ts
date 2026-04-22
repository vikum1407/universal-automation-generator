import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Sidebar } from './Sidebar';

export class InsightsPage extends BasePage {
  private pageRef: Page;
  readonly sidebar: Sidebar;

  constructor(page: Page) {
    super(page);
    this.pageRef = page;
    this.sidebar = new Sidebar(page);
  }

  async open(): Promise<void> {
    await this.goto('/execution/insights');
  }

  async assertLoaded(): Promise<void> {
    await expect(
      this.pageRef.getByRole('heading', { name: 'Execution Insights' })
    ).toBeVisible();
  }

  async assertHighlightsVisible(): Promise<void> {
    await expect(
      this.pageRef.getByText('Highlights')
    ).toBeVisible();
  }

  async assertMetricsVisible(): Promise<void> {
    await expect(this.pageRef.getByText('Risk Score')).toBeVisible();
    await expect(this.pageRef.getByText('Stability Score')).toBeVisible();
    await expect(this.pageRef.getByText('Coverage Score')).toBeVisible();
  }
}
