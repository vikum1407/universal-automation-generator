import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { UISelectorExtractor } from './ui-selector-extractor';
import { UIRequirementGenerator } from './ui-requirement-generator';
import { UITestWriter } from './ui-test-writer';
import { UIFlowDetector } from './ui-flow-detector';
import { UISelectorEvolutionEngine } from './ui-selector-evolution';
import { AutoRewriteEngine } from './auto-rewrite-engine';
import { UIJourneyGenerator, UIJourney } from './ui-journey-generator';
import { UIScenarioEngine, UIScenario } from './ui-scenario-engine';
import { UIStateEngine, UIStateGraph } from './ui-state-engine';
import { UIExplorer } from './ui-explorer';
import {
  ReinforcementEngine,
  ReinforcementMemory
} from './reinforcement-engine';
import {
  GlobalOptimizationEngine,
  GlobalOptimizationResult
} from './global-optimization-engine';
import {
  RegressionEngine,
  RegressionMemory
} from './regression-engine';
import {
  SelfRefactorEngine,
  RequirementRef
} from './self-refactor-engine';
import {
  PipelineEvolutionEngine,
  PipelineEvolutionMemory
} from './pipeline-evolution-engine';
import {
  RootCauseEngine,
  RootCauseMemory
} from './root-cause-engine';
import * as fs from 'fs';
import * as path from 'path';

interface TestFailure {
  title: string;
  file?: string;
  error: string;
}

interface DiagnosisResult {
  title: string;
  file?: string;
  rootCause: string;
  suggestion: string;
  confidence: number;
}

@Injectable()
export class UIFlowOrchestrator {
  private extractor = new UISelectorExtractor();
  private requirementGen = new UIRequirementGenerator();
  private writer = new UITestWriter();
  private flowDetector = new UIFlowDetector();
  private evolution = new UISelectorEvolutionEngine();
  private autoRewrite = new AutoRewriteEngine();
  private journeyGen = new UIJourneyGenerator();
  private scenarioEngine = new UIScenarioEngine();
  private stateEngine = new UIStateEngine();
  private explorer = new UIExplorer();
  private reinforcement = new ReinforcementEngine();
  private optimizer = new GlobalOptimizationEngine();
  private regression = new RegressionEngine();
  private selfRefactor = new SelfRefactorEngine();
  private pipelineEvolution = new PipelineEvolutionEngine();
  private rootCauseEngine = new RootCauseEngine();

  async run(url: string, outputDir: string) {
    const evolutionPath = path.join(outputDir, 'evolution.json');
    let pipelineMemory: PipelineEvolutionMemory | undefined = undefined;
    if (fs.existsSync(evolutionPath)) {
      try {
        const raw = await fs.promises.readFile(evolutionPath, 'utf-8');
        pipelineMemory = JSON.parse(raw);
      } catch {
        pipelineMemory = undefined;
      }
    }

    const reinforcementMemoryPath = path.join(outputDir, 'reinforcement.json');
    let existingReinforcement: ReinforcementMemory | undefined = undefined;
    if (fs.existsSync(reinforcementMemoryPath)) {
      try {
        const raw = await fs.promises.readFile(reinforcementMemoryPath, 'utf-8');
        existingReinforcement = JSON.parse(raw);
      } catch {
        existingReinforcement = undefined;
      }
    }

    const regressionMemoryPath = path.join(outputDir, 'regression.json');
    let existingRegression: RegressionMemory | undefined = undefined;
    if (fs.existsSync(regressionMemoryPath)) {
      try {
        const raw = await fs.promises.readFile(regressionMemoryPath, 'utf-8');
        existingRegression = JSON.parse(raw);
      } catch {
        existingRegression = undefined;
      }
    }

    const rootCausePath = path.join(outputDir, 'rootcause.json');
    let existingRootCause: RootCauseMemory | undefined = undefined;
    if (fs.existsSync(rootCausePath)) {
      try {
        const raw = await fs.promises.readFile(rootCausePath, 'utf-8');
        existingRootCause = JSON.parse(raw);
      } catch {
        existingRootCause = undefined;
      }
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const html = await page.content();
    await browser.close();

    const initialNodes = this.extractor.extract(html, url);
    const initialPages = [{ url, nodes: initialNodes }];

    const config = pipelineMemory?.current ?? {
      maxDepth: 2,
      maxPages: 10,
      maxActionsPerPage: 10,
      enableExploration: true,
      enableJourneys: true,
      enableScenarios: true,
      enableStateGraph: true,
      enableOptimization: true,
      enableRegression: true,
      enableSelfRefactor: true
    };

    const exploration = config.enableExploration
      ? await this.explorer.explore(url, {
          maxDepth: config.maxDepth,
          maxPages: config.maxPages,
          maxActionsPerPage: config.maxActionsPerPage,
          waitAfterNavigationMs: 1500
        })
      : { pages: [] };

    const allPagesMap = new Map<string, { url: string; nodes: any[] }>();
    for (const p of initialPages) {
      allPagesMap.set(p.url, { url: p.url, nodes: p.nodes });
    }
    for (const p of exploration.pages) {
      const existing = allPagesMap.get(p.url);
      if (existing) {
        existing.nodes = [...existing.nodes, ...p.nodes];
      } else {
        allPagesMap.set(p.url, { url: p.url, nodes: p.nodes });
      }
    }
    const allPages = Array.from(allPagesMap.values());
    const allNodes = allPages.flatMap(p => p.nodes);

    const flowGraph = this.flowDetector.detect(allPages);

    const evolutionResults = this.evolution.evolve(allNodes);

    const uiRequirementsRaw = this.requirementGen.generate(allNodes);

    const { updatedRequirements: rewrittenRequirements, rewrites } =
      this.autoRewrite.rewrite(uiRequirementsRaw);

    let journeys: UIJourney[] =
      config.enableJourneys && flowGraph && flowGraph.edges && flowGraph.edges.length > 0
        ? this.journeyGen.generate(flowGraph, rewrittenRequirements)
        : [];

    let scenarios: UIScenario[] =
      config.enableScenarios && journeys && journeys.length > 0
        ? this.scenarioEngine.generate(journeys, rewrittenRequirements)
        : [];

    let stateGraph: UIStateGraph =
      config.enableStateGraph && (journeys.length > 0 || scenarios.length > 0)
        ? this.stateEngine.buildStateGraph(journeys, scenarios, rewrittenRequirements)
        : { states: [], transitions: [] };

    const allTestTitles = this.collectPlannedTestTitles(
      rewrittenRequirements,
      flowGraph,
      journeys,
      scenarios,
      stateGraph
    );

    const optimization: GlobalOptimizationResult = config.enableOptimization
      ? this.optimizer.optimize(
          allTestTitles,
          scenarios,
          stateGraph,
          existingReinforcement ?? { selectors: [], scenarios: [], states: [] }
        )
      : {
          testPlan: allTestTitles.map(t => ({ title: t, priority: 3, reason: 'No optimization.' })),
          driftHotspots: [],
          explorationPlan: {
            targetUrls: [],
            maxDepth: config.maxDepth,
            maxPages: config.maxPages,
            maxActionsPerPage: config.maxActionsPerPage
          },
          selectorEvolutionPlan: [],
          prunedScenarios: []
        };

    this.ensureProject(outputDir);

    let requirementsForRefactor: RequirementRef[] = rewrittenRequirements.map(r => {
      const anyReq = r as any;
      return {
        id: r.id,
        page: r.page,
        description: r.description,
        selector: r.selector,
        evolvedSelector: r.evolvedSelector,
        type: r.type,
        action: r.action,
        tags: anyReq.tags ?? [],
        meta: anyReq.meta ?? {}
      };
    });

    if (config.enableSelfRefactor) {
      const refactorResult = this.selfRefactor.refactor(
        requirementsForRefactor,
        journeys,
        scenarios,
        stateGraph,
        existingReinforcement ?? { selectors: [], scenarios: [], states: [] },
        existingRegression
      );

      requirementsForRefactor = refactorResult.requirements;
      journeys = refactorResult.journeys;
      scenarios = refactorResult.scenarios;
      stateGraph = refactorResult.stateGraph;
    }

    const testFiles =
      requirementsForRefactor.length > 0
        ? this.writer.writeTests(
            requirementsForRefactor as any,
            outputDir,
            flowGraph,
            journeys,
            scenarios,
            stateGraph,
            optimization,
            existingRegression,
            existingRootCause
          )
        : [];

    const report = await this.runPlaywrightTests(outputDir);
    const failures = report ? this.extractFailures(report) : [];
    const diagnoses = this.diagnoseFailures(failures, requirementsForRefactor as any);

    const reinforcementMemory = this.reinforcement.reinforce(
      failures,
      requirementsForRefactor.map(r => ({
        id: r.id,
        description: r.description,
        selector: r.selector,
        evolvedSelector: r.evolvedSelector,
        selectorHistory: (r as any).selectorHistory,
        page: r.page
      })),
      journeys,
      scenarios,
      stateGraph,
      existingReinforcement
    );

    await fs.promises.writeFile(
      reinforcementMemoryPath,
      JSON.stringify(reinforcementMemory, null, 2),
      'utf-8'
    );

    const regressionMemory = config.enableRegression
      ? this.regression.analyze(
          reinforcementMemory,
          scenarios,
          stateGraph,
          existingRegression
        )
      : existingRegression ?? { signatures: [], clusters: [], forecasts: [] };

    await fs.promises.writeFile(
      regressionMemoryPath,
      JSON.stringify(regressionMemory, null, 2),
      'utf-8'
    );

    const rootCauseMemory: RootCauseMemory = this.rootCauseEngine.analyze(
      failures,
      reinforcementMemory,
      regressionMemory,
      stateGraph,
      scenarios
    );

    await fs.promises.writeFile(
      rootCausePath,
      JSON.stringify(rootCauseMemory, null, 2),
      'utf-8'
    );

    const evolvedPipeline = this.pipelineEvolution.evolve(
      pipelineMemory,
      reinforcementMemory,
      optimization,
      regressionMemory
    );

    await fs.promises.writeFile(
      evolutionPath,
      JSON.stringify(evolvedPipeline, null, 2),
      'utf-8'
    );

    const optimizationPath = path.join(outputDir, 'optimization.json');
    await fs.promises.writeFile(
      optimizationPath,
      JSON.stringify(optimization, null, 2),
      'utf-8'
    );

    const rtm = {
      generatedAt: new Date().toISOString(),
      requirements: requirementsForRefactor,
      evolution: evolutionResults,
      rewrites,
      journeys,
      scenarios,
      stateGraph,
      exploration: {
        pages: exploration.pages.map(p => ({ url: p.url, nodeCount: p.nodes.length }))
      },
      reinforcement: {
        selectorCount: reinforcementMemory.selectors.length,
        scenarioCount: reinforcementMemory.scenarios.length,
        stateCount: reinforcementMemory.states.length
      },
      optimization: {
        testPlanSize: optimization.testPlan.length,
        hotspotCount: optimization.driftHotspots.length
      },
      regression: {
        signatureCount: regressionMemory.signatures.length,
        clusterCount: regressionMemory.clusters.length,
        forecastCount: regressionMemory.forecasts.length
      },
      pipelineEvolution: {
        current: evolvedPipeline.current,
        historyLength: evolvedPipeline.history.length
      },
      rootCause: {
        nodeCount: rootCauseMemory.nodes.length,
        edgeCount: rootCauseMemory.edges.length,
        clusterCount: rootCauseMemory.clusters.length
      }
    };

    return {
      flowGraph,
      testFiles,
      rtm,
      failures,
      diagnoses,
      evolution: evolutionResults,
      rewrites,
      journeys,
      scenarios,
      stateGraph,
      reinforcement: reinforcementMemory,
      optimization,
      regression: regressionMemory,
      pipelineEvolution: evolvedPipeline,
      rootCause: rootCauseMemory
    };
  }

  private collectPlannedTestTitles(
    requirements: any[],
    flowGraph: any,
    journeys: UIJourney[],
    scenarios: UIScenario[],
    stateGraph: UIStateGraph
  ): string[] {
    const titles = new Set<string>();

    for (const r of requirements) {
      titles.add(r.description);
      titles.add(`${r.description} - negative: invalid credentials`);
      titles.add(`${r.description} - negative: add to cart without inventory`);
      titles.add(`${r.description} - negative: checkout with missing data`);
    }

    if (flowGraph && flowGraph.edges) {
      for (const e of flowGraph.edges) {
        titles.add(`Navigate from ${e.from} to ${e.to}`);
      }
    }

    for (const j of journeys) {
      titles.add(j.title);
    }

    for (const s of scenarios) {
      titles.add(s.title);
    }

    for (const st of stateGraph.states) {
      titles.add(`State invariants for ${st.label}`);
    }

    return Array.from(titles);
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
  testDir: './ui-tests',
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'playwright-report.json' }]
  ]
});
`;

    fs.writeFileSync(path.join(outputDir, 'package.json'), JSON.stringify(pkg, null, 2));
    fs.writeFileSync(path.join(outputDir, 'playwright.config.ts'), config.trim() + '\n');
  }

  private async runPlaywrightTests(outputDir: string): Promise<any | null> {
    return new Promise((resolve) => {
      const proc = spawn('npx', ['playwright', 'test'], {
        cwd: outputDir,
        shell: true
      });

      proc.stdout.on('data', (data) => console.log(data.toString()));
      proc.stderr.on('data', (data) => console.error(data.toString()));

      proc.on('close', async () => {
        const reportPath = path.join(outputDir, 'playwright-report.json');
        if (!fs.existsSync(reportPath)) return resolve(null);

        try {
          const raw = await fs.promises.readFile(reportPath, 'utf-8');
          resolve(JSON.parse(raw));
        } catch {
          resolve(null);
        }
      });
    });
  }

  private extractFailures(report: any): TestFailure[] {
    const failures: TestFailure[] = [];

    const walkSuite = (suite: any) => {
      if (!suite) return;

      if (Array.isArray(suite.tests)) {
        for (const t of suite.tests) {
          if (t.outcome === 'failed') {
            const errors = Array.isArray(t.errors) ? t.errors : [];
            const message =
              errors.map((e: any) => e.message || '').join('\n') || 'Unknown error';

            failures.push({
              title: t.title,
              file: t.location?.file,
              error: message
            });
          }
        }
      }

      if (Array.isArray(suite.suites)) {
        for (const child of suite.suites) walkSuite(child);
      }
    };

    if (Array.isArray(report.suites)) {
      for (const s of report.suites) walkSuite(s);
    } else if (report.suite) {
      walkSuite(report.suite);
    }

    return failures;
  }

  private diagnoseFailures(failures: TestFailure[], requirements: any[]): DiagnosisResult[] {
    const diagnoses: DiagnosisResult[] = [];

    for (const f of failures) {
      const relatedReq =
        requirements.find((r: any) => f.title.includes(r.description)) ?? null;

      const rootCause = relatedReq
        ? `Test for requirement "${relatedReq.id}" failed. Likely selector or assertion drift.`
        : 'Test failed. Likely selector, assertion, or flow drift.';

      const suggestion = relatedReq
        ? `Review and update selector "${relatedReq.selector}".`
        : 'Review the failing test, its selectors, and its assertions.';

      const confidence = relatedReq ? 0.8 : 0.5;

      diagnoses.push({
        title: f.title,
        file: f.file,
        rootCause,
        suggestion,
        confidence
      });
    }

    return diagnoses;
  }
}
