export interface EndpointTestStats {
  totalTests:  number;
  passedTests: number;
  failedTests: number;
}

// Phase 3: binary — has tests or not.
// Phase 4+ can refine to reflect path-level coverage.
export function computeEndpointCoverageScore(stats: EndpointTestStats): number {
  return stats.totalTests > 0 ? 1 : 0;
}
