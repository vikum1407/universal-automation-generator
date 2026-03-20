import type { SuiteDashboard } from "../types/suite-dashboard";

const API_BASE = "/api/suites";

export async function fetchSuiteDashboard(suiteId: string): Promise<SuiteDashboard> {
  const res = await fetch(`${API_BASE}/dashboard/${suiteId}`);
  if (!res.ok) throw new Error("Failed to load suite dashboard");
  return res.json();
}
