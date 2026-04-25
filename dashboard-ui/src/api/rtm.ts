const API_BASE = "http://localhost:3000";

// ─────────────────────────────────────────────────────────────
// Core types
// ─────────────────────────────────────────────────────────────

export type ReqType = "ui" | "api" | "hybrid" | "performance" | "security" | "business";
export type Priority = "low" | "medium" | "high" | "critical";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type TestStatus = "passed" | "failed" | "flaky" | "skipped" | "not-run";

export interface RTMRequirementSource {
  pageName?: string | null;
  endpointPath?: string | null;
  method?: string | null;
  flowId?: string | null;
  swaggerRef?: string | null;
  domSelector?: string | null;
}

export interface RTMAILogic {
  generatedBy: string;
  lastImprovedAt: string | null;
  confidenceScore: number;
  reasoning: string;
  steps: string[];
  assertions: string[];
  negativeTests: string[];
}

export interface RTMHistoryEntry {
  timestamp: string;
  change: string;
  actor: string;
}

export interface RTMRequirement {
  id: string;
  title: string;
  description: string;
  type: ReqType;
  source: RTMRequirementSource;
  businessPriority: Priority;
  riskLevel: RiskLevel;
  tags: string[];
  coveredBy: string[];
  covered: boolean;
  specFile: string | null;
  aiLogic: RTMAILogic;
  history: RTMHistoryEntry[];
}

export interface RTMBreakdownRow {
  type?: string;
  businessPriority?: string;
  riskLevel?: string;
  total: number;
  covered: number;
  uncovered: number;
  pct: number;
}

export interface RTMAnalytics {
  totalRequirements: number;
  coveredRequirements: number;
  coveragePercent: number;
  riskScore: number;
  stabilityScore: number;
  aiConfidenceScore: number;
  specFilesFound: number;
  byType: (RTMBreakdownRow & { type: string })[];
  byPriority: (RTMBreakdownRow & { businessPriority: string })[];
  byRisk: (RTMBreakdownRow & { riskLevel: string })[];
  trending: { new: number; updated: number; risky: number };
}

export interface RTMInsights {
  highRiskUncovered: RTMRequirement[];
  duplicateSuspects: { ids: string[]; titles: string[]; similarity: number }[];
  needsRewrite: RTMRequirement[];
  withFailingTests: RTMRequirement[];
  withFlakyTests: RTMRequirement[];
}

export interface RTMEnterpriseResponse {
  generatedAt: string;
  requirements: RTMRequirement[];
  analytics: RTMAnalytics;
  insights: RTMInsights;
}

// ─────────────────────────────────────────────────────────────
// API calls
// ─────────────────────────────────────────────────────────────

export async function fetchRTM(projectId: string): Promise<RTMEnterpriseResponse> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/rtm`);
  if (!res.ok) throw new Error("RTM not found");
  return res.json();
}

export async function regenerateRTM(projectId: string, ids: string[] = []): Promise<void> {
  await fetch(`${API_BASE}/projects/${projectId}/rtm/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selectedRequirementIds: ids }),
  });
}

export async function patchRequirement(
  projectId: string,
  reqId: string,
  updates: Partial<RTMRequirement>,
): Promise<void> {
  await fetch(`${API_BASE}/projects/${projectId}/rtm/${reqId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export function exportRTMUrl(projectId: string): string {
  return `${API_BASE}/projects/${projectId}/rtm/export`;
}

// Legacy compat (used by older components)
export type RTMRequirementView = RTMRequirement;
export type RTMResponse = RTMEnterpriseResponse;
