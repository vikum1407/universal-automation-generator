const API_BASE = "http://localhost:3000";

export interface TrendPoint { date: string; value: number; }

export interface TrendsOverview {
  from: string; to: string;
  kpis: {
    coverage: { value: number; delta: number };
    passRate: { value: number; delta: number };
    riskScore: { value: number; delta: number };
    testsTotal: { value: number; delta: number };
    aiActions: { value: number; delta: number };
  };
  series: {
    coverage: TrendPoint[];
    passRate: TrendPoint[];
    riskScore: TrendPoint[];
    testsTotal: TrendPoint[];
    flakyCount: TrendPoint[];
  };
}

export interface TrendsCoverage {
  from: string; to: string;
  current: { requirements: number; ui: number; api: number; flows: number; endpoints: number };
  series: { requirements: TrendPoint[]; ui: TrendPoint[]; api: TrendPoint[]; flows: TrendPoint[]; endpoints: TrendPoint[] };
}

export interface TrendsRisk {
  from: string; to: string;
  current: { score: number; highUncovered: number; criticalUncovered: number };
  series: { score: TrendPoint[]; highUncovered: TrendPoint[]; criticalUncovered: TrendPoint[] };
}

export interface TrendsStability {
  from: string; to: string;
  current: { passRate: number; failureRate: number; flakyCount: number; flakyRate: number };
  series: { passRate: TrendPoint[]; failureRate: TrendPoint[]; flakyCount: TrendPoint[]; flakyRate: TrendPoint[] };
}

export interface TrendsTests {
  from: string; to: string;
  current: { total: number };
  series: { total: TrendPoint[]; added: TrendPoint[]; healed: TrendPoint[]; regenerated: TrendPoint[] };
}

export interface TrendsAI {
  from: string; to: string;
  current: { sugTotal: number; sugApplied: number; healTotal: number; healApplied: number; applyRate: number; healRate: number };
  periodTotals: { sugCreated: number; sugApplied: number; healCreated: number; healApplied: number };
  series: { sugCreated: TrendPoint[]; sugApplied: TrendPoint[]; healCreated: TrendPoint[]; healApplied: TrendPoint[]; coverageDelta: TrendPoint[] };
}

export interface TrendsFlows {
  from: string; to: string;
  current: { flowsTotal: number; flowsWithFailures: number; endpointsTotal: number; endpointsWithFailures: number; healthScore: number };
  series: { health: TrendPoint[]; flowFailures: TrendPoint[]; endpointFailures: TrendPoint[] };
}

export type DateRange = "7d" | "30d" | "90d";

export const DATE_RANGE_OPTIONS: { value: DateRange; label: string; days: number }[] = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
];

function qs(days: number) { return `?days=${days}`; }

export async function fetchTrendsOverview(projectId: string, days: number): Promise<TrendsOverview> {
  return fetch(`${API_BASE}/projects/${projectId}/trends/overview${qs(days)}`).then(r => r.json());
}

export async function fetchTrendsCoverage(projectId: string, days: number): Promise<TrendsCoverage> {
  return fetch(`${API_BASE}/projects/${projectId}/trends/coverage${qs(days)}`).then(r => r.json());
}

export async function fetchTrendsRisk(projectId: string, days: number): Promise<TrendsRisk> {
  return fetch(`${API_BASE}/projects/${projectId}/trends/risk${qs(days)}`).then(r => r.json());
}

export async function fetchTrendsStability(projectId: string, days: number): Promise<TrendsStability> {
  return fetch(`${API_BASE}/projects/${projectId}/trends/stability${qs(days)}`).then(r => r.json());
}

export async function fetchTrendsTests(projectId: string, days: number): Promise<TrendsTests> {
  return fetch(`${API_BASE}/projects/${projectId}/trends/tests${qs(days)}`).then(r => r.json());
}

export async function fetchTrendsAI(projectId: string, days: number): Promise<TrendsAI> {
  return fetch(`${API_BASE}/projects/${projectId}/trends/ai${qs(days)}`).then(r => r.json());
}

export async function fetchTrendsFlows(projectId: string, days: number): Promise<TrendsFlows> {
  return fetch(`${API_BASE}/projects/${projectId}/trends/flows-endpoints${qs(days)}`).then(r => r.json());
}
