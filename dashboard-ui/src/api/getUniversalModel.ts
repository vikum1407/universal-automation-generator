import { buildUniversalTestModel } from "@/engine/UniversalTestModelBuilder";

export interface UniversalModelResponse {
  requirements: any[];
  tests: any[];
  metadata: {
    generatedAt: string;
  };
}

export function getUniversalModel(
  snapshot: any,
  learning: any
): UniversalModelResponse {
  const model = buildUniversalTestModel(
    snapshot as any,
    learning as any
  );

  return {
    requirements: model.requirements,
    tests: model.tests,
    metadata: {
      generatedAt: new Date().toISOString(),
    },
  };
}
