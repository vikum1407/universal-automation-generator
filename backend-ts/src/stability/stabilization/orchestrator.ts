import { StabilizationResult } from "./types";
import { evaluateReleaseReadiness } from "../readiness/evaluator";
import { loadReleaseReadinessContext } from "../context/loadReleaseReadinessContext";

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

  let context = await loadReleaseReadinessContext(project);
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

  context = await loadReleaseReadinessContext(project);
  readiness = evaluateReleaseReadiness(context);

  const finalStatus =
    readiness.status === "safe" ? "completed" : "failed";

  return {
    stabilizationId,
    status: finalStatus,
    actions
  };
}
