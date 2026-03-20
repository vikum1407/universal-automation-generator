import type { MultiFrameworkOutput } from "@/engine/orchestrator/MultiFrameworkTypes";
import type { FrameworkSyncResult } from "@/engine/sync/FrameworkSyncTypes";
import type { EvolutionResult } from "./EvolutionTypes";

export function evolveTests(
  sync: FrameworkSyncResult,
  _previous: MultiFrameworkOutput | null,
  _current: MultiFrameworkOutput
): EvolutionResult {
  const updatedTests: string[] = [];
  const removedTests: string[] = [];
  const addedTests: string[] = [];

  for (const id of sync.regenerated) {
    updatedTests.push(id);
  }

  for (const id of sync.drift) {
    removedTests.push(id);
  }

  for (const id of sync.missing) {
    addedTests.push(id);
  }

  return {
    updatedTests,
    removedTests,
    addedTests,
    summary: `Updated: ${updatedTests.length}, Added: ${addedTests.length}, Removed: ${removedTests.length}`,
  };
}
