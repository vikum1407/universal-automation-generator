import type { ExecutionResult } from "@/engine/ActionExecutionEngine";
import type { StabilitySnapshot } from "@/types/StabilitySnapshot";

export interface LearningState {
  healingEffectiveness: Record<string, number>;
  flakyCounts: Record<string, number>;
  failurePatterns: Record<string, number>;
  requirementRegression: Record<string, number>;
}

export class LearningEngine {
  private state: LearningState;

  constructor(initial?: Partial<LearningState>) {
    this.state = {
      healingEffectiveness: {},
      flakyCounts: {},
      failurePatterns: {},
      requirementRegression: {},
      ...initial,
    };
  }

  updateFromSnapshot(snapshot: StabilitySnapshot) {
    for (const test of snapshot.tests ?? []) {
      if (test.status === "flaky") {
        this.state.flakyCounts[test.testId] =
          (this.state.flakyCounts[test.testId] ?? 0) + 1;
      }
    }

    for (const req of snapshot.requirements ?? []) {
      if (req.status === "unstable" || req.status === "risky") {
        this.state.requirementRegression[req.requirementId] =
          (this.state.requirementRegression[req.requirementId] ?? 0) + 1;
      }
    }

    for (const h of snapshot.selfHealing ?? []) {
      this.state.failurePatterns[h.failurePattern] =
        (this.state.failurePatterns[h.failurePattern] ?? 0) + 1;
    }
  }

  updateFromExecution(results: ExecutionResult[]) {
    for (const r of results) {
      if (r.action.type === "apply-healing") {
        const key = r.action.testId;
        const prev = this.state.healingEffectiveness[key] ?? 0;

        if (r.status === "success") {
          this.state.healingEffectiveness[key] = prev + 1;
        } else if (r.status === "failed") {
          this.state.healingEffectiveness[key] = prev - 1;
        }
      }
    }
  }

  getState(): LearningState {
    return this.state;
  }
}
