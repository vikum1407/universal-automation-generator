export async function loadStabilizationContext(project: string) {
  return {
    recentPipelineRuns: [], // TODO: replace with real DB query
    healingHistory: []      // TODO: replace with real DB query
  };
}
