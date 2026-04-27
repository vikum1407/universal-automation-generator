const API_BASE = "http://localhost:3000";

export interface EnrichedFlow {
  id: string;
  name: string;
  url: string;
  type: "ui" | "hybrid";
  nodeCount: number;
  edgeCount: number;
  actions: string[];
  linkedRequirements: string[];
  linkedTests: string[];
  coverageScore: number;
  riskScore: number;
  stabilityScore: number;
  tags: string[];
  hasFailingTests: boolean;
}

export interface EnrichedEndpoint {
  id: string;
  method: string;
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: any[];
  requestBody: any;
  responseSchemas: Record<string, any>;
  linkedRequirements: string[];
  linkedTests: string[];
  linkedFlows: string[];
  coverageScore: number;
  riskScore: number;
  stabilityScore: number;
  unused: boolean;
  hasFailingTests: boolean;
  lastTestStatus: string | null;
}

export interface SystemMapSummary {
  projectType: "ui" | "api" | "hybrid";
  totalFlows: number;
  totalEndpoints: number;
  coveredFlows: number;
  coveredEndpoints: number;
  coveredFlowsPct: number;
  coveredEndpointsPct: number;
  highRiskFlows: number;
  highRiskEndpoints: number;
  unusedEndpoints: number;
  flowsWithFailingTests: number;
  endpointsWithFailingTests: number;
}

export async function fetchSystemMapSummary(projectId: string): Promise<SystemMapSummary> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/system-map/summary`);
  return res.json();
}

export async function fetchSystemFlows(projectId: string): Promise<EnrichedFlow[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/system-map/flows`);
  return res.json();
}

export async function fetchSystemEndpoints(projectId: string): Promise<EnrichedEndpoint[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/system-map/endpoints`);
  return res.json();
}

export async function fetchFlowGraph(projectId: string): Promise<{ nodes: any[]; edges: any[] }> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/system-map/flow-graph`);
  return res.json();
}

export async function rebuildSystemMap(projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/system-map/rebuild`, { method: "POST" });
  return res.json();
}

export const METHOD_COLOR: Record<string, string> = {
  GET: "#00C853",
  POST: "#448AFF",
  PUT: "#FFA726",
  PATCH: "#AB47BC",
  DELETE: "#EF5350",
};
