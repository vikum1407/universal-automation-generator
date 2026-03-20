import type { SelectorResponse } from "./types/SelectorResponse";

export function getSelectorsHandler(context: any, testId: string): SelectorResponse {
  const model = context.currentModel;
  const test = model.tests.find((t: any) => t.id === testId);

  return {
    testId,
    selectors: test?.selectorIntelligence ?? [],
  };
}
