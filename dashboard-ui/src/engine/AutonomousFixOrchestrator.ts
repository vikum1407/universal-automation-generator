import type { StabilitySnapshot } from "@/types/StabilitySnapshot";

export type OrchestratedAction =
  | {
      type: "rerun-tests";
      tests: string[];
      reason: string;
    }
  | {
      type: "reset-environment";
      environment: string;
      reason: string;
    }
  | {
      type: "apply-healing";
      testId: string;
      fix: string;
      reason: string;
    }
  | {
      type: "create-issue";
      requirementId: string;
      title: string;
      reason: string;
    }
  | {
      type: "notify-team";
      message: string;
      reason: string;
    }
  | {
      type: "gate-release";
      reason: string;
    };

export function orchestrateFixes(
  snapshot: StabilitySnapshot
): OrchestratedAction[] {
  const actions: OrchestratedAction[] = [];

  const requirements = snapshot.requirements ?? [];
  const healing = snapshot.selfHealing ?? [];
  const executions = snapshot.executions ?? [];

  const latest = executions[executions.length - 1];
  const previous =
    executions.length > 1 ? executions[executions.length - 2] : null;

  const failureMomentum =
    latest && previous
      ? latest.failed + latest.flaky - (previous.failed + previous.flaky)
      : 0;

  const risky = requirements.filter((r) => r.status === "risky");
  const unstable = requirements.filter((r) => r.status === "unstable");

  if (failureMomentum > 0) {
    actions.push({
      type: "notify-team",
      message: `Failures increased by ${failureMomentum} in the latest run.`,
      reason: "Failure momentum detected.",
    });
  }

  for (const r of risky) {
    actions.push({
      type: "create-issue",
      requirementId: r.requirementId,
      title: `High-risk requirement: ${r.title}`,
      reason: "Marked as risky with recent failures.",
    });
  }

  for (const h of healing) {
    if (h.confidence > 0.7) {
      actions.push({
        type: "apply-healing",
        testId: h.testId,
        fix: h.suggestedFix,
        reason: "High-confidence healing signal.",
      });
    }
  }

  if (latest && latest.flaky > 0) {
    actions.push({
      type: "rerun-tests",
      tests: unstable.flatMap((r) => r.linkedTests),
      reason: "Detected flaky tests in the latest run.",
    });
  }

  if (risky.length > 3) {
    actions.push({
      type: "gate-release",
      reason: "Too many risky requirements.",
    });
  }

  return actions;
}
