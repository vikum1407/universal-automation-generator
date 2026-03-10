import { chromium } from 'playwright';
import { APIRequirementGenerator } from './api-requirement-generator';
import { APITestWriter } from './api-test-writer';
import { RTMDocument, Requirement } from '../rtm/rtm.model';
import * as fs from 'fs';
import * as path from 'path';

export class APIPipelineOrchestrator {
  private requirementGen = new APIRequirementGenerator();
  private writer = new APITestWriter();

  async run(url: string, outputDir: string): Promise<RTMDocument> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const calls: { method: string; endpoint: string }[] = [];

    page.on('request', req => {
      const endpoint = req.url();
      const method = req.method();

      if (
        endpoint.startsWith('http') &&
        !endpoint.endsWith('.js') &&
        !endpoint.endsWith('.css') &&
        !endpoint.endsWith('.png') &&
        !endpoint.endsWith('.jpg') &&
        !endpoint.includes('google') &&
        !endpoint.includes('fonts')
      ) {
        calls.push({ method, endpoint });
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    await browser.close();

    // Convert raw calls → Requirement[]
    const apiRequirements: Requirement[] = calls.map((call, index) => ({
      id: `API-${index + 1}`,
      page: url,
      description: `API call detected: [${call.method}] ${call.endpoint}`,
      type: 'api',
      source: 'API',
      method: call.method,
      url: call.endpoint,
      expectedStatus: 200
    }));

    this.ensureProject(outputDir);

    if (apiRequirements.length > 0) {
      this.writer.writeTests(apiRequirements, outputDir);
    }

    const rtm: RTMDocument = {
      generatedAt: new Date().toISOString(),
      requirements: apiRequirements
    };

    return rtm;
  }

  private ensureProject(outputDir: string) {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const pkg = {
      name: 'generated-api-project',
      version: '1.0.0',
      private: true,
      scripts: {
        test: 'playwright test',
        'show-report': 'playwright show-report'
      },
      devDependencies: {
        '@playwright/test': '^1.42.0'
      }
    };

    const config = `
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [
    ['html', { open: 'never' }]
  ],
  use: {
    extraHTTPHeaders: {
      'Content-Type': 'application/json'
    }
  }
});
`;

    fs.writeFileSync(path.join(outputDir, 'package.json'), JSON.stringify(pkg, null, 2));
    fs.writeFileSync(path.join(outputDir, 'playwright.config.ts'), config.trim() + '\n');
  }
}
