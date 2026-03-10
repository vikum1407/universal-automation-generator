import * as fs from 'fs';
import * as path from 'path';

export class HybridTestWriter {
  writeHybridFlowsWithApi(flows: any[], outputDir: string) {
    const testDir = path.join(outputDir, 'tests', 'hybrid');
    fs.mkdirSync(testDir, { recursive: true });

    flows.forEach((flow, index) => {
      const filePath = path.join(testDir, `hybrid-flow-${index + 1}.spec.ts`);
      const content = this.buildTest(flow, index + 1);
      fs.writeFileSync(filePath, content);
    });
  }

  private buildTest(flow: any, id: number): string {
    const steps = flow.steps;
    const selectors = flow.selectors;
    const apiCalls = flow.apiCalls;

    const navSteps = selectors
      .map((sel: string, i: number) => `
    // Step ${i + 1}: Navigate from ${steps[i]} → ${steps[i + 1]}
    await page.click('${sel}');
    await page.waitForURL('${steps[i + 1]}');`)
      .join('\n');

    const apiAssertions = apiCalls
      .map((api: any, i: number) => `
    // API Assertion ${i + 1}
    const response${i} = await apiClient.request({
      method: '${api.method ?? 'GET'}',
      url: '${api.url}'
    });
    expect(response${i}.status).toBe(200);`)
      .join('\n');

    return `
import { test, expect } from '@playwright/test';
import axios from 'axios';

test('Hybrid Flow ${id}: ${steps.join(' → ')}', async ({ page }) => {
  const apiClient = axios.create();

  // Start at first page
  await page.goto('${steps[0]}');

  ${navSteps}

  ${apiAssertions}

  // Final assertion: page loaded
  await expect(page).toHaveURL('${steps[steps.length - 1]}');
});
`;
  }
}
