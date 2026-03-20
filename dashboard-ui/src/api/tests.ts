import type { TestDashboard } from "@/types/test-dashboard";

const API_BASE = "/api/tests";

export async function fetchTestDashboard(testId: string): Promise<TestDashboard> {
  const res = await fetch(`${API_BASE}/${testId}/dashboard`);
  if (!res.ok) {
    throw new Error("Failed to load test dashboard");
  }
  return res.json();
}
