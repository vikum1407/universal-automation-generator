import { Injectable } from '@nestjs/common';
import { OrchestratorConfig } from './orchestrator-config';
import { OrchestratorContext } from './orchestrator-context';
import { OrchestratorLoader } from './orchestrator-loader';
import { OrchestratorSaver } from './orchestrator-saver';
import { OrchestratorRunner } from './orchestrator-runner';
import { OrchestratorDiagnosis } from './orchestrator-diagnosis';
import { OrchestratorCollector } from './orchestrator-collector';

import { UISelectorExtractor } from '../ui-selector-extractor';
import { UIRequirementGenerator } from '../ui-requirement-generator';
import { UITestWriter } from '../test-writer/ui-test-writer';
import { UIFlowDetector } from '../ui-flow-detector';
import { UISelectorEvolutionEngine } from '../ui-selector-evolution';
import { AutoRewriteEngine } from '../auto-rewrite-engine';
import { UIJourneyGenerator } from '../ui-journey-generator';
import { UIScenarioEngine } from '../ui-scenario-engine';
import { UIStateEngine } from '../ui-state-engine';
import { UIExplorer } from '../ui-explorer';
import { ReinforcementEngine } from '../reinforcement-engine';
import { GlobalOptimizationEngine } from '../global-optimization-engine';
import { RegressionEngine } from '../regression-engine';
import { SelfRefactorEngine } from '../self-refactor-engine';
import { PipelineEvolutionEngine } from '../pipeline-evolution-engine';
import { RootCauseEngine } from '../root-cause-engine';

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

  private loader = new OrchestratorLoader();
  private saver = new OrchestratorSaver();
  private runner = new OrchestratorRunner();
  private diagnosis = new OrchestratorDiagnosis();
  private collector = new OrchestratorCollector();

  async run(url: string, outputDir: string) {
    const context = new OrchestratorContext(outputDir);

    await this.loader.loadAll(context);

    const config = OrchestratorConfig.resolve(context.pipelineMemory);

    const exploration = await this.collector.explore(url, config);

    const allPages = this.collector.mergePages(url, exploration);

    const flowGraph = this.flowDetector.detect(allPages);

    const evolutionResults = this.evolution.evolve(allPages.flatMap(p => p.nodes));

    const uiRequirementsRaw = this.requirementGen.generate(
      allPages.flatMap(p => p.nodes)
    );

    const { updatedRequirements: rewrittenRequirements, rewrites } =
      this.autoRewrite.rewrite(uiRequirementsRaw);

    let journeys = this.collector.generateJourneys(
      config,
      flowGraph,
      rewrittenRequirements,
      this.journeyGen
    );

    let scenarios = this.collector.generateScenarios(
      config,
      journeys,
      rewrittenRequirements,
      this.scenarioEngine
    );

    let stateGraph = this.collector.generateStateGraph(
      config,
      journeys,
      scenarios,
      rewrittenRequirements,
      this.stateEngine
    );

    const allTestTitles = this.collector.collectPlannedTestTitles(
      rewrittenRequirements,
      flowGraph,
      journeys,
      scenarios,
      stateGraph
    );

    const optimization = this.collector.optimize(
      config,
      allTestTitles,
      scenarios,
      stateGraph,
      context.existingReinforcement,
      this.optimizer
    );

    let requirementsForRefactor = this.collector.prepareForRefactor(
      rewrittenRequirements
    );

    if (config.enableSelfRefactor) {
      const refactorResult = this.selfRefactor.refactor(
        requirementsForRefactor,
        journeys,
        scenarios,
        stateGraph,
        context.existingReinforcement,
        context.existingRegression
      );

      requirementsForRefactor = refactorResult.requirements;
      journeys = refactorResult.journeys;
      scenarios = refactorResult.scenarios;
      stateGraph = refactorResult.stateGraph;
    }

    const testFiles = this.writer.writeTests(
      requirementsForRefactor as any,
      outputDir,
      flowGraph,
      journeys,
      scenarios,
      stateGraph,
      optimization,
      context.existingRegression,
      context.existingRootCause
    );

    const report = await this.runner.runPlaywright(outputDir);
    const failures = this.runner.extractFailures(report);

    const diagnoses = this.diagnosis.diagnose(failures, requirementsForRefactor);

    const reinforcementMemory = this.reinforcement.reinforce(
      failures,
      requirementsForRefactor,
      journeys,
      scenarios,
      stateGraph,
      context.existingReinforcement
    );

    const regressionMemory = this.regression.analyze(
      reinforcementMemory,
      scenarios,
      stateGraph,
      context.existingRegression
    );

    const rootCauseMemory = this.rootCauseEngine.analyze(
      failures,
      reinforcementMemory,
      regressionMemory,
      stateGraph,
      scenarios
    );

    const evolvedPipeline = this.pipelineEvolution.evolve(
      context.pipelineMemory,
      reinforcementMemory,
      optimization,
      regressionMemory
    );

    await this.saver.saveAll(
      outputDir,
      reinforcementMemory,
      regressionMemory,
      rootCauseMemory,
      evolvedPipeline,
      optimization
    );

    return {
      flowGraph,
      testFiles,
      failures,
      diagnoses,
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
}
