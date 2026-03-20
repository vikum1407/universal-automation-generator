import { evolveTests } from "@/engine/evolution/EvolutionEngine";
import type { EvolutionResponse } from "./types/EvolutionResponse";
import type { MultiFrameworkOutput } from "@/engine/orchestrator/MultiFrameworkTypes";

export function evolveTestsHandler(context: any): EvolutionResponse {
  const previous = context.previousGenerated as MultiFrameworkOutput | null;
  const current = context.currentGenerated as MultiFrameworkOutput;

  const result = evolveTests(
    context.syncResult, // from C40.3
    previous,
    current
  );

  return {
    updated: result.updatedTests,
    removed: result.removedTests,
    added: result.addedTests,
    summary: result.summary,
  };
}
