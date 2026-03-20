export interface GuardrailsResponse {
  project: string;
  generatedAt: string;
  guardrails: any;
}

export interface ScoreResponse {
  project: string;
  generatedAt: string;
  score: any;
}

export interface ReadinessResponse {
  project: string;
  generatedAt: string;
  readiness: any;
}

export interface StabilizationResponse {
  project: string;
  generatedAt: string;
  stabilization: any;
}

export interface DashboardResponse {
  project: string;
  generatedAt: string;
  guardrails: any;
  score: any;
  readiness: any;
  contexts: {
    guardrails: any;
    score: any;
    readiness: any;
  };
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function get<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const StabilityAPI = {
  getGuardrails: (project: string) =>
    get<GuardrailsResponse>(`/stability/${project}/guardrails`),

  getScore: (project: string) =>
    get<ScoreResponse>(`/stability/${project}/score`),

  getReadiness: (project: string) =>
    get<ReadinessResponse>(`/stability/${project}/readiness`),

  runStabilization: (project: string) =>
    get<StabilizationResponse>(`/stability/${project}/stabilize`),

  getDashboard: (project: string) =>
    get<DashboardResponse>(`/stability/${project}/dashboard`),

  getFullContext: (project: string) =>
    get(`/stability/${project}/context`)
};
