import { Requirement } from '../rtm/rtm.model';
import * as fs from 'fs';

export class UITestGenerator {
  generate(requirement: Requirement): string {
    const testName = `${requirement.id}-${this.slug(requirement.description)}`;

    const pageUrl = requirement.source.pageName ?? '';
    const selector = requirement.aiLogic?.primarySelector ?? '';
    const action = requirement.aiLogic?.primaryAction ?? 'click';

    return `
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test('${requirement.id}: ${this.sanitize(requirement.description)}', async ({ page }) => {
    const steps: any[] = [];

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
      url: '${pageUrl}',
      timestamp: Date.now()
    });
    await page.goto('${pageUrl}');

    // Interaction (AI-driven)
    steps.push({
      type: "action",
      action: '${action}',
      selector: \`${this.sanitize(selector)}\`,
      timestamp: Date.now()
    });

    if ('${action}' === 'click') {
      await page.locator(\`${this.sanitize(selector)}\`).first().click();
    } else {
      await page.locator(\`${this.sanitize(selector)}\`).first().${action}();
    }

    // Assertion
    steps.push({
      type: "assert",
      selector: \`${this.sanitize(selector)}\`,
      timestamp: Date.now()
    });
    await expect(page.locator(\`${this.sanitize(selector)}\`).first()).toBeVisible();

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
