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
import { progressService } from '../services/ProgressService';
import { ProgressGateway } from '../gateways/progress.gateway';

export class UIPipelineOrchestrator {
  private crawler = new UIMultiPageCrawler();
  private extractor = new UISelectorExtractor();
  private requirementGen = new UIRequirementGenerator();
  private writer = new UITestWriter();
  private flowBuilder = new UIFlowGraphBuilder();
  private hybridGen = new FlowHybridTestGenerator();
  private hybridWriter = new HybridFlowTestWriter();

  constructor(
    private readonly projectId: string,
    private readonly gateway: ProgressGateway
  ) {}

  private emitProgress(percent: number, step: string) {
    progressService.update(this.projectId, percent, step);
    this.gateway.emitRecrawlProgress(this.projectId, percent, step);
    this.gateway.emitProjectStatus(this.projectId);
  }

  async run(startUrl: string, outputDir: string): Promise<any> {
    const pipelineStart = Date.now();
    this.ensureProject(outputDir);

    this.emitProgress(3, "Initialising pipeline…");

    // ── CRAWL: 3% → 65% (longest step) ──────────────────────────────────────
    this.emitProgress(5, "Crawling pages…");
    const crawlStart = Date.now();
    const crawledPages = await this.crawler.crawl(startUrl, 3, 30);
    const crawlMs = Date.now() - crawlStart;

    this.emitProgress(65, `Crawled ${crawledPages.length} pages`);

    const pagesDir = path.join(outputDir, 'pages');
    fs.mkdirSync(pagesDir, { recursive: true });

    crawledPages.forEach((p, i) => {
      fs.writeFileSync(path.join(pagesDir, `page-${i + 1}.html`), p.html);
    });

    // ── EXTRACT: 65% → 78% ───────────────────────────────────────────────────
    this.emitProgress(66, "Extracting selectors…");

    const allNodes: any[] = [];
    const allSemanticRequirements: Requirement[] = [];
    const extractStart = Date.now();
    const total = crawledPages.length;

    for (let i = 0; i < crawledPages.length; i++) {
      const page = crawledPages[i];
      const nodes = this.extractor.extract(page.html, page.url);
      allNodes.push(...nodes);

      const uiReqs = this.requirementGen.generate(nodes);
      const semanticReqs = this.requirementGen.toSemanticRequirements(uiReqs);
      allSemanticRequirements.push(...semanticReqs);

      if (uiReqs.length > 0) {
        const normalizedForWriter = uiReqs.map(r => ({
          id: r.id,
          page: r.pageUrl,
          description: r.description,
          selector: r.selector ?? '',
          type: 'ui',
          action: r.action
        }));
        this.writer.writeTests(normalizedForWriter, outputDir);
      }

      // Emit incremental progress per page during extraction
      const extractPercent = 66 + Math.round(((i + 1) / total) * 12);
      this.emitProgress(extractPercent, `Extracting page ${i + 1} of ${total}…`);
    }

    const extractMs = Date.now() - extractStart;

    // ── FLOW GRAPH: 78% → 85% ────────────────────────────────────────────────
    this.emitProgress(79, "Building flow graph…");
    const flowStart = Date.now();
    const flowGraph = this.flowBuilder.build(crawledPages, allNodes);
    const flowGraphPath = path.join(outputDir, 'flow-graph.json');
    fs.writeFileSync(flowGraphPath, JSON.stringify(flowGraph, null, 2));
    const flowMs = Date.now() - flowStart;

    // ── HYBRID FLOWS: 85% → 92% ──────────────────────────────────────────────
    this.emitProgress(85, "Generating hybrid flows…");
    const hybridStart = Date.now();
    const hybridFlows = this.hybridGen.generate(flowGraph, allNodes);
    const hybridRequirements = this.hybridGen.toRequirements(hybridFlows);
    allSemanticRequirements.push(...hybridRequirements);

    if (hybridFlows.length > 0) {
      this.hybridWriter.writeTests(hybridFlows, outputDir);
    }
    const hybridMs = Date.now() - hybridStart;

    // ── RTM: 92% → 100% ──────────────────────────────────────────────────────
    this.emitProgress(92, "Writing RTM…");
    const rtm: RTMDocument = {
      generatedAt: new Date().toISOString(),
      requirements: allSemanticRequirements
    };

    const rtmPath = path.join(outputDir, 'rtm.json');
    fs.writeFileSync(rtmPath, JSON.stringify(rtm, null, 2));

    this.emitProgress(100, "Completed ✓");

    progressService.complete(this.projectId);
    this.gateway.emitProjectStatus(this.projectId);
    this.gateway.emitRecrawlEvent(this.projectId);

    const totalMs = Date.now() - pipelineStart;

    return {
      status: 'success',
      pipeline: 'ui',
      generatedAt: rtm.generatedAt,
      timings: { totalMs, crawlMs, extractMs, flowMs, hybridMs },
      stats: {
        pagesCrawled: crawledPages.length,
        uniquePages: new Set(crawledPages.map(p => p.url)).size,
        depthUsed: 3,
        transitionsDetected: flowGraph.edges.length
      },
      artifacts: {
        outputDir,
        pagesDir,
        rtm: rtmPath,
        flowGraph: flowGraphPath,
        uiTestsDir: path.join(outputDir, 'ui-tests')
      },
      requirements: rtm.requirements
    };
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