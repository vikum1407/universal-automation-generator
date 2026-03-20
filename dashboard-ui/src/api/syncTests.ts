import { syncFrameworks } from "@/engine/sync/FrameworkSyncEngine";
import type { SyncResponse } from "./types/SyncResponse";
import type { MultiFrameworkOutput } from "@/engine/orchestrator/MultiFrameworkTypes";

export function syncTestsHandler(context: any): SyncResponse {
  const previous = context.previousGenerated as MultiFrameworkOutput | null;
  const current = context.currentGenerated as MultiFrameworkOutput;

  const result = syncFrameworks(previous, current);

  return {
    missing: result.missing,
    outdated: result.outdated,
    drift: result.drift,
    regenerated: result.regenerated,
    summary: result.summary,
  };
}
