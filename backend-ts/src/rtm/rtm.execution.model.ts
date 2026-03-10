export interface TestExecutionResult {
  testId: string;
  requirementId: string;
  status: 'passed' | 'failed';
  errorMessage?: string | null;
}

export interface RTMExecutionDocument {
  executedAt: string;
  results: TestExecutionResult[];
}
