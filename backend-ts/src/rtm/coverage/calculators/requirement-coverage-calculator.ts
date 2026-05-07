// Weights for the composite coverage score
const W_REQ      = 0.2;  // has direct tests?
const W_FLOW     = 0.3;  // UI-flow coverage
const W_ENDPOINT = 0.3;  // endpoint coverage
const W_JOURNEY  = 0.2;  // journey coverage

export interface TestStats {
  totalTests:  number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
}

export interface MappingCounts {
  uiFlowsTotal:     number;
  uiFlowsCovered:   number;
  endpointsTotal:   number;
  endpointsCovered: number;
  journeysTotal:    number;
  journeysCovered:  number;
}

export function computeRequirementCoverageScore(
  stats: TestStats,
  mappings: MappingCounts,
): number {
  const reqScore = stats.totalTests > 0 ? 1 : 0;

  const flowScore = mappings.uiFlowsTotal === 0
    ? 1
    : mappings.uiFlowsCovered / mappings.uiFlowsTotal;

  const endpointScore = mappings.endpointsTotal === 0
    ? 1
    : mappings.endpointsCovered / mappings.endpointsTotal;

  const journeyScore = mappings.journeysTotal === 0
    ? 1
    : mappings.journeysCovered / mappings.journeysTotal;

  return Math.min(
    1,
    W_REQ * reqScore + W_FLOW * flowScore + W_ENDPOINT * endpointScore + W_JOURNEY * journeyScore,
  );
}
