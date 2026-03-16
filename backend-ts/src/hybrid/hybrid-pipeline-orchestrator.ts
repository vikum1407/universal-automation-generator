import * as fs from 'fs';
import * as path from 'path';

import { FlowHybridTestGenerator } from './flow-hybrid-test-generator';
import { HybridTestWriter } from './hybrid-test-writer';
import { ApiCorrelationEngine } from './api-correlation-engine';
import { HybridFlowOptimizer } from './hybrid-flow-optimizer';
import { HybridFlowPrioritizer } from './hybrid-flow-prioritizer';
import { HybridCoverageMapBuilder } from './hybrid-coverage-map';
import { HybridCoverageVisualizer } from './hybrid-coverage-visualizer';

import { JourneyEngine } from '../journey/journey-engine';
import { JourneyWriter } from '../journey/journey-writer';
import { ScenarioWriter } from '../journey/scenario-writer';
import { JourneyVisualizer } from '../journey/journey-visualizer';
import { JourneyCoverageMapBuilder } from '../journey/journey-coverage-map';
import { JourneyRiskEngine } from '../journey/journey-risk-engine';
import { JourneyPrioritizer } from '../journey/journey-prioritizer';
import { JourneyClusterEngine } from '../journey/journey-cluster-engine';
import { JourneyClusterWriter } from '../journey/journey-cluster-writer';
import { JourneySummaryEngine } from '../journey/journey-summary-engine';
import { JourneyInsightEngine } from '../journey/journey-insight-engine';

import { RTMDocument, Requirement } from '../rtm/rtm.model';

export class HybridPipelineOrchestrator {
  private flowGen = new FlowHybridTestGenerator();
  private writer = new HybridTestWriter();
  private apiCorrelator = new ApiCorrelationEngine();
  private optimizer = new HybridFlowOptimizer();
  private prioritizer = new HybridFlowPrioritizer();
  private coverageBuilder = new HybridCoverageMapBuilder();
  private visualizer = new HybridCoverageVisualizer();

  private journeyEngine = new JourneyEngine();
  private journeyWriter = new JourneyWriter();
  private scenarioWriter = new ScenarioWriter();
  private journeyVisualizer = new JourneyVisualizer();
  private journeyCoverageBuilder = new JourneyCoverageMapBuilder();
  private journeyRiskEngine = new JourneyRiskEngine();
  private journeyPrioritizer = new JourneyPrioritizer();
  private clusterEngine = new JourneyClusterEngine();
  private clusterWriter = new JourneyClusterWriter();
  private summaryEngine = new JourneySummaryEngine();
  private insightEngine = new JourneyInsightEngine();

  async run(url: string, outputDir: string): Promise<any> {
    const pipelineStart = Date.now();

    if (!outputDir) {
      throw new Error('Output directory is required. Example: qlitz hybrid-run <url> <outputDir>');
    }

    console.log(`[HYBRID] Starting hybrid pipeline for ${url}`);

    const rtmPath = path.join(outputDir, 'rtm.json');
    const flowGraphPath = path.join(outputDir, 'flow-graph.json');

    if (!fs.existsSync(rtmPath)) {
      throw new Error(`RTM not found at ${rtmPath}. Run UI + API pipelines first.`);
    }
    if (!fs.existsSync(flowGraphPath)) {
      throw new Error(`Flow graph not found at ${flowGraphPath}. Run UI pipeline first.`);
    }

    const rtm: RTMDocument = JSON.parse(fs.readFileSync(rtmPath, 'utf-8'));
    const flowGraph = JSON.parse(fs.readFileSync(flowGraphPath, 'utf-8'));

    // -----------------------------------
    // HYBRID FLOW GENERATION
    // -----------------------------------
    console.log('[HYBRID] Generating hybrid flows');
    const hybridFlows = this.flowGen.generate(flowGraph);

    const optimizedFlows = this.optimizer.optimize(hybridFlows);
    const correlatedFlows = this.apiCorrelator.correlate(
      optimizedFlows,
      rtm.requirements as Requirement[]
    );
    const prioritizedFlows = this.prioritizer.prioritize(correlatedFlows);

    const flowReqs = this.flowGen.toRequirements(optimizedFlows);
    rtm.requirements.push(...flowReqs);

    this.writer.writeHybridFlowsWithApi(prioritizedFlows, outputDir);
    console.log('[HYBRID] Hybrid tests written');

    // -----------------------------------
    // JOURNEY GENERATION
    // -----------------------------------
    console.log('[HYBRID] Generating journeys');
    const journeys = this.journeyEngine.generateJourneys(optimizedFlows);

    // -----------------------------------
    // RISK SCORING
    // -----------------------------------
    const risks = this.journeyRiskEngine.compute(journeys);

    // -----------------------------------
    // PRIORITIZATION
    // -----------------------------------
    const prioritizedJourneys = this.journeyPrioritizer.prioritize(journeys, risks);

    prioritizedJourneys.forEach(p => {
      p.journey.risk = p.risk;
    });

    // -----------------------------------
    // WRITE JOURNEY TESTS
    // -----------------------------------
    const journeyTestsDir = path.join(outputDir, 'journey-tests');
    fs.mkdirSync(journeyTestsDir, { recursive: true });

    prioritizedJourneys.forEach(p => {
      const content = this.journeyWriter.build(p.journey, false, false, false);
      fs.writeFileSync(path.join(journeyTestsDir, `${p.journey.id}.spec.ts`), content);
    });

    // -----------------------------------
    // WRITE SCENARIO TESTS
    // -----------------------------------
    const scenarioTestsDir = path.join(outputDir, 'scenario-tests');
    fs.mkdirSync(scenarioTestsDir, { recursive: true });

    prioritizedJourneys.forEach(p => {
      const scenario = { ...p.journey, title: p.journey.title + ' (Scenario)' };
      const content = this.scenarioWriter.build(scenario, false, false, false);
      fs.writeFileSync(path.join(scenarioTestsDir, `${p.journey.id}-scenario.spec.ts`), content);
    });

    // -----------------------------------
    // JOURNEY VISUALIZATION
    // -----------------------------------
    this.journeyVisualizer.generate(journeys, outputDir);

    // -----------------------------------
    // JOURNEY COVERAGE
    // -----------------------------------
    const journeyCoverage = this.journeyCoverageBuilder.build(journeys);
    const journeyCoveragePath = path.join(outputDir, 'journey-coverage.json');
    fs.writeFileSync(journeyCoveragePath, JSON.stringify(journeyCoverage, null, 2));

    // -----------------------------------
    // JOURNEY CLUSTERING
    // -----------------------------------
    console.log('[HYBRID] Clustering journeys');
    const clusters = this.clusterEngine.cluster(journeys, risks);

    const { jsonPath: clusterJson, mdPath: clusterMd } = this.clusterWriter.write(
      clusters,
      outputDir
    );

    console.log(`[HYBRID] Journey clusters generated: ${clusters.length}`);

    // -----------------------------------
    // SUMMARIES & INSIGHTS
    // -----------------------------------
    const journeySummaries = journeys.map(j => ({
      id: j.id,
      title: j.title,
      summary: this.summaryEngine.summarizeJourney(j)
    }));
    fs.writeFileSync(
      path.join(outputDir, 'journey-summaries.json'),
      JSON.stringify(journeySummaries, null, 2)
    );

    const clusterSummaries = clusters.map(c => ({
      id: c.id,
      label: c.label,
      summary: this.summaryEngine.summarizeCluster(c)
    }));
    fs.writeFileSync(
      path.join(outputDir, 'cluster-summaries.json'),
      JSON.stringify(clusterSummaries, null, 2)
    );

    const insights = this.insightEngine.generateInsights(journeys, journeyCoverage);
    fs.writeFileSync(
      path.join(outputDir, 'journey-insights.json'),
      JSON.stringify(insights, null, 2)
    );

    // -----------------------------------
    // UPDATE RTM
    // -----------------------------------
    fs.writeFileSync(rtmPath, JSON.stringify(rtm, null, 2));

    const totalMs = Date.now() - pipelineStart;

    return {
      status: 'success',
      pipeline: 'hybrid',
      generatedAt: new Date().toISOString(),
      timings: { totalMs },
      stats: {
        hybridFlows: prioritizedFlows.length,
        journeys: prioritizedJourneys.length,
        clusters: clusters.length
      },
      artifacts: {
        outputDir,
        rtm: rtmPath,
        flowGraph: flowGraphPath,
        journeyTestsDir,
        scenarioTestsDir,
        journeyCoverage: journeyCoveragePath,
        journeyClustersJson: clusterJson,
        journeyClustersMd: clusterMd,
        journeySvg: path.join(outputDir, 'journeys.svg'),
        journeyDot: path.join(outputDir, 'journeys.dot'),
        journeyJson: path.join(outputDir, 'journeys.json'),
        journeySummaries: path.join(outputDir, 'journey-summaries.json'),
        clusterSummaries: path.join(outputDir, 'cluster-summaries.json'),
        journeyInsights: path.join(outputDir, 'journey-insights.json')
      }
    };
  }
}
