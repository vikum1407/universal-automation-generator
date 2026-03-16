export interface StabilizationAction {
  type: string;
  pipelineId?: string;
  description: string;
}

export interface StabilizationResult {
  stabilizationId: string;
  status: "running" | "completed" | "failed";
  actions: StabilizationAction[];
}
