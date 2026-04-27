const API_BASE = "http://localhost:3000";

export type HealType = "selector" | "timing" | "flow" | "api-schema" | "status-code" | "url" | "data-contract";
export type HealStatus = "pending" | "applied" | "validated" | "ignored" | "failed";

export interface HealPatch {
  filePath: string;
  before: string;
  after: string;
}

export interface AutoHealItem {
  id: string;
  testId: string;
  testFileName: string;
  requirementId: string | null;
  requirement: string | null;
  type: HealType;
  rootCause: string;
  aiReasoning: string;
  patch: HealPatch;
  confidence: number;
  impact: number;
  autoApplicable: boolean;
  status: HealStatus;
  createdAt: string;
  validated: boolean;
  lastFailed: string | null;
  healedAt: string | null;
}

export interface AutoHealSummary {
  totalHealable: number;
  autoHealedLast7Days: number;
  healingSuccessRate: number;
  flakyReduced: number;
  highRiskUnhealed: number;
}

export interface AutoHealStore {
  heals: AutoHealItem[];
  scannedAt: string;
}

export async function fetchAutoHeal(projectId: string): Promise<AutoHealStore> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/auto-heal`);
  return res.json();
}

export async function fetchAutoHealSummary(projectId: string): Promise<AutoHealSummary> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/auto-heal/summary`);
  return res.json();
}

export async function scanAutoHeal(projectId: string): Promise<AutoHealStore> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/auto-heal/scan`, { method: "POST" });
  return res.json();
}

export async function applyHeal(projectId: string, healId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/auto-heal/${healId}/apply`, { method: "POST" });
  return res.json();
}

export async function validateHeal(projectId: string, healId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/auto-heal/${healId}/validate`, { method: "POST" });
  return res.json();
}

export async function ignoreHeal(projectId: string, healId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/auto-heal/${healId}/ignore`, { method: "POST" });
  return res.json();
}

export const TYPE_LABEL: Record<HealType, string> = {
  selector: "Selector",
  timing: "Timing",
  flow: "Flow",
  "api-schema": "API Schema",
  "status-code": "Status Code",
  url: "URL",
  "data-contract": "Data Contract",
};

export const TYPE_COLOR: Record<HealType, string> = {
  selector: "#9C27B0",
  timing: "#FF9800",
  flow: "#2196F3",
  "api-schema": "#4CAF50",
  "status-code": "#00BCD4",
  url: "#FF5722",
  "data-contract": "#795548",
};

export const STATUS_COLOR: Record<HealStatus, string> = {
  pending: "#FFA726",
  applied: "#66BB6A",
  validated: "#42A5F5",
  ignored: "#90A4AE",
  failed: "#EF5350",
};

export const STATUS_LABEL: Record<HealStatus, string> = {
  pending: "Pending",
  applied: "Applied",
  validated: "Validated",
  ignored: "Ignored",
  failed: "Failed",
};
