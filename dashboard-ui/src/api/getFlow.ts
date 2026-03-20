import type { FlowResponse } from "./types/FlowResponse";

export function getFlowHandler(context: any, testId: string): FlowResponse {
  const model = context.currentModel; // from /model
  const test = model.tests.find((t: any) => t.id === testId);

  return {
    testId,
    steps: test?.steps ?? [],
  };
}
