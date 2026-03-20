import type { MultiFrameworkOutput } from "@/engine/orchestrator/MultiFrameworkTypes";
import type { FrameworkSyncResult } from "./FrameworkSyncTypes";

export function syncFrameworks(
  previous: MultiFrameworkOutput | null,
  current: MultiFrameworkOutput
): FrameworkSyncResult {
  const missing: string[] = [];
  const outdated: string[] = [];
  const drift: string[] = [];
  const regenerated: string[] = [];

  const frameworks = ["playwright", "cypress", "selenium", "restassured"] as const;

  for (const fw of frameworks) {
    const prevFiles = previous?.[fw] ?? {};
    const currFiles = current[fw];

    for (const fileName of Object.keys(currFiles)) {
      const prevContent = prevFiles[fileName];
      const currContent = currFiles[fileName];

      if (!prevContent) {
        missing.push(`${fw}:${fileName}`);
        regenerated.push(`${fw}:${fileName}`);
        continue;
      }

      if (prevContent !== currContent) {
        outdated.push(`${fw}:${fileName}`);
        regenerated.push(`${fw}:${fileName}`);
      }
    }

    for (const fileName of Object.keys(prevFiles)) {
      if (!currFiles[fileName]) {
        drift.push(`${fw}:${fileName}`);
      }
    }
  }

  return {
    missing,
    outdated,
    drift,
    regenerated,
    summary: `Missing: ${missing.length}, Outdated: ${outdated.length}, Drift: ${drift.length}, Regenerated: ${regenerated.length}`,
  };
}
