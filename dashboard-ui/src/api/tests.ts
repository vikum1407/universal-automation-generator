import type { TestDashboard } from "@/types/test-dashboard";

const OLD_API_BASE = "/api/tests";

export async function fetchTestDashboard(testId: string): Promise<TestDashboard> {
  const res = await fetch(`${OLD_API_BASE}/${testId}/dashboard`);
  if (!res.ok) throw new Error("Failed to load test dashboard");
  return res.json();
}

// ── New enterprise tests API ──────────────────────────────────────────────────

const API_BASE = "http://localhost:3000";

export type TestStatus = "passed" | "failed" | "flaky" | "not-run";
export type TestType = "ui" | "api" | "hybrid";
export type TestView = "list" | "tree" | "requirement" | "risk";

export interface TestItem {
  id: string;
  name: string;
  fileName: string;
  folder: "root" | "tests";
  type: TestType;
  status: TestStatus;
  lastRun: string | null;
  duration: number | null;
  requirements: string[];
  endpoint: string | null;
  stabilityScore: number;
  riskScore: number;
  assertionCount: number;
  selectorCount: number;
  linesOfCode: number;
  aiSuggestions: number;
  content: string;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  notRun: number;
  stabilityScore: number;
  aiSuggestions: number;
  lastRunAt: string | null;
  coverageImpact: number;
}

export async function fetchTests(projectId: string): Promise<TestItem[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/tests`);
  return res.json();
}

export async function fetchTestSummary(projectId: string): Promise<TestSummary> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/tests/summary`);
  return res.json();
}

export async function runAllTests(projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/tests/run`, { method: "POST" });
  return res.json();
}

export async function runSingleTest(projectId: string, testId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/tests/${testId}/run`, { method: "POST" });
  return res.json();
}

export async function healTest(projectId: string, testId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/tests/${testId}/heal`, { method: "POST" });
  return res.json();
}

export async function regenerateTest(projectId: string, testId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/tests/${testId}/regenerate`, { method: "POST" });
  return res.json();
}

export const STATUS_COLOR: Record<TestStatus, string> = {
  passed: "#66BB6A",
  failed: "#EF5350",
  flaky: "#FFA726",
  "not-run": "#90A4AE",
};

export const TYPE_COLOR: Record<string, string> = {
  ui: "#9C27B0",
  api: "#448AFF",
  hybrid: "#FF7043",
};
