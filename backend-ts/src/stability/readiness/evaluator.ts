import { ReleaseReadinessResult } from "./types";

export function evaluateReleaseReadiness(context: any): ReleaseReadinessResult {
  const reasons: string[] = [];
  const recommendations: string[] = [];

  const score = context.stabilityScore?.score || 0;
  const guardrails = context.guardrails || { violations: [], warnings: [] };
  const nightly = context.nightlyFailures || [];
  const pipelines = context.recentPipelineFailures || [];
  const riskTrends = context.riskTrends || [];
  const predictions = context.predictions || [];

  let status: "safe" | "risky" | "blocked" = "safe";

  // Guardrails
  if (guardrails.violations.length > 0) {
    status = "blocked";
    reasons.push("Critical guardrail violations detected.");
    recommendations.push("Resolve all guardrail violations before shipping.");
  }

  // Stability score
  if (score < 0.7 && status !== "blocked") {
    status = "risky";
    reasons.push(`Low stability score (${(score * 100).toFixed(0)}%).`);
    recommendations.push("Investigate failing components and run stabilization.");
  }

  // Nightly failures
  const unstable = nightly.filter((n: any) => n.failureCount >= 2);
  if (unstable.length > 0 && status !== "blocked") {
    status = "risky";
    unstable.forEach((u: any) =>
      reasons.push(`${u.component} failed in ${u.failureCount} nightly runs.`)
    );
    recommendations.push("Run targeted healing pipelines for unstable components.");
  }

  // Pipeline failures
  if (pipelines.length > 0 && status !== "blocked") {
    status = "risky";
    reasons.push("Recent pipeline failures detected.");
    recommendations.push("Review failing pipelines and re-run stabilization.");
  }

  // Risk trends
  const risingRisk = riskTrends.filter((r: any) => r.increasingStreak >= 3);
  if (risingRisk.length > 0 && status !== "blocked") {
    status = "risky";
    risingRisk.forEach((r: any) =>
      reasons.push(`Risk increasing in ${r.module}.`)
    );
    recommendations.push("Investigate modules with rising risk.");
  }

  // Predictions
  const highPredictions = predictions.filter((p: any) => p.confidence > 0.7);
  if (highPredictions.length > 0 && status !== "blocked") {
    status = "risky";
    highPredictions.forEach((p: any) =>
      reasons.push(`Predicted failure likely in ${p.component}.`)
    );
    recommendations.push("Run proactive stabilization for predicted failures.");
  }

  if (status === "safe") {
    reasons.push("No major stability risks detected.");
    recommendations.push("Release is safe to ship.");
  }

  return {
    status,
    stabilityScore: score,
    reasons,
    recommendations
  };
}
