import { Requirement } from '../rtm/rtm.model';

export class UITestGenerator {
  generate(requirement: Requirement): string {
    return `
import { test, expect } from '@playwright/test';

test('${requirement.id}: ${this.sanitize(requirement.description)}', async ({ page }) => {
    await page.goto('${requirement.page}');
    await expect(page.locator(\`${this.sanitize(requirement.selector)}\`).first()).toBeVisible();
});
`;
  }

  private sanitize(text: string): string {
    return text.replace(/`/g, '\\`').replace(/"/g, '\\"').replace(/'/g, "\\'");
  }
}
