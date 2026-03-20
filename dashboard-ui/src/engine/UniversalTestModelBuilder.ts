import type {
  StabilitySnapshot,
  RequirementStability,
  HealingSignal,
} from "@/types/StabilitySnapshot";
import type { LearningState } from "@/engine/LearningEngine";

export interface UniversalTestStep {
  id: string;
  description: string;
  selector?: string;
  assertion?: string;
}

export interface UniversalTestCase {
  id: string;
  title: string;
  linkedRequirements: string[];
  status: "stable" | "unstable" | "flaky" | "risky";
  passRate: number;
  recentFailures: number;
  flakinessScore: number;
  healingSignals: HealingSignal[];
  steps: UniversalTestStep[]; // placeholder for future DOM/flow extraction
}

export interface UniversalRequirementModel {
  id: string;
  title: string;
  status: "stable" | "unstable" | "risky";
  passRate: number;
  recentFailures: number;
  linkedTests: string[];
  regressionScore: number;
}

export interface UniversalTestModel {
  requirements: UniversalRequirementModel[];
  tests: UniversalTestCase[];
}

/**
 * Builds a universal test model from the current snapshot + learning state.
 * This is the backbone for C33 (Playwright Generator).
 */
export function buildUniversalTestModel(
  snapshot: StabilitySnapshot,
  learning: LearningState
): UniversalTestModel {
  const requirements = buildRequirementModels(snapshot, learning);
  const tests = buildTestModels(snapshot, learning);

  return {
    requirements,
    tests,
  };
}

function buildRequirementModels(
  snapshot: StabilitySnapshot,
  learning: LearningState
): UniversalRequirementModel[] {
  const reqs = snapshot.requirements ?? [];

  return reqs.map((r: RequirementStability) => {
    const regressionScore =
      learning.requirementRegression[r.requirementId] ?? 0;

    return {
      id: r.requirementId,
      title: r.title,
      status: r.status,
      passRate: r.passRate,
      recentFailures: r.recentFailures,
      linkedTests: r.linkedTests ?? [],
      regressionScore,
    };
  });
}

function buildTestModels(
  snapshot: StabilitySnapshot,
  learning: LearningState
): UniversalTestCase[] {
  const tests = (snapshot as any).tests ?? [];
  const healingSignals = snapshot.selfHealing ?? [];

  return tests.map((t: any) => {
    const flakinessScore = learning.flakyCounts[t.testId] ?? 0;
    const healingForTest = healingSignals.filter(
      (h) => h.testId === t.testId
    );

    return {
      id: t.testId,
      title: t.title,
      linkedRequirements: t.linkedRequirements ?? [],
      status: t.status,
      passRate: t.passRate,
      recentFailures: t.recentFailures,
      flakinessScore,
      healingSignals: healingForTest,
      steps: [], // to be populated later from DOM/flow capture
    };
  });
}
