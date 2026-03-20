import type { StabilitySnapshot } from "../../types/StabilitySnapshot";

export async function fetchStabilitySnapshot(project: string): Promise<StabilitySnapshot> {
  const res = await fetch(`/api/projects/${project}/stability`);
  if (!res.ok) throw new Error("Failed to fetch stability snapshot");
  return res.json();
}
