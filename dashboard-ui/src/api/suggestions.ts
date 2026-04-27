const API_BASE = "http://localhost:3000";

export type SuggestionType =
  | "missing-test"
  | "improve-test"
  | "heal"
  | "rewrite-requirement"
  | "risk"
  | "stability"
  | "release";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type SuggestionStatus = "pending" | "applied" | "dismissed";

export interface SuggestionAction {
  label: string;
  type: "generate-test" | "heal" | "refactor" | "rewrite" | "regenerate" | "apply";
  payload: any;
}

export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  requirementId?: string;
  testId?: string;
  endpoint?: string;
  flowId?: string;
  riskLevel: RiskLevel;
  impact: number;
  confidence: number;
  aiReasoning: string;
  actions: SuggestionAction[];
  status: SuggestionStatus;
  createdAt: string;
}

export interface SuggestionsAnalytics {
  total: number;
  highRisk: number;
  autoFixable: number;
  applied: number;
  dismissed: number;
  byCategory: Partial<Record<SuggestionType, number>>;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
  analytics: SuggestionsAnalytics;
}

export async function fetchSuggestions(projectId: string): Promise<SuggestionsResponse> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/suggestions`);
  return res.json();
}

export async function generateSuggestions(projectId: string): Promise<SuggestionsResponse> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/suggestions/generate`, {
    method: "POST",
  });
  return res.json();
}

export async function updateSuggestionStatus(
  projectId: string,
  suggId: string,
  status: SuggestionStatus
): Promise<void> {
  await fetch(`${API_BASE}/projects/${projectId}/suggestions/${suggId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function applySuggestion(
  projectId: string,
  suggId: string,
  actionType: string,
  payload?: any
): Promise<void> {
  await fetch(`${API_BASE}/projects/${projectId}/suggestions/${suggId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actionType, ...payload }),
  });
}

// ── Label helpers ─────────────────────────────────────────────────────────────

export const TYPE_LABEL: Record<SuggestionType, string> = {
  "missing-test": "Missing Test",
  "improve-test": "Improve Test",
  "heal": "Auto-Heal",
  "rewrite-requirement": "Rewrite Req",
  "risk": "Risk",
  "stability": "Stability",
  "release": "Release",
};

export const TYPE_COLOR: Record<SuggestionType, string> = {
  "missing-test": "#EF5350",
  "improve-test": "#FFA726",
  "heal": "#AB47BC",
  "rewrite-requirement": "#42A5F5",
  "risk": "#FF7043",
  "stability": "#26C6DA",
  "release": "#66BB6A",
};

export const RISK_COLOR: Record<RiskLevel, string> = {
  critical: "#EF5350",
  high: "#FF7043",
  medium: "#FFA726",
  low: "#66BB6A",
};
