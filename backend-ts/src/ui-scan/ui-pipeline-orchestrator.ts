import * as fs from 'fs';
import * as path from 'path';

import { UIMultiPageCrawler } from './ui-multi-page-crawler';
import { UISelectorExtractor } from './ui-selector-extractor';
import { UIRequirementGenerator } from './ui-requirement-generator';
import { UITestWriter } from './ui-test-writer';
import { UIFlowGraphBuilder } from './ui-flow-graph';

import { FlowHybridTestGenerator } from '../hybrid/flow-hybrid-test-generator';
import { HybridFlowTestWriter } from '../hybrid/hybrid-flow-test-writer';

import { RTMDocument, Requirement } from '../rtm/rtm.model';

export class UIPipelineOrchestrator {
  private crawler = new UIMultiPageCrawler();
  private extractor = new UISelectorExtractor();
  private requirementGen = new UIRequirementGenerator();
  private writer = new UITestWriter();
  private flowBuilder = new UIFlowGraphBuilder();
  private hybridGen = new FlowHybridTestGenerator();
  private hybridWriter = new HybridFlowTestWriter();

  async run(startUrl: string, outputDir: string): Promise<RTMDocument> {
    this.ensureProject(outputDir);

    const crawledPages = await this.crawler.crawl(startUrl, 1);

    const pagesDir = path.join(outputDir, 'pages');
    fs.mkdirSync(pagesDir, { recursive: true });

    crawledPages.forEach((p, i) => {
      const filePath = path.join(pagesDir, `page-${i + 1}.html`);
      fs.writeFileSync(filePath, p.html);
    });

    const allNodes = [];

    const allRequirements: Requirement[] = [];

    for (const page of crawledPages) {
      const nodes = this.extractor.extract(page.html, page.url);
      allNodes.push(...nodes);

      const uiReqs = this.requirementGen.generate(nodes);

      const normalized: Requirement[] = uiReqs.map((r, index) => ({
        id: r.id ?? `UI-${index + 1}`,
        page: r.pageUrl,
        description: r.description,
        selector: r.selector,
        type: 'ui',
        source: 'UI',
        action: r.action
      }));

      allRequirements.push(...normalized);

      if (normalized.length > 0) {
        const normalizedForWriter = normalized.map(r => ({
          id: r.id,
          page: r.page,
          description: r.description,
          selector: r.selector ?? '',
          type: 'ui',
          action: r.action
        }));

        this.writer.writeTests(normalizedForWriter, outputDir);
      }
    }

    const flowGraph = this.flowBuilder.build(crawledPages, allNodes);

    fs.writeFileSync(
      path.join(outputDir, 'flow-graph.json'),
      JSON.stringify(flowGraph, null, 2)
    );

    const hybridFlows = this.hybridGen.generate(flowGraph, allNodes);
    if (hybridFlows.length > 0) {
      this.hybridWriter.writeTests(hybridFlows, outputDir);
    }

    const rtm: RTMDocument = {
      generatedAt: new Date().toISOString(),
      requirements: allRequirements
    };

    return rtm;
  }

  private ensureProject(outputDir: string) {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const pkg = {
      name: 'generated-ui-project',
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
  ]
});
`;

    fs.writeFileSync(path.join(outputDir, 'package.json'), JSON.stringify(pkg, null, 2));
    fs.writeFileSync(path.join(outputDir, 'playwright.config.ts'), config.trim() + '\n');
  }
}
