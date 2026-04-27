const API_BASE = "http://localhost:3000";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type InsightType =
  | "risk-hotspot"
  | "coverage-gap"
  | "flaky-cluster"
  | "critical-flow-instability"
  | "endpoint-risk"
  | "ai-impact"
  | "auto-heal-opportunity"
  | "quality-debt"
  | "trend-anomaly";

export type InsightSeverity = "low" | "medium" | "high" | "critical";
export type InsightStatus = "open" | "in-progress" | "resolved" | "dismissed";

export interface InsightAction {
  id: string;
  type: string;
  label: string;
  description?: string;
  target?: Record<string, any>;
}

export interface Insight {
  id: string;
  projectId: string;
  projectName?: string;
  projectType?: string;
  type: InsightType;
  severity: InsightSeverity;
  status: InsightStatus;
  title: string;
  description: string;
  area: string;
  createdAt: string;
  updatedAt: string;
  metricsSnapshot: Record<string, number>;
  suggestedActions: InsightAction[];
  linkedEntities: {
    requirementIds?: string[];
    endpointIds?: string[];
    flowIds?: string[];
    testIds?: string[];
    autoHealIds?: string[];
  };
  tags: string[];
}

export interface OrgInsightSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  topProjects: { id: string; name: string; type: string; total: number; critical: number; high: number }[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const SEVERITY_COLOR: Record<InsightSeverity, string> = {
  critical: "#EF5350",
  high:     "#FF7043",
  medium:   "#FFA726",
  low:      "#66BB6A",
};

export const SEVERITY_BG: Record<InsightSeverity, string> = {
  critical: "#EF535018",
  high:     "#FF704318",
  medium:   "#FFA72618",
  low:      "#66BB6A18",
};

export const TYPE_LABEL: Record<InsightType, string> = {
  "risk-hotspot":              "Risk Hotspot",
  "coverage-gap":              "Coverage Gap",
  "flaky-cluster":             "Flaky Cluster",
  "critical-flow-instability": "Flow Instability",
  "endpoint-risk":             "Endpoint Risk",
  "ai-impact":                 "AI Impact",
  "auto-heal-opportunity":     "Auto-Heal Opportunity",
  "quality-debt":              "Quality Debt",
  "trend-anomaly":             "Trend Anomaly",
};

export const TYPE_ICON: Record<InsightType, string> = {
  "risk-hotspot":              "🔥",
  "coverage-gap":              "📭",
  "flaky-cluster":             "🌀",
  "critical-flow-instability": "⚡",
  "endpoint-risk":             "🔓",
  "ai-impact":                 "🤖",
  "auto-heal-opportunity":     "🩹",
  "quality-debt":              "📉",
  "trend-anomaly":             "📊",
};

export const STATUS_LABEL: Record<InsightStatus, string> = {
  "open":        "Open",
  "in-progress": "In Progress",
  "resolved":    "Resolved",
  "dismissed":   "Dismissed",
};

export const STATUS_COLOR: Record<InsightStatus, string> = {
  "open":        "#EF5350",
  "in-progress": "#FFA726",
  "resolved":    "#66BB6A",
  "dismissed":   "#78909C",
};

// ─── Fetch functions ────────────────────────────────────────────────────────────

export async function fetchProjectInsights(
  projectId: string,
  filters?: { types?: string; severities?: string; statuses?: string }
): Promise<Insight[]> {
  const params = new URLSearchParams();
  if (filters?.types) params.set("types", filters.types);
  if (filters?.severities) params.set("severities", filters.severities);
  if (filters?.statuses) params.set("statuses", filters.statuses);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/projects/${projectId}/insights${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch insights");
  return res.json();
}

export async function refreshProjectInsights(projectId: string): Promise<Insight[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/insights/refresh`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to refresh insights");
  const data = await res.json();
  return data.insights ?? [];
}

export async function updateInsightStatus(
  projectId: string,
  insightId: string,
  status: InsightStatus
): Promise<Insight> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/insights/${insightId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update insight status");
  return res.json();
}

export async function fetchOrgInsights(filters?: {
  types?: string; severities?: string; statuses?: string; projectIds?: string;
}): Promise<Insight[]> {
  const params = new URLSearchParams();
  if (filters?.types) params.set("types", filters.types);
  if (filters?.severities) params.set("severities", filters.severities);
  if (filters?.statuses) params.set("statuses", filters.statuses);
  if (filters?.projectIds) params.set("projectIds", filters.projectIds);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/org/insights${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch org insights");
  return res.json();
}

export async function fetchOrgInsightSummary(): Promise<OrgInsightSummary> {
  const res = await fetch(`${API_BASE}/org/insights/summary`);
  if (!res.ok) throw new Error("Failed to fetch org insight summary");
  return res.json();
}
