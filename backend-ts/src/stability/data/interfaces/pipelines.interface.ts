export interface PipelineFailure {
  pipelineId: string;
  reason: string;
}

export interface PipelinesProvider {
  getRecentPipelineFailures(project: string): Promise<PipelineFailure[]>;
}
