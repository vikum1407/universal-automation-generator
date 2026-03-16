export interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  error: string | null;
  durationMs: number;
}

export interface ExecutionResult {
  project: string;
  timestamp: number;
  results: TestResult[];
  summary: {
    passed: number;
    failed: number;
    total: number;
  };
  raw: {
    stdout: string;
    stderr: string;
  };
}
