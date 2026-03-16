export const API_BASE = "http://localhost:3000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  return res.json() as Promise<T>;
}

export interface JourneyCoverageMap {
  pages: Record<string, number>;
  transitions: Record<string, number>;
  journeys: number;
}

export const DashboardAPI = {
  // Projects list
  journeys: () => get<any[]>("/dashboard/projects"),

  // Project overview (latest run)
  journey: (id: string) => get<any>(`/dashboard/projects/${id}/latest`),

  // Legacy endpoints (unused unless you add backend support)
  journeyClusters: () => get<any[]>("/dashboard/journeyClusters"),
  cluster: (id: string) => get<any>(`/dashboard/journeyClusters/${id}`),
  journeyCoverage: () => get<JourneyCoverageMap>("/dashboard/journeyCoverage"),
  journeySummaries: () => get<any[]>("/dashboard/journeySummaries"),

  // Insights
  journeyInsights: (project: string) =>
    get<string[]>(`/dashboard/projects/${project}/insights`),

  artifacts: () => get<any[]>("/dashboard/artifacts"),

  journeyGraph: () =>
    fetch(`${API_BASE}/dashboard/journeyGraph`).then(r => r.text())
};
