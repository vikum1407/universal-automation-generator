import { buildUniversalTestModel } from "@/engine/UniversalTestModelBuilder";
import { generateAllFrameworkTests } from "@/engine/orchestrator/MultiFrameworkOrchestrator";
import type { GenerateTestsResponse } from "./types/GenerateTestsResponse";

export function generateTestsHandler(context: any): GenerateTestsResponse {
  const snapshot = context.snapshot;
  const learning = context.learning;

  const model = buildUniversalTestModel(snapshot as any, learning as any);
  const frameworks = generateAllFrameworkTests(model);

  context.previousGenerated = frameworks;

  return {
    frameworks,
    metadata: {
      generatedAt: new Date().toISOString(),
    },
  };
}
