import * as fs from 'fs';
import * as path from 'path';

import { FlowHybridTestGenerator } from './flow-hybrid-test-generator';
import { HybridTestWriter } from './hybrid-test-writer';
import { ApiCorrelationEngine } from './api-correlation-engine';
import { HybridFlowOptimizer } from './hybrid-flow-optimizer';
import { HybridFlowPrioritizer } from './hybrid-flow-prioritizer';
import { HybridCoverageMapBuilder } from './hybrid-coverage-map';
import { HybridCoverageVisualizer } from './hybrid-coverage-visualizer';

import { RTMDocument, Requirement } from '../rtm/rtm.model';

export class HybridPipelineOrchestrator {
  private flowGen = new FlowHybridTestGenerator();
  private writer = new HybridTestWriter();
  private apiCorrelator = new ApiCorrelationEngine();
  private optimizer = new HybridFlowOptimizer();
  private prioritizer = new HybridFlowPrioritizer();
  private coverageBuilder = new HybridCoverageMapBuilder();
  private visualizer = new HybridCoverageVisualizer();

  async run(url: string, outputDir: string): Promise<RTMDocument> {
    if (!outputDir) {
      throw new Error("Output directory is required. Example: qlitz hybrid-run <url> <outputDir>");
    }

    // --- Load RTM ---
    const rtmPath = path.join(outputDir, 'rtm.json');
    if (!fs.existsSync(rtmPath)) {
      throw new Error(`RTM not found at ${rtmPath}. Run UI + API pipelines first.`);
    }
    const rtm: RTMDocument = JSON.parse(fs.readFileSync(rtmPath, 'utf-8'));

    // --- Load Flow Graph ---
    const flowGraphPath = path.join(outputDir, 'flow-graph.json');
    if (!fs.existsSync(flowGraphPath)) {
      throw new Error(`Flow graph not found at ${flowGraphPath}. Run UI pipeline first.`);
    }
    const flowGraph = JSON.parse(fs.readFileSync(flowGraphPath, 'utf-8'));

    // 1. Generate short hybrid flows
    const hybridFlows = this.flowGen.generate(flowGraph);

    // 2. Optimize & deduplicate flows
    const optimizedFlows = this.optimizer.optimize(hybridFlows);

    // 3. Correlate API calls
    const correlatedFlows = this.apiCorrelator.correlate(
      optimizedFlows,
      rtm.requirements as Requirement[]
    );

    // 4. Prioritize flows
    const prioritizedFlows = this.prioritizer.prioritize(correlatedFlows);

    // 5. Convert flows → flow requirements
    const flowReqs = this.flowGen.toRequirements(optimizedFlows);
    rtm.requirements.push(...flowReqs);

    // 6. Write hybrid tests
    this.writer.writeHybridFlowsWithApi(prioritizedFlows, outputDir);

    // 7. Build hybrid coverage map
    const coverage = this.coverageBuilder.build(prioritizedFlows);
    fs.writeFileSync(
      path.join(outputDir, 'coverage.json'),
      JSON.stringify(coverage, null, 2)
    );

    // 8. Generate SVG visualizer
    this.visualizer.generateSvg(outputDir);

    // 9. Save updated RTM
    fs.writeFileSync(rtmPath, JSON.stringify(rtm, null, 2));

    return rtm;
  }
}
