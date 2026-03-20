export interface TestDashboard {
  testId: string;

  summary: {
    totalRuns: number;
    lastStatus: "completed" | "failed" | "running";
    lastDurationMs: number | null;
    successRate: number;
    failureRate: number;
    flakinessScore: number;
  };

  latestRun: TestRun | null;

  runs: TestRun[];

  trends: {
    daily: TestTrendPoint[];
  };

  aiInsights: {
    keyFindings: string[];
    suggestedFixes: string[];
    riskLevel: "P0" | "P1" | "P2";
  };
}

export interface TestRun {
  runId: string;
  status: "completed" | "failed" | "running";
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;

  // Optional fields for detailed panels
  assertions?: {
    id: string;
    passed: boolean;
    message: string;
  }[];

  logs?: {
    type: string;
    message: string;
    timestamp: string;
  }[];

  artifacts?: {
    id: string;
    type: "screenshot" | "video" | "snapshot" | "diff";
    url: string;
  }[];

  error?: {
    message: string;
    stack: string;
  } | null;
}

export interface TestTrendPoint {
  day: string;
  successRate: number;
  failureRate: number;
  flakiness: number;
}

