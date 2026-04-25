import { chromium } from 'playwright';
import { APIRequirementGenerator } from './api-requirement-generator';
import { APITestWriter } from '../projects/api/api-test-writer';
import { RTMDocument, Requirement } from '../rtm/rtm.model';
import * as fs from 'fs';
import * as path from 'path';

import { progressService } from '../services/ProgressService';
import { ProgressGateway } from '../gateways/progress.gateway';

export class APIPipelineOrchestrator {
  private requirementGen = new APIRequirementGenerator();
  private writer = new APITestWriter();

  constructor(
    private readonly projectId: string,
    private readonly gateway: ProgressGateway
  ) {}

  private emitProgress(percent: number, step: string) {
    progressService.update(this.projectId, percent, step);
    this.gateway.emitRecrawlProgress(this.projectId, percent, step);
    this.gateway.emitProjectStatus(this.projectId);
  }

  async run(url: string, outputDir: string): Promise<any> {
    const pipelineStart = Date.now();

    this.emitProgress(5, "Starting API pipeline…");

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

    this.emitProgress(20, "Capturing API calls…");

    const captureStart = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    await browser.close();
    const captureMs = Date.now() - captureStart;

    this.emitProgress(40, "Generating API requirements…");

    const apiRequirements: Requirement[] = calls.map((call, index) => ({
      id: `API-${index + 1}`,
      title: `API ${call.method} ${call.endpoint}`,
      description: `API call detected: [${call.method}] ${call.endpoint}`,
      type: 'api',
      source: {
        endpointPath: call.endpoint,
        method: call.method
      },
      coveredBy: []
    }));

    this.ensureProject(outputDir);

    this.emitProgress(60, "Writing API tests…");

    if (apiRequirements.length > 0) {
      const tests = apiRequirements.map(r => {
        const name = `${r.source.method}_${r.source.endpointPath}`
          .replace(/[{}\/]/g, '_')
          .replace(/_+/g, '_');

        return {
          name,
          content: `
import { test, expect } from '@playwright/test';

test('${r.id}: ${r.description.replace(/'/g, "\\'")}', async ({ request }) => {
  const response = await request.${r.source.method.toLowerCase()}(\`${r.source.endpointPath}\`);
  expect(response.status()).toBe(200);
});
`
        };
      });

      this.writer.writeTests(outputDir, tests);
    }

    this.emitProgress(80, "Updating RTM…");

    const rtmPath = path.join(outputDir, 'rtm.json');
    let existingRtm: RTMDocument | null = null;

    if (fs.existsSync(rtmPath)) {
      existingRtm = JSON.parse(fs.readFileSync(rtmPath, 'utf-8'));
    }

    const mergedRtm: RTMDocument = {
      generatedAt: new Date().toISOString(),
      requirements: [
        ...(existingRtm?.requirements ?? []),
        ...apiRequirements
      ]
    };

    fs.writeFileSync(rtmPath, JSON.stringify(mergedRtm, null, 2));

    this.emitProgress(100, "Completed");

    progressService.complete(this.projectId);
    this.gateway.emitProjectStatus(this.projectId);
    this.gateway.emitRecrawlEvent(this.projectId);

    const totalMs = Date.now() - pipelineStart;

    return {
      status: 'success',
      pipeline: 'api',
      generatedAt: mergedRtm.generatedAt,
      timings: {
        totalMs,
        captureMs
      },
      artifacts: {
        outputDir,
        rtm: rtmPath,
        apiTestsDir: outputDir
      },
      requirements: mergedRtm.requirements
    };
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

    fs.writeFileSync(
      path.join(outputDir, 'package.json'),
      JSON.stringify(pkg, null, 2)
    );
    fs.writeFileSync(
      path.join(outputDir, 'playwright.config.ts'),
      config.trim() + '\n'
    );
  }
}
