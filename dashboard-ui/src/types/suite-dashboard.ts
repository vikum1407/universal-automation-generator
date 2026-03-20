export interface SuiteDashboard {
  suiteId: string;

  summary: {
    totalRuns: number;
    successRate: number;
    failureRate: number;
    averageDurationMs: number;
  };

  leaderboards: {
    fastestRuns: SuiteRun[];
    slowestRuns: SuiteRun[];
    mostFailedTests: TestStats[];
    mostPassedTests: TestStats[];
  };

  flaky: {
    isFlaky: boolean;
    flakinessScore: number;
    flips: number;
    failureClusters: number;
    longestPassStreak: number;
  };

  trends: {
    daily: DailyTrend[];
  };

  latestRuns: SuiteRun[];
}

export interface SuiteRun {
  runId: string;
  status: 'completed' | 'failed' | 'running';
  startedAt: string;
  finishedAt: string | null;
  duration: number | null;
  tests: SuiteRunTest[];
}

export interface SuiteRunTest {
  testId: string;
  result: {
    status: 'completed' | 'failed';
    startedAt?: string;
    finishedAt?: string;
    duration?: number;
  };
}

export interface TestStats {
  testId: string;
  passes: number;
  fails: number;
}

export interface DailyTrend {
  day: string;
  totalRuns: number;
  successRate: number;
  failureRate: number;
  averageDurationMs: number;
  flakiness: number;
}
