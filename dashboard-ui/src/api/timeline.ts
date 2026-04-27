const API_BASE = "http://localhost:3000";

export type TimelineSeverity = "info" | "low" | "medium" | "high" | "critical";

export type TimelineEventType =
  | "scan-completed" | "tests-generated" | "tests-executed"
  | "auto-heal-applied" | "suggestions-applied" | "coverage-milestone"
  | "risk-spike" | "incident-detected" | "config-changed";

export interface TimelineEvent {
  id: string;
  projectId: string;
  projectName: string;
  projectType: "ui" | "api" | "hybrid";
  type: TimelineEventType;
  title: string;
  description?: string;
  timestamp: string;
  severity: TimelineSeverity;
  tags: string[];
  metrics?: {
    coverageDelta?: number;
    testsAdded?: number;
    testsHealed?: number;
    failures?: number;
    flakinessDelta?: number;
    riskDelta?: number;
  };
  links?: {
    projectId?: string;
    runId?: string;
    historyEventIds?: string[];
  };
}

export interface TimelineSummary {
  projectsActive: number;
  scansLast24h: number;
  scansLast7d: number;
  runsLast24h: number;
  runsLast7d: number;
  autoHealsLast7d: number;
  suggestionsLast7d: number;
  coverageTrend: { projectId: string; label: string; before: number; after: number }[];
  riskEvents: number;
  criticalEvents: number;
}

export interface TimelineListResponse {
  events: TimelineEvent[];
  total: number;
  offset: number;
  limit: number;
}

export interface TimelineProject {
  id: string;
  name: string;
  type: "ui" | "api" | "hybrid";
}

export interface TimelineFilters {
  from?: string;
  to?: string;
  projectId?: string;
  type?: string;
  severity?: string;
}

export const EVENT_TYPE_ICON: Record<TimelineEventType, string> = {
  "scan-completed": "🔍",
  "tests-generated": "🤖",
  "tests-executed": "▶️",
  "auto-heal-applied": "🔧",
  "suggestions-applied": "💡",
  "coverage-milestone": "📈",
  "risk-spike": "🔥",
  "incident-detected": "🚨",
  "config-changed": "⚙️",
};

export const EVENT_TYPE_LABEL: Record<TimelineEventType, string> = {
  "scan-completed": "Scan Completed",
  "tests-generated": "Tests Generated",
  "tests-executed": "Tests Executed",
  "auto-heal-applied": "Auto-Heal Applied",
  "suggestions-applied": "Suggestions Applied",
  "coverage-milestone": "Coverage Milestone",
  "risk-spike": "Risk Spike",
  "incident-detected": "Incident Detected",
  "config-changed": "Config Changed",
};

export const SEVERITY_COLOR: Record<TimelineSeverity, string> = {
  info: "#42A5F5",
  low: "#66BB6A",
  medium: "#FFA726",
  high: "#EF5350",
  critical: "#B71C1C",
};

export const SEVERITY_BG: Record<TimelineSeverity, string> = {
  info: "#42A5F518",
  low: "#66BB6A18",
  medium: "#FFA72618",
  high: "#EF535018",
  critical: "#B71C1C18",
};

export const PROJECT_TYPE_COLOR: Record<string, string> = {
  ui: "#9C27B0",
  api: "#448AFF",
  hybrid: "#FF9800",
};

const TIME_RANGE_MS: Record<string, number> = {
  "24h": 86_400_000,
  "7d": 7 * 86_400_000,
  "30d": 30 * 86_400_000,
  "90d": 90 * 86_400_000,
};

export function timeRangeToFrom(range: string): string | undefined {
  if (!range) return undefined;
  const ms = TIME_RANGE_MS[range];
  return ms ? new Date(Date.now() - ms).toISOString() : undefined;
}

function qs(params: Record<string, string | number | undefined>) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "" && v !== "all")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
}

export async function fetchTimelineSummary(): Promise<TimelineSummary> {
  const res = await fetch(`${API_BASE}/timeline/summary`);
  return res.json();
}

export async function fetchTimeline(
  filters: TimelineFilters & { limit?: number; offset?: number } = {},
): Promise<TimelineListResponse> {
  const q = qs(filters as any);
  const url = `${API_BASE}/timeline${q ? `?${q}` : ""}`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchTimelineProjects(): Promise<TimelineProject[]> {
  const res = await fetch(`${API_BASE}/timeline/projects`);
  return res.json();
}
