export type StabilitySnapshot = {
  release: string | ReleaseMetrics;
  executions: ExecutionSummary[];
  requirements: RequirementStability[];
  selfHealing: HealingSignal[];

  // Added for Test-level Stability Matrix
  tests: TestStability[];
};

export interface ExecutionSummary {
  runId: string;
  startedAt: string;
  durationMs: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  environment: string;
}

export interface RequirementStability {
  requirementId: string;
  title: string;
  status: "stable" | "unstable" | "risky";
  passRate: number;
  recentFailures: number;
  linkedTests: string[];
}

export interface TestStability {
  testId: string;
  title: string;
  status: "stable" | "unstable" | "flaky" | "risky";
  passRate: number;
  recentFailures: number;
  linkedRequirements: string[];
}

export interface HealingSignal {
  testId: string;
  failurePattern: string;
  suggestedFix: string;
  confidence: number;
}

export interface ReleaseMetrics {
  readinessScore: number;
  riskLevel: "low" | "medium" | "high";
  blockers: string[];
  highlights: string[];
}
