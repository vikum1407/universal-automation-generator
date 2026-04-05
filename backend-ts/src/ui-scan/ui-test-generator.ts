import { Requirement } from '../rtm/rtm.model';
import * as fs from 'fs';

export class UITestGenerator {
  generate(requirement: Requirement): string {
    const testName = `${requirement.id}-${this.slug(requirement.description)}`;

    return `
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test('${requirement.id}: ${this.sanitize(requirement.description)}', async ({ page }) => {
    const steps: any[] = [];

    // Event listeners
    page.on("request", req => {
      steps.push({
        type: "request",
        url: req.url(),
        method: req.method(),
        timestamp: Date.now()
      });
    });

    page.on("response", res => {
      steps.push({
        type: "response",
        url: res.url(),
        status: res.status(),
        timestamp: Date.now()
      });
    });

    page.on("domcontentloaded", () => {
      steps.push({
        type: "domcontentloaded",
        timestamp: Date.now()
      });
    });

    page.on("load", () => {
      steps.push({
        type: "load",
        timestamp: Date.now()
      });
    });

    // Navigation
    steps.push({
      type: "action",
      action: "goto",
      url: '${requirement.page}',
      timestamp: Date.now()
    });
    await page.goto('${requirement.page}');

    // Assertion
    steps.push({
      type: "assert",
      selector: \`${this.sanitize(requirement.selector)}\`,
      timestamp: Date.now()
    });
    await expect(page.locator(\`${this.sanitize(requirement.selector)}\`).first()).toBeVisible();

    // Save replay
    const replayDir = './replay';
    if (!fs.existsSync(replayDir)) fs.mkdirSync(replayDir);

    fs.writeFileSync(
      \`\${replayDir}/${testName}.json\`,
      JSON.stringify(steps, null, 2)
    );
});
`;
  }

  private sanitize(text: string): string {
    return text.replace(/`/g, '\\`').replace(/"/g, '\\"').replace(/'/g, "\\'");
  }

  private slug(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  }
}
