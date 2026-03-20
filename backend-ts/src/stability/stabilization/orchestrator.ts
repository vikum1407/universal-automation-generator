import { StabilizationResult } from "./types";
import { evaluateReleaseReadiness } from "../readiness/evaluator";
import { LoadStabilityContext } from "../context/loadStabilityContext";
import { StabilityDataService } from "../data/stabilityData.service";

import { PrDiffsProvider } from "../data/providers/pr_diffs.provider";
import { TestFilesProvider } from "../data/providers/test_files.provider";
import { RiskTrendsProvider } from "../data/providers/risk_trends.provider";
import { NightlyFailuresProvider } from "../data/providers/nightly_failures.provider";
import { HealedPatternsProvider } from "../data/providers/healed_patterns.provider";
import { PredictionsProvider } from "../data/providers/predictions.provider";
import { PipelinesProvider } from "../data/providers/pipelines.provider";
import { FlakinessProvider } from "../data/providers/flakiness.provider";
import { HealingEffectivenessProvider } from "../data/providers/healing_effectiveness.provider";

// Manual wiring for now (can be DI later)
const dataService = new StabilityDataService(
  new PrDiffsProvider(),
  new TestFilesProvider(),
  new RiskTrendsProvider(),
  new NightlyFailuresProvider(),
  new HealedPatternsProvider(),
  new PredictionsProvider(),
  new PipelinesProvider(),
  new FlakinessProvider(),
  new HealingEffectivenessProvider()
);

const loadStabilityContext = new LoadStabilityContext(dataService);

function generateId() {
  return "stab-" + Math.random().toString(36).substring(2, 10);
}

async function runHealingPipeline(component: string) {
  return {
    pipelineId: "pipe-" + Math.random().toString(36).substring(2, 10),
    description: `Ran self-healing pipeline on ${component}`
  };
}

export async function runAutonomousStabilization(project: string): Promise<StabilizationResult> {
  const stabilizationId = generateId();
  const actions: any[] = [];

  let context = await loadStabilityContext.execute(project);
  let readiness = evaluateReleaseReadiness(context);

  if (readiness.status === "safe") {
    return {
      stabilizationId,
      status: "completed",
      actions: []
    };
  }

  const unstableComponents = [
    ...context.nightlyFailures.map((n: any) => n.component),
    ...context.predictions.map((p: any) => p.component)
  ];

  const uniqueComponents = [...new Set(unstableComponents)];

  for (const component of uniqueComponents) {
    const pipeline = await runHealingPipeline(component);
    actions.push({
      type: "pipeline",
      pipelineId: pipeline.pipelineId,
      description: pipeline.description
    });
  }

  context = await loadStabilityContext.execute(project);
  readiness = evaluateReleaseReadiness(context);

  const finalStatus =
    readiness.status === "safe" ? "completed" : "failed";

  return {
    stabilizationId,
    status: finalStatus,
    actions
  };
}
