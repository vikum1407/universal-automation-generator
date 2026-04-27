const API_BASE = "http://localhost:3000";

export type HistoryEntityType =
  | "requirement" | "test" | "flow" | "endpoint" | "rtm"
  | "coverage" | "suggestion" | "auto-heal" | "replay-run" | "config" | "project";

export type HistoryEventType =
  | "created" | "updated" | "deleted" | "linked" | "unlinked"
  | "run-started" | "run-completed" | "healed" | "suggested"
  | "applied" | "rejected" | "regenerated" | "coverage-changed" | "risk-changed";

export interface HistoryEvent {
  id: string;
  projectId: string;
  entityType: HistoryEntityType;
  entityId: string;
  eventType: HistoryEventType;
  timestamp: string;
  actorType: "user" | "system" | "ai" | "ci";
  actorId?: string;
  summary: string;
  details?: any;
  metadata?: Record<string, any>;
}

export interface HistorySummary {
  total: number;
  last24h: number;
  last7d: number;
  last30d: number;
  aiDriven: number;
  userDriven: number;
  systemDriven: number;
  riskImpacting: number;
  coverageImpacting: number;
  stabilityImpacting: number;
}

export interface HistoryListResponse {
  events: HistoryEvent[];
  total: number;
  offset: number;
  limit: number;
}

export interface HistoryFilters {
  from?: string;
  to?: string;
  entityType?: string;
  eventType?: string;
  actorType?: string;
  impact?: string;
}

export const ENTITY_ICON: Record<HistoryEntityType, string> = {
  requirement: "📋",
  test: "🧪",
  flow: "🌐",
  endpoint: "🔌",
  rtm: "📊",
  coverage: "📈",
  suggestion: "💡",
  "auto-heal": "🔧",
  "replay-run": "▶️",
  config: "⚙️",
  project: "📁",
};

export const ENTITY_LABEL: Record<HistoryEntityType, string> = {
  requirement: "Requirement",
  test: "Test",
  flow: "Flow",
  endpoint: "Endpoint",
  rtm: "RTM",
  coverage: "Coverage",
  suggestion: "Suggestion",
  "auto-heal": "Auto-Heal",
  "replay-run": "Replay Run",
  config: "Config",
  project: "Project",
};

export const ENTITY_COLOR: Record<HistoryEntityType, string> = {
  requirement: "#9C27B0",
  test: "#42A5F5",
  flow: "#7B2FF7",
  endpoint: "#448AFF",
  rtm: "#AB47BC",
  coverage: "#FF9800",
  suggestion: "#26C6DA",
  "auto-heal": "#7B2FF7",
  "replay-run": "#66BB6A",
  config: "#90A4AE",
  project: "#78909C",
};

export const EVENT_COLOR: Record<HistoryEventType, string> = {
  created: "#66BB6A",
  updated: "#42A5F5",
  deleted: "#EF5350",
  linked: "#AB47BC",
  unlinked: "#90A4AE",
  "run-started": "#FFA726",
  "run-completed": "#66BB6A",
  healed: "#7B2FF7",
  suggested: "#26C6DA",
  applied: "#66BB6A",
  rejected: "#EF5350",
  regenerated: "#42A5F5",
  "coverage-changed": "#FF9800",
  "risk-changed": "#EF5350",
};

export const EVENT_LABEL: Record<HistoryEventType, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  linked: "Linked",
  unlinked: "Unlinked",
  "run-started": "Run Started",
  "run-completed": "Run Completed",
  healed: "Healed",
  suggested: "Suggested",
  applied: "Applied",
  rejected: "Rejected",
  regenerated: "Regenerated",
  "coverage-changed": "Coverage Changed",
  "risk-changed": "Risk Changed",
};

export const ACTOR_COLOR: Record<string, string> = {
  user: "#42A5F5",
  system: "#78909C",
  ai: "#7B2FF7",
  ci: "#FF9800",
};

export const ACTOR_LABEL: Record<string, string> = {
  user: "User",
  system: "System",
  ai: "AI",
  ci: "CI",
};

export const ENTITY_TAB_LINK: Partial<Record<HistoryEntityType, string>> = {
  requirement: "rtm",
  test: "tests",
  flow: "flows",
  endpoint: "flows",
  rtm: "rtm",
  coverage: "coverage",
  suggestion: "suggestions",
  "auto-heal": "autoheal",
  "replay-run": "replay",
};

function buildQs(params: Record<string, string | number | undefined>) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "" && v !== "all")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
}

export async function fetchHistorySummary(projectId: string): Promise<HistorySummary> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/history/summary`);
  return res.json();
}

export async function fetchHistory(
  projectId: string,
  filters: HistoryFilters & { limit?: number; offset?: number } = {},
): Promise<HistoryListResponse> {
  const qs = buildQs(filters as any);
  const url = `${API_BASE}/projects/${projectId}/history${qs ? `?${qs}` : ""}`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchHistoryEvent(projectId: string, eventId: string): Promise<HistoryEvent | null> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/history/${eventId}`);
  return res.json();
}

export async function recordHistoryEvent(projectId: string, event: Partial<HistoryEvent>): Promise<HistoryEvent> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  return res.json();
}
