const API_BASE = "http://localhost:3000";

export type RunStatus = "passed" | "failed" | "partial" | "cancelled";
export type ResultStatus = "passed" | "failed" | "flaky" | "skipped";
export type TriggerType = "user" | "ci" | "auto-heal" | "suggestion" | "schedule";

export interface TestRunResult {
  id: string;
  runId: string;
  testId: string;
  testFileName: string;
  requirements: string[];
  status: ResultStatus;
  durationMs: number;
  retries: number;
  errorMessage: string | null;
  errorStack: string | null;
  stdout: string;
}

export interface TestRun {
  id: string;
  projectId: string;
  label: string;
  testIds: string[];
  status: RunStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  environment: string;
  triggeredBy: TriggerType;
  summary: { total: number; passed: number; failed: number; flaky: number; skipped: number };
  results?: TestRunResult[];
}

export interface ReplaySummary {
  totalRuns: number;
  last24hRuns: number;
  passRate: number;
  avgDurationMs: number;
  flakyTests: number;
  lastRunStatus: RunStatus | null;
  lastRunAt: string | null;
}

export interface RunDiffEntry {
  fileName: string;
  testId: string;
  statusA: string;
  statusB: string;
  changed: boolean;
  fixed: boolean;
  broken: boolean;
  durationA: number | null;
  durationB: number | null;
  durationDelta: number;
  errorA: string | null;
  errorB: string | null;
}

export interface RunComparison {
  runA: { id: string; label: string; startedAt: string; status: RunStatus; summary: TestRun["summary"] };
  runB: { id: string; label: string; startedAt: string; status: RunStatus; summary: TestRun["summary"] };
  diff: RunDiffEntry[];
  newFailures: number;
  fixedTests: number;
  unchanged: number;
}

export async function fetchRuns(projectId: string): Promise<TestRun[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/replay/runs`);
  return res.json();
}

export async function fetchRun(projectId: string, runId: string): Promise<TestRun> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/replay/runs/${runId}`);
  return res.json();
}

export async function fetchReplaySummary(projectId: string): Promise<ReplaySummary> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/replay/summary`);
  return res.json();
}

export async function fetchTestHistory(projectId: string, testId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/replay/tests/${testId}/history`);
  return res.json();
}

export async function fetchCompare(projectId: string, runA: string, runB: string): Promise<RunComparison> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/replay/compare?runA=${runA}&runB=${runB}`);
  return res.json();
}

export async function runAll(projectId: string): Promise<TestRun> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/replay/run`, { method: "POST" });
  return res.json();
}

export async function runSingle(projectId: string, testId: string): Promise<TestRun> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/replay/tests/${testId}/run`, { method: "POST" });
  return res.json();
}

export const RUN_STATUS_COLOR: Record<RunStatus, string> = {
  passed: "#66BB6A",
  failed: "#EF5350",
  partial: "#FFA726",
  cancelled: "#90A4AE",
};

export const RESULT_STATUS_COLOR: Record<ResultStatus, string> = {
  passed: "#66BB6A",
  failed: "#EF5350",
  flaky: "#FFA726",
  skipped: "#90A4AE",
};

export const TRIGGER_COLOR: Record<TriggerType, string> = {
  user: "#448AFF",
  ci: "#AB47BC",
  "auto-heal": "#66BB6A",
  suggestion: "#FF9800",
  schedule: "#90A4AE",
};

export const TRIGGER_ICON: Record<TriggerType, string> = {
  user: "👤",
  ci: "⚙️",
  "auto-heal": "🩹",
  suggestion: "💡",
  schedule: "🕐",
};

export function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}
