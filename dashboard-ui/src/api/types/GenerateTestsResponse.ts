import type { MultiFrameworkOutput } from "@/engine/orchestrator/MultiFrameworkTypes";

export interface GenerateTestsResponse {
  frameworks: MultiFrameworkOutput;
  metadata: {
    generatedAt: string;
  };
}
